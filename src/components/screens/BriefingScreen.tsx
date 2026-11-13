import { useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Database,
  FlaskConical,
  Gauge,
  Layers,
  Orbit,
  Rocket,
  Satellite,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { BODIES } from "../../data/bodies";
import { DATASET } from "../../data/dataset";
import { DIFFICULTIES, DIFFICULTY_BY_ID } from "../../data/difficulties";
import { MEASUREMENTS } from "../../data/measurements";
import { OBJECTIVES } from "../../data/objectives";
import { getOrbit, scienceTargetFor } from "../../engine/design";
import { fmtMonths, fmtMusd, fmtNumber, fmtPercent } from "../../engine/format";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Meter } from "../ui/Meter";
import { Modal } from "../ui/Modal";
import { BodyOrb } from "../visuals/BodyOrb";
import { OrbitDiagram } from "../visuals/OrbitDiagram";

export function BriefingScreen() {
  const { state, dispatch } = useGame();
  const [introOpen, setIntroOpen] = useState(false);
  const difficulty = DIFFICULTY_BY_ID[state.design.difficulty];
  const selected = OBJECTIVES.find((item) => item.id === state.design.objectiveId);
  const selectedOrbit = selected ? getOrbit(selected.allowedOrbits[0]) : undefined;
  const heroBody = selected?.body ?? "earth";

  const scrollToObjectives = () => {
    document.getElementById("objective-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="screen briefing-screen">
      <section className="hero">
        <div className="hero__copy">
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-line" />
            NASA SPACE APPS CHALLENGE <span className="slash">/</span> 2026
          </div>
          <h1 className="hero__title">
            There is no perfect spacecraft.
            <span>Only trade-offs.</span>
          </h1>
          <p className="hero__lede">
            Design a science mission from the bus up. Choose instruments, orbit and launch
            vehicle, then live with the mass, power, data and budget consequences. Every
            decision opens one door and closes another.
          </p>
          <div className="hero__actions">
            <Button
              variant="primary"
              size="lg"
              icon={<Target size={17} />}
              trailing={<ArrowRight size={17} />}
              onClick={scrollToObjectives}
            >
              {selected ? "Continue mission setup" : "Choose a mission"}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              icon={<BookOpen size={17} />}
              onClick={() => setIntroOpen(true)}
            >
              How it works
            </Button>
          </div>
          <div className="hero__specs">
            <div>
              <strong>07</strong>
              <span>subsystems</span>
            </div>
            <div>
              <strong>26</strong>
              <span>components</span>
            </div>
            <div>
              <strong>06</strong>
              <span>target bodies</span>
            </div>
            <div>
              <strong>01</strong>
              <span>hard budget</span>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero-visual__frame">
            <div className="hero-visual__top">
              <span>MISSION ARCHITECTURE</span>
              <Badge tone="cyan" dot>
                concept · CML 1
              </Badge>
            </div>
            <OrbitDiagram body={heroBody} orbit={selectedOrbit} compact />
            <div className="hero-visual__readout">
              <div>
                <span>Target</span>
                <strong>{selected ? BODIES[selected.body].name : "Unassigned"}</strong>
              </div>
              <div>
                <span>Orbit</span>
                <strong>{selectedOrbit?.shortName ?? "Open trade"}</strong>
              </div>
              <div>
                <span>Budget</span>
                <strong>
                  {selected
                    ? fmtMusd(selected.baseBudgetMusd * difficulty.budgetMultiplier)
                    : fmtMusd(420 * difficulty.budgetMultiplier)}
                </strong>
              </div>
            </div>
            <div className="hero-visual__corner hero-visual__corner--tl" />
            <div className="hero-visual__corner hero-visual__corner--tr" />
            <div className="hero-visual__corner hero-visual__corner--bl" />
            <div className="hero-visual__corner hero-visual__corner--br" />
          </div>
          <p className="hero__visual-caption">
            <Sparkles size={13} /> Reference framework: NASA GSFC Mission Design Lab disciplines.
            Dataset {DATASET.status}.
          </p>
        </div>
      </section>

      <section className="section difficulty-section">
        <div className="section__heading">
          <div>
            <span className="eyebrow">01 · Programme settings</span>
            <h2>Choose how much margin you can afford.</h2>
          </div>
          <p className="section__hint">
            Difficulty changes the budget, required margins and score multiplier. You can adjust
            it before launch.
          </p>
        </div>
        <div className="difficulty-grid">
          {DIFFICULTIES.map((item) => {
            const active = item.id === difficulty.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`difficulty-card ${active ? "is-active" : ""}`}
                onClick={() => dispatch({ type: "set-difficulty", difficulty: item.id })}
                aria-pressed={active}
              >
                <div className="difficulty-card__top">
                  <span className={`difficulty-card__signal difficulty-card__signal--${item.id}`} />
                  <span className="difficulty-card__label">{item.label}</span>
                  {active ? <Check size={15} /> : null}
                </div>
                <strong>{item.tagline}</strong>
                <p>{item.description}</p>
                <div className="difficulty-card__stats">
                  <span>
                    <CircleDollarSign size={12} />
                    {Number.isFinite(item.budgetMultiplier)
                      ? `×${item.budgetMultiplier.toFixed(2)}`
                      : "∞ budget"}
                  </span>
                  <span>
                    <BatteryCharging size={12} />
                    {fmtPercent(item.powerMargin * 100)} power
                  </span>
                  <span>
                    <Database size={12} />
                    {fmtPercent(item.dataMargin * 100)} data
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="difficulty-detail">
          <span className="difficulty-detail__icon">
            <Gauge size={16} />
          </span>
          <p>
            <strong>{difficulty.label}:</strong> {difficulty.description}{" "}
            {difficulty.hintLevel === "minimal"
              ? "Hints are limited to feasibility failures."
              : "Design hints are available throughout the build."}{" "}
            Score multiplier <strong>×{difficulty.scoreMultiplier.toFixed(2)}</strong>.
          </p>
        </div>
      </section>

      <section className="section objective-section" id="objective-grid">
        <div className="section__heading">
          <div>
            <span className="eyebrow">02 · Mission briefs</span>
            <h2>Pick a reason to leave Earth.</h2>
          </div>
          <p className="section__hint">
            Each brief demands a different measurement suite. The target body and required
            measurements drive the entire architecture.
          </p>
        </div>

        <div className="objective-grid">
          {OBJECTIVES.map((objective) => {
            const active = objective.id === state.design.objectiveId;
            const budget = objective.baseBudgetMusd * difficulty.budgetMultiplier;
            const scienceTarget = scienceTargetFor(objective, difficulty);
            return (
              <button
                key={objective.id}
                type="button"
                className={`objective-card ${active ? "is-active" : ""}`}
                style={{ ["--accent" as string]: BODIES[objective.body].color }}
                onClick={() => dispatch({ type: "set-objective", objectiveId: objective.id })}
                aria-pressed={active}
              >
                <div className="objective-card__glow" aria-hidden="true" />
                <header className="objective-card__header">
                  <BodyOrb body={objective.body} size="sm" ring />
                  <div className="objective-card__tags">
                    <Badge tone="muted">{BODIES[objective.body].shortName}</Badge>
                    <span className="objective-card__category">{objective.category}</span>
                  </div>
                  <span className="objective-card__select">
                    {active ? <Check size={15} /> : <ChevronRight size={15} />}
                  </span>
                </header>
                <div className="objective-card__codename">{objective.codename}</div>
                <h3>{objective.name}</h3>
                <p className="objective-card__summary">{objective.summary}</p>

                <div className="objective-card__stats">
                  <div>
                    <span>
                      <CircleDollarSign size={12} /> Budget
                    </span>
                    <strong>
                      {Number.isFinite(budget) ? fmtMusd(budget) : "Unlimited"}
                    </strong>
                  </div>
                  <div>
                    <span>
                      <Timer size={12} /> Lifetime
                    </span>
                    <strong>{fmtMonths(objective.requiredLifetimeMonths)}</strong>
                  </div>
                  <div>
                    <span>
                      <Orbit size={12} /> Coverage
                    </span>
                    <strong>{fmtPercent(objective.minCoveragePct)}</strong>
                  </div>
                  <div>
                    <span>
                      <FlaskConical size={12} /> Science
                    </span>
                    <strong>{fmtNumber(scienceTarget)} pts</strong>
                  </div>
                </div>

                <div className="objective-card__measurements">
                  {objective.measurementsRequired.map((tag) => (
                    <span key={tag} className="measurement-chip" title={MEASUREMENTS[tag].description}>
                      {MEASUREMENTS[tag].short}
                      <em>{MEASUREMENTS[tag].label}</em>
                    </span>
                  ))}
                </div>

                <footer className="objective-card__footer">
                  <span>
                    <ShieldAlert size={12} /> {objective.hazards.length} hazards
                  </span>
                  <span>
                    <Layers size={12} /> {objective.allowedOrbits.length} orbits
                  </span>
                  <span className="objective-card__action">
                    {active ? "Selected" : "Select brief"}
                  </span>
                </footer>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section briefing-checkpoint">
        <div className="briefing-checkpoint__copy">
          <span className="eyebrow">Ready check</span>
          <h3>{selected ? `${selected.codename} is on the board.` : "No mission brief selected."}</h3>
          <p>
            {selected
              ? `${selected.summary} Next: stack the subsystems and see what the mass, power, data and dollar budgets do to your intent.`
              : "Choose a target and a mission objective above, then move into the spacecraft bay."}
          </p>
        </div>
        <div className="briefing-checkpoint__stats">
          {selected ? (
            <>
              <div>
                <span>Target</span>
                <strong>{BODIES[selected.body].name}</strong>
              </div>
              <div>
                <span>Programme</span>
                <strong>{difficulty.label}</strong>
              </div>
              <div>
                <span>Launch budget</span>
                <strong>
                  {fmtMusd(selected.baseBudgetMusd * difficulty.budgetMultiplier)}
                </strong>
              </div>
            </>
          ) : (
            <div className="briefing-checkpoint__empty">
              <Satellite size={20} />
              <span>Awaiting mission need</span>
            </div>
          )}
          <Button
            variant="primary"
            icon={<Rocket size={16} />}
            trailing={<ArrowRight size={16} />}
            disabled={!selected}
            onClick={() => dispatch({ type: "set-step", step: "spacecraft" })}
          >
            {selected ? "Open spacecraft bay" : "Select a brief"}
          </Button>
        </div>
      </section>

      <Modal
        open={introOpen}
        onClose={() => setIntroOpen(false)}
        eyebrow="Operator's handbook"
        title="How a mission comes together"
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setIntroOpen(false)}>
            Back to the brief
          </Button>
        }
      >
        <div className="intro-steps">
          <article>
            <span className="intro-steps__number">01</span>
            <div>
              <h3>Frame the mission</h3>
              <p>
                Select an objective and a difficulty. Difficulty sets the budget, required
                margins, access to advanced hardware and your score multiplier.
              </p>
            </div>
          </article>
          <article>
            <span className="intro-steps__number">02</span>
            <div>
              <h3>Build the spacecraft</h3>
              <p>
                Seven subsystem categories, one bus. Mass, power, data, pointing, lifetime and
                cost update live. Instruments are the reason for the mission, but they are never
                free.
              </p>
            </div>
          </article>
          <article>
            <span className="intro-steps__number">03</span>
            <div>
              <h3>Choose orbit and launch</h3>
              <p>
                Orbit sets coverage, eclipse, radiation and comms windows. The launch vehicle
                must fit your mass and stowed envelope, and you pay for it out of the same
                budget.
              </p>
            </div>
          </article>
          <article>
            <span className="intro-steps__number">04</span>
            <div>
              <h3>Fly the consequences</h3>
              <p>
                A deterministic simulation runs the full mission: eclipse, battery state,
                buffer overflow, downlink, degradation and science return. The report explains
                what worked and what you traded away.
              </p>
            </div>
          </article>
        </div>
        <div className="intro-note">
          <Meter label="Mission difficulty" value={state.design.difficulty === "hard" ? 90 : state.design.difficulty === "medium" ? 60 : 30} max={100} display={difficulty.label} tone="amber" compact />
          <p>
            Trade-off philosophy: there is no hidden perfect answer. Different combinations of
            bus, instruments, orbit and launch vehicle can satisfy the same brief. The score
            rewards science, margin discipline and cost efficiency — you choose which to
            optimise.
          </p>
        </div>
      </Modal>
    </div>
  );
}
