import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Database,
  FlaskConical,
  GitCompareArrows,
  Medal,
  Orbit,
  Play,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Warehouse,
  Weight,
  X,
} from "lucide-react";
import { DIFFICULTY_BY_ID } from "../../data/difficulties";
import type { DesignState, MissionRun, SavedDesign } from "../../data/types";
import {
  budgetFor,
  calculateTotals,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  resolveSelection,
  totalMissionCost,
} from "../../engine/design";
import { evaluateDesign } from "../../engine/compatibility";
import {
  fmtData,
  fmtDate,
  fmtDateTime,
  fmtMass,
  fmtMusd,
  fmtPercent,
} from "../../engine/format";
import { buildShareUrl } from "../../engine/share";
import {
  deleteRun,
  deleteSavedDesign,
  loadRuns,
  loadSavedDesigns,
} from "../../engine/storage";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { useToast } from "../ui/Toast";
import { MissionPatch } from "../visuals/MissionPatch";

type HangarTab = "runs" | "designs" | "compare";

const TABS: Array<{ id: HangarTab; label: string; icon: typeof Trophy }> = [
  { id: "runs", label: "Leaderboard", icon: Trophy },
  { id: "designs", label: "Saved designs", icon: Warehouse },
  { id: "compare", label: "Compare", icon: GitCompareArrows },
];

