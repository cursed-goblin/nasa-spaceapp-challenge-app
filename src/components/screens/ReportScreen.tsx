import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BatteryCharging,
  BookOpen,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileJson,
  FileText,
  FlaskConical,
  Gauge as GaugeIcon,
  Layers,
  Printer,
  Radio,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  Trophy,
  Weight,
  X,
} from "lucide-react";
import { BODIES } from "../../data/bodies";
import { DATASET } from "../../data/dataset";
import type { MissionRun } from "../../data/types";
import { evaluateDesign } from "../../engine/compatibility";
import {
  budgetFor,
  calculateTotals,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  GROUND_SEGMENT_COST_MUSD,
} from "../../engine/design";
import { downloadTextFile } from "../../engine/download";
import {
  fmtArcsec,
  fmtData,
  fmtDate,
  fmtMass,
  fmtMonths,
  fmtMusd,
  fmtPercent,
  fmtPower,
} from "../../engine/format";
import { buildMissionReportJson, buildMissionReportMarkdown } from "../../engine/report";
import { conceptMaturity } from "../../engine/maturity";
import { loadRuns } from "../../engine/storage";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Gauge } from "../ui/Gauge";
import { Panel } from "../ui/Panel";
import { useToast } from "../ui/Toast";
import { MissionPatch } from "../visuals/MissionPatch";

function gradeFor(total: number, multiplier: number): string {
  const raw = multiplier > 0 ? total / multiplier : total;
  if (raw >= 95) return "S";
  if (raw >= 82) return "A";
  if (raw >= 68) return "B";
  if (raw >= 52) return "C";
  if (raw >= 35) return "D";
  return "E";
}

