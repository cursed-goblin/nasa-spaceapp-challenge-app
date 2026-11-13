import {
  Check,
  ClipboardCheck,
  FileText,
  Orbit,
  Play,
  Rocket,
  Satellite,
} from "lucide-react";
import type { StepId } from "../../data/types";
import { useGame } from "../../state/GameContext";

const STEPS: Array<{
  id: StepId;
  label: string;
  short: string;
  icon: typeof Satellite;
}> = [
  { id: "briefing", label: "Briefing", short: "Brief", icon: ClipboardCheck },
  { id: "spacecraft", label: "Spacecraft", short: "Build", icon: Satellite },
  { id: "orbit", label: "Orbit", short: "Orbit", icon: Orbit },
  { id: "launch", label: "Launch", short: "Launch", icon: Rocket },
  { id: "review", label: "Review", short: "Review", icon: Check },
  { id: "flight", label: "Simulation", short: "Fly", icon: Play },
  { id: "report", label: "Report", short: "Report", icon: FileText },
];

const ORDER = STEPS.map((step) => step.id);

export function Stepper() {
  const { state, dispatch } = useGame();
  const currentIndex = ORDER.indexOf(state.step);
  const hasObjective = Boolean(state.design.objectiveId);

  const canVisit = (step: StepId): boolean => {
    if (step === "briefing") return true;
    if (step === "flight" || step === "report") {
      return Boolean(state.run) || (step === "flight" && Boolean(state.simulation));
    }
    return hasObjective;
  };

  return (
    <nav className="stepper" aria-label="Mission design steps">
      <div className="stepper__track">
        {STEPS.map((step, index) => {
          const active = state.step === step.id;
          const complete = index < currentIndex;
          const enabled = canVisit(step.id);
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              className={`stepper__step ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}`}
              onClick={() => dispatch({ type: "set-step", step: step.id })}
              disabled={!enabled}
              aria-current={active ? "step" : undefined}
              title={!enabled ? (step.id === "flight" || step.id === "report" ? "Run a simulation first" : "Select a mission objective first") : undefined}
            >
              <span className="stepper__index">{complete ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>
              <span className="stepper__label">
                <Icon size={14} />
                <span className="stepper__label-full">{step.label}</span>
                <span className="stepper__label-short">{step.short}</span>
              </span>
              {index < STEPS.length - 1 ? <span className="stepper__connector" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
