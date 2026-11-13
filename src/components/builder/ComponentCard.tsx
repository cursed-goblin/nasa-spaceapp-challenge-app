import { Check, Crown, Plus } from "lucide-react";
import { MEASUREMENTS } from "../../data/measurements";
import type {
  CelestialBody,
  DifficultySpec,
  ObjectiveSpec,
  SpacecraftComponent,
} from "../../data/types";
import { componentCost } from "../../engine/design";
import { fmtMass, fmtMusd, fmtPower } from "../../engine/format";
import { isInstrument } from "../../data/components";
import { Badge } from "../ui/Badge";
import { componentSpecs } from "./componentSpecs";

interface ComponentCardProps {
  component: SpacecraftComponent;
  selected: boolean;
  difficulty: DifficultySpec;
  body: CelestialBody;
  objective: ObjectiveSpec;
  onSelect: () => void;
}

export function ComponentCard({
  component,
  selected,
  difficulty,
  body,
  objective,
  onSelect,
}: ComponentCardProps) {
  const cost = componentCost(component, difficulty);
  const premium =
    component.tier === "advanced" && difficulty.advancedCostMultiplier !== 1;
  const specs = componentSpecs(component, body).slice(0, 3);
  const instrument = isInstrument(component) ? component : null;
  const offBrief =
    instrument !== null &&
    !instrument.measurements.some((tag) => objective.measurementsRequired.includes(tag));

  return (
    <button
      type="button"
      className={`component-card ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="component-card__top">
        <div className="component-card__title">
          <span className={`tier-dot tier-dot--${component.tier}`} aria-hidden="true" />
          <strong>{component.name}</strong>
        </div>
        <div className="component-card__badges">
          {premium ? (
            <Badge tone="amber">
              <Crown size={10} /> Premium ×{difficulty.advancedCostMultiplier}
            </Badge>
          ) : (
            <Badge tone={component.tier === "advanced" ? "ice" : "muted"}>
              {component.tier === "advanced" ? "Advanced" : "Simple"}
            </Badge>
          )}
          <span className={`component-card__check ${selected ? "is-on" : ""}`}>
            {selected ? <Check size={13} /> : <Plus size={13} />}
          </span>
        </div>
      </div>

      <p className="component-card__description">{component.description}</p>

      {instrument ? (
        <div className="component-card__measurements">
          {instrument.measurements.map((tag) => (
            <span
              key={tag}
              className={`measurement-chip ${
                objective.measurementsRequired.includes(tag) ? "is-relevant" : ""
              }`}
              title={MEASUREMENTS[tag].description}
            >
              {MEASUREMENTS[tag].short}
            </span>
          ))}
          {offBrief ? <Badge tone="amber">Off-brief</Badge> : null}
        </div>
      ) : null}

      <div className="component-card__specs">
        {specs.map((spec) => (
          <span key={spec.label}>
            <em>{spec.label}</em>
            <strong>{spec.value}</strong>
          </span>
        ))}
      </div>

      <div className="component-card__footer">
        <span>
          <em>Mass</em>
          <strong>{fmtMass(component.massKg)}</strong>
        </span>
        <span>
          <em>Power</em>
          <strong>{component.powerW > 0 ? fmtPower(component.powerW) : "Passive"}</strong>
        </span>
        <span className="component-card__cost">
          <em>Cost</em>
          <strong className={premium ? "is-premium" : ""}>{fmtMusd(cost)}</strong>
        </span>
      </div>
      <span className="component-card__heritage">{component.heritage}</span>
    </button>
  );
}
