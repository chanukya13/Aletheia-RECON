import { useEffect, useRef, useState } from "react";
import type { SourceRevisionData, SpanData } from "@recon/contracts";
import {
  SourceAnnotationAdapter,
  type InspectedSelection,
} from "../adapters/SourceAnnotationAdapter";

export function SourceReader({
  revision,
  selectedSpan,
  onAnnotate,
  language,
}: {
  revision: SourceRevisionData;
  selectedSpan: SpanData | null;
  onAnnotate?: (selection: InspectedSelection) => void;
  language?: string;
}) {
  const container = useRef<HTMLDivElement>(null),
    adapter = useRef<SourceAnnotationAdapter | null>(null);
  const [selection, setSelection] = useState<InspectedSelection | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!container.current || !revision.displayText) return;
    setSelection(null);
    setError("");
    try {
      adapter.current = new SourceAnnotationAdapter(
        container.current,
        revision.displayText,
        selectedSpan,
        setSelection,
      );
    } catch {
      setError(
        "Highlighting is unavailable. The exact source text remains available.",
      );
      container.current.textContent = revision.displayText;
    }
    const current = adapter.current;
    const frame = selectedSpan
      ? requestAnimationFrame(() => {
          container.current?.scrollIntoView({ block: "center" });
          container.current?.focus({ preventScroll: true });
          current?.scrollTo(selectedSpan.id);
        })
      : null;
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      current?.destroy();
      adapter.current = null;
    };
  }, [revision.id, revision.displayText, selectedSpan]);
  return (
    <>
      <div className="reader-tools">
        <span>Exact edition text</span>
        <button
          className="text-button"
          onClick={() => {
            const value = adapter.current?.inspectSelection();
            if (value) setSelection(value);
            else
              setError(
                "Select a passage in the source first. Keyboard selection is supported.",
              );
          }}
        >
          Inspect selection <span aria-hidden="true">↗</span>
        </button>
      </div>
      {error ? (
        <p role="status" className="inline-note">
          {error}
        </p>
      ) : null}
      {revision.displayText ? (
        <div
          ref={container}
          className="source-text"
          tabIndex={0}
          role="region"
          aria-label="Edition passage"
          lang={
            language ??
            (revision.sourceId === "cockayne-original" ? "ang" : "en")
          }
          data-revision={revision.id}
          data-text-sha256={revision.textSha256}
        />
      ) : (
        <p className="empty">
          Source text is withheld under this artifact’s rights decision.
          Metadata remains available.
        </p>
      )}
      {selection ? (
        <section
          className="selection-preview"
          aria-label="Selection inspection"
        >
          <div className="section-heading">
            <strong>Selected passage</strong>
            <button className="text-button" onClick={() => setSelection(null)}>
              Clear
            </button>
          </div>
          <blockquote>{selection.exact}</blockquote>
          <p className="mono">
            UTF-16 [{selection.start}, {selection.end}) · {revision.id}
          </p>
          <p>
            Temporary inspection. The immutable source and reviewed assertions
            are unchanged.
          </p>
          {onAnnotate ? (
            <button
              className="secondary-button"
              onClick={() => onAnnotate(selection)}
            >
              Annotate selection
            </button>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
