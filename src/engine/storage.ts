import type { DesignState, MissionRun, SavedDesign } from "../data/types";
import { getObjective, resolveSelection } from "./design";

const DRAFT_KEY = "tradeoff.draft.v1";
const RUNS_KEY = "tradeoff.runs.v1";
const DESIGNS_KEY = "tradeoff.designs.v1";
const MAX_RUNS = 30;
const MAX_DESIGNS = 30;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(): DesignState | null {
  const draft = readJson<DesignState | null>(DRAFT_KEY, null);
  if (!draft || typeof draft.objectiveId !== "string" || !draft.selection) {
    return null;
  }
  return draft;
}

export function saveDraft(design: DesignState): boolean {
  return writeJson(DRAFT_KEY, design);
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be unavailable in private mode; ignoring is safe.
  }
}

export function loadRuns(): MissionRun[] {
  const runs = readJson<MissionRun[]>(RUNS_KEY, []);
  return Array.isArray(runs) ? runs : [];
}

export function saveRun(run: MissionRun): boolean {
  const runs = loadRuns().filter((item) => item.id !== run.id);
  runs.unshift(run);
  return writeJson(RUNS_KEY, runs.slice(0, MAX_RUNS));
}

export function deleteRun(id: string): void {
  writeJson(
    RUNS_KEY,
    loadRuns().filter((run) => run.id !== id),
  );
}

export function clearRuns(): void {
  writeJson(RUNS_KEY, []);
}

export function loadSavedDesigns(): SavedDesign[] {
  const designs = readJson<SavedDesign[]>(DESIGNS_KEY, []);
  return Array.isArray(designs) ? designs : [];
}

export function saveDesign(design: DesignState, name?: string): boolean {
  const objective = getObjective(design.objectiveId);
  if (!objective) return false;
  const systems = resolveSelection(design.selection);
  const entry: SavedDesign = {
    id: `design-${Date.now().toString(36)}`,
    name: name?.trim() || `${objective.codename} · ${new Date().toLocaleDateString("en-US")}`,
    savedAt: new Date().toISOString(),
    design,
    summary: {
      objectiveName: objective.name,
      massKg: systems.all.reduce((sum, component) => sum + component.massKg, 0),
      costMusd: systems.all.reduce((sum, component) => sum + component.costMusd, 0),
      sciencePerDay: systems.instruments.reduce(
        (sum, instrument) => sum + instrument.sciencePerDay,
        0,
      ),
    },
  };
  const designs = loadSavedDesigns();
  designs.unshift(entry);
  return writeJson(DESIGNS_KEY, designs.slice(0, MAX_DESIGNS));
}

export function deleteSavedDesign(id: string): void {
  writeJson(
    DESIGNS_KEY,
    loadSavedDesigns().filter((design) => design.id !== id),
  );
}

export function storageAvailable(): boolean {
  try {
    const key = "tradeoff.test";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
