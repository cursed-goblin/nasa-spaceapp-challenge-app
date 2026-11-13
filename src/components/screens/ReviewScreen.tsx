import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FlaskConical,
  Gauge,
  Layers,
  Link2,
  Play,
  Rocket,
  Satellite,
  Save,
  ShieldAlert,
  Weight,
  X,
} from "lucide-react";
import { BODIES } from "../../data/bodies";
import { CATEGORY_META } from "../../data/components";
import type {
  CategoryId,
  FeasibilityCheck,
  SpacecraftComponent,
} from "../../data/types";
import { evaluateDesign, readinessScore } from "../../engine/compatibility";
import {
  budgetFor,
  calculateTotals,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  GROUND_SEGMENT_COST_MUSD,
  limitingComponent,
  missingCategories,
  resolveSelection,
  scienceTargetFor,
  totalMissionCost,
  downlinkPerDay,
} from "../../engine/design";
import {
  fmtArcsec,
  fmtDataRate,
  fmtEnergy,
  fmtMass,
  fmtMonths,
  fmtMusd,
  fmtPercent,
  fmtPower,
} from "../../engine/format";
import { conceptMaturity } from "../../engine/maturity";
import { createMissionRun } from "../../engine/scoring";
import { buildShareUrl } from "../../engine/share";
import { simulateMission } from "../../engine/simulation";
import { saveDesign, saveRun } from "../../engine/storage";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Meter } from "../ui/Meter";
import { Panel } from "../ui/Panel";
import { useToast } from "../ui/Toast";
import { MissionPatch } from "../visuals/MissionPatch";

const GROUP_LABELS: Record<string, string[]> = {
  "Mission definition": ["subsystems", "instruments", "slots", "measurements", "payload-focus", "science-capacity"],
  "Orbit & environment": ["orbit", "coverage", "battery", "lifetime", "pointing", "delta-v"],
  "Power & data": ["power", "downlink", "storage"],
  "Launch & programme": ["mass", "fairing", "budget", "reliability"],
};

const CHECK_GROUP_ORDER = Object.keys(GROUP_LABELS);

function groupChecks(checks: FeasibilityCheck[]): Array<{ label: string; checks: FeasibilityCheck[] }> {
  const used = new Set<string>();
  const groups = CHECK_GROUP_ORDER.map((label) => {
    const ids = GROUP_LABELS[label];
    const grouped = checks.filter((check) => ids.includes(check.id));
    grouped.forEach((check) => used.add(check.id));
    return { label, checks: grouped };
  }).filter((group) => group.checks.length > 0);
  const remaining = checks.filter((check) => !used.has(check.id));
  if (remaining.length > 0) groups.push({ label: "Other checks", checks: remaining });
  return groups;
}

