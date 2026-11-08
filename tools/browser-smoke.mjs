import { browserEnvironment } from "./browser-environment.mjs";
Object.assign(process.env, browserEnvironment());
const { chromium } = await import("@playwright/test");
const b = await chromium.launch({ headless: true });
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  p.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE", m.text());
  });
  await p.goto("http://127.0.0.1:4317/cases");
  await p.getByRole("heading", { name: "Start with the source." }).waitFor();
  await p.screenshot({
    path: "artifacts/preflight/library-first.png",
    fullPage: true,
  });
  await p.getByRole("link", { name: /Bald’s eyesalve/ }).click();
  await p.getByRole("region", { name: "Edition passage" }).waitFor();
  await p.screenshot({
    path: "artifacts/preflight/reader-first.png",
    fullPage: true,
  });
  console.log(
    "TITLE",
    await p.title(),
    "TEXT",
    (
      await p.getByRole("region", { name: "Edition passage" }).innerText()
    ).slice(0, 100),
  );
} finally {
  await b.close();
}
