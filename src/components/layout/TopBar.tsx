import {
  ChevronRight,
  Database,
  Menu,
  Satellite,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";
import { BODIES } from "../../data/bodies";
import { DATASET } from "../../data/dataset";
import { DIFFICULTY_BY_ID } from "../../data/difficulties";
import { getObjective } from "../../engine/design";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";

interface TopBarProps {
  onOpenData: () => void;
}

export function TopBar({ onOpenData }: TopBarProps) {
  const { state, dispatch } = useGame();
  const [menuOpen, setMenuOpen] = useState(false);
  const objective = getObjective(state.design.objectiveId);
  const difficulty = DIFFICULTY_BY_ID[state.design.difficulty];

  const goBriefing = () => {
    dispatch({ type: "close-hangar" });
    dispatch({ type: "set-step", step: "briefing" });
    setMenuOpen(false);
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button type="button" className="brand" onClick={goBriefing} aria-label="TRADEOFF mission design lab home">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="20" cy="20" rx="18" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.65" transform="rotate(-28 20 20)" />
              <circle cx="20" cy="20" r="3.6" fill="currentColor" />
              <circle cx="35" cy="12" r="1.7" fill="currentColor" opacity="0.9" />
            </svg>
          </span>
          <span className="brand__copy">
            <strong>TRADEOFF</strong>
            <small>Mission Design Lab</small>
          </span>
        </button>

        <div className="topbar__mission" aria-label="Current mission">
          {objective ? (
            <>
              <span className="topbar__mission-dot" style={{ background: BODIES[objective.body].color }} />
              <span>
                <small>{objective.codename}</small>
                <strong>{objective.name}</strong>
              </span>
              <Badge tone={difficulty.id === "hard" ? "red" : difficulty.id === "sandbox" ? "ice" : "muted"}>
                {difficulty.label}
              </Badge>
            </>
          ) : (
            <span className="topbar__mission-empty">No mission selected</span>
          )}
        </div>

        <div className="topbar__actions">
          <button type="button" className="data-pill" onClick={onOpenData}>
            <span className="data-pill__dot" aria-hidden="true" />
            <Database size={13} />
            <span>{DATASET.status.toUpperCase()} DATA</span>
          </button>
          <button
            type="button"
            className={`btn btn--ghost btn--sm topbar__hangar ${state.view === "hangar" ? "is-active" : ""}`}
            onClick={() =>
              state.view === "hangar"
                ? dispatch({ type: "close-hangar" })
                : dispatch({ type: "open-hangar" })
            }
          >
            <Warehouse size={16} />
            <span>Hangar</span>
          </button>
          <button
            type="button"
            className="icon-btn topbar__menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="topbar__mobile-menu">
          <button type="button" onClick={onOpenData}>
            <Database size={16} /> Dataset status
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(state.view === "hangar" ? { type: "close-hangar" } : { type: "open-hangar" });
              setMenuOpen(false);
            }}
          >
            <Warehouse size={16} /> Mission hangar
          </button>
          <button type="button" onClick={goBriefing}>
            <Satellite size={16} /> Mission briefing
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </header>
  );
}