export function ReviewScreen() {
  const { state, dispatch } = useGame();
  const { notify } = useToast();
  const [showAllChecks, setShowAllChecks] = useState(true);
  const objective = getObjective(state.design.objectiveId);
  const orbit = getOrbit(state.design.orbitId);
  const vehicle = getLaunchVehicle(state.design.launchVehicleId);
  const difficulty = getDifficulty(state.design.difficulty);
  const systems = resolveSelection(state.design.selection);
  const totals = calculateTotals(state.design.selection, difficulty, objective?.body ?? "earth");
  const report = evaluateDesign(state.design);
  const maturity = conceptMaturity(state.design, report);
  const missing = missingCategories(systems);
  const canSimulate =
    Boolean(objective) &&
    Boolean(orbit) &&
    Boolean(vehicle) &&
    missing.length === 0 &&
    systems.instruments.length > 0;

  if (!objective) {
    return (
      <div className="screen empty-state">
        <ClipboardCheck size={42} />
        <h1>No mission to review</h1>
        <p>Select a brief and assemble a spacecraft first.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "briefing" })}>
          Return to briefing
        </Button>
      </div>
    );
  }

  const budget = budgetFor(objective, difficulty);
  const missionCost = totalMissionCost(totals, vehicle);
  const limiting = limitingComponent(systems, orbit);
  const downlink = downlinkPerDay(systems.comms, orbit);
  const requiredPower = totals.powerUseW * (1 + difficulty.powerMargin);
  const requiredData = totals.dataGbPerDay * (1 + difficulty.dataMargin);
  const requiredEnergy = orbit ? totals.powerUseW * orbit.eclipseHours * 1.1 : 0;
  const readiness = readinessScore(report);
  const groups = groupChecks(report.checks);
  const visibleChecks = showAllChecks
    ? report.checks
    : report.checks.filter((check) => check.status === "fail" || check.status === "warn");
  const warningCount = report.failures + report.warnings;

  const startFlight = (whatIf = false) => {
    const simulation = simulateMission(state.design);
    if (!simulation) {
      notify("Simulation cannot start", {
        detail: "Install the four core spacecraft systems, an instrument, an orbit and a launch vehicle.",
        tone: "warning",
      });
      return;
    }
    const run = createMissionRun(state.design, totals, simulation, report);
    if (!run) return;
    saveRun(run);
    dispatch({ type: "start-flight", simulation, run });
    if (whatIf) {
      notify("What-if simulation started", {
        detail: "This design has open compatibility failures, so the run is unranked.",
        tone: "warning",
      });
    }
  };

  const handleSave = () => {
    const saved = saveDesign(state.design);
    notify(saved ? "Design saved to hangar" : "Could not save design", {
      detail: saved
        ? `${objective.codename} · ${fmtMass(totals.massKg)} · ${fmtMusd(totals.spacecraftCostMusd)} spacecraft`
        : "Local storage may be unavailable in this browser.",
      tone: saved ? "success" : "warning",
    });
  };

  const handleShare = async () => {
    const url = buildShareUrl(state.design);
    try {
      await navigator.clipboard.writeText(url);
      notify("Share link copied", {
        detail: "Anyone with the link can load this design in their browser.",
        tone: "success",
      });
    } catch {
      notify("Share link ready", {
        detail: url,
        tone: "info",
      });
    }
  };

  return (
    <div className="screen review-screen">
      <header className="screen-head review-head">
        <div>
          <span className="eyebrow">05 · Design review</span>
          <h1>
            Put it in front of the review board. <em>Find the weak link.</em>
          </h1>
          <p>
            {objective.codename} · {objective.name}. This is the same discipline spine as a
            mission design lab review: mass, power, data, orbit, launch accommodation, risk, cost
            and science closure.
          </p>
        </div>
        <div className="review-head__actions">
          <Badge tone="cyan">{maturity.short} · {maturity.label}</Badge>
          <Button variant="ghost" size="sm" icon={<Save size={14} />} onClick={handleSave}>
            Save design
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Link2 size={14} />}
            onClick={() => void handleShare()}
          >
            Share
          </Button>
        </div>
      </header>

      <div className="review-top">
        <Panel className="review-summary" eyebrow="Mission dossier" title={objective.name}>
          <div className="review-summary__hero">
            <MissionPatch
              seed={objective.id.length * 1999 + totals.massKg}
              body={objective.body}
              codename={objective.codename}
              difficulty={difficulty.id}
              size={154}
            />
            <div className="review-summary__copy">
              <div className="review-summary__badges">
                <Badge tone="muted">{BODIES[objective.body].name}</Badge>
                <Badge tone={difficulty.id === "hard" ? "red" : "ice"}>{difficulty.label}</Badge>
                <Badge tone="muted">{objective.category}</Badge>
              </div>
              <p>{objective.summary}</p>
              <div className="review-summary__stats">
                <div>
                  <span>Orbit</span>
                  <strong>{orbit?.shortName ?? "—"}</strong>
                </div>
                <div>
                  <span>Launch</span>
                  <strong>{vehicle?.name ?? "—"}</strong>
                </div>
                <div>
                  <span>Wet mass</span>
                  <strong>{fmtMass(totals.massKg)}</strong>
                </div>
                <div>
                  <span>Programme</span>
                  <strong>{fmtMusd(missionCost)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="review-summary__footer">
            <div>
              <span className="eyebrow">Concept maturity</span>
              <strong>{maturity.short} · {maturity.label}</strong>
              <p>{maturity.description}</p>
            </div>
            <div className="readiness">
              <span className="eyebrow">Review readiness</span>
              <strong>{readiness}%</strong>
              <div className="readiness__track">
                <span style={{ width: `${readiness}%` }} />
              </div>
              <small>
                {report.passed
                  ? "All gating checks passed."
                  : `${report.failures} failure${report.failures === 1 ? "" : "s"} · ${report.warnings} warning${report.warnings === 1 ? "" : "s"}`}
              </small>
            </div>
          </div>
        </Panel>

        <div className="review-side">
          <Panel eyebrow="Mass equipment list" title="MEL" className="mel-panel">
            <div className="mel-table">
              <div className="mel-table__head">
                <span>Component</span>
                <span>Mass</span>
                <span>Power</span>
                <span>Cost</span>
              </div>
              {[...systems.all].sort((a, b) => a.category.localeCompare(b.category)).map((component) => (
                <MelRow key={component.id} component={component} />
              ))}
              <div className="mel-table__total">
                <span>Spacecraft total</span>
                <strong>{fmtMass(totals.massKg)}</strong>
                <strong>{fmtPower(totals.powerUseW)}</strong>
                <strong>{fmtMusd(totals.spacecraftCostMusd)}</strong>
              </div>
            </div>
            {missing.length > 0 ? (
              <div className="inline-warning">
                <AlertTriangle size={13} /> Missing categories: {missing.join(", ")}
              </div>
            ) : null}
          </Panel>

          <Panel eyebrow="Programme accounting" title="Cost & segment model">
            <div className="cost-breakdown">
              <div>
                <span>Spacecraft (MEL)</span>
                <strong>{fmtMusd(totals.spacecraftCostMusd)}</strong>
              </div>
              <div>
                <span>Launch vehicle</span>
                <strong>{fmtMusd(vehicle?.costMusd ?? 0)}</strong>
              </div>
              <div>
                <span>Ground segment</span>
                <strong>{fmtMusd(GROUND_SEGMENT_COST_MUSD)}</strong>
              </div>
              <div className="cost-breakdown__total">
                <span>Total mission</span>
                <strong className={missionCost > budget ? "is-over" : ""}>{fmtMusd(missionCost)}</strong>
              </div>
            </div>
            <Meter
              label="Budget utilisation"
              value={missionCost}
              max={Number.isFinite(budget) ? budget : Math.max(missionCost, 1)}
              display={`${fmtMusd(missionCost)} / ${Number.isFinite(budget) ? fmtMusd(budget) : "∞"}`}
              tone={missionCost > budget ? "red" : missionCost > budget * 0.85 ? "amber" : "green"}
              hint={
                Number.isFinite(budget)
                  ? `${fmtMusd(Math.abs(budget - missionCost))} ${missionCost > budget ? "over" : "remaining"}`
                  : "Sandbox budget is unlimited."
              }
            />
          </Panel>
        </div>
      </div>

      <div className="review-budgets">
        <Panel eyebrow="Engineering budgets" title="Margins are the design.">
          <div className="budget-grid">
            <Meter
              label="Power generation vs required"
              value={totals.powerGenW}
              max={Math.max(requiredPower, totals.powerGenW, 1)}
              display={`${fmtPower(totals.powerGenW)} / ${fmtPower(requiredPower)}`}
              tone={totals.powerGenW >= requiredPower ? "green" : "red"}
              hint={`${fmtPower(totals.powerUseW)} load · ${fmtPercent(difficulty.powerMargin * 100)} margin`}
            />
            <Meter
              label="Downlink vs data generated"
              value={downlink}
              max={Math.max(requiredData, downlink, 0.01)}
              display={`${fmtDataRate(downlink)} / ${fmtDataRate(requiredData)}`}
              tone={downlink >= requiredData ? "green" : "red"}
              hint={`${fmtDataRate(totals.dataGbPerDay)} generated · ${fmtPercent(difficulty.dataMargin * 100)} margin`}
            />
            <Meter
              label="Eclipse energy"
              value={totals.usableBatteryWh}
              max={Math.max(requiredEnergy, totals.usableBatteryWh, 1)}
              display={`${fmtEnergy(totals.usableBatteryWh)} / ${fmtEnergy(requiredEnergy)}`}
              tone={totals.usableBatteryWh >= requiredEnergy ? "green" : "red"}
              hint={orbit ? `${orbit.eclipseHours} h eclipse · 10% reserve` : "Orbit pending"}
            />
            <Meter
              label="Lifetime"
              value={limiting.lifetimeMonths}
              max={Math.max(objective.requiredLifetimeMonths, 1)}
              display={`${fmtMonths(limiting.lifetimeMonths)} / ${fmtMonths(objective.requiredLifetimeMonths)}`}
              tone={limiting.lifetimeMonths >= objective.requiredLifetimeMonths ? "green" : "red"}
              hint={limiting.component ? `Limited by ${limiting.component.name}` : "No components selected"}
            />
          </div>
          <div className="budget-notes">
            <div>
              <span><Weight size={13} /> Mass</span>
              <strong>{fmtMass(totals.massKg)}</strong>
              <small>
                {vehicle && orbit
                  ? `${fmtMass(vehicle.payloadKg[orbit.destination])} capacity`
                  : "Launch vehicle not selected"}
              </small>
            </div>
            <div>
              <span><Gauge size={13} /> Pointing</span>
              <strong>{totals.minPointingArcsec ? fmtArcsec(totals.minPointingArcsec) : "—"}</strong>
              <small>objective needs {fmtArcsec(objective.pointingRequirementArcsec)}</small>
            </div>
            <div>
              <span><Layers size={13} /> Instrument slots</span>
              <strong>{totals.instrumentSlotsUsed}/{totals.instrumentSlots}</strong>
              <small>{systems.instruments.length} payloads installed</small>
            </div>
            <div>
              <span><FlaskConical size={13} /> Science capacity</span>
              <strong>{Math.round(totals.sciencePerDay)} pts/day</strong>
              <small>target {Math.round(scienceTargetFor(objective, difficulty))} pts</small>
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Compatibility"
          title={report.passed ? "Cleared for simulation" : `${report.failures} open failure${report.failures === 1 ? "" : "s"}`}
          aside={
            <button
              type="button"
              className="text-button"
              onClick={() => setShowAllChecks((current) => !current)}
            >
              {showAllChecks ? "Show problems only" : "Show all checks"}
            </button>
          }
        >
          <div className="check-groups">
            {groups
              .map((group) => ({
                ...group,
                checks: showAllChecks
                  ? group.checks
                  : group.checks.filter((check) => visibleChecks.includes(check)),
              }))
              .filter((group) => group.checks.length > 0)
              .map((group) => (
                <div key={group.label} className="check-group">
                  <h3>{group.label}</h3>
                  <ul className="check-list">
                    {group.checks.map((check) => (
                      <li key={check.id} className={`check-list__item check-list__item--${check.status}`}>
                        <span className="check-list__icon">
                          {check.status === "pass" ? (
                            <Check size={12} />
                          ) : check.status === "fail" ? (
                            <X size={12} />
                          ) : check.status === "warn" ? (
                            <AlertTriangle size={12} />
                          ) : (
                            <BookOpen size={12} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {check.label}
                            {check.requirement ? <em>{check.requirement}</em> : null}
                          </strong>
                          <span>{check.detail}</span>
                        </div>
                        {check.actual ? <small>{check.actual}</small> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {!showAllChecks && warningCount === 0 ? (
              <div className="empty-note">
                <CheckCircle2 size={18} /> Every check passed. Nothing to review.
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Brief interpretation" title="What the review board is looking for" className="review-brief-panel">
        <div className="review-brief-grid">
          <div>
            <h3><Satellite size={14} /> Science closure</h3>
            <p>{objective.scienceGoal}</p>
            <ul className="bullet-list">
              {objective.measurementsRequired.map((tag) => (
                <li key={tag}>
                  {systems.instruments.some((instrument) => instrument.measurements.includes(tag)) ? (
                    <Check size={12} />
                  ) : (
                    <X size={12} />
                  )}
                  {tag}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3><ShieldAlert size={14} /> Hazards to defend</h3>
            <ul className="bullet-list bullet-list--warn">
              {objective.hazards.map((hazard) => (
                <li key={hazard}>
                  <AlertTriangle size={12} /> {hazard}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3><Rocket size={14} /> Architecture analogue</h3>
            <p>
              {objective.analogue.name} ({objective.analogue.agency}). {objective.analogue.note}
            </p>
            <a className="text-link" href={objective.analogue.url} target="_blank" rel="noreferrer">
              Open NASA reference <ArrowRight size={12} />
            </a>
          </div>
          <div>
            <h3><Database size={14} /> Data provenance</h3>
            <p>
              This review is generated from a provisional, internally consistent gameplay dataset.
              It is not an official NASA feasibility assessment.
            </p>
            <span className="badge badge--amber">Provisional data</span>
          </div>
        </div>
      </Panel>

      <div className="builder-footer review-footer">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => dispatch({ type: "set-step", step: "launch" })}
        >
          Launch vehicle
        </Button>
        <div className="builder-footer__status">
          {report.passed ? (
            <span className="is-good">
              <BadgeCheck size={14} /> All gating checks passed · ready to simulate
            </span>
          ) : (
            <span className="is-warn">
              <AlertTriangle size={14} /> {warningCount} open finding
              {warningCount === 1 ? "" : "s"} · simulation will be unranked
            </span>
          )}
        </div>
        {report.passed ? (
          <Button
            variant="primary"
            size="lg"
            icon={<Play size={16} />}
            trailing={<ArrowRight size={16} />}
            disabled={!canSimulate}
            onClick={() => startFlight(false)}
          >
            Run mission simulation
          </Button>
        ) : (
          <div className="review-footer__actions">
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "set-step", step: "spacecraft" })}
            >
              Fix design
            </Button>
            <Button
              variant="secondary"
              icon={<Play size={15} />}
              disabled={!canSimulate}
              onClick={() => startFlight(true)}
            >
              Run what-if
            </Button>
          </div>
        )}
      </div>
      <span className="review-print-hint">
        <Download size={12} /> Tip: print the report from your browser to save a PDF review sheet.
      </span>
    </div>
  );
}

function MelRow({ component }: { component: SpacecraftComponent }) {
  return (
    <div className="mel-table__row">
      <span>
        <em>{CATEGORY_META[component.category as CategoryId].short}</em>
        {component.name}
      </span>
      <span>{fmtMass(component.massKg)}</span>
      <span>{component.powerW > 0 ? fmtPower(component.powerW) : "—"}</span>
      <span>{fmtMusd(component.costMusd)}</span>
    </div>
  );
}
