import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import type {
  SourceAnnotationAdapter,
  InspectedSelection,
} from "../../apps/web/src/adapters/SourceAnnotationAdapter.js";
import type { SpanData } from "@recon/contracts";
declare global {
  interface Window {
    ReconSpike: { SourceAnnotationAdapter: typeof SourceAnnotationAdapter };
    spike: {
      adapter: SourceAnnotationAdapter;
      events: InspectedSelection[];
      text: string;
    };
  }
}
async function fixture(page: Page, renderer: "SPANS" | "CSS_HIGHLIGHTS") {
  await page.goto("about:blank");
  await page.setContent(
    '<main><h1>Annotation compatibility fixture</h1><div id="source" tabindex="0" style="margin:30px;position:relative;white-space:pre-wrap;font:22px/2 monospace"></div><button id="inspect">Inspect selection</button></main>',
  );
  await page.addStyleTag({
    path: resolve("artifacts/browser/annotation-spike/aletheia-recon.css"),
  });
  await page.addScriptTag({
    path: resolve("artifacts/browser/annotation-spike/adapter.js"),
  });
  await page.evaluate((renderer) => {
    const text = "𐐀 ά Ƿyrc wiþ æ · cropleac cropleac · end";
    const el = document.getElementById("source")!;
    const events: InspectedSelection[] = [];
    for (let i = 0; i < 12; i++) {
      const old = new window.ReconSpike.SourceAnnotationAdapter(
        el,
        text,
        null,
        (s) => events.push(s),
        renderer,
      );
      old.destroy();
      old.destroy();
      if (el.textContent !== text)
        throw new Error("Text mutated during teardown");
    }
    const adapter = new window.ReconSpike.SourceAnnotationAdapter(
      el,
      text,
      null,
      (s) => events.push(s),
      renderer,
    );
    window.spike = { adapter, events, text };
    document.getElementById("inspect")!.addEventListener("click", () => {
      const selection = adapter.inspectSelection();
      if (selection) events.push(selection);
    });
  }, renderer);
}
for (const renderer of ["SPANS", "CSS_HIGHLIGHTS"] as const) {
  test(`R2 invalid spans reject before creating a renderer · ${renderer}`, async ({
    page,
  }) => {
    await fixture(page, renderer);
    const result = await page.evaluate((renderer) => {
      const el = document.getElementById("source")!;
      window.spike.adapter.destroy();
      const text = window.spike.text;
      let rejected = 0;
      for (const range of [
        { start: 0, end: 1, exact: text.slice(0, 1) },
        { start: 0, end: 999, exact: text },
        { start: 0, end: 2, exact: "wrong" },
      ]) {
        try {
          new window.ReconSpike.SourceAnnotationAdapter(
            el,
            text,
            {
              id: "bad-fixture",
              sourceRevisionId: "fixture.r1",
              sourceTextSha256: "0".repeat(64),
              prefix: "",
              suffix: "",
              locator: { label: "Synthetic invalid fixture" },
              ...range,
            },
            () => {},
            renderer,
          );
        } catch {
          rejected++;
        }
      }
      return {
        rejected,
        text: el.textContent,
        layers: el.querySelectorAll(".r6o-span-highlight-layer").length,
      };
    }, renderer);
    expect(result.rejected).toBe(3);
    expect(result.layers).toBe(0);
    expect(result.text).toBe(await page.evaluate(() => window.spike.text));
  });
  test(`R2 real selection, Unicode and repeated teardown · ${renderer}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await fixture(page, renderer);
    const position = await page.evaluate(() => {
      const source = document.getElementById("source")!;
      const text = window.spike.text;
      const start = text.indexOf("cropleac"),
        end = start + "cropleac".length;
      const node = source.firstChild!;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      const box = range.getBoundingClientRect();
      return {
        x1: box.left + 1,
        x2: box.right - 1,
        y: box.y + box.height / 2,
        start,
        end,
      };
    });
    await page.mouse.move(position.x1, position.y);
    await page.mouse.down();
    await page.mouse.move(position.x2, position.y, { steps: 12 });
    await page.mouse.up();
    await expect
      .poll(() => page.evaluate(() => window.spike.events.length))
      .toBe(1);
    const selected = await page.evaluate(() => window.spike.events[0]);
    expect(selected).toEqual({
      start: position.start,
      end: position.end,
      exact: "cropleac",
    });
    expect(await page.locator("#source").textContent()).toBe(
      await page.evaluate(() => window.spike.text),
    );
    // Keyboard activation of our native-range fallback remains exact after a
    // supplementary Unicode character and a combining sequence.
    await page.evaluate(() => {
      const el = document.getElementById("source")!;
      const t = window.spike.text;
      const start = t.lastIndexOf("cropleac");
      const node = Array.from(el.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE,
      )!;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + 8);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await page.getByRole("button", { name: "Inspect selection" }).focus();
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => window.spike.events.at(-1))).toEqual(
      await page.evaluate(() => ({
        start: window.spike.text.lastIndexOf("cropleac"),
        end: window.spike.text.lastIndexOf("cropleac") + 8,
        exact: "cropleac",
      })),
    );
    await page.evaluate(() => {
      window.spike.adapter.destroy();
    });
    expect(await page.locator("#source").textContent()).toBe(
      await page.evaluate(() => window.spike.text),
    );
    expect(errors).toEqual([]);
  });
  test(`R2 overlapping and adjacent highlights preserve source bytes · ${renderer}`, async ({
    page,
  }) => {
    await fixture(page, renderer);
    const text = await page.evaluate(() => window.spike.text);
    const ranges = [
      [0, 4],
      [3, 8],
      [8, 12],
    ].map(([start, end], i) => ({
      id: `fixture-span-${i}`,
      sourceRevisionId: "fixture.r1",
      sourceTextSha256: "0".repeat(64),
      start: start!,
      end: end!,
      exact: text.slice(start, end),
      prefix: "",
      suffix: "",
      locator: { label: "Synthetic compatibility fixture only" },
    })) as SpanData[];
    await page.evaluate(
      ({ ranges, renderer }) => {
        const el = document.getElementById("source")!;
        window.spike.adapter.destroy();
        window.spike.adapter = new window.ReconSpike.SourceAnnotationAdapter(
          el,
          window.spike.text,
          ranges,
          () => {},
          renderer,
        );
      },
      { ranges, renderer },
    );
    expect(await page.locator("#source").textContent()).toBe(text);
    if (renderer === "SPANS")
      await expect(
        page.locator('[data-annotation="fixture-span-0"]').first(),
      ).toBeVisible();
    await page.evaluate(() => {
      window.spike.adapter.destroy();
    });
    expect(await page.locator("#source").textContent()).toBe(text);
  });
}