export function ReportScreen() {
  const { state, dispatch } = useGame();
  const { notify } = useToast();
  const run = state.run;
  const objective = run ? getObjective(run.design.objectiveId) : undefined;

  if (!run || !objective) {
    return (
      <div className="screen empty-state">
        <FileText size={42} />
        <h1>No mission report</h1>
        <p>Complete a simulation to generate the post-mission analysis.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "review" })}>
          Return to review
        </Button>
      </div>
    );
  }

  const difficulty = getDifficulty(run.design.difficulty);
  const orbit = getOrbit(run.design.orbitId);
  const vehicle = getLaunchVehicle(run.design.launchVehicleId);
  const totals = calculateTotals(run.design.selection, difficulty, objective.body);
  const compatibility = evaluateDesign(run.design);
  const budget = budgetFor(objective, difficulty);
  const localRuns = loadRuns().sort((a, b) => b.score.total - a.score.total);
  const localRank = localRuns.findIndex((item) => item.id === run.id) + 1;
  const success = run.simulation.success;
  const maturity = conceptMaturity(run.design, compatibility, run.simulation);
  const grade = gradeFor(run.score.total, run.score.difficultyMultiplier);
  const scoreRows = [
    { label: "Science", value: run.score.science, max: 55, tone: "cyan" as const },
    { label: "Cost efficiency", value: run.score.cost, max: 25, tone: "amber" as const },
    { label: "Engineering margins", value: run.score.margins, max: 20, tone: "green" as const },
    { label: "Success bonus", value: run.score.successBonus, max: 10, tone: "ice" as const },
  ];

  const downloadMarkdown = () => {
    downloadTextFile(
      `tradeoff-${objective.codename.toLowerCase()}-mission-report.md`,
      buildMissionReportMarkdown(run),
      "text/markdown",
    );
    notify("Mission report downloaded", { detail: "Markdown includes budgets, findings and timeline.", tone: "success" });
  };

  const downloadJson = () => {
    downloadTextFile(
      `tradeoff-${objective.codename.toLowerCase()}-run.json`,
      buildMissionReportJson(run),
      "application/json",
    );
    notify("Run data exported", { detail: "Full telemetry and design state included.", tone: "success" });
  };

  const findings = [
    ...run.simulation.gaps.filter((gap) => gap !== "All primary science and engineering requirements were met."),
    ...compatibility.checks
      .filter((check) => check.status === "fail")
      .map((check) => `${check.label}: ${check.detail}`),
  ];

  return (
    <div className="screen report-screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">07 · Post-mission analysis</span>
          <h1>
            The mission is over. <em>The learning is not.</em>
          </h1>
          <p>
            {objective.codename} flight report. The board wants closure on science, engineering
            margins, budget, risk and the next design move. Everything below traces back to the
            design and the simulated telemetry.
          </p>
        </div>
        <div className="report-head__actions">
          <Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={downloadMarkdown}>
            Report .md
          </Button>
          <Button variant="ghost" size="sm" icon={<FileJson size={14} />} onClick={downloadJson}>
            Run .json
          </Button>
        </div>
      </header>

      <Panel
        className={`report-hero ${success ? "is-success" : "is-partial"}`}
        eyebrow={`${DATASET.status} dataset · ${fmtDate(run.createdAt)}`}
        title="Mission outcome"
        aside={
          <Badge tone={success ? "green" : "amber"} dot>
            {success ? "Primary objective met" : "Mission complete with gaps"}
          </Badge>
        }
      >
        <div className="report-hero__grid">
          <div className="report-hero__patch">
            <MissionPatch
              seed={run.patchSeed}
              body={run.body}
              codename={objective.codename}
              difficulty={difficulty.id}
              size={184}
            />
            <span className="report-hero__stamp">
              {success ? <BadgeCheck size={14} /> : <ShieldAlert size={14} />}
              {success ? "MISSION SUCCESS" : "PARTIAL SUCCESS"}
            </span>
          </div>
          <div className="report-hero__copy">
            <span className="eyebrow">{BODIES[run.body].name} · {objective.category}</span>
            <h2>{objective.name}</h2>
            <p>{run.simulation.endReason}</p>
            <div className="report-hero__meta">
              <span><Rocket size={13} /> {vehicle?.name ?? "No launcher"}</span>
              <span><Layers size={13} /> {orbit?.shortName ?? "No orbit"}</span>
              <span><Weight size={13} /> {fmtMass(totals.massKg)}</span>
              <span><CircleDollarSign size={13} /> {fmtMusd(run.costMusd)}</span>
            </div>
            <div className="report-hero__badges">
              <Badge tone="muted">{difficulty.label}</Badge>
              <Badge tone={run.score.rankEligible ? "green" : "amber"}>
                {run.score.rankEligible ? "Leaderboard eligible" : "Unranked run"}
              </Badge>
              {run.score.rankEligible && localRank > 0 ? (
                <Badge tone="cyan"><Trophy size={11} /> Local rank #{localRank}</Badge>
              ) : null}
            </div>
          </div>
          <div className="report-hero__score">
            <Gauge
              label="Final score"
              value={run.score.total}
              max={Math.max(110 * run.score.difficultyMultiplier, run.score.total, 1)}
              display={String(run.score.total)}
              sublabel={`×${run.score.difficultyMultiplier.toFixed(2)} difficulty`}
              tone={run.score.total > 0 ? "green" : "red"}
              size={168}
            />
            <span className={`report-grade report-grade--${grade.toLowerCase()}`}>
              <Award size={16} /> Grade {grade}
            </span>
            <small>Raw score {run.score.difficultyMultiplier > 0 ? Math.round(run.score.total / run.score.difficultyMultiplier) : 0} / 110</small>
          </div>
        </div>
      </Panel>

      <div className="report-grid">
        <Panel eyebrow="Science closure" title="Did the mission answer the question?">
          <div className="science-closure">
            <div className="science-closure__gauge">
              <Gauge
                label="Science target"
                value={run.simulation.scienceReturn}
                max={Math.max(run.simulation.scienceRequired, 1)}
                display={fmtPercent((run.simulation.scienceReturn / Math.max(run.simulation.scienceRequired, 1)) * 100, 0)}
                sublabel={`${run.simulation.scienceReturn.toLocaleString("en-US")} / ${run.simulation.scienceRequired.toLocaleString("en-US")} pts`}
                tone={run.simulation.scienceReturn >= run.simulation.scienceRequired ? "green" : "amber"}
                size={142}
              />
              <span className={success ? "is-good" : "is-warn"}>
                {success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {success ? "Science target met" : "Science target not met"}
              </span>
            </div>
            <div className="science-closure__copy">
              <h3>Brief intent</h3>
              <p>{objective.scienceGoal}</p>
              <ul className="criteria-list">
                {objective.successCriteria.map((criterion) => (
                  <li key={criterion}>
                    {success ? <Check size={12} /> : <X size={12} />}
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="report-stat-grid">
            <div>
              <span><Radio size={12} /> Data downlinked</span>
              <strong>{fmtData(run.simulation.dataDownlinkedGb)}</strong>
              <small>{fmtPercent(run.simulation.downlinkCoveragePct, 1)} coverage</small>
            </div>
            <div>
              <span><AlertTriangle size={12} /> Data lost</span>
              <strong>{fmtData(run.simulation.dataLostGb)}</strong>
              <small>{run.simulation.dataLostGb > 0 ? "buffer overflow" : "no loss"}</small>
            </div>
            <div>
              <span><BatteryCharging size={12} /> Min battery</span>
              <strong>{fmtPercent(run.simulation.minBatteryPct, 1)}</strong>
              <small>{run.simulation.powerDeficitHours > 0 ? `${run.simulation.powerDeficitHours} h deficit` : "no power deficit"}</small>
            </div>
            <div>
              <span><FlaskConical size={12} /> Science rate</span>
              <strong>{Math.round(totals.sciencePerDay)} pts/day</strong>
              <small>×{totals.scienceEfficiency.toFixed(2)} avionics</small>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Score audit" title="Where the points came from">
          <div className="score-audit">
            {scoreRows.map((row) => (
              <div key={row.label} className="score-row">
                <div>
                  <span>{row.label}</span>
                  <strong>{row.value.toFixed(1)} <em>/ {row.max}</em></strong>
                </div>
                <div className="score-row__track">
                  <span
                    className={`score-row__fill score-row__fill--${row.tone}`}
                    style={{ width: `${Math.min(100, (row.value / row.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="score-audit__total">
              <span>Base subtotal</span>
              <strong>
                {(run.score.science + run.score.cost + run.score.margins + run.score.successBonus).toFixed(1)}
              </strong>
            </div>
            <div className="score-audit__total">
              <span>Difficulty ×{run.score.difficultyMultiplier.toFixed(2)}</span>
              <strong>{run.score.total}</strong>
            </div>
            <p className="score-audit__note">
              Cost efficiency rewards budget headroom, not cheapness for its own sake. Margins
              reward mass, power and downlink reserve. The success bonus requires both a valid
              design and a completed science objective.
            </p>
          </div>
        </Panel>
      </div>

      <div className="report-grid report-grid--three">
        <Panel eyebrow="Engineering" title="Margins at end of mission">
          <div className="report-spec-list">
            <div><span>Power generation</span><strong>{fmtPower(totals.powerGenW)}</strong></div>
            <div><span>Power load</span><strong>{fmtPower(totals.powerUseW)}</strong></div>
            <div><span>Average power margin</span><strong>{fmtPercent(run.simulation.averagePowerMarginPct, 1)}</strong></div>
            <div><span>Average data margin</span><strong>{fmtPercent(run.simulation.averageDataMarginPct, 1)}</strong></div>
            <div><span>Pointing</span><strong>{fmtArcsec(totals.minPointingArcsec)}</strong></div>
            <div><span>Instrument slots</span><strong>{totals.instrumentSlotsUsed}/{totals.instrumentSlots}</strong></div>
            <div><span>Lifetime</span><strong>{fmtMonths(objective.requiredLifetimeMonths)}</strong></div>
            <div><span>Battery cycles</span><strong>{run.simulation.batteryCycles}</strong></div>
          </div>
        </Panel>

        <Panel eyebrow="Programme" title="Cost & budget closure">
          <div className="report-spec-list">
            <div><span>Spacecraft</span><strong>{fmtMusd(totals.spacecraftCostMusd)}</strong></div>
            <div><span>Launch</span><strong>{fmtMusd(vehicle?.costMusd ?? 0)}</strong></div>
            <div><span>Ground segment</span><strong>{fmtMusd(GROUND_SEGMENT_COST_MUSD)}</strong></div>
            <div><span>Total mission</span><strong>{fmtMusd(run.costMusd)}</strong></div>
            <div><span>Budget</span><strong>{Number.isFinite(budget) ? fmtMusd(budget) : "Unlimited"}</strong></div>
            <div><span>Budget status</span><strong className={run.costMusd > budget ? "is-warn" : "is-good"}>{run.costMusd > budget ? "Over" : "Within"}</strong></div>
            <div><span>MEL components</span><strong>{totals.componentCount}</strong></div>
            <div><span>Ranking</span><strong>{run.score.rankEligible ? "Eligible" : "Unranked"}</strong></div>
          </div>
        </Panel>

        <Panel eyebrow="Concept maturity" title="What this run proves">
          <div className="maturity-card">
            <span className="maturity-card__level">{maturity.short}</span>
            <h3>{maturity.label}</h3>
            <p>{maturity.description}</p>
            <div className="maturity-scale">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={maturity.level >= level ? "is-on" : ""}>
                  CML {level}
                </span>
              ))}
            </div>
            <small>
              Game adaptation of JPL's Concept Maturity Levels ({maturity.framework}). Not an
              official NASA assessment.
            </small>
          </div>
        </Panel>
      </div>

      <div className="report-grid">
        <Panel
          eyebrow="Findings"
          title={findings.length > 0 ? `${findings.length} post-mission finding${findings.length === 1 ? "" : "s"}` : "No open findings"}
          aside={<Badge tone={findings.length > 0 ? "amber" : "green"}>{findings.length > 0 ? "Iterate" : "Clean"}</Badge>}
        >
          {findings.length > 0 ? (
            <ul className="finding-list">
              {findings.map((finding, index) => (
                <li key={`${finding}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{finding}</strong>
                    <p>{recommendationFor(finding)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-note">
              <BadgeCheck size={18} />
              <p>
                The design met its science, engineering and programmatic gates. Try a harder
                difficulty or a leaner cost profile for the next run.
              </p>
            </div>
          )}
          <div className="recommendation-box">
            <Sparkles size={15} />
            <div>
              <strong>Next design move</strong>
              <p>{nextMove(run, compatibility.failures, objective.requiredLifetimeMonths)}</p>
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Flight timeline"
          title="Events worth reviewing"
          aside={<Badge tone="muted">{run.simulation.events.length} logged</Badge>}
        >
          <ul className="event-feed report-event-feed">
            {run.simulation.events
              .filter((event) => event.severity !== "info")
              .slice(-8)
              .reverse()
              .map((event, index) => (
                <li key={`${event.day}-${event.title}-${index}`} className={`event-feed__item is-${event.severity}`}>
                  <span className="event-feed__day">D+{String(event.day).padStart(3, "0")}</span>
                  <span className="event-feed__marker" aria-hidden="true" />
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                </li>
              ))}
            {run.simulation.events.filter((event) => event.severity !== "info").length === 0 ? (
              <li className="event-feed__empty">
                <CheckCircle2 size={16} /> No contingency events were logged.
              </li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <Panel eyebrow="Flight heritage" title={objective.analogue.name} className="analogue-panel">
        <div className="analogue-panel__body">
          <div>
            <span className="eyebrow">{objective.analogue.agency} reference mission</span>
            <p>{objective.analogue.note}</p>
            <a className="text-link" href={objective.analogue.url} target="_blank" rel="noreferrer">
              Open mission reference <ArrowRight size={12} />
            </a>
          </div>
          <div className="analogue-panel__caveat">
            <BookOpen size={16} />
            <p>
              Analogue missions are references for architecture and trade-offs, not a claim that
              this design is equivalent to a flight mission. Dataset {DATASET.version} remains{" "}
              {DATASET.status}.
            </p>
          </div>
        </div>
      </Panel>

      <div className="report-signoff">
        <div>
          <span className="eyebrow">Review board sign-off</span>
          <p>
            {success
              ? "Mission meets the primary science objective. Preserve the margin story and consider a harder programme next."
              : "Mission returned useful data but did not close the brief. Prioritise the highest-leverage finding, then re-fly."}
          </p>
        </div>
        <div className="report-signoff__stamp">
          <span>{success ? "FLIGHT REVIEWED" : "ITERATE"}</span>
          <small>{fmtDate(run.createdAt)} · {DATASET.version}</small>
        </div>
      </div>

      <div className="builder-footer">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => dispatch({ type: "load-design", design: run.design, step: "review" })}
        >
          Tune this design
        </Button>
        <div className="builder-footer__status">
          <span className="is-good">
            <FileText size={14} /> Report generated from deterministic telemetry · {run.simulation.daysSimulated} days
          </span>
        </div>
        <div className="report-footer__actions">
          <Button variant="ghost" icon={<Trophy size={15} />} onClick={() => dispatch({ type: "open-hangar" })}>
            Hangar
          </Button>
          <Button variant="primary" icon={<RefreshCw size={15} />} onClick={() => dispatch({ type: "reset" })}>
            New mission
          </Button>
        </div>
      </div>
      <span className="report-disclaimer">
        <GaugeIcon size={12} /> TRADEOFF is an independent prototype, not an official NASA product.
        Values are gameplay-balanced estimates. Source materials and NASA references are listed in
        the dataset status panel.
      </span>
    </div>
  );
}

function recommendationFor(finding: string): string {
  const lower = finding.toLowerCase();
  if (lower.includes("data") && (lower.includes("lost") || lower.includes("overflow"))) {
    return "Increase onboard storage, add downlink capacity, or choose an orbit with longer comms passes. The buffer must survive the gap between passes.";
  }
  if (lower.includes("power") || lower.includes("battery")) {
    return "Reduce continuous load, add generation, or increase usable battery energy. Recheck the eclipse duration and the difficulty margin.";
  }
  if (lower.includes("science")) {
    return "Increase payload science yield, extend mission life, or improve downlink closure so more of the generated science reaches the ground.";
  }
  if (lower.includes("coverage")) {
    return "Trade to an orbit with more target coverage, even if it costs power or downlink. Coverage is a geometry constraint, not a budget line.";
  }
  if (lower.includes("mass") || lower.includes("fairing")) {
    return "Remove low-value mass, choose a roomier launch vehicle, or move to a smaller bus. Do not fix a mass problem by spending only budget.";
  }
  return "Trace this finding back to the subsystem that owns it, change one variable at a time, and re-run the review before flying again.";
}

function nextMove(run: MissionRun, failures: number, requiredMonths: number): string {
  if (failures > 0) {
    return `Close the ${failures} compatibility finding${failures === 1 ? "" : "s"} first. A cleaner design is worth more than a higher science number.`;
  }
  if (!run.simulation.success) {
    return `The design closes on paper but not in flight. Revisit the largest simulated gap, then re-run the mission before touching the launch vehicle.`;
  }
  if (run.score.rankEligible) {
    return `Try a leaner architecture or a harder difficulty. Preserve the ${fmtMonths(requiredMonths)} lifetime margin while reducing cost and excess capacity.`;
  }
  return "This run is unranked. Resolve the open findings or leave sandbox mode to compare on the local leaderboard.";
}
