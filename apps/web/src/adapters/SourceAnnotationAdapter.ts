import {
  createTextAnnotator,
  type TextAnnotation,
  type TextAnnotator,
} from "@recogito/text-annotator";
import type { SpanData } from "@recon/contracts";
import "@recogito/text-annotator/text-annotator.css";

export type InspectedSelection = { start: number; end: number; exact: string };
export class SourceAnnotationAdapter {
  private annotator: TextAnnotator<TextAnnotation, TextAnnotation>;
  private disposed = false;
  constructor(
    private container: HTMLElement,
    private text: string,
    span: SpanData | SpanData[] | null,
    onSelection: (selection: InspectedSelection) => void,
    renderer: "SPANS" | "CSS_HIGHLIGHTS" = "SPANS",
  ) {
    const spans = span ? (Array.isArray(span) ? span : [span]) : [];
    const boundary = (p: number) =>
      !(
        p > 0 &&
        p < text.length &&
        text.charCodeAt(p - 1) >= 0xd800 &&
        text.charCodeAt(p - 1) <= 0xdbff &&
        text.charCodeAt(p) >= 0xdc00 &&
        text.charCodeAt(p) <= 0xdfff
      );
    for (const s of spans) {
      if (
        !Number.isInteger(s.start) ||
        !Number.isInteger(s.end) ||
        s.start < 0 ||
        s.end <= s.start ||
        s.end > text.length ||
        !boundary(s.start) ||
        !boundary(s.end) ||
        text.slice(s.start, s.end) !== s.exact
      )
        throw new Error("Source annotation does not match the immutable text.");
    }
    container.textContent = text;
    this.annotator = createTextAnnotator<TextAnnotation, TextAnnotation>(
      container,
      {
        renderer,
        annotatingEnabled: true,
        style: { fill: "#d6e8d7", fillOpacity: 0.65 },
      },
    );
    this.annotator.on("createAnnotation", (annotation: TextAnnotation) => {
      if (this.disposed) return;
      const selector = annotation.target.selector[0];
      if (
        selector &&
        this.text.slice(selector.start, selector.end) === selector.quote
      )
        onSelection({
          start: selector.start,
          end: selector.end,
          exact: selector.quote,
        });
    });
    if (spans.length) {
      this.annotator.setAnnotations(
        spans.map((s) => ({
          id: s.id,
          bodies: [],
          target: {
            annotation: s.id,
            selector: [{ start: s.start, end: s.end, quote: s.exact }],
          },
        })),
      );
    }
  }
  inspectSelection(): InspectedSelection | null {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    if (
      !this.container.contains(range.startContainer) ||
      !this.container.contains(range.endContainer)
    )
      return null;
    const before = range.cloneRange();
    before.selectNodeContents(this.container);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length,
      exact = range.toString(),
      end = start + exact.length;
    if (!exact || this.text.slice(start, end) !== exact) return null;
    return { start, end, exact };
  }
  scrollTo(spanId: string) {
    if (this.disposed) return;
    const annotation = this.annotator
      .getAnnotations()
      .find((annotation) => annotation.id === spanId);
    const selector = annotation?.target.selector[0];
    if (!selector) return;
    // Native range positions remain valid while the renderer's bounds index is
    // waiting for layout (notably when a dialog has just become visible).
    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
    );
    const range = document.createRange();
    let offset = 0,
      started = false;
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const length = node.textContent?.length ?? 0;
      if (!started && selector.start < offset + length) {
        range.setStart(node, selector.start - offset);
        started = true;
      }
      if (started && selector.end <= offset + length) {
        range.setEnd(node, selector.end - offset);
        const rect = range.getBoundingClientRect();
        this.container.scrollIntoView({ block: "nearest" });
        this.container.scrollTop +=
          rect.top -
          this.container.getBoundingClientRect().top -
          this.container.clientHeight / 2;
        return;
      }
      offset += length;
    }
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.annotator.destroy();
    this.container.textContent = this.text;
  }
}
