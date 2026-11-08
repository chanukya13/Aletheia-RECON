import { Link, useLocation } from "react-router-dom";
import "../journey.css";

export function ResearchHome() {
  return (
    <div className="journey-home page-width">
      <p className="eyebrow">Aletheia RECON / evidence investigation</p>
      <h1>
        Follow the word.
        <br />
        Check the experiment.
      </h1>
      <p className="journey-intro">
        A historical ingredient can have several readings. Find where each
        interpretation came from, compare what researchers actually tested, and
        save an analysis others can reproduce.
      </p>
      <section className="journey-feature">
        <div>
          <p className="eyebrow">Bald’s eyesalve / Old English medicine</p>
          <h2>
            Did <i>cropleac</i> mean onion or leek?
          </h2>
          <p>
            Inspect the original wording, the editor’s suggestion and the modern
            alternatives. Then see how the published measurements vary by
            bacterial strain.
          </p>
          <Link className="primary-button" to="/cases/balds-eyesalve/source">
            Start the eyesalve investigation ↗
          </Link>
        </div>
        <ol>
          <li>
            <strong>Read the source</strong>
            <span>Keep the original wording and its edition in view.</span>
          </li>
          <li>
            <strong>Trace the interpretation</strong>
            <span>See which source supports each proposed identity.</span>
          </li>
          <li>
            <strong>Compare the experiment</strong>
            <span>Inspect the exact values, strain and assay.</span>
          </li>
          <li>
            <strong>Save a reproducible audit</strong>
            <span>
              Record your assumptions and download the evidence chain.
            </span>
          </li>
        </ol>
      </section>
      <section className="journey-other">
        <div>
          <h2>Investigate another source</h2>
          <p>
            Oxymel offers a different question. How far can a historical
            preparation mention support a comparison with a modern tested
            material?
          </p>
          <Link to="/cases/hippocratic-oxymel/source">
            Open the oxymel source ↗
          </Link>
        </div>
        <div>
          <h2>Bring your own passage</h2>
          <p>
            Import a source with its attribution, annotate the wording and
            investigate it using the same tools.
          </p>
          <Link to="/cases">Browse cases or import a passage ↗</Link>
        </div>
        <div>
          <h2>Inspect the evidence behind RECON</h2>
          <p>
            Open the executed validation, baseline comparisons, source checks
            and reproducible outputs.
          </p>
          <Link to="/evaluation">View measured validation results ↗</Link>
        </div>
      </section>
    </div>
  );
}

function journeyFor(path: string) {
  const match = path.match(
    /^\/cases\/([^/]+)\/(source|material|evidence|interpretations)$/,
  );
  const id =
    match?.[1] ??
    (["/trace", "/outcomes"].includes(path) ? "balds-eyesalve" : null);
  if (!id) return null;
  const eyesalve = id === "balds-eyesalve";
  const steps = [
    { label: "Source", path: `/cases/${id}/source` },
    {
      label: "Interpretation",
      path: eyesalve ? "/trace?q=cropleac" : `/cases/${id}/material`,
    },
    {
      label: "Experiment",
      path: eyesalve ? "/outcomes" : `/cases/${id}/evidence`,
    },
    {
      label: "Save an audit",
      path: eyesalve
        ? `/cases/${id}/interpretations?study=study-fuchs-2018`
        : `/cases/${id}/interpretations`,
    },
  ];
  const current = path.endsWith("/source")
    ? 0
    : path === "/trace" || path.endsWith("/material")
      ? 1
      : path === "/outcomes" || path.endsWith("/evidence")
        ? 2
        : 3;
  return { steps, current };
}
export function ResearchJourney({ next = false }: { next?: boolean }) {
  const location = useLocation(),
    journey = journeyFor(location.pathname);
  if (!journey) return null;
  if (next) {
    const step = journey.steps[journey.current + 1];
    return step ? (
      <div className="journey-next page-width">
        <span>
          {
            [
              "Now follow the source behind each proposed reading.",
              "Next, inspect what was measured in the modern experiment.",
              "Keep the interpretation explicit and save its evidence audit.",
            ][journey.current]
          }
        </span>
        <Link className="primary-button" to={step.path}>
          Continue to {step.label.toLowerCase()} ↗
        </Link>
      </div>
    ) : null;
  }
  return (
    <nav className="journey-nav page-width" aria-label="Research journey">
      {journey.steps.map((step, index) => (
        <Link
          key={step.label}
          to={step.path}
          aria-current={index === journey.current ? "step" : undefined}
        >
          <span aria-hidden="true">{index + 1}</span>
          {step.label}
        </Link>
      ))}
    </nav>
  );
}
