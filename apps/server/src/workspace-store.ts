import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  chmodSync,
  accessSync,
  constants,
  statfsSync,
} from "node:fs";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";
import { WorkspaceError } from "./errors.js";

type WorkspaceApp = Awaited<ReturnType<typeof createApp>>;
type Entry = { app: Promise<WorkspaceApp>; active: number; touched: number };
export class WorkspaceStore {
  private readonly secret: Buffer;
  private readonly open = new Map<string, Entry>();
  private readonly maxOpen: number;
  private readonly maxWorkspaces: number;
  private readonly maxBytes: number;
  private creationWindow = { start: Date.now(), count: 0 };
  readonly directory: string;
  constructor(
    private options: {
      directory: string;
      publicOrigin: string;
      liveTaxonomy?: boolean;
      maxOpen?: number;
      maxWorkspaces?: number;
      maxBytes?: number;
    },
  ) {
    this.directory = resolve(options.directory);
    this.maxOpen = options.maxOpen ?? 4;
    this.maxWorkspaces = options.maxWorkspaces ?? 96;
    this.maxBytes = options.maxBytes ?? 8 * 1024 * 1024;
    mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const key = resolve(this.directory, "workspace-secret.key");
    if (!existsSync(key)) {
      if (
        readdirSync(this.directory).some((f) =>
          /^[a-f0-9]{32}\.sqlite$/.test(f),
        )
      )
        throw new Error("WORKSPACE_SECRET_MISSING_RESTORE_BACKUP");
      try {
        writeFileSync(key, randomBytes(32), { flag: "wx", mode: 0o600 });
      } catch (error) {
        if (!existsSync(key)) throw error;
      }
    }
    this.secret = readFileSync(key);
    if (this.secret.length !== 32) throw new Error("WORKSPACE_SECRET_INVALID");
  }
  assertStorage() {
    try {
      accessSync(this.directory, constants.W_OK);
      if (!existsSync(resolve(this.directory, "workspace-secret.key")))
        throw new Error("MISSING_KEY");
      const stats = statfsSync(this.directory);
      if (stats.bavail * stats.bsize < 4 * 1024 * 1024)
        throw new Error("DISK_FULL");
    } catch {
      throw new WorkspaceError(
        "STORAGE_UNAVAILABLE",
        "Persistent workspace storage is unavailable. Existing data has not been reset.",
        503,
      );
    }
  }
  private signature(id: string) {
    return createHmac("sha256", this.secret)
      .update("recon-workspace-v1:" + id)
      .digest("hex");
  }
  token(id: string) {
    return `${id}.${this.signature(id)}`;
  }
  verify(token: string): string {
    if (!/^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token))
      throw new WorkspaceError(
        "WORKSPACE_TOKEN_INVALID",
        "The private workspace access cookie is invalid. Clear this site's cookie to start a new workspace.",
        401,
      );
    const [id, signature] = token.split(".");
    if (
      !timingSafeEqual(
        Buffer.from(signature!, "hex"),
        Buffer.from(this.signature(id!), "hex"),
      )
    )
      throw new WorkspaceError(
        "WORKSPACE_TOKEN_INVALID",
        "The private workspace access cookie is invalid. Clear this site's cookie to start a new workspace.",
        401,
      );
    if (!existsSync(this.file(id!)))
      throw new WorkspaceError(
        "WORKSPACE_UNAVAILABLE",
        "This private workspace is unavailable. Retain any downloaded dossiers and contact the deployment owner.",
        410,
      );
    return id!;
  }
  private file(id: string) {
    if (!/^[a-f0-9]{32}$/.test(id)) throw new Error("WORKSPACE_ID_INVALID");
    return resolve(this.directory, `${id}.sqlite`);
  }
  private async reserve() {
    if (this.open.size < this.maxOpen) return;
    const idle = [...this.open]
      .filter(([, e]) => e.active === 0)
      .sort((a, b) => a[1].touched - b[1].touched)[0];
    if (!idle)
      throw new WorkspaceError(
        "WORKSPACE_BUSY",
        "The server is handling other research work. Retry in a few seconds.",
        503,
      );
    this.open.delete(idle[0]);
    await (await idle[1].app).close();
  }
  private async makeApp(id: string) {
    const file = this.file(id),
      db = openDatabase(file);
    try {
      db.pragma(
        `max_page_count = ${Math.floor(this.maxBytes / Number(db.pragma("page_size", { simple: true })))}`,
      );
      db.pragma("wal_autocheckpoint = 32");
      db.pragma("journal_size_limit = 524288");
      const app = await createApp({
        db,
        ui: false,
        publicOrigin: this.options.publicOrigin,
        liveTaxonomy: this.options.liveTaxonomy ?? false,
      });
      app.addHook("onClose", async () => {
        try {
          db.pragma("wal_checkpoint(TRUNCATE)");
        } finally {
          db.close();
        }
      });
      await app.ready();
      chmodSync(file, 0o600);
      return app;
    } catch (error) {
      if (db.open) db.close();
      throw error;
    }
  }
  async create() {
    this.assertStorage();
    if (Date.now() - this.creationWindow.start >= 60_000)
      this.creationWindow = { start: Date.now(), count: 0 };
    if (this.creationWindow.count >= 20)
      throw new WorkspaceError(
        "WORKSPACE_RATE_LIMITED",
        "New workspace creation is temporarily rate-limited. Retry in a minute.",
        429,
      );
    const count = readdirSync(this.directory).filter((f) =>
      /^[a-f0-9]{32}\.sqlite$/.test(f),
    ).length;
    if (count >= this.maxWorkspaces)
      throw new WorkspaceError(
        "WORKSPACE_CAPACITY",
        "Private workspace capacity has been reached. Existing workspaces remain available; contact the deployment owner.",
        503,
      );
    this.creationWindow.count++;
    const id = randomBytes(16).toString("hex");
    const lease = await this.acquire(id, true);
    return { id, token: this.token(id), ...lease };
  }
  async acquire(id: string, fresh = false) {
    if (!fresh && !existsSync(this.file(id)))
      throw new WorkspaceError(
        "WORKSPACE_UNAVAILABLE",
        "This private workspace is unavailable.",
        410,
      );
    let entry = this.open.get(id);
    if (!entry) {
      await this.reserve();
      // Recheck after awaiting eviction: concurrent requests may have opened it.
      entry = this.open.get(id);
      if (!entry) {
        if (this.open.size >= this.maxOpen)
          throw new WorkspaceError(
            "WORKSPACE_BUSY",
            "The server is handling other research work. Retry shortly.",
            503,
          );
        entry = { app: this.makeApp(id), active: 0, touched: Date.now() };
        this.open.set(id, entry);
      }
    }
    entry.active++;
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        entry!.active--;
        entry!.touched = Date.now();
      }
    };
    try {
      return { app: await entry.app, release };
    } catch (error) {
      release();
      if (this.open.get(id) === entry) this.open.delete(id);
      throw error;
    }
  }
  async close() {
    await Promise.all(
      [...this.open.values()].map(async (e) => (await e.app).close()),
    );
    this.open.clear();
  }
}
