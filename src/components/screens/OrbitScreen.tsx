import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Download,
  Gauge,
  Lock,
  Map,
  Orbit as OrbitIcon,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sun,
  Timer,
} from "lucide-react";
import { BODIES } from "../../data/bodies";
import type { OrbitSpec } from "../../data/types";
import {
  calculateTotals,
  downlinkPerDay,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  resolveSelection,
} from "../../engine/design";
import { evaluateDesign } from "../../engine/compatibility";
import { downloadTextFile } from "../../engine/download";
import {
  fmtDataRate,
  fmtMonths,
  fmtPercent,
  fmtPower,
} from "../../engine/format";
import { buildGmatHandoff } from "../../engine/gmat";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { useToast } from "../ui/Toast";
import { OrbitDiagram } from "../visuals/OrbitDiagram";

export function OrbitScreen() {
  const { state, dispatch } = useGame();
  const { notify } = useToast();
  const objective = getObjective(state.design.objectiveId);
  const difficulty = getDifficulty(state.design.difficulty);

  if (!objective) {
    return (
      <div className="screen empty-state">
        <OrbitIcon size={42} />
        <h1>No mission selected</h1>
        <p>Choose a mission brief before exploring orbits.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "briefing" })}>
          Return to briefing
        </Button>
      </div>
    );
  }

  const systems = resolveSelection(state.design.selection);
  const totals = calculateTotals(state.design.selection, difficulty, objective.body);
  const candidates = objective.allowedOrbits
    .map((id) => getOrbit(id))
    .filter((orbit): orbit is OrbitSpec => Boolean(orbit));
  const locked = getOrbit(state.design.orbitId);
  const preview = locked ?? candidates[0];
  const selected = Boolean(locked && preview && locked.id === preview.id);

  const previewReport = preview
    ? evaluateDesign({ ...state.design, orbitId: preview.id })
    : null;

  const requirementChecks = previewReport
    ? previewReport.checks.filter((check) =>
        ["coverage", "battery", "downlink", "lifetime", "delta-v", "orbit"].includes(check.id),
      )
    : [];

  const downlink = downlinkPerDay(systems.comms, preview ?? undefined);
  const coverageOk = preview ? preview.coveragePct >= objective.minCoveragePct : false;
  const dataNeed = totals.dataGbPerDay * (1 + difficulty.dataMargin);

  const handleGmatExport = () => {
    if (!preview) return;
    const handoff = buildGmatHandoff({
      objective,
      orbit: preview,
      totals,
      design: { ...state.design, orbitId: preview.id },
      vehicle: getLaunchVehicle(state.design.launchVehicleId),
    });
    downloadTextFile(
      handoff.filename,
      handoff.content,
      handoff.format === "json" ? "application/json" : "text/plain",
    );
    notify(
      handoff.supported ? "GMAT handoff downloaded" : "Trajectory elements downloaded",
      { detail: handoff.note, tone: handoff.supported ? "success" : "warning" },
    );
  };

  return (
    <div className="screen orbit-screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">03 · Orbit analysis</span>
          <h1>
            Pick the vantage point. <em>Then live with the geometry.</em>
          </h1>
          <p>
            {objective.codename} needs {fmtPercent(objective.minCoveragePct)} coverage around{" "}
            {BODIES[objective.body].name}. Orbit sets coverage, revisit, eclipse, radiation and
            how often you can talk to the spacecraft.
          </p>
        </div>
        <div className="screen-head__meta">
          <Badge tone="muted">{candidates.length} candidate orbits</Badge>
          <Badge tone={locked ? "green" : "amber"} dot>
            {locked ? "Orbit locked" : "No orbit locked"}
          </Badge>
        </div>
      </header>

      <div className="orbit-layout">
        <section className="orbit-list" aria-label="Candidate orbits">
          {candidates.map((orbit) => {
            const isSelected = state.design.orbitId === orbit.id;
            const isPreview = preview?.id === orbit.id;
            const cardBatteryNeed = totals.powerUseW * orbit.eclipseHours * 1.1;
            const cardBatteryOk = totals.usableBatteryWh >= cardBatteryNeed;
            const cardDataOk = downlinkPerDay(systems.comms, orbit) >= dataNeed;
            const cardCoverageOk = orbit.coveragePct >= objective.minCoveragePct;
            return (
              <button
                key={orbit.id}
                type="button"
                className={`orbit-card ${isSelected ? "is-selected" : ""} ${isPreview && !isSelected ? "is-preview" : ""}`}
                onClick={() => dispatch({ type: "set-orbit", orbitId: orbit.id })}
                aria-pressed={isSelected}
              >
                <div className="orbit-card__head">
                  <div className="orbit-card__icon">
                    <span className={`orbit-glyph orbit-glyph--${orbit.destination}`} />
                  </div>
                  <div className="orbit-card__title">
                    <span>{orbit.shortName}</span>
                    <strong>{orbit.name}</strong>
                  </div>
                  <span className={`orbit-card__radio ${isSelected ? "is-on" : ""}`}>
                    {isSelected ? <Check size={12} /> : null}
                  </span>
                </div>
                <p className="orbit-card__altitude">{orbit.altitudeLabel}</p>
                <div className="orbit-card__stats">
                  <span>
                    <Map size={12} /> {fmtPercent(orbit.coveragePct)}
                  </span>
                  <span>
                    <RefreshCw size={12} /> {orbit.revisitHours} h revisit
                  </span>
                  <span>
                    <Radio size={12} /> {orbit.commsWindowsPerDay}×{orbit.commsWindowHours} h
                  </span>
                  <span>
                    <Sun size={12} /> {orbit.eclipseHours} h eclipse
                  </span>
                  <span>
                    <ShieldAlert size={12} /> {orbit.radiationKradPerYear} krad/yr
                  </span>
                  <span>
                    <Timer size={12} /> {orbit.periodHours} h period
                  </span>
                </div>
                <div className="orbit-card__flags">
                  <span className={cardCoverageOk ? "is-good" : "is-warn"}>
                    {cardCoverageOk ? <Check size={11} /> : <AlertTriangle size={11} />} Coverage
                  </span>
                  <span className={cardBatteryOk ? "is-good" : "is-warn"}>
                    {cardBatteryOk ? <Check size={11} /> : <AlertTriangle size={11} />} Eclipse power
                  </span>
                  <span className={cardDataOk ? "is-good" : "is-warn"}>
                    {cardDataOk ? <Check size={11} /> : <AlertTriangle size={11} />} Downlink
                  </span>
                </div>
                <p className="orbit-card__tradeoff">{orbit.tradeoff}</p>
              </button>
            );
          })}
        </section>

        {preview ? (
          <div className="orbit-detail">
            <Panel
              className="orbit-visual-panel"
              eyebrow={selected ? "Orbit locked" : "Live preview"}
              title={preview.name}
              aside={
                <Badge tone={coverageOk ? "green" : "red"}>
                  {coverageOk ? "Coverage met" : "Coverage short"}
                </Badge>
              }
            >
              <OrbitDiagram body={objective.body} orbit={preview} />
              <div className="orbit-visual__readout">
                <div>
                  <span>Coverage</span>
                  <strong>{fmtPercent(preview.coveragePct)}</strong>
                  <small>need {fmtPercent(objective.minCoveragePct)}</small>
                </div>
                <div>
                  <span>Downlink / day</span>
                  <strong>{fmtDataRate(downlink)}</strong>
                  <small>need {fmtDataRate(dataNeed)}</small>
                </div>
                <div>
                  <span>Eclipse load</span>
                  <strong>{fmtPower(totals.powerUseW)}</strong>
                  <small>{preview.eclipseHours} h per orbit</small>
                </div>
                <div>
                  <span>Station-keeping</span>
                  <strong>{preview.stationKeepingMpsPerYear} m/s/yr</strong>
                  <small>orbit maintenance</small>
                </div>
              </div>
            </Panel>

            <Panel eyebrow="README // orbit dossier" title="Consequences at a glance" className="orbit-dossier">
              <p className="orbit-dossier__description">{preview.description}</p>
              <div className="orbit-dossier__grid">
                <div>
                  <span>Inclination</span>
                  <strong>{preview.inclinationDeg}°</strong>
                </div>
                <div>
                  <span>Revisit</span>
                  <strong>{preview.revisitHours} h</strong>
                </div>
                <div>
                  <span>Comms window</span>
                  <strong>
                    {preview.commsWindowsPerDay} × {preview.commsWindowHours} h
                  </strong>
                </div>
                <div>
                  <span>Eclipse</span>
                  <strong>{preview.eclipseHours} h / orbit</strong>
                </div>
                <div>
                  <span>Radiation dose</span>
                  <strong>{preview.radiationKradPerYear} krad/yr</strong>
                </div>
                <div>
                  <span>Destination class</span>
                  <strong>{destinationLabel(preview.destination)}</strong>
                </div>
              </div>

              <h3 className="orbit-dossier__subhead">Requirement checks</h3>
              <ul className="check-list">
                {requirementChecks.map((check) => (
                  <li key={check.id} className={`check-list__item check-list__item--${check.status}`}>
                    <span className="check-list__icon">
                      {check.status === "pass" ? (
                        <Check size={12} />
                      ) : check.status === "fail" ? (
                        <AlertTriangle size={12} />
                      ) : (
                        <Gauge size={12} />
                      )}
                    </span>
                    <div>
                      <strong>{check.label}</strong>
                      <span>{check.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="orbit-dossier__actions">
                {selected ? (
                  <Badge tone="green" dot>
                    <Lock size={11} /> This orbit is locked
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    icon={<Compass size={15} />}
                    onClick={() => dispatch({ type: "set-orbit", orbitId: preview.id })}
                  >
                    Lock this orbit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  icon={<Download size={14} />}
                  onClick={handleGmatExport}
                  title="Download a GMAT R2026a handoff for high-fidelity analysis"
                >
                  GMAT handoff
                </Button>
                <span className="orbit-dossier__note">
                  <ShieldAlert size={13} /> Radiation and station-keeping are checked against your
                  selected components. GMAT export is a starting point, not a flight dynamics
                  product.
                </span>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>

      <div className="builder-footer">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => dispatch({ type: "set-step", step: "spacecraft" })}
        >
          Spacecraft
        </Button>
        <div className="builder-footer__status">
          {locked ? (
            <span className="is-good">
              <Check size={14} /> {locked.name} locked · {fmtMonths(objective.requiredLifetimeMonths)} mission
            </span>
          ) : (
            <span className="is-warn">
              <AlertTriangle size={14} /> Lock an orbit to continue
            </span>
          )}
        </div>
        <Button
          variant="primary"
          trailing={<ArrowRight size={16} />}
          disabled={!locked}
          onClick={() => dispatch({ type: "set-step", step: "launch" })}
        >
          Select launch vehicle
        </Button>
      </div>
    </div>
  );
}

function destinationLabel(destination: string): string {
  switch (destination) {
    case "leo":
      return "Low Earth orbit";
    case "sso":
      return "Sun-synchronous";
    case "geo":
      return "Geostationary";
    case "lunar":
      return "Lunar transfer";
    default:
      return "Interplanetary";
  }
}
