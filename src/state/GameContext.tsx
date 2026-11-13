import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  CategoryId,
  DesignState,
  DifficultyId,
  MissionRun,
  SimulationResult,
  StepId,
} from "../data/types";
import { missingCategories, resolveSelection } from "../engine/design";
import { readShareHash } from "../engine/share";
import { loadDraft, saveDraft } from "../engine/storage";

export interface GameState {
  view: "mission" | "hangar";
  step: StepId;
  design: DesignState;
  simulation: SimulationResult | null;
  run: MissionRun | null;
  loadedFromShare: boolean;
}

export type GameAction =
  | { type: "set-difficulty"; difficulty: DifficultyId }
  | { type: "set-objective"; objectiveId: string }
  | { type: "select-component"; category: Exclude<CategoryId, "instruments">; id?: string }
  | { type: "toggle-instrument"; id: string }
  | { type: "clear-category"; category: CategoryId }
  | { type: "set-orbit"; orbitId?: string }
  | { type: "set-launch-vehicle"; id?: string }
  | { type: "set-step"; step: StepId }
  | { type: "start-flight"; simulation: SimulationResult; run: MissionRun }
  | { type: "load-design"; design: DesignState; step?: StepId }
  | { type: "load-run"; run: MissionRun }
  | { type: "open-hangar" }
  | { type: "close-hangar" }
  | { type: "reset" };

export const EMPTY_SELECTION = { instruments: [] as string[] };

const BASE_DESIGN: DesignState = {
  objectiveId: "",
  difficulty: "medium",
  selection: { ...EMPTY_SELECTION },
};

function freshState(design: DesignState = BASE_DESIGN): GameState {
  return {
    view: "mission",
    step: "briefing",
    design,
    simulation: null,
    run: null,
    loadedFromShare: false,
  };
}

export function initialGameState(): GameState {
  if (typeof window !== "undefined") {
    const shared = readShareHash(window.location.hash);
    if (shared) {
      const state = freshState(shared);
      state.step = designReadinessStep(shared);
      state.loadedFromShare = true;
      return state;
    }
    const draft = loadDraft();
    if (draft && draft.objectiveId) {
      return freshState(draft);
    }
  }
  return freshState();
}

export function designReadinessStep(design: DesignState): StepId {
  const systems = resolveSelection(design.selection);
  const complete =
    Boolean(design.objectiveId) &&
    missingCategories(systems).length === 0 &&
    systems.instruments.length > 0 &&
    Boolean(design.orbitId) &&
    Boolean(design.launchVehicleId);
  return complete ? "review" : "spacecraft";
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "set-difficulty": {
      if (state.design.difficulty === action.difficulty) return state;
      return {
        ...state,
        design: { ...state.design, difficulty: action.difficulty },
        simulation: null,
        run: null,
      };
    }
    case "set-objective": {
      if (state.design.objectiveId === action.objectiveId) return state;
      return {
        ...state,
        design: {
          objectiveId: action.objectiveId,
          difficulty: state.design.difficulty,
          selection: { ...EMPTY_SELECTION },
        },
        simulation: null,
        run: null,
      };
    }
    case "select-component": {
      const current = state.design.selection[action.category];
      if (current === action.id) return state;
      return {
        ...state,
        design: {
          ...state.design,
          selection: {
            ...state.design.selection,
            [action.category]: action.id,
          },
        },
        simulation: null,
        run: null,
      };
    }
    case "toggle-instrument": {
      const current = state.design.selection.instruments;
      const instruments = current.includes(action.id)
        ? current.filter((id) => id !== action.id)
        : [...current, action.id];
      return {
        ...state,
        design: {
          ...state.design,
          selection: { ...state.design.selection, instruments },
        },
        simulation: null,
        run: null,
      };
    }
    case "clear-category": {
      if (action.category === "instruments") {
        return {
          ...state,
          design: {
            ...state.design,
            selection: { ...state.design.selection, instruments: [] },
          },
          simulation: null,
          run: null,
        };
      }
      return {
        ...state,
        design: {
          ...state.design,
          selection: {
            ...state.design.selection,
            [action.category]: undefined,
          },
        },
        simulation: null,
        run: null,
      };
    }
    case "set-orbit":
      if (state.design.orbitId === action.orbitId) return state;
      return {
        ...state,
        design: { ...state.design, orbitId: action.orbitId },
        simulation: null,
        run: null,
      };
    case "set-launch-vehicle":
      if (state.design.launchVehicleId === action.id) return state;
      return {
        ...state,
        design: { ...state.design, launchVehicleId: action.id },
        simulation: null,
        run: null,
      };
    case "set-step":
      return { ...state, step: action.step, view: "mission" };
    case "start-flight":
      return {
        ...state,
        step: "flight",
        simulation: action.simulation,
        run: action.run,
        view: "mission",
      };
    case "load-design": {
      const step = action.step ?? designReadinessStep(action.design);
      return {
        ...freshState(action.design),
        step,
      };
    }
    case "load-run":
      return {
        ...freshState(action.run.design),
        step: "report",
        simulation: action.run.simulation,
        run: action.run,
      };
    case "open-hangar":
      return { ...state, view: "hangar" };
    case "close-hangar":
      return { ...state, view: "mission" };
    case "reset":
      return freshState({ ...BASE_DESIGN, selection: { ...EMPTY_SELECTION } });
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialGameState);

  useEffect(() => {
    if (state.design.objectiveId) {
      saveDraft(state.design);
    }
  }, [state.design]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used inside a GameProvider");
  }
  return context;
}
