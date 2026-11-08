import { Link, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import "../journey.css";

export function ResearchHome() {
  return (
    <div className="journey-home page-width">
      <section className="research-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="topic-label">
            <Icon name="leaf" size={17} /> Traditional knowledge, examined
          </span>
          <h1 id="home-title">
            Old remedies.
            <br />
            Evidence you
            <br />
            can inspect.
          </h1>
          <p className="hero-description">
            Discover what a historical remedy meant—and what modern researchers
            actually tested.
          </p>
          <Link
            className="primary-button hero-start"
            to="/cases/balds-eyesalve/source"
          >
            Start the eyesalve investigation <Icon name="arrow" size={18} />
          </Link>
          <Link className="hero-secondary" to="/cases">
            Explore the case library
          </Link>
        </div>
        <figure className="hero-study">
          <img
            src="/images/onion-leek-study.webp"
            width="1448"
            height="1086"
            alt="Illustrative still life of an onion, a leek and an empty glass petri dish"
            fetchPriority="high"
          />
          <figcaption className="hero-study-caption">
            <span>Featured investigation</span>
            <strong>Onion or leek?</strong>
            <p>One historical word. Different modern preparations.</p>
            <Link to="/trace?q=cropleac">
              Follow the evidence <Icon name="arrow" size={17} />
            </Link>
          </figcaption>
          <span className="illustration-label">
            Illustration · not source evidence
          </span>
        </figure>
      </section>
      <section className="investigation-path" aria-labelledby="path-title">
        <div className="section-intro">
          <h2 id="path-title">A question becomes a traceable investigation.</h2>
          <p>Read it. Question it. Check what was tested.</p>
        </div>
        <div className="path-preview">
          {(
            [
              [
                "book",
                "Read the source",
                "An Old English recipe",
                "/cases/balds-eyesalve/source",
              ],
              [
                "trace",
                "Trace the interpretation",
                "Why onion? Why leek?",
                "/trace?q=cropleac",
              ],
              [
                "flask",
                "Compare the experiment",
                "Published measurements",
                "/outcomes",
              ],
              [
                "folder",
                "Save a reproducible audit",
                "Your assumptions and evidence",
                "/cases/balds-eyesalve/interpretations?study=study-fuchs-2018",
              ],
            ] as const
          ).map(([icon, title, text, to], i) => (
            <Link className="path-step" key={to} to={to}>
              <span className="path-symbol">
                <Icon name={icon} size={23} />
              </span>
              <span>
                <small>Step {i + 1}</small>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </div>
      </section>
      <section className="desk-shortcuts" aria-label="More ways to investigate">
        <Link to="/cases/hippocratic-oxymel/source">
          <Icon name="book" />
          <span>
            <strong>Another historical source</strong>
            <span>Explore honey, vinegar and oxymel.</span>
          </span>
          <Icon name="arrow" size={17} />
        </Link>
        <Link to="/cases">
          <Icon name="folder" />
          <span>
            <strong>Bring your own passage</strong>
            <span>Import, annotate and investigate.</span>
          </span>
          <Icon name="arrow" size={17} />
        </Link>
        <Link to="/evaluation">
          <Icon name="check" />
          <span>
            <strong>Check our methods</strong>
            <span>Executed tests and honest limitations.</span>
          </span>
          <Icon name="arrow" size={17} />
        </Link>
      </section>
      <p className="home-integrity">
        <Icon name="check" size={16} /> Sources stay inspectable. Assumptions
        stay explicit. Research use; independent review pending.
      </p>
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
  const steps: { label: string; path: string; icon: IconName }[] = [
    { label: "Source", path: `/cases/${id}/source`, icon: "book" },
    {
      label: "Interpretation",
      path: eyesalve ? "/trace?q=cropleac" : `/cases/${id}/material`,
      icon: "trace",
    },
    {
      label: "Experiment",
      path: eyesalve ? "/outcomes" : `/cases/${id}/evidence`,
      icon: "flask",
    },
    {
      label: "Save an audit",
      path: eyesalve
        ? `/cases/${id}/interpretations?study=study-fuchs-2018`
        : `/cases/${id}/interpretations`,
      icon: "folder",
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
              "See where the onion and leek readings came from.",
              "See what the modern experiment actually measured.",
              "Keep your interpretation explicit and save its evidence.",
            ][journey.current]
          }
        </span>
        <Link className="primary-button" to={step.path}>
          Continue to {step.label.toLowerCase()} <Icon name="arrow" size={18} />
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
          <Icon name={step.icon} size={17} />
          {step.label}
        </Link>
      ))}
    </nav>
  );
}
