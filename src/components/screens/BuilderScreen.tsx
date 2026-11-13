import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Box,
  Check,
  CircleDollarSign,
  Compass,
  Cpu,
  Database,
  FlaskConical,
  Gauge,
  Layers,
  Plus,
  Radio,
  RotateCcw,
  Satellite,
  Sun,
  Telescope,
  Timer,
  Weight,
  X,
} from "lucide-react";
import { BODIES } from "../../data/bodies";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  COMPONENTS_BY_CATEGORY,
} from "../../data/components";
import { MEASUREMENTS } from "../../data/measurements";
import type { CategoryId } from "../../data/types";
import {
  budgetFor,
  calculateTotals,
  downlinkPerDay,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  limitingComponent,
  missingCategories,
  resolveSelection,
  scienceTargetFor,
  totalMissionCost,
} from "../../engine/design";
import { evaluateDesign } from "../../engine/compatibility";
import {
  fmtDataRate,
  fmtMass,
  fmtMonths,
  fmtMusd,
  fmtPercent,
  fmtPower,
} from "../../engine/format";
import { conceptMaturity } from "../../engine/maturity";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Meter } from "../ui/Meter";
import { Panel } from "../ui/Panel";
import { ComponentCard } from "../builder/ComponentCard";
import { SpacecraftSchematic } from "../builder/SpacecraftSchematic";

const CATEGORY_ICONS: Record<CategoryId, typeof Box> = {
  structure: Box,
  power: Sun,
  battery: BatteryCharging,
  comms: Radio,
  computer: Cpu,
  adcs: Compass,
  instruments: Telescope,
};

