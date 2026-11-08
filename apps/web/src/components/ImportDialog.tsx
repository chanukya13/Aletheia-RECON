import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ImportTextRequest, SaveResponse } from "@recon/contracts";
import { mutateApi } from "../api";
import { Dialog } from "./Dialog";
import { DEFAULT_ACTOR } from "./curation-shared";
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState(""),
    [text, setText] = useState(""),
    [language, setLanguage] = useState("en"),
    [creator, setCreator] = useState(""),
    [edition, setEdition] = useState(""),
    [sourceUrl, setSourceUrl] = useState(""),
    [rights, setRights] = useState("local_research_only"),
    [rightsRationale, setRightsRationale] = useState(""),
    [kind, setKind] = useState<"recipe" | "preparation_mention">("recipe"),
    [name, setName] = useState(DEFAULT_ACTOR.name),
    [qualification, setQualification] = useState(DEFAULT_ACTOR.qualification),
    [validation, setValidation] = useState("");
  const request = useRef<{ body: string; id: string } | null>(null);
  const navigate = useNavigate(),
    cache = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      mutateApi("/imports/text", body, SaveResponse),
    onSuccess: (result) => {
      void cache.invalidateQueries({ queryKey: ["cases"] });
      onClose();
      navigate(`/cases/${result.result.case.id}/material`);
    },
  });
  const close = () => {
    if (
      !mutation.isPending &&
      (!text || window.confirm("Discard this unsaved import?"))
    )
      onClose();
  };
  return (
    <Dialog title="Import a research passage" onClose={close}>
      <form
        className="curation-form"
        onSubmit={(e) => {
          e.preventDefault();
          setValidation("");
          const body = {
            actor: { name, qualification, mode: "draft" },
            title,
            text,
            language,
            creator,
            edition,
            ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
            rightsDeclaration: rights,
            rightsRationale,
            kind,
          };
          const serialized = JSON.stringify(body);
          if (request.current?.body !== serialized)
            request.current = { body: serialized, id: crypto.randomUUID() };
          const parsed = ImportTextRequest.safeParse({
            ...body,
            requestId: request.current!.id,
          });
          if (!parsed.success) {
            setValidation(
              parsed.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .slice(0, 4)
                .join(" · "),
            );
            return;
          }
          mutation.mutate(parsed.data);
        }}
      >
        <p className="form-intro">
          Keep the original text, edition and rights declaration together.
          Imports remain local drafts; declaring a license does not approve
          public redistribution.
        </p>
        <label>
          Case title
          <input
            required
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Record type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="recipe">Recipe / preparation instructions</option>
              <option value="preparation_mention">
                Preparation mention only
              </option>
            </select>
          </label>
          <label>
            Language (BCP-47)
            <input
              required
              value={language}
              maxLength={35}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="en, ang, grc, ja…"
            />
          </label>
        </div>
        <label>
          Exact source passage
          <textarea
            className="source-input"
            required
            value={text}
            maxLength={50000}
            rows={8}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        </label>
        <p className="form-hint">
          Whitespace, accents and Unicode are preserved. Automatic proposals
          cover English only; other languages support manual annotation.
        </p>
        <label>
          Author / source credit
          <input
            required
            value={creator}
            maxLength={300}
            onChange={(e) => setCreator(e.target.value)}
          />
        </label>
        <label>
          Edition / source description
          <input
            required
            value={edition}
            maxLength={300}
            onChange={(e) => setEdition(e.target.value)}
          />
        </label>
        <label>
          Source URL (optional)
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label>
          Rights declaration
          <select value={rights} onChange={(e) => setRights(e.target.value)}>
            <option value="local_research_only">
              Private local research use only
            </option>
            <option value="unknown">
              Terms unknown · private display only
            </option>
            <option value="CC0-1.0">CC0 declared by importer</option>
            <option value="CC-BY-4.0">CC BY 4.0 declared by importer</option>
            <option value="public_domain">
              Public domain declared by importer
            </option>
          </select>
        </label>
        <label>
          Rights basis / permission note
          <textarea
            required
            value={rightsRationale}
            minLength={5}
            maxLength={1000}
            rows={2}
            onChange={(e) => setRightsRationale(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Imported by
            <input
              value={name}
              required
              minLength={2}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Role / qualification
            <input
              value={qualification}
              required
              minLength={3}
              onChange={(e) => setQualification(e.target.value)}
            />
          </label>
        </div>
        {validation || mutation.isError ? (
          <p role="alert" className="form-error">
            {validation || mutation.error?.message}
          </p>
        ) : null}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={close}
            disabled={mutation.isPending}
          >
            Cancel import
          </button>
          <button className="primary-button" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Retaining exact text…"
              : "Create local draft"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
