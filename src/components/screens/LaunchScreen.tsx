import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Gauge,
  PackageCheck,
  Rocket,
  Ruler,
  ShieldCheck,
  Weight,
} from "lucide-react";
import { LAUNCH_VEHICLES } from "../../data/launchVehicles";
import { BODIES } from "../../data/bodies";
import {
  budgetFor,
  calculateTotals,
  getDifficulty,
  getObjective,
  getOrbit,
  GROUND_SEGMENT_COST_MUSD,
  resolveSelection,
  totalMissionCost,
} from "../../engine/design";
import { fmtMass, fmtMusd, fmtPercent } from "../../engine/format";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Meter } from "../ui/Meter";
import { Panel } from "../ui/Panel";
import { RocketGlyph } from "../visuals/RocketGlyph";

const DESTINATION_LABEL: Record<string, string> = {
  leo: "LEO",
  sso: "SSO",
  geo: "GEO",
  lunar: "lunar transfer",
  interplanetary: "interplanetary",
};

export function LaunchScreen() {
  const { state, dispatch } = useGame();
  const objective = getObjective(state.design.objectiveId);
  const orbit = getOrbit(state.design.orbitId);
  const difficulty = getDifficulty(state.design.difficulty);

  if (!objective) {
    return (
      <div className="screen empty-state">
        <Rocket size={42} />
        <h1>No mission selected</h1>
        <p>Choose a mission brief before selecting a launch vehicle.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "briefing" })}>
          Return to briefing
        </Button>
      </div>
    );
  }

  if (!orbit) {
    return (
      <div className="screen empty-state">
        <Rocket size={42} />
        <h1>Orbit required</h1>
        <p>Launch capacity depends on the destination. Lock an orbit first.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "orbit" })}>
          Choose an orbit
        </Button>
      </div>
    );
  }

  const systems = resolveSelection(state.design.selection);
  const totals = calculateTotals(state.design.selection, difficulty, objective.body);
  const budget = budgetFor(objective, difficulty);
  const selected = LAUNCH_VEHICLES.find((vehicle) => vehicle.id === state.design.launchVehicleId);
  const preview =
    selected ??
    LAUNCH_VEHICLES.find((vehicle) => vehicle.payloadKg[orbit.destination] > 0) ??
    LAUNCH_VEHICLES[0];
  const previewCost = totalMissionCost(totals, preview);
  const previewCapacity = preview.payloadKg[orbit.destination];
  const envelopeDiameter = Math.max(
    systems.structure?.diameterM ?? 0,
    (systems.comms?.antennaDiameterM ?? 0) + 0.2,
  );
  const envelopeHeight =
    (systems.structure?.heightM ?? 0) + (systems.comms?.antennaDiameterM ?? 0) * 0.35 + 0.4;
  const massMargin =
    previewCapacity > 0 ? ((previewCapacity - totals.massKg) / previewCapacity) * 100 : -100;
  const fairingFits =
    envelopeDiameter <= preview.fairingDiameterM && envelopeHeight <= preview.fairingHeightM;
  const budgetFits = previewCost <= budget || !Number.isFinite(budget);
  const canContinue = Boolean(selected);
  const destination = DESTINATION_LABEL[orbit.destination] ?? orbit.destination;

  return (
    <div className="screen launch-screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">04 · Launch accommodations</span>
          <h1>
            The rocket is part of the design. <em>Not a checkout step.</em>
          </h1>
          <p>
            {fmtMass(totals.massKg)} of spacecraft has to fit inside {preview.fairingDiameterM} m
            and reach {destination} around {BODIES[objective.body].name}. Capacity, fairing and
            price are all constraints.
          </p>
        </div>
        <div className="screen-head__meta">
          <Badge tone="muted">{destination} destination</Badge>
          <Badge tone={selected ? "green" : "amber"} dot>
            {selected ? `${selected.name} selected` : "No vehicle locked"}
          </Badge>
        </div>
      </header>

      <div className="launch-layout">
        <section className="launch-list" aria-label="Launch vehicles">
          {LAUNCH_VEHICLES.map((vehicle) => {
            const capacity = vehicle.payloadKg[orbit.destination];
            const missionCost = totalMissionCost(totals, vehicle);
            const massFits = capacity > 0 && totals.massKg <= capacity;
            const diameterFits = envelopeDiameter <= vehicle.fairingDiameterM;
            const heightFits = envelopeHeight <= vehicle.fairingHeightM;
            const vehicleFairingFits = diameterFits && heightFits;
            const vehicleBudgetFits = missionCost <= budget || !Number.isFinite(budget);
            const isSelected = state.design.launchVehicleId === vehicle.id;
            return (
              <button
                key={vehicle.id}
                type="button"
                className={`launch-card ${isSelected ? "is-selected" : ""} ${
                  !massFits || !vehicleFairingFits ? "has-risk" : ""
                }`}
                onClick={() => dispatch({ type: "set-launch-vehicle", id: vehicle.id })}
                aria-pressed={isSelected}
              >
                <div className="launch-card__visual">
                  <RocketGlyph vehicle={vehicle} size={74} selected={isSelected} />
                </div>
                <div className="launch-card__body">
                  <div className="launch-card__head">
                    <div>
                      <span>{vehicle.provider}</span>
                      <strong>{vehicle.name}</strong>
                    </div>
                    <span className={`launch-card__radio ${isSelected ? "is-on" : ""}`}>
                      {isSelected ? <Check size={12} /> : null}
                    </span>
                  </div>
                  <p>{vehicle.description}</p>
                  <div className="launch-card__stats">
                    <span>
                      <Weight size={12} />
                      {capacity > 0 ? fmtMass(capacity) : "No trajectory"}
                    </span>
                    <span>
                      <Ruler size={12} />
                      {vehicle.fairingDiameterM} × {vehicle.fairingHeightM} m
                    </span>
                    <span>
                      <CircleDollarSign size={12} />
                      {fmtMusd(vehicle.costMusd)}
                    </span>
                  </div>
                  <div className="launch-card__flags">
                    <span className={massFits ? "is-good" : "is-warn"}>
                      {massFits ? <Check size={11} /> : <AlertTriangle size={11} />} Mass
                    </span>
                    <span className={vehicleFairingFits ? "is-good" : "is-warn"}>
                      {vehicleFairingFits ? <Check size={11} /> : <AlertTriangle size={11} />}{" "}
                      Fairing
                    </span>
                    <span className={vehicleBudgetFits ? "is-good" : "is-warn"}>
                      {vehicleBudgetFits ? <Check size={11} /> : <AlertTriangle size={11} />}{" "}
                      Budget
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <aside className="launch-detail">
          <Panel
            className="launch-visual-panel"
            eyebrow={selected?.id === preview.id ? "Vehicle selected" : "Live preview"}
            title={preview.name}
            aside={
              <Badge tone={fairingFits && massMargin >= 0 ? "green" : "red"}>
                {fairingFits && massMargin >= 0 ? "Payload fits" : "Accommodation risk"}
              </Badge>
            }
          >
            <div className="launch-hero">
              <div className="launch-hero__pad">
                <span className="launch-hero__cross launch-hero__cross--a" />
                <span className="launch-hero__cross launch-hero__cross--b" />
                <RocketGlyph vehicle={preview} size={150} selected />
                <div className="launch-hero__grid" aria-hidden="true" />
              </div>
              <div className="launch-hero__copy">
                <span className="eyebrow">{preview.provider}</span>
                <h2>{preview.name}</h2>
                <p>{preview.description}</p>
                <div className="launch-hero__meta">
                  <span>
                    <ShieldCheck size={13} /> {preview.reliabilityPct}% reliability
                  </span>
                  <span>
                    <CircleDollarSign size={13} /> {fmtMusd(preview.costMusd)} launch
                  </span>
                </div>
              </div>
            </div>

            <div className="launch-fit">
              <Meter
                label={`Payload to ${destination}`}
                value={totals.massKg}
                max={previewCapacity > 0 ? previewCapacity : Math.max(totals.massKg, 1)}
                display={`${fmtMass(totals.massKg)} / ${previewCapacity > 0 ? fmtMass(previewCapacity) : "0 kg"}`}
                tone={massMargin >= 0 ? "green" : "red"}
                hint={
                  previewCapacity > 0
                    ? `${fmtPercent(Math.max(massMargin, -100))} payload margin. Mass includes all selected subsystems and instruments.`
                    : `${preview.name} has no trajectory to this destination in the current dataset.`
                }
              />
              <div className="fit-grid">
                <div className={fairingFits ? "fit-card is-good" : "fit-card is-warn"}>
                  <span>
                    <Ruler size={13} /> Stowed envelope
                  </span>
                  <strong>
                    {envelopeDiameter.toFixed(2)} × {envelopeHeight.toFixed(2)} m
                  </strong>
                  <small>
                    fairing {preview.fairingDiameterM} × {preview.fairingHeightM} m
                  </small>
                </div>
                <div className={budgetFits ? "fit-card is-good" : "fit-card is-warn"}>
                  <span>
                    <CircleDollarSign size={13} /> Mission cost
                  </span>
                  <strong>{fmtMusd(previewCost)}</strong>
                  <small>
                    {Number.isFinite(budget) ? `budget ${fmtMusd(budget)}` : "unlimited budget"}
                  </small>
                </div>
              </div>
            </div>

            <div className="cost-breakdown">
              <div>
                <span>Spacecraft</span>
                <strong>{fmtMusd(totals.spacecraftCostMusd)}</strong>
              </div>
              <div>
                <span>Launch</span>
                <strong>{fmtMusd(preview.costMusd)}</strong>
              </div>
              <div>
                <span>Ground segment</span>
                <strong>{fmtMusd(GROUND_SEGMENT_COST_MUSD)}</strong>
              </div>
              <div className="cost-breakdown__total">
                <span>Programme total</span>
                <strong>{fmtMusd(previewCost)}</strong>
              </div>
            </div>

            <div className="launch-detail__actions">
              {selected?.id === preview.id ? (
                <Badge tone="green" dot>
                  <PackageCheck size={12} /> {preview.name} is locked
                </Badge>
              ) : (
                <Button
                  variant="primary"
                  icon={<Rocket size={15} />}
                  onClick={() => dispatch({ type: "set-launch-vehicle", id: preview.id })}
                >
                  Lock {preview.name}
                </Button>
              )}
              <span className="launch-detail__note">
                <Gauge size={13} /> Advanced vehicles are not automatically better; every kilogram
                of capacity is paid for in dollars.
              </span>
            </div>
          </Panel>

          <Panel eyebrow="Capacity card" title="Payload to other destinations">
            <div className="capacity-table">
              {(Object.keys(preview.payloadKg) as Array<keyof typeof preview.payloadKg>).map(
                (key) => (
                  <div key={key} className={key === orbit.destination ? "is-active" : ""}>
                    <span>{DESTINATION_LABEL[key]}</span>
                    <strong>
                      {preview.payloadKg[key] > 0
                        ? fmtMass(preview.payloadKg[key])
                        : "No trajectory"}
                    </strong>
                  </div>
                ),
              )}
            </div>
            <div className="tiny-note">
              <AlertTriangle size={12} /> Mass and fairing size are hard limits. Power, data and
              lifetime closure are checked again at design review.
            </div>
          </Panel>
        </aside>
      </div>

      <div className="builder-footer">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => dispatch({ type: "set-step", step: "orbit" })}
        >
          Orbit
        </Button>
        <div className="builder-footer__status">
          {selected ? (
            <span className={massMargin >= 0 && fairingFits && budgetFits ? "is-good" : "is-warn"}>
              {massMargin >= 0 && fairingFits && budgetFits ? (
                <Check size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}{" "}
              {selected.name} · {fmtMusd(totalMissionCost(totals, selected))} programme cost
            </span>
          ) : (
            <span className="is-warn">
              <AlertTriangle size={14} /> Select a launch vehicle to continue
            </span>
          )}
        </div>
        <Button
          variant="primary"
          trailing={<ArrowRight size={16} />}
          disabled={!canContinue}
          onClick={() => dispatch({ type: "set-step", step: "review" })}
        >
          Review mission
        </Button>
      </div>
    </div>
  );
}