export function BuilderScreen() {
  const { state, dispatch } = useGame();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("structure");
  const objective = getObjective(state.design.objectiveId);
  const difficulty = getDifficulty(state.design.difficulty);
  const orbit = getOrbit(state.design.orbitId);
  const vehicle = getLaunchVehicle(state.design.launchVehicleId);
  const systems = resolveSelection(state.design.selection);
  const totals = calculateTotals(
    state.design.selection,
    difficulty,
    objective?.body ?? "earth",
  );

  const report = useMemo(() => evaluateDesign(state.design), [state.design]);
  const maturity = conceptMaturity(state.design, report);
  const budget = objective ? budgetFor(objective, difficulty) : 0;
  const missionCost = totalMissionCost(totals, vehicle);
  const knowledgeTarget = objective
    ? scienceTargetFor(objective, difficulty)
    : 0;
  const dataCapacity = orbit ? downlinkPerDay(systems.comms, orbit) : 0;
  const limiting = orbit ? limitingComponent(systems, orbit) : null;
  const missing = missingCategories(systems);

  if (!objective) {
    return (
      <div className="screen empty-state">
        <Satellite size={42} />
        <h1>No mission brief selected</h1>
        <p>Pick a science objective before opening the spacecraft bay.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "briefing" })}>
          Return to briefing
        </Button>
      </div>
    );
  }

  const advancedMultiplier = difficulty.advancedCostMultiplier;
  const selectedIds = new Set([
    systems.structure?.id,
    systems.power?.id,
    systems.battery?.id,
    systems.comms?.id,
    systems.computer?.id,
    systems.adcs?.id,
  ]);
  const categoryComponents = COMPONENTS_BY_CATEGORY[activeCategory];
  const selectedInCategory =
    activeCategory === "instruments"
      ? systems.instruments.length > 0
      : Boolean(selectedIds.has(categoryComponents.find((component) => selectedIds.has(component.id))?.id));

  const warningChecks = report.checks.filter(
    (check) =>
      (check.status === "fail" || check.status === "warn") &&
      !["orbit", "mass", "fairing", "reliability"].includes(check.id),
  );

  const canContinue = missing.length === 0 && systems.instruments.length > 0;

  const handleSelect = (id: string) => {
    if (activeCategory === "instruments") {
      dispatch({ type: "toggle-instrument", id });
      return;
    }
    const isSelected = state.design.selection[activeCategory] === id;
    if (isSelected) {
      dispatch({ type: "clear-category", category: activeCategory });
    } else {
      dispatch({
        type: "select-component",
        category: activeCategory as Exclude<CategoryId, "instruments">,
        id,
      });
    }
  };

  const powerMargin = totals.powerUseW > 0 ? ((totals.powerGenW - totals.powerUseW) / totals.powerUseW) * 100 : 100;
  const budgetLeft = budget - missionCost;

  return (
    <div className="screen builder-screen">
      <header className="screen-head builder-head">
        <div>
          <span className="eyebrow">02 · Spacecraft configuration</span>
          <h1>
            Build the machine that <em>earns</em> the science.
          </h1>
          <p>
            {objective.codename} · {objective.name}. Every kilogram, watt and gigabit competes
            for the same budget. The schematic updates live.
          </p>
        </div>
        <div className="builder-head__meta">
          <Badge tone="cyan">{maturity.short} · {maturity.label}</Badge>
          <Badge tone={difficulty.id === "hard" ? "red" : "muted"}>{difficulty.label}</Badge>
          <span className="builder-head__target">
            <span style={{ background: BODIES[objective.body].color }} />
            {BODIES[objective.body].name}
          </span>
        </div>
      </header>

      <div className="builder-layout">
        <aside className="category-rail" aria-label="Spacecraft subsystem categories">
          <div className="category-rail__head">
            <span className="eyebrow">Subsystems</span>
            <span>{CATEGORY_ORDER.length}</span>
          </div>
          {CATEGORY_ORDER.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const isActive = activeCategory === category;
            const selectedName =
              category === "instruments"
                ? systems.instruments.length > 0
                  ? `${systems.instruments.length} selected`
                  : null
                : systems[category]?.name ?? null;
            const complete =
              category === "instruments"
                ? systems.instruments.length > 0
                : Boolean(systems[category]);
            return (
              <button
                key={category}
                type="button"
                className={`category-rail__item ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
              >
                <span className="category-rail__icon">
                  <Icon size={17} />
                </span>
                <span className="category-rail__copy">
                  <span>
                    {CATEGORY_META[category].label}
                    <em>{CATEGORY_META[category].short}</em>
                  </span>
                  <small>{selectedName ?? "Unassigned"}</small>
                </span>
                <span className={`category-rail__state ${complete ? "is-complete" : ""}`}>
                  {complete ? <Check size={12} /> : <Plus size={12} />}
                </span>
              </button>
            );
          })}

          <div className="category-rail__footer">
            <div className="category-rail__progress">
              <span>Assembly</span>
              <strong>
                {6 - missing.length + (systems.instruments.length > 0 ? 1 : 0)}/7
              </strong>
            </div>
            <div className="category-rail__bar">
              <span
                style={{
                  width: `${((6 - missing.length + (systems.instruments.length > 0 ? 1 : 0)) / 7) * 100}%`,
                }}
              />
            </div>
            <button
              type="button"
              className="category-rail__reset"
              onClick={() => {
                for (const category of CATEGORY_ORDER) {
                  dispatch({ type: "clear-category", category });
                }
              }}
            >
              <RotateCcw size={12} /> Clear build
            </button>
          </div>
        </aside>

        <section className="builder-main">
          <Panel
            className="schematic-panel"
            eyebrow="Interactive configuration"
            title="Spacecraft bay"
            aside={
              <div className="panel__aside-actions">
                {advancedMultiplier !== 1 ? (
                  <Badge tone="amber">Advanced ×{advancedMultiplier} cost</Badge>
                ) : (
                  <Badge tone="muted">All tiers available</Badge>
                )}
                <Badge tone={difficulty.hintLevel === "minimal" ? "red" : "cyan"} dot>
                  {difficulty.hintLevel === "minimal" ? "No hints" : "Hints on"}
                </Badge>
              </div>
            }
          >
            <SpacecraftSchematic
              systems={systems}
              body={objective.body}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </Panel>

          <section className="component-picker">
            <div className="component-picker__head">
              <div>
                <span className="eyebrow">{CATEGORY_META[activeCategory].short} · selection</span>
                <h2>{CATEGORY_META[activeCategory].label}</h2>
                <p>{CATEGORY_META[activeCategory].blurb}</p>
              </div>
              <div className="component-picker__actions">
                {selectedInCategory ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={13} />}
                    onClick={() => dispatch({ type: "clear-category", category: activeCategory })}
                  >
                    Clear
                  </Button>
                ) : null}
                <Badge tone="muted">{categoryComponents.length} options</Badge>
              </div>
            </div>
            <div className="component-grid">
              {categoryComponents.map((component) => {
                const selected =
                  activeCategory === "instruments"
                    ? systems.instruments.some((instrument) => instrument.id === component.id)
                    : state.design.selection[activeCategory] === component.id;
                return (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    selected={selected}
                    difficulty={difficulty}
                    body={objective.body}
                    objective={objective}
                    onSelect={() => handleSelect(component.id)}
                  />
                );
              })}
            </div>
          </section>
        </section>

        <aside className="resource-rail">
          <Panel eyebrow="Programme health" title="Live budget" tone="accent">
            <Meter
              label="Mission cost"
              value={missionCost}
              max={Number.isFinite(budget) ? budget : Math.max(missionCost, 1)}
              display={`${fmtMusd(missionCost)}${Number.isFinite(budget) ? ` / ${fmtMusd(budget)}` : " / ∞"}`}
              tone={missionCost > budget ? "red" : budgetLeft < budget * 0.15 ? "amber" : "ice"}
              hint={
                vehicle
                  ? `Includes ${vehicle.name} launch and ground segment.`
                  : "Spacecraft + ground segment. Launch is added at step 04."
              }
            />
            <div className="resource-grid">
              <div className="resource-stat">
                <span><Weight size={13} /> Mass</span>
                <strong>{fmtMass(totals.massKg)}</strong>
                <small>
                  {vehicle && orbit
                    ? `Limit ${fmtMass(vehicle.payloadKg[orbit.destination])}`
                    : "No launcher locked"}
                </small>
              </div>
              <div className="resource-stat">
                <span><Sun size={13} /> Power</span>
                <strong>{fmtPower(totals.powerGenW)}</strong>
                <small className={powerMargin < difficulty.powerMargin * 100 ? "is-warn" : "is-good"}>
                  {totals.powerUseW > 0 ? `${fmtPercent(powerMargin)} margin` : "No load"}
                </small>
              </div>
              <div className="resource-stat">
                <span><Database size={13} /> Data</span>
                <strong>{fmtDataRate(totals.dataGbPerDay)}</strong>
                <small className={orbit && dataCapacity < totals.dataGbPerDay ? "is-warn" : "is-good"}>
                  {orbit ? `${fmtDataRate(dataCapacity)} downlink` : "Orbit pending"}
                </small>
              </div>
              <div className="resource-stat">
                <span><FlaskConical size={13} /> Science</span>
                <strong>{Math.round(totals.sciencePerDay)} pts/day</strong>
                <small>Target {Math.round(knowledgeTarget)} pts</small>
              </div>
            </div>
            <div className="resource-mini">
              <span>
                <Layers size={12} /> Slots
                <strong>{totals.instrumentSlotsUsed}/{totals.instrumentSlots}</strong>
              </span>
              <span>
                <Timer size={12} /> Life
                <strong>
                  {limiting ? fmtMonths(limiting.lifetimeMonths) : fmtMonths(objective.requiredLifetimeMonths)}
                </strong>
              </span>
            </div>
          </Panel>

          <Panel eyebrow="Design review" title={warningChecks.length > 0 ? "Open issues" : "No blocking issues"}>
            {warningChecks.length > 0 ? (
              <ul className="issue-list">
                {warningChecks.slice(0, 5).map((check) => (
                  <li key={check.id} className={`issue-list__item issue-list__item--${check.status}`}>
                    {check.status === "fail" ? <AlertTriangle size={14} /> : <Gauge size={14} />}
                    <div>
                      <strong>{check.label}</strong>
                      <span>{check.detail}</span>
                    </div>
                  </li>
                ))}
                {warningChecks.length > 5 ? (
                  <li className="issue-list__more">+{warningChecks.length - 5} more checks at review</li>
                ) : null}
              </ul>
            ) : (
              <div className="empty-note">
                <Check size={18} />
                <p>
                  Current subsystems close on paper. Continue to orbit selection to test the
                  environment.
                </p>
              </div>
            )}
            {difficulty.hintLevel !== "minimal" ? (
              <div className="hint-box">
                <span className="eyebrow">Hint</span>
                <p>
                  {totals.powerUseW === 0
                    ? "Start with a bus, a power source and an instrument. The budget rail will show the consequences."
                    : powerMargin < difficulty.powerMargin * 100
                      ? `Power generation needs at least ${fmtPower(totals.powerUseW * (1 + difficulty.powerMargin))} at ${BODIES[objective.body].name}.`
                      : "Mass is the quiet constraint: launch capacity is not checked until you pick a vehicle."}
                </p>
              </div>
            ) : null}
          </Panel>

          <Panel eyebrow="Science brief" title={objective.codename}>
            <p className="brief-summary">{objective.summary}</p>
            <div className="brief-requirements">
              <span>
                <CircleDollarSign size={13} /> Budget <strong>{fmtMusd(budget)}</strong>
              </span>
              <span>
                <Timer size={13} /> Lifetime <strong>{fmtMonths(objective.requiredLifetimeMonths)}</strong>
              </span>
              <span>
                <Gauge size={13} /> Pointing <strong>{objective.pointingRequirementArcsec}″</strong>
              </span>
            </div>
            <div className="brief-tags">
              {objective.measurementsRequired.map((tag) => (
                <span key={tag} className="brief-tag">
                  {MEASUREMENTS[tag].short} · {MEASUREMENTS[tag].label}
                </span>
              ))}
            </div>
            <div className="brief-progress">
              <span>Instruments cover</span>
              <strong>
                {
                  objective.measurementsRequired.filter((tag) =>
                    systems.instruments.some((instrument) => instrument.measurements.includes(tag)),
                  ).length
                }
                /{objective.measurementsRequired.length}
              </strong>
            </div>
          </Panel>
        </aside>
      </div>

      <div className="builder-footer">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => dispatch({ type: "set-step", step: "briefing" })}
        >
          Briefing
        </Button>
        <div className="builder-footer__status">
          {missing.length > 0 ? (
            <span className="is-warn">
              <AlertTriangle size={14} /> Missing {missing.join(", ")}
            </span>
          ) : systems.instruments.length === 0 ? (
            <span className="is-warn">
              <AlertTriangle size={14} /> Add at least one instrument
            </span>
          ) : (
            <span className="is-good">
              <Check size={14} /> Spacecraft assembly complete · {fmtMass(totals.massKg)}
            </span>
          )}
        </div>
        <Button
          variant="primary"
          trailing={<ArrowRight size={16} />}
          disabled={!canContinue}
          onClick={() => dispatch({ type: "set-step", step: "orbit" })}
        >
          Choose an orbit
        </Button>
      </div>
    </div>
  );
}