export function HangarScreen() {
  const { dispatch } = useGame();
  const { notify } = useToast();
  const [tab, setTab] = useState<HangarTab>("runs");
  const [runs, setRuns] = useState<MissionRun[]>(() => loadRuns());
  const [designs, setDesigns] = useState<SavedDesign[]>(() => loadSavedDesigns());
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const rankedRuns = runs.filter((run) => run.score.rankEligible);
  const sortedRuns = [...runs].sort((a, b) => b.score.total - a.score.total);
  const bestScore = rankedRuns.length > 0 ? Math.max(...rankedRuns.map((run) => run.score.total)) : 0;
  const successRate = runs.length > 0 ? (runs.filter((run) => run.simulation.success).length / runs.length) * 100 : 0;
  const totalScience = runs.reduce((sum, run) => sum + run.simulation.scienceReturn, 0);
  const compareRuns = compareIds
    .map((id) => runs.find((run) => run.id === id))
    .filter((run): run is MissionRun => Boolean(run));

  const viewRun = (run: MissionRun) => {
    dispatch({ type: "load-run", run });
    dispatch({ type: "close-hangar" });
  };

  const loadDesign = (design: DesignState) => {
    dispatch({ type: "load-design", design });
    dispatch({ type: "close-hangar" });
  };

  const removeRun = (run: MissionRun) => {
    deleteRun(run.id);
    setRuns(loadRuns());
    setCompareIds((ids) => ids.filter((id) => id !== run.id));
    notify("Run removed from flight log", { tone: "info" });
  };

  const removeDesign = (design: SavedDesign) => {
    deleteSavedDesign(design.id);
    setDesigns(loadSavedDesigns());
    notify("Saved design removed", { tone: "info" });
  };

  const shareDesign = async (design: DesignState) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(design));
      notify("Design link copied", { detail: "Share this architecture with another player.", tone: "success" });
    } catch {
      notify("Clipboard unavailable", { detail: "Sharing requires browser clipboard access.", tone: "warning" });
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const newMission = () => {
    dispatch({ type: "reset" });
    dispatch({ type: "close-hangar" });
  };

  return (
    <div className="screen hangar-screen">
      <header className="screen-head hangar-head">
        <div>
          <span className="eyebrow">Mission hangar</span>
          <h1>
            Every run leaves a trace. <em>Make the next one better.</em>
          </h1>
          <p>
            Saved architectures, completed flight logs and side-by-side trade studies. The hangar
            is local to this browser; no account or backend is required.
          </p>
        </div>
        <div className="hangar-head__actions">
          <Button
            variant="ghost"
            icon={<ArrowRight size={15} />}
            onClick={() => dispatch({ type: "close-hangar" })}
          >
            Mission control
          </Button>
          <Button variant="primary" icon={<Rocket size={15} />} onClick={newMission}>
            New mission
          </Button>
        </div>
      </header>

      <div className="hangar-stats">
        <div>
          <span><Trophy size={14} /> Best ranked score</span>
          <strong>{bestScore || "—"}</strong>
          <small>{rankedRuns.length} ranked run{rankedRuns.length === 1 ? "" : "s"}</small>
        </div>
        <div>
          <span><ShieldCheck size={14} /> Success rate</span>
          <strong>{Math.round(successRate)}%</strong>
          <small>{runs.filter((run) => run.simulation.success).length} of {runs.length} flights</small>
        </div>
        <div>
          <span><FlaskConical size={14} /> Science returned</span>
          <strong>{Math.round(totalScience).toLocaleString("en-US")}</strong>
          <small>points across all runs</small>
        </div>
        <div>
          <span><Database size={14} /> Stored locally</span>
          <strong>{runs.length + designs.length}</strong>
          <small>{runs.length} runs · {designs.length} designs</small>
        </div>
      </div>

      <nav className="hangar-tabs" aria-label="Hangar sections">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              <Icon size={15} />
              {item.label}
              <span>
                {item.id === "runs" ? runs.length : item.id === "designs" ? designs.length : compareIds.length}
              </span>
            </button>
          );
        })}
      </nav>

      {tab === "runs" ? (
        <Panel
          eyebrow="Local leaderboard"
          title={runs.length > 0 ? "Flight log" : "No completed runs yet"}
          aside={<Badge tone="amber">Local browser only</Badge>}
        >
          {runs.length > 0 ? (
            <>
              <div className="leaderboard-head">
                <span>Rank</span>
                <span>Mission</span>
                <span>Programme</span>
                <span>Score</span>
                <span>Science</span>
                <span>Cost</span>
                <span>Flown</span>
                <span />
              </div>
              <div className="leaderboard">
                {sortedRuns.map((run, index) => {
                  const ranked = run.score.rankEligible;
                  const selectedForCompare = compareIds.includes(run.id);
                  return (
                    <div key={run.id} className={`leaderboard__row ${ranked ? "" : "is-unranked"}`}>
                      <span className={`leaderboard__rank ${index === 0 && ranked ? "is-first" : ""}`}>
                        {ranked ? (
                          index === 0 ? <Medal size={16} /> : `#${index + 1}`
                        ) : (
                          "—"
                        )}
                      </span>
                      <span className="leaderboard__mission">
                        <MissionPatch
                          seed={run.patchSeed}
                          body={run.body}
                          codename={getObjective(run.objectiveId)?.codename ?? "MISSION"}
                          size={38}
                        />
                        <span>
                          <strong>{getObjective(run.objectiveId)?.codename ?? run.objectiveName}</strong>
                          <small>{run.objectiveName}</small>
                        </span>
                      </span>
                      <span>
                        <Badge tone={run.difficulty === "hard" ? "red" : run.difficulty === "sandbox" ? "ice" : "muted"}>
                          {DIFFICULTY_BY_ID[run.difficulty].label}
                        </Badge>
                        <small className="leaderboard__status">
                          {run.simulation.success ? "Success" : "Partial"}
                        </small>
                      </span>
                      <span className="leaderboard__score">
                        <strong>{run.score.total}</strong>
                        {!ranked ? <small>unranked</small> : null}
                      </span>
                      <span>{fmtPercent((run.simulation.scienceReturn / Math.max(run.simulation.scienceRequired, 1)) * 100, 0)}</span>
                      <span>{fmtMusd(run.costMusd)}</span>
                      <span>{fmtDateTime(run.createdAt)}</span>
                      <span className="leaderboard__actions">
                        <button
                          type="button"
                          className={`icon-btn icon-btn--sm ${selectedForCompare ? "is-active" : ""}`}
                          onClick={() => toggleCompare(run.id)}
                          aria-label={`${selectedForCompare ? "Remove" : "Add"} ${run.objectiveName} ${selectedForCompare ? "from" : "to"} comparison`}
                          title={selectedForCompare ? "Remove from comparison" : "Add to comparison"}
                        >
                          {selectedForCompare ? <Check size={13} /> : <GitCompareArrows size={13} />}
                        </button>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => viewRun(run)} aria-label="Open mission report" title="Open mission report">
                          <ArrowRight size={14} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => removeRun(run)} aria-label="Delete run" title="Delete run">
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="leaderboard-foot">
                <p>
                  <Trophy size={13} /> Ranked runs require a passed compatibility review and a completed primary objective.
                  Sandbox and what-if flights are stored but unranked.
                </p>
                {compareIds.length >= 2 ? (
                  <Button variant="primary" size="sm" icon={<GitCompareArrows size={14} />} onClick={() => setTab("compare")}>
                    Compare {compareIds.length} runs
                  </Button>
                ) : (
                  <span>Select 2–3 runs to compare.</span>
                )}
              </div>
            </>
          ) : (
            <div className="hangar-empty">
              <Trophy size={32} />
              <h3>No flights logged</h3>
              <p>Run a mission simulation and the result will appear here automatically.</p>
              <Button variant="primary" onClick={() => dispatch({ type: "close-hangar" })}>
                Go to mission control
              </Button>
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "designs" ? (
        <Panel
          eyebrow="Architecture library"
          title={designs.length > 0 ? `${designs.length} saved design${designs.length === 1 ? "" : "s"}` : "No saved designs"}
          aside={<Badge tone="muted">Shareable links</Badge>}
        >
          {designs.length > 0 ? (
            <div className="design-grid">
              {designs.map((entry) => {
                const objective = getObjective(entry.design.objectiveId);
                const difficulty = getDifficulty(entry.design.difficulty);
                const totals = calculateTotals(entry.design.selection, difficulty, objective?.body ?? "earth");
                const vehicle = getLaunchVehicle(entry.design.launchVehicleId);
                const missionCost = totalMissionCost(totals, vehicle);
                const budget = objective ? budgetFor(objective, difficulty) : 0;
                return (
                  <article key={entry.id} className="design-card">
                    <header>
                      <div>
                        <span className="eyebrow">{objective?.category ?? "Mission design"}</span>
                        <h3>{entry.name}</h3>
                      </div>
                      <Badge tone={difficulty.id === "hard" ? "red" : "muted"}>{difficulty.label}</Badge>
                    </header>
                    <p>{objective?.summary ?? "Archived design."}</p>
                    <div className="design-card__stats">
                      <span><Weight size={12} /> {fmtMass(totals.massKg)}</span>
                      <span><CircleDollarSign size={12} /> {fmtMusd(missionCost)}</span>
                      <span><FlaskConical size={12} /> {Math.round(totals.sciencePerDay)} pts/day</span>
                      <span><Clock size={12} /> {fmtDate(entry.savedAt)}</span>
                    </div>
                    <div className="design-card__status">
                      <span className={missionCost <= budget ? "is-good" : "is-warn"}>
                        {missionCost <= budget ? <Check size={11} /> : <X size={11} />} Budget
                      </span>
                      <span className="is-muted">
                        <Orbit size={11} /> {getOrbit(entry.design.orbitId)?.shortName ?? "No orbit"}
                      </span>
                      <span className="is-muted">
                        <Rocket size={11} /> {vehicle?.name ?? "No launcher"}
                      </span>
                    </div>
                    <footer>
                      <Button variant="secondary" size="sm" icon={<Play size={13} />} onClick={() => loadDesign(entry.design)}>
                        Load design
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Share2 size={13} />} onClick={() => void shareDesign(entry.design)}>
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => removeDesign(entry)}>
                        Delete
                      </Button>
                    </footer>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="hangar-empty">
              <Warehouse size={32} />
              <h3>Nothing archived yet</h3>
              <p>Save a design from the review screen to keep it here for another attempt.</p>
              <Button variant="primary" onClick={() => dispatch({ type: "close-hangar" })}>
                Back to design
              </Button>
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "compare" ? (
        <div className="compare-layout">
          <Panel eyebrow="Trade study" title="Select up to three flights">
            {runs.length > 0 ? (
              <div className="compare-picker">
                {sortedRuns.map((run) => {
                  const active = compareIds.includes(run.id);
                  return (
                    <button
                      key={run.id}
                      type="button"
                      className={active ? "is-active" : ""}
                      onClick={() => toggleCompare(run.id)}
                    >
                      <span className={`compare-picker__check ${active ? "is-on" : ""}`}>
                        {active ? <Check size={12} /> : null}
                      </span>
                      <span>
                        <strong>{getObjective(run.objectiveId)?.codename ?? run.objectiveName}</strong>
                        <small>{fmtDate(run.createdAt)} · {DIFFICULTY_BY_ID[run.difficulty].label} · {run.score.total} pts</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-note">
                <ClipboardList size={17} /> No completed runs to compare.
              </div>
            )}
            <div className="compare-picker__hint">
              <GitCompareArrows size={13} /> Compare science closure, margins and cost. All values are recomputed from the archived design and telemetry.
            </div>
          </Panel>

          <Panel
            eyebrow="Side-by-side"
            title={compareRuns.length >= 2 ? `${compareRuns.length}-way comparison` : "Pick at least two runs"}
            aside={<Badge tone="cyan">Design trade</Badge>}
          >
            {compareRuns.length >= 2 ? (
              <CompareTable runs={compareRuns} onView={viewRun} />
            ) : (
              <div className="hangar-empty hangar-empty--compact">
                <BarChart3 size={28} />
                <h3>No comparison yet</h3>
                <p>Select two or three flights on the left to see the trade-offs side by side.</p>
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      <div className="hangar-disclaimer">
        <Sparkles size={14} />
        <p>
          Local leaderboard only. A future multiplayer service could sync runs, but this prototype
          deliberately has no backend, accounts or telemetry. Data stays in this browser.
        </p>
        <button type="button" className="text-button" onClick={() => dispatch({ type: "close-hangar" })}>
          Return to mission <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function CompareTable({ runs, onView }: { runs: MissionRun[]; onView: (run: MissionRun) => void }) {
  const rows = runs.map((run) => {
    const objective = getObjective(run.design.objectiveId);
    const difficulty = getDifficulty(run.design.difficulty);
    const systems = resolveSelection(run.design.selection);
    const totals = calculateTotals(run.design.selection, difficulty, objective?.body ?? "earth");
    const compatibility = evaluateDesign(run.design);
    return { run, objective, difficulty, systems, totals, compatibility };
  });

  return (
    <div className="compare-table">
      <div className="compare-table__head">
        <span>Metric</span>
        {rows.map(({ run, objective }) => (
          <span key={run.id}>
            <strong>{objective?.codename ?? run.objectiveName}</strong>
            <small>{DIFFICULTY_BY_ID[run.difficulty].label}</small>
          </span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Score</span>
        {rows.map(({ run }) => (
          <strong key={run.id} className="compare-score">{run.score.total}{run.score.rankEligible ? "" : "*"}</strong>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Science closure</span>
        {rows.map(({ run }) => (
          <span key={run.id}>{fmtPercent((run.simulation.scienceReturn / Math.max(run.simulation.scienceRequired, 1)) * 100, 0)}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Mass</span>
        {rows.map(({ totals, run }) => (
          <span key={run.id}>{fmtMass(totals.massKg)}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Mission cost</span>
        {rows.map(({ run }) => (
          <span key={run.id}>{fmtMusd(run.costMusd)}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Power margin</span>
        {rows.map(({ totals, run }) => (
          <span key={run.id}>{fmtPercent(((totals.powerGenW - totals.powerUseW) / Math.max(totals.powerUseW, 1)) * 100, 0)}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Min battery</span>
        {rows.map(({ run }) => (
          <span key={run.id}>{fmtPercent(run.simulation.minBatteryPct, 0)}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Data lost</span>
        {rows.map(({ run }) => (
          <span key={run.id}>{fmtData(run.simulation.dataLostGb)}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Review</span>
        {rows.map(({ run, compatibility }) => (
          <span key={run.id} className={compatibility.passed ? "is-good" : "is-warn"}>
            {compatibility.passed ? "Cleared" : `${compatibility.failures} fail`}
          </span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Orbit</span>
        {rows.map(({ run }) => (
          <span key={run.id}>{getOrbit(run.design.orbitId)?.shortName ?? "—"}</span>
        ))}
      </div>
      <div className="compare-table__row">
        <span>Launch</span>
        {rows.map(({ run }) => (
          <span key={run.id}>{getLaunchVehicle(run.design.launchVehicleId)?.name ?? "—"}</span>
        ))}
      </div>
      <p className="compare-table__note">* Unranked or sandbox run.</p>
      <div className="compare-table__actions">
        {rows.map(({ run }) => (
          <Button
            key={run.id}
            variant="ghost"
            size="sm"
            icon={<ArrowRight size={12} />}
            onClick={() => onView(run)}
          >
            {getObjective(run.design.objectiveId)?.codename ?? "Run"}
          </Button>
        ))}
      </div>
    </div>
  );
}
