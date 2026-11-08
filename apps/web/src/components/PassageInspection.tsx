import { useState } from "react";
import type { SourceRevisionData, SpanData } from "@recon/contracts";
import { Dialog } from "./Dialog";
import { SourceReader } from "./SourceReader";

export function PassageInspection({
  revision,
  span,
  label = "Inspect exact passage",
}: {
  revision: SourceRevisionData;
  span: SpanData;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-button" onClick={() => setOpen(true)}>
        {label} ↗
      </button>
      {open ? (
        <Dialog title="Exact source passage" onClose={() => setOpen(false)}>
          <p>{span.locator.label}</p>
          <SourceReader revision={revision} selectedSpan={span} />
          <p className="form-hint">
            {revision.rights.credit} / {revision.rights.license}
          </p>
        </Dialog>
      ) : null}
    </>
  );
}
