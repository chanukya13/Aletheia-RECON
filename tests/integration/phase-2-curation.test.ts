import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  CaseResponse,
  EditorSession,
  ExtractionRun,
  SaveResponse,
  TaxonomyResponse,
} from "@recon/contracts";
import { createApp } from "../../apps/server/src/app.js";
import { openDatabase } from "../../apps/server/src/database.js";
const closers: Array<() => void | Promise<void>> = [];
afterEach(async () => {
  for (const close of closers.splice(0).reverse()) await close();
});
const actor = {
  name: "Integration test reviewer",
  qualification: "Synthetic test actor; not an actual corpus reviewer",
  mode: "source_checked" as const,
};
async function setup() {
  const db = openDatabase(":memory:");
  closers.push(() => {
    db.close();
  });
  const app = await createApp({ db, ui: false, liveTaxonomy: false });
  closers.push(() => app.close());
  const session = EditorSession.parse(
    (await app.inject("/api/v1/editor-session")).json(),
  );
  const headers = {
    origin: "http://localhost",
    "x-recon-csrf": session.csrfToken,
  };
  return { app, db, headers };
}
const saveInput = () => ({
  requestId: randomUUID(),
  actor,
  expectedRevision: 1,
  decisions: [],
  manualAnnotations: [],
  fieldEdits: [],
  candidateEdits: [],
  assignments: [],
  assignmentRationale: "",
  rationale: "Source checked in isolated integration test",
});
describe("actual import → extraction → review → immutable save", () => {
  it("preserves old revisions, exact source and accepted/rejected proposal history across reload", async () => {
    const { app, db, headers } = await setup();
    const imported = await app.inject({
      method: "POST",
      url: "/api/v1/imports/text",
      headers,
      payload: {
        requestId: randomUUID(),
        actor,
        title: "Isolated test preparation",
        text: "𐐀 Take 2 g garlic and honey. Mix, then strain. Do not boil.",
        language: "en",
        creator: "Test fixture author",
        edition: "Synthetic integration fixture",
        rightsDeclaration: "local_research_only",
        rightsRationale: "Synthetic text for private software testing only",
        kind: "recipe",
      },
    });
    expect(imported.statusCode, imported.body).toBe(200);
    const c = SaveResponse.parse(imported.json()).result.case;
    const sourceId = c.primarySourceRevisionId;
    const extraction = await app.inject({
      method: "POST",
      url: `/api/v1/cases/${c.id}/extraction-proposals`,
      headers,
      payload: {
        requestId: randomUUID(),
        actor,
        expectedRevision: 1,
        sourceRevisionId: sourceId,
        extractorVersion: "english-preparation-v1",
      },
    });
    expect(extraction.statusCode, extraction.body).toBe(200);
    const run = ExtractionRun.parse(extraction.json());
    const garlic = run.proposals.find((p) => p.value === "garlic")!,
      honey = run.proposals.find((p) => p.value === "honey")!;
    const request = {
      ...saveInput(),
      runId: run.id,
      decisions: [
        {
          proposalId: garlic.id,
          decision: "accept",
          rationale: "Garlic is explicitly taken in the source.",
        },
        {
          proposalId: honey.id,
          decision: "reject",
          rationale: "Rejected in this isolated review test.",
        },
      ],
    };
    const saved = await app.inject({
      method: "POST",
      url: `/api/v1/cases/${c.id}/revisions`,
      headers,
      payload: request,
    });
    expect(saved.statusCode, saved.body).toBe(200);
    const result = SaveResponse.parse(saved.json()).result;
    expect(result.case.revision).toBe(2);
    expect(result.material.componentSlots).toHaveLength(1);
    expect(result.material.fingerprint).toHaveLength(64);
    expect(result.sourceRevisions[0]!.displayText).toBe(
      "𐐀 Take 2 g garlic and honey. Mix, then strain. Do not boil.",
    );
    const pinned = CaseResponse.parse(
      (await app.inject(`/api/v1/cases/${c.id}?revision=1`)).json(),
    );
    expect(pinned.material.componentSlots).toEqual([]);
    expect(pinned.case.contentHash).toBe(c.contentHash);
    const current = CaseResponse.parse(
      (await app.inject(`/api/v1/cases/${c.id}`)).json(),
    );
    expect(current.case.revision).toBe(2);
    expect(
      current.assertions.find(
        (a) => a.id === current.material.componentSlots[0]!.termAssertionId,
      )!.review.status,
    ).toBe("accepted");
    const repeated = await app.inject({
      method: "POST",
      url: `/api/v1/cases/${c.id}/revisions`,
      headers,
      payload: request,
    });
    expect(repeated.statusCode).toBe(200);
    expect(SaveResponse.parse(repeated.json()).result.case.revision).toBe(2);
    const history = ExtractionRun.parse(
      (
        await app.inject(
          `/api/v1/cases/${c.id}/extraction-proposals?runId=${run.id}`,
        )
      ).json(),
    );
    expect(history.decisions.map((d) => d.decision)).toEqual([
      "accept",
      "reject",
    ]);
    expect(db.pragma("foreign_key_check")).toEqual([]);
  });
  it("rejects stale writes while keeping the previously saved data intact", async () => {
    const { app, headers } = await setup();
    const initial = CaseResponse.parse(
      (await app.inject("/api/v1/cases/balds-eyesalve")).json(),
    );
    const request = {
      ...saveInput(),
      assignments: [
        { occurrenceId: "slot-cropleek", candidateId: "candidate-onion" },
      ],
      assignmentRationale: "Explicit onion interpretation for test only.",
    };
    const a = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: request,
    });
    expect(a.statusCode, a.body).toBe(200);
    const stale = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: { ...request, requestId: randomUUID() },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.code).toBe("STALE_REVISION");
    const old = CaseResponse.parse(
      (await app.inject("/api/v1/cases/balds-eyesalve?revision=1")).json(),
    );
    expect(old.case.contentHash).toBe(initial.case.contentHash);
    expect(old.case.baselineScenarioInput.assignments).toEqual([]);
  });
  it("rejects invalid manual spans and unsupported assertion values transactionally", async () => {
    const { app, headers } = await setup();
    const c = CaseResponse.parse(
      (await app.inject("/api/v1/cases/balds-eyesalve")).json(),
    );
    const r = c.sourceRevisions[0]!;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: {
        ...saveInput(),
        manualAnnotations: [
          {
            sourceRevisionId: r.id,
            sourceTextSha256: r.textSha256,
            start: 0,
            end: 3,
            exact: "BAD",
            kind: "ingredient",
            value: "fake",
            interpretation: "recorded",
            rationale: "Invalid selection test",
          },
        ],
      },
    });
    expect(response.statusCode).toBe(422);
    expect(
      CaseResponse.parse(
        (await app.inject("/api/v1/cases/balds-eyesalve")).json(),
      ).case.revision,
    ).toBe(1);
  });
  it("supports unsupported-language imports through manual annotation without fabricating translation", async () => {
    const { app, headers } = await setup();
    const text = "𐐀 ά · Ƿyrc cropleac ⁊ garleac";
    const imported = SaveResponse.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/imports/text",
          headers,
          payload: {
            requestId: randomUUID(),
            actor,
            title: "Old English test",
            text,
            language: "ang",
            creator: "Test author",
            edition: "Synthetic Unicode fixture",
            rightsDeclaration: "unknown",
            rightsRationale: "Local-only software fixture, no redistribution",
            kind: "recipe",
          },
        })
      ).json(),
    );
    const r = imported.result.sourceRevisions[0]!;
    const run = ExtractionRun.parse(
      (
        await app.inject({
          method: "POST",
          url: `/api/v1/cases/${imported.result.case.id}/extraction-proposals`,
          headers,
          payload: {
            requestId: randomUUID(),
            actor,
            expectedRevision: 1,
            sourceRevisionId: r.id,
            extractorVersion: "english-preparation-v1",
          },
        })
      ).json(),
    );
    expect(run.status).toBe("unsupported_language");
    const start = text.indexOf("cropleac");
    const saved = await app.inject({
      method: "POST",
      url: `/api/v1/cases/${imported.result.case.id}/revisions`,
      headers,
      payload: {
        ...saveInput(),
        manualAnnotations: [
          {
            sourceRevisionId: r.id,
            sourceTextSha256: r.textSha256,
            start,
            end: start + 8,
            exact: "cropleac",
            kind: "ingredient",
            value: "cropleac",
            interpretation: "recorded",
            rationale: "Manual exact occurrence; no modern taxon inferred.",
          },
        ],
      },
    });
    expect(saved.statusCode, saved.body).toBe(200);
    expect(
      SaveResponse.parse(saved.json()).result.material.componentSlots,
    ).toHaveLength(1);
  });
  it("protects writes against foreign origins and missing tokens", async () => {
    const { app, headers } = await setup();
    for (const bad of [
      {},
      {
        origin: "http://attacker.example",
        "x-recon-csrf": headers["x-recon-csrf"],
      },
    ]) {
      const r = await app.inject({
        method: "POST",
        url: "/api/v1/cases/balds-eyesalve/revisions",
        headers: bad,
        payload: saveInput(),
      });
      expect(r.statusCode).toBe(403);
    }
  });
  it("shows bundled taxonomic ambiguity and preserves a qualified synonym record", async () => {
    const { app } = await setup();
    const ambiguous = TaxonomyResponse.parse(
      (
        await app.inject(
          "/api/v1/taxonomy/candidates?scientificName=Allium%20porrum",
        )
      ).json(),
    );
    expect(ambiguous.state).toBe("needs_review");
    expect(ambiguous.choices.every((c) => !c.selectable)).toBe(true);
    const qualified = TaxonomyResponse.parse(
      (
        await app.inject(
          "/api/v1/taxonomy/candidates?scientificName=Allium%20porrum%20L.",
        )
      ).json(),
    );
    expect(qualified.state).toBe("ready");
    expect(qualified.choices[0]).toMatchObject({
      status: "SYNONYM",
      rank: "SPECIES",
      acceptedName: "Allium ampeloprasum L.",
      acceptedRank: "SPECIES",
    });
  });
  it("retains synonym and accepted usage as separate immutable licensed sources", async () => {
    const { app, headers, db } = await setup();
    const tax = TaxonomyResponse.parse(
      (
        await app.inject(
          "/api/v1/taxonomy/candidates?scientificName=Allium%20porrum%20L.",
        )
      ).json(),
    );
    const input = {
      ...saveInput(),
      actor: { ...actor, mode: "draft" },
      candidateEdits: [
        {
          occurrenceId: "slot-cropleek",
          proposedName: "Allium porrum L.",
          status: "inferred",
          supportSpanIds: ["span-cropleek"],
          rationale:
            "Synthetic inferred alternative; name match is separate from historical identity.",
          taxonomySnapshotId: tax.snapshotId,
          taxonomyChoiceKey: tax.choices[0]!.key,
          taxonomyReviewed: true,
        },
      ],
    };
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: input,
    });
    expect(response.statusCode, response.body).toBe(200);
    const result = SaveResponse.parse(response.json()).result;
    const candidate = result.candidates.find(
      (c) => c.proposedName === "Allium porrum L.",
    )!;
    const concept = result.taxa!.find(
      (t) => t.id === candidate.taxonConceptId,
    )!;
    expect(concept.reportedName).toBe("Allium porrum L.");
    expect(concept.acceptedName).toBe("Allium ampeloprasum L.");
    expect(concept.supportingSourceRevisionIds).toHaveLength(2);
    for (const id of concept.supportingSourceRevisionIds!)
      expect(
        result.sourceRevisions.find((r) => r.id === id)!.rights,
      ).toMatchObject({ license: "CC BY 4.0", redistribution: true });
    expect(result.case.baselineScenarioInput.assignments).toEqual([]);
    const old = CaseResponse.parse(
      (await app.inject("/api/v1/cases/balds-eyesalve?revision=1")).json(),
    );
    expect(old.candidates.some((c) => c.id === candidate.id)).toBe(false);
    expect(old.taxa?.some((t) => t.id === concept.id)).toBe(false);
    expect(db.pragma("foreign_key_check")).toEqual([]);
    const raw = result.sourceRevisions.find(
      (r) => r.id === concept.sourceRevisionId,
    )!;
    const exact = "Allium porrum L.";
    const start = raw.displayText.indexOf(exact);
    expect(start).toBeGreaterThanOrEqual(0);
    const annotated = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: {
        ...saveInput(),
        expectedRevision: 2,
        manualAnnotations: [
          {
            sourceRevisionId: raw.id,
            sourceTextSha256: raw.textSha256,
            start,
            end: start + exact.length,
            exact,
            kind: "matrix",
            value: exact,
            interpretation: "inferred",
            rationale:
              "Synthetic annotation to verify taxonomic evidence cannot replace historical support.",
          },
        ],
      },
    });
    expect(annotated.statusCode, annotated.body).toBe(200);
    const updated = SaveResponse.parse(annotated.json()).result;
    const span = updated.spans.find(
      (s) => s.sourceRevisionId === raw.id && s.exact === exact,
    )!;
    const circular = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: {
        ...saveInput(),
        expectedRevision: 3,
        candidateEdits: [
          {
            occurrenceId: "slot-cropleek",
            proposedName: exact,
            status: "documented_plausible",
            supportSpanIds: [span.id],
            rationale:
              "This deliberately invalid test relies only on the taxonomic response.",
            taxonomyReviewed: false,
          },
        ],
      },
    });
    expect(circular.statusCode).toBe(422);
    expect(circular.json().error.code).toBe("HISTORICAL_BASIS_REQUIRED");
    expect(
      CaseResponse.parse(
        (await app.inject("/api/v1/cases/balds-eyesalve")).json(),
      ).case.revision,
    ).toBe(3);
  });
  it("rejects unsupported documented identity, taxon mismatch and incompatible quantity units without committing", async () => {
    const { app, headers } = await setup();
    const base = {
      occurrenceId: "slot-cropleek",
      proposedName: "Completely invented plant",
      status: "documented_plausible",
      supportSpanIds: ["span-cropleek"],
      rationale: "Synthetic unsupported candidate rejection test.",
      taxonomyReviewed: false,
    };
    const bad = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: { ...saveInput(), candidateEdits: [base] },
    });
    expect(bad.statusCode).toBe(422);
    const tax = TaxonomyResponse.parse(
      (
        await app.inject(
          "/api/v1/taxonomy/candidates?scientificName=Allium%20cepa",
        )
      ).json(),
    );
    const mismatched = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: {
        ...saveInput(),
        candidateEdits: [
          {
            ...base,
            status: "inferred",
            proposedName: "Allium sativum",
            taxonomySnapshotId: tax.snapshotId,
            taxonomyChoiceKey: tax.choices[0]!.key,
            taxonomyReviewed: true,
          },
        ],
      },
    });
    expect(mismatched.statusCode).toBe(422);
    expect(mismatched.json().error.code).toBe("TAXON_NAME_MISMATCH");
    const data = CaseResponse.parse(
      (await app.inject("/api/v1/cases/balds-eyesalve")).json(),
    );
    const q = data.material.quantities[0]!;
    const a = data.assertions.find((a) => a.id === q.assertionId)!;
    const ref = a.references.find((r) => r.kind === "span")!;
    if (ref.kind !== "span") throw Error("Missing quantity source");
    const quantity = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers,
      payload: {
        ...saveInput(),
        quantityEdits: [
          {
            quantityId: q.id,
            basis: "mass",
            value: 2,
            unit: "mL",
            supportingSpanId: ref.spanId,
            rationale: "Synthetic incompatible unit rejection test.",
          },
        ],
      },
    });
    expect(quantity.statusCode).toBe(422);
    expect(quantity.json().error.code).toBe("INCOMPATIBLE_QUANTITY_BASIS");
    expect(
      CaseResponse.parse(
        (await app.inject("/api/v1/cases/balds-eyesalve")).json(),
      ).case.revision,
    ).toBe(1);
  });
  it("creates two distinct imports, keeps malicious text inert and rejects idempotency-key reuse", async () => {
    const { app, headers } = await setup();
    const request = {
      requestId: randomUUID(),
      actor: { ...actor, mode: "draft" },
      title: "Isolated malicious-text fixture",
      text: "<script>window.BAD=true</script> Take garlic.",
      language: "en",
      creator: "Test author",
      edition: "Private synthetic fixture",
      rightsDeclaration: "unknown",
      rightsRationale: "Synthetic local test text only.",
      kind: "recipe",
    };
    const first = SaveResponse.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/imports/text",
          headers,
          payload: request,
        })
      ).json(),
    );
    const second = SaveResponse.parse(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/imports/text",
          headers,
          payload: { ...request, requestId: randomUUID() },
        })
      ).json(),
    );
    expect(first.result.case.id).not.toBe(second.result.case.id);
    expect(first.result.sourceRevisions[0]!.displayText).toBe(request.text);
    expect(first.result.sourceRevisions[0]!.rights.redistribution).toBe(false);
    const conflict = await app.inject({
      method: "POST",
      url: "/api/v1/imports/text",
      headers,
      payload: { ...request, title: "Changed same request" },
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json().error.code).toBe("IDEMPOTENCY_CONFLICT");
  });
  it("enforces read-only mode without disabling inspection", async () => {
    const db = openDatabase(":memory:");
    closers.push(() => {
      db.close();
    });
    const app = await createApp({
      db,
      ui: false,
      editor: false,
      liveTaxonomy: false,
    });
    closers.push(() => app.close());
    const session = EditorSession.parse(
      (await app.inject("/api/v1/editor-session")).json(),
    );
    expect(session.enabled).toBe(false);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/cases/balds-eyesalve/revisions",
      headers: {
        origin: "http://localhost",
        "x-recon-csrf": session.csrfToken,
      },
      payload: saveInput(),
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("READ_ONLY");
    expect((await app.inject("/api/v1/cases/balds-eyesalve")).statusCode).toBe(
      200,
    );
  });
});
