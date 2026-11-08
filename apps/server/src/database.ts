import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseJsonStrict, scientificHash, validateCorpus } from "@recon/core";
import type { CorpusData } from "@recon/contracts";

export const ROOT = resolve(import.meta.dirname, "../../..");
export const migrations = [
  {
    version: 1,
    sql: `
CREATE TABLE corpus_revisions (id TEXT PRIMARY KEY, hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE sources (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE source_revisions (id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id), revision INTEGER NOT NULL CHECK(revision > 0), payload TEXT NOT NULL CHECK(json_valid(payload)), UNIQUE(source_id, revision));
CREATE TABLE spans (id TEXT PRIMARY KEY, source_revision_id TEXT NOT NULL REFERENCES source_revisions(id), payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE assertions (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE assertion_spans (assertion_id TEXT NOT NULL REFERENCES assertions(id), span_id TEXT NOT NULL REFERENCES spans(id), PRIMARY KEY(assertion_id,span_id));
CREATE TABLE material_versions (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE material_assertions (material_id TEXT NOT NULL REFERENCES material_versions(id), assertion_id TEXT NOT NULL REFERENCES assertions(id), PRIMARY KEY(material_id,assertion_id));
CREATE TABLE ingredient_slots (id TEXT PRIMARY KEY, material_id TEXT NOT NULL REFERENCES material_versions(id), payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE mapping_candidates (id TEXT PRIMARY KEY, occurrence_id TEXT NOT NULL REFERENCES ingredient_slots(id), payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE cases (id TEXT PRIMARY KEY);
CREATE TABLE case_revisions (case_id TEXT NOT NULL REFERENCES cases(id), revision INTEGER NOT NULL, material_id TEXT NOT NULL REFERENCES material_versions(id), primary_source_revision_id TEXT NOT NULL REFERENCES source_revisions(id), corpus_revision TEXT NOT NULL REFERENCES corpus_revisions(id), payload TEXT NOT NULL CHECK(json_valid(payload)), PRIMARY KEY(case_id,revision));
CREATE TABLE studies (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE evidence_units (id TEXT PRIMARY KEY, study_id TEXT NOT NULL REFERENCES studies(id), material_id TEXT NOT NULL REFERENCES material_versions(id), payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TRIGGER source_revisions_immutable BEFORE UPDATE ON source_revisions BEGIN SELECT RAISE(ABORT, 'immutable source revision'); END;
CREATE TRIGGER source_revisions_no_delete BEFORE DELETE ON source_revisions BEGIN SELECT RAISE(ABORT, 'immutable source revision'); END;
CREATE TRIGGER case_revisions_immutable BEFORE UPDATE ON case_revisions BEGIN SELECT RAISE(ABORT, 'immutable case revision'); END;
CREATE TRIGGER case_revisions_no_delete BEFORE DELETE ON case_revisions BEGIN SELECT RAISE(ABORT, 'immutable case revision'); END;
CREATE TRIGGER material_versions_immutable BEFORE UPDATE ON material_versions BEGIN SELECT RAISE(ABORT, 'immutable material version'); END;
CREATE TRIGGER assertions_immutable BEFORE UPDATE ON assertions BEGIN SELECT RAISE(ABORT, 'immutable assertion'); END;
CREATE TRIGGER spans_immutable BEFORE UPDATE ON spans BEGIN SELECT RAISE(ABORT, 'immutable span'); END;
`,
  },
  {
    version: 2,
    sql: `
CREATE TABLE audit_events (id INTEGER PRIMARY KEY, event_type TEXT NOT NULL, subject_id TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE INDEX spans_by_revision ON spans(source_revision_id);
CREATE INDEX evidence_by_study ON evidence_units(study_id);
CREATE INDEX case_revisions_by_corpus ON case_revisions(corpus_revision);
`,
  },
  {
    version: 3,
    sql: `
CREATE TABLE occurrences (id TEXT PRIMARY KEY);
INSERT INTO occurrences SELECT id FROM ingredient_slots;
CREATE TABLE material_slots (material_id TEXT NOT NULL REFERENCES material_versions(id), occurrence_id TEXT NOT NULL REFERENCES occurrences(id), payload TEXT NOT NULL CHECK(json_valid(payload)), PRIMARY KEY(material_id,occurrence_id));
INSERT INTO material_slots SELECT m.id,json_extract(s.value,'$.id'),s.value FROM material_versions m,json_each(m.payload,'$.componentSlots') s;
ALTER TABLE mapping_candidates RENAME TO mapping_candidates_phase1;
CREATE TABLE mapping_candidates (id TEXT PRIMARY KEY, occurrence_id TEXT NOT NULL REFERENCES occurrences(id), payload TEXT NOT NULL CHECK(json_valid(payload)));
INSERT INTO mapping_candidates SELECT * FROM mapping_candidates_phase1;
CREATE TABLE extraction_runs (id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id), case_revision INTEGER NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), FOREIGN KEY(case_id,case_revision) REFERENCES case_revisions(case_id,revision));
CREATE TABLE proposal_decisions (run_id TEXT NOT NULL REFERENCES extraction_runs(id), proposal_id TEXT NOT NULL, case_id TEXT NOT NULL, case_revision INTEGER NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), PRIMARY KEY(run_id,proposal_id,case_revision), FOREIGN KEY(case_id,case_revision) REFERENCES case_revisions(case_id,revision));
CREATE TABLE idempotency_keys (id TEXT PRIMARY KEY, operation TEXT NOT NULL, input_hash TEXT NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)));
CREATE TABLE provider_cache (id TEXT PRIMARY KEY, query TEXT NOT NULL, retrieved_at TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE INDEX provider_cache_by_query ON provider_cache(query,retrieved_at);
CREATE INDEX extraction_by_case ON extraction_runs(case_id,case_revision);
CREATE TRIGGER corpus_snapshots_immutable BEFORE UPDATE ON corpus_revisions BEGIN SELECT RAISE(ABORT,'immutable corpus snapshot'); END;
CREATE TRIGGER extraction_runs_immutable BEFORE UPDATE ON extraction_runs BEGIN SELECT RAISE(ABORT,'immutable extraction run'); END;
CREATE TRIGGER candidates_immutable BEFORE UPDATE ON mapping_candidates BEGIN SELECT RAISE(ABORT,'immutable mapping candidate'); END;
`,
  },
  {
    version: 4,
    sql: `
CREATE TABLE literature_snapshots(id TEXT PRIMARY KEY,query_key TEXT NOT NULL,raw TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE INDEX literature_query ON literature_snapshots(query_key);
CREATE TABLE pending_studies(id TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE pending_fulltext(id TEXT PRIMARY KEY REFERENCES pending_studies(id),raw TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE evaluation_runs(input_hash TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TRIGGER evaluation_immutable BEFORE UPDATE ON evaluation_runs BEGIN SELECT RAISE(ABORT,'immutable evaluation'); END;
`,
  },
  {
    version: 5,
    sql: `
CREATE TABLE scenario_versions(id TEXT NOT NULL,revision INTEGER NOT NULL,case_id TEXT NOT NULL,case_revision INTEGER NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),PRIMARY KEY(id,revision),FOREIGN KEY(case_id,case_revision) REFERENCES case_revisions(case_id,revision));
CREATE TABLE scenario_runs(hash TEXT PRIMARY KEY,kind TEXT NOT NULL,context TEXT,input TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE analysis_records(id TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TRIGGER scenario_versions_immutable BEFORE UPDATE ON scenario_versions BEGIN SELECT RAISE(ABORT,'immutable scenario'); END;
CREATE TRIGGER scenario_versions_no_delete BEFORE DELETE ON scenario_versions BEGIN SELECT RAISE(ABORT,'immutable scenario'); END;
CREATE TRIGGER scenario_runs_immutable BEFORE UPDATE ON scenario_runs BEGIN SELECT RAISE(ABORT,'immutable scenario run'); END;
CREATE TRIGGER scenario_runs_no_delete BEFORE DELETE ON scenario_runs BEGIN SELECT RAISE(ABORT,'immutable scenario run'); END;
CREATE TRIGGER analyses_immutable BEFORE UPDATE ON analysis_records BEGIN SELECT RAISE(ABORT,'immutable analysis'); END;
CREATE TRIGGER analyses_no_delete BEFORE DELETE ON analysis_records BEGIN SELECT RAISE(ABORT,'immutable analysis'); END;
`,
  },
  {
    version: 6,
    sql: `
CREATE TABLE imported_dossiers(id TEXT PRIMARY KEY,bundle_hash TEXT UNIQUE NOT NULL,record TEXT NOT NULL CHECK(json_valid(record)),bundle TEXT NOT NULL CHECK(json_valid(bundle)));
CREATE TRIGGER imported_dossiers_immutable BEFORE UPDATE ON imported_dossiers BEGIN SELECT RAISE(ABORT,'immutable imported dossier'); END;
CREATE TRIGGER imported_dossiers_no_delete BEFORE DELETE ON imported_dossiers BEGIN SELECT RAISE(ABORT,'immutable imported dossier'); END;
`,
  },
];
export function openDatabase(file: string): Database.Database {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 3000");
  return db;
}
export function migrate(
  db: Database.Database,
  through = migrations.length,
): void {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL)",
  );
  for (const m of migrations.filter((m) => m.version <= through)) {
    const checksum = scientificHash(m.sql);
    const previous = db
      .prepare("SELECT checksum FROM schema_migrations WHERE version=?")
      .get(m.version) as { checksum: string } | undefined;
    if (previous) {
      if (previous.checksum !== checksum)
        throw new Error("MIGRATION_CHECKSUM_MISMATCH");
      continue;
    }
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare("INSERT INTO schema_migrations VALUES(?,?)").run(
        m.version,
        checksum,
      );
    })();
  }
}
export function loadCorpus(): CorpusData {
  return validateCorpus(
    parseJsonStrict(
      readFileSync(resolve(ROOT, "data/corpus/recon-v1.json"), "utf8"),
    ),
  );
}
export function seed(db: Database.Database, corpus: CorpusData): void {
  validateCorpus(corpus);
  const hash = scientificHash(corpus);
  const prior = db
    .prepare("SELECT hash FROM corpus_revisions WHERE id=?")
    .get(corpus.revision) as { hash: string } | undefined;
  if (prior) {
    if (prior.hash !== hash) throw new Error("CORPUS_REVISION_CONFLICT");
    return;
  }
  const insert = (
    table: string,
    row: { id: string },
    columns: Record<string, string | number> = {},
  ) => {
    const values = { id: row.id, ...columns, payload: JSON.stringify(row) };
    // Table/column names are internal constants, never request input.
    const prior = db
      .prepare(`SELECT payload FROM ${table} WHERE id=?`)
      .get(row.id) as { payload: string } | undefined;
    if (prior) {
      if (
        scientificHash(parseJsonStrict(prior.payload)) !== scientificHash(row)
      )
        throw new Error(`IMMUTABLE_ID_CONFLICT:${row.id}`);
      return;
    }
    db.prepare(
      `INSERT INTO ${table} (${Object.keys(values).join(",")}) VALUES (${Object.keys(
        values,
      )
        .map(() => "?")
        .join(",")})`,
    ).run(...Object.values(values));
  };
  db.transaction(() => {
    db.prepare("INSERT INTO corpus_revisions VALUES(?,?,?)").run(
      corpus.revision,
      hash,
      JSON.stringify(corpus),
    );
    corpus.sources.forEach((r) => insert("sources", r));
    corpus.sourceRevisions.forEach((r) =>
      insert("source_revisions", r, {
        source_id: r.sourceId,
        revision: r.revision,
      }),
    );
    corpus.spans.forEach((r) =>
      insert("spans", r, { source_revision_id: r.sourceRevisionId }),
    );
    corpus.assertions.forEach((r) => insert("assertions", r));
    corpus.assertions.forEach((a) =>
      a.references.forEach((r) => {
        if (r.kind === "span")
          db.prepare("INSERT OR IGNORE INTO assertion_spans VALUES(?,?)").run(
            a.id,
            r.spanId,
          );
      }),
    );
    corpus.materials.forEach((r) => insert("material_versions", r));
    corpus.materials.forEach((m) => {
      m.componentSlots.forEach((r) => {
        db.prepare("INSERT OR IGNORE INTO occurrences VALUES(?)").run(r.id);
        db.prepare("INSERT OR IGNORE INTO material_slots VALUES(?,?,?)").run(
          m.id,
          r.id,
          JSON.stringify(r),
        );
      });
      m.assertionIds.forEach((a) =>
        db
          .prepare("INSERT OR IGNORE INTO material_assertions VALUES(?,?)")
          .run(m.id, a),
      );
    });
    corpus.candidates.forEach((r) =>
      insert("mapping_candidates", r, { occurrence_id: r.occurrenceId }),
    );
    corpus.studies.forEach((r) => insert("studies", r));
    corpus.evidenceUnits.forEach((r) =>
      insert("evidence_units", r, {
        study_id: r.studyId,
        material_id: r.testedMaterialVersionId,
      }),
    );
    corpus.cases.forEach((c) => {
      db.prepare("INSERT OR IGNORE INTO cases VALUES(?)").run(c.id);
      const previous = db
        .prepare(
          "SELECT payload FROM case_revisions WHERE case_id=? AND revision=?",
        )
        .get(c.id, c.revision) as { payload: string } | undefined;
      if (previous) {
        if (
          scientificHash(parseJsonStrict(previous.payload)) !==
          scientificHash(c)
        )
          throw new Error("IMMUTABLE_CASE_CONFLICT");
        return;
      }
      db.prepare("INSERT INTO case_revisions VALUES(?,?,?,?,?,?)").run(
        c.id,
        c.revision,
        c.materialVersionId,
        c.primarySourceRevisionId,
        c.corpusRevision,
        JSON.stringify(c),
      );
    });
    db.prepare(
      "INSERT INTO audit_events(event_type,subject_id,payload) VALUES(?,?,?)",
    ).run(
      "bundle_seeded",
      corpus.revision,
      JSON.stringify({ hash, reviewStatus: "pending" }),
    );
    if ((db.pragma("foreign_key_check") as unknown[]).length)
      throw new Error("FOREIGN_KEY_CHECK_FAILED");
  })();
}
export function readCorpus(db: Database.Database): CorpusData {
  const row = db
    .prepare("SELECT payload FROM corpus_revisions ORDER BY rowid DESC LIMIT 1")
    .get() as { payload: string } | undefined;
  if (!row) throw new Error("CORPUS_NOT_SEEDED");
  return validateCorpus(parseJsonStrict(row.payload, 20_000_000));
}
