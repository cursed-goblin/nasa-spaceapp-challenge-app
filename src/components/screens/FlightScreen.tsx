import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Clock,
  Database,
  FastForward,
  FileText,
  FlaskConical,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SkipForward,
  Sun,
  Zap,
} from "lucide-react";
import type { MissionEvent } from "../../data/types";
import { getOrbit } from "../../engine/design";
import {
  fmtData,
  fmtEnergy,
  fmtPower,
} from "../../engine/format";
import { useGame } from "../../state/GameContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Gauge } from "../ui/Gauge";
import { LineChart } from "../ui/LineChart";
import { Panel } from "../ui/Panel";
import { FlightTrack } from "../visuals/FlightTrack";

const SPEEDS = [1, 4, 10];

export function FlightScreen() {
  const { state, dispatch } = useGame();
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(4);
  const [index, setIndex] = useState(0);
  const simulation = state.simulation;
  const daily = simulation?.daily ?? [];
  const lastIndex = Math.max(0, daily.length - 1);

  useEffect(() => {
    setIndex(0);
    setPlaying(Boolean(simulation));
  }, [simulation]);

  useEffect(() => {
    if (!playing || !simulation || lastIndex <= 0) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => Math.min(lastIndex, current + speed));
    }, 130);
    return () => window.clearInterval(timer);
  }, [playing, speed, lastIndex, simulation]);

  useEffect(() => {
    if (index >= lastIndex && playing) setPlaying(false);
  }, [index, lastIndex, playing]);

  const activeDaily = daily[Math.min(index, lastIndex)];
  const activeDay = activeDaily?.day ?? 0;
  const orbit = getOrbit(state.design.orbitId);
  const progress = lastIndex > 0 ? index / lastIndex : 0;
  const complete = lastIndex > 0 && index >= lastIndex;
  const activeEvents = simulation
    ? simulation.events.filter((event) => event.day <= activeDay).slice(-12).reverse()
    : [];
  const latestEvent = activeEvents[0];
  const alert =
    Boolean(activeDaily && (activeDaily.batteryPct < 20 || activeDaily.powerDeficitWh > 0)) ||
    latestEvent?.severity === "critical";
  const scienceProgress =
    simulation && simulation.scienceRequired > 0
      ? Math.min(100, (activeDaily?.science ?? 0) / simulation.scienceRequired * 100)
      : 0;
  const scienceMax = simulation
    ? Math.max(simulation.scienceRequired, ...daily.map((item) => item.science), 1)
    : 1;
  const cumulative = daily.slice(0, index + 1).reduce(
    (acc, item) => ({
      downlinked: acc.downlinked + item.dataDownlinkedGb,
      lost: acc.lost + item.dataLostGb,
      deficitWh: acc.deficitWh + item.powerDeficitWh,
    }),
    { downlinked: 0, lost: 0, deficitWh: 0 },
  );

  if (!simulation || !orbit || !state.run) {
    return (
      <div className="screen empty-state">
        <Play size={42} />
        <h1>No flight plan loaded</h1>
        <p>Review a design and run the mission simulation to open the flight deck.</p>
        <Button variant="primary" onClick={() => dispatch({ type: "set-step", step: "review" })}>
          Go to design review
        </Button>
      </div>
    );
  }

  return (
    <div className="screen flight-screen">
      <header className="screen-head">
        <div>
          <span className="eyebrow">06 · Mission simulation</span>
          <h1>
            Fly the consequence. <em>Watch the margins move.</em>
          </h1>
          <p>
            Deterministic telemetry replay for {simulation.durationDays} days in {orbit.shortName}.
            Power, eclipse, storage, downlink and science evolve together. Replay is not a
            substitute for a flight dynamics product.
          </p>
        </div>
        <div className="screen-head__meta">
          <Badge tone={complete ? (simulation.success ? "green" : "amber") : "cyan"} dot>
            {complete
              ? simulation.success
                ? "Mission success"
                : "Mission complete · gaps"
              : playing
                ? "Telemetry live"
                : "Replay paused"}
          </Badge>
          <Badge tone="muted">
            <Clock size={11} /> Day {activeDay} / {simulation.durationDays}
          </Badge>
        </div>
      </header>

      <div className="flight-layout">
        <Panel
          className="flight-visual-panel"
          eyebrow="Spacecraft state vector"
          title={`${orbit.shortName} · day ${activeDay}`}
          aside={<Badge tone={alert ? "red" : complete ? "green" : "cyan"}>{alert ? "Contingency" : complete ? "Complete" : "Nominal"}</Badge>}
        >
          <FlightTrack
            body={state.run.body}
            orbit={orbit}
            progress={progress}
            day={activeDay}
            alert={alert}
            complete={complete}
          />

          <div className="flight-transport">
            <div className="flight-transport__buttons">
              <button
                type="button"
                className="transport-btn transport-btn--primary"
                onClick={() => {
                  if (complete) {
                    setIndex(0);
                    setPlaying(true);
                  } else {
                    setPlaying((current) => !current);
                  }
                }}
                aria-label={playing ? "Pause simulation" : complete ? "Replay simulation" : "Play simulation"}
              >
                {playing ? <Pause size={17} /> : complete ? <RotateCcw size={17} /> : <Play size={17} />}
              </button>
              <button
                type="button"
                className="transport-btn"
                onClick={() => {
                  setIndex(0);
                  setPlaying(true);
                }}
                aria-label="Restart replay"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="transport-btn"
                onClick={() => {
                  setIndex(lastIndex);
                  setPlaying(false);
                }}
                aria-label="Skip to end"
              >
                <SkipForward size={15} />
              </button>
            </div>
            <div className="flight-scrubber">
              <input
                type="range"
                min={0}
                max={lastIndex}
                value={Math.min(index, lastIndex)}
                onChange={(event) => {
                  setIndex(Number(event.target.value));
                  setPlaying(false);
                }}
                aria-label="Mission day scrubber"
                style={{ ["--progress" as string]: `${progress * 100}%` }}
              />
              <div className="flight-scrubber__events" aria-hidden="true">
                {simulation.events
                  .filter((event) => event.severity !== "info")
                  .map((event, eventIndex) => (
                    <span
                      key={`${event.day}-${eventIndex}`}
                      className={`flight-scrubber__marker is-${event.severity}`}
                      style={{ left: `${(event.day / Math.max(simulation.durationDays, 1)) * 100}%` }}
                    />
                  ))}
              </div>
              <div className="flight-scrubber__labels">
                <span>D+0</span>
                <span>D+{Math.round(simulation.durationDays / 2)}</span>
                <span>D+{simulation.durationDays}</span>
              </div>
            </div>
            <div className="flight-speed">
              <FastForward size={14} />
              {SPEEDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={speed === value ? "is-active" : ""}
                  onClick={() => setSpeed(value)}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flight-telemetry">
          <Panel eyebrow="Live telemetry" title="State of charge & science">
            <div className="flight-gauges">
              <Gauge
                label="Battery"
                value={activeDaily?.batteryPct ?? 0}
                display={`${Math.round(activeDaily?.batteryPct ?? 0)}%`}
                sublabel={activeDaily && activeDaily.batteryPct < 20 ? "Reserve low" : "State of charge"}
                tone={
                  (activeDaily?.batteryPct ?? 0) < 20
                    ? "red"
                    : (activeDaily?.batteryPct ?? 0) < 40
                      ? "amber"
                      : "green"
                }
                size={132}
              />
              <Gauge
                label="Science"
                value={scienceProgress}
                display={`${Math.round(scienceProgress)}%`}
                sublabel={`${Math.round(activeDaily?.science ?? 0).toLocaleString("en-US")} / ${Math.round(simulation.scienceRequired).toLocaleString("en-US")}`}
                tone={scienceProgress >= 100 ? "green" : "cyan"}
                size={132}
              />
            </div>
            <div className="flight-stat-grid">
              <div>
                <span><BatteryCharging size={12} /> Solar input</span>
                <strong>{fmtPower(activeDaily?.solarW ?? 0)}</strong>
              </div>
              <div>
                <span><Zap size={12} /> Load</span>
                <strong>{fmtPower(activeDaily?.loadW ?? 0)}</strong>
              </div>
              <div>
                <span><Database size={12} /> Buffer</span>
                <strong>{fmtData(activeDaily?.bufferGb ?? 0)}</strong>
              </div>
              <div>
                <span><Radio size={12} /> Downlink</span>
                <strong>{fmtData(activeDaily?.dataDownlinkedGb ?? 0)}</strong>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Cumulative" title="Mission totals">
            <div className="mission-totals">
              <div>
                <span>Science returned</span>
                <strong>{Math.round(activeDaily?.science ?? 0).toLocaleString("en-US")}</strong>
                <small>of {simulation.scienceRequired.toLocaleString("en-US")} target</small>
              </div>
              <div>
                <span>Data downlinked</span>
                <strong>{fmtData(cumulative.downlinked)}</strong>
                <small>cumulative to date</small>
              </div>
              <div>
                <span>Data lost</span>
                <strong className={cumulative.lost > 0 ? "is-warn" : ""}>
                  {fmtData(cumulative.lost)}
                </strong>
                <small>buffer overflow</small>
              </div>
              <div>
                <span>Power deficit</span>
                <strong className={cumulative.deficitWh > 0 ? "is-warn" : ""}>
                  {fmtEnergy(cumulative.deficitWh)}
                </strong>
                <small>unmet load</small>
              </div>
            </div>
            <div className="flight-progress-bars">
              <div>
                <span>Science closure</span>
                <div><i style={{ width: `${scienceProgress}%` }} /></div>
              </div>
              <div>
                <span>Downlink coverage</span>
                <div>
                  <i
                    style={{
                      width: `${Math.min(100, simulation.downlinkCoveragePct)}%`,
                      background: simulation.downlinkCoveragePct < 95 ? "#ffcc7a" : undefined,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className={`flight-status ${alert ? "is-alert" : complete ? "is-complete" : ""}`}>
              {alert ? <AlertTriangle size={16} /> : complete ? <CheckCircle2 size={16} /> : <Activity size={16} />}
              <div>
                <strong>{latestEvent?.title ?? "Housekeeping nominal"}</strong>
                <span>{latestEvent?.detail ?? "All subsystems within expected ranges."}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="flight-charts">
        <Panel eyebrow="Replay trace" title="Battery & science">
          <div className="flight-chart-grid">
            <div>
              <div className="chart-title"><BatteryCharging size={13} /> State of charge (%)</div>
              <LineChart
                series={[{ label: "Battery", values: daily.map((item) => item.batteryPct), color: "#9fffc4" }]}
                max={100}
                activeIndex={index}
                height={150}
              />
            </div>
            <div>
              <div className="chart-title"><FlaskConical size={13} /> Cumulative science (points)</div>
              <LineChart
                series={[{ label: "Science", values: daily.map((item) => item.science), color: "#ffb05c" }]}
                max={scienceMax}
                activeIndex={index}
                height={150}
              />
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Flight log"
          title={`${activeEvents.length} events to day ${activeDay}`}
          className="flight-log-panel"
          aside={<Badge tone={alert ? "red" : "muted"}>{alert ? "Action required" : "Nominal"}</Badge>}
        >
          <ul className="event-feed">
            {activeEvents.map((event, eventIndex) => (
              <FlightEvent key={`${event.day}-${event.title}-${eventIndex}`} event={event} />
            ))}
            {activeEvents.length === 0 ? (
              <li className="event-feed__empty">
                <Sun size={16} /> Telemetry is waiting for the first housekeeping report.
              </li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <div className="builder-footer">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => dispatch({ type: "set-step", step: "review" })}
        >
          Design review
        </Button>
        <div className="builder-footer__status">
          <span className={alert ? "is-warn" : "is-good"}>
            {alert ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {complete
              ? simulation.success
                ? "Primary objective met · ready for post-mission analysis"
                : "Mission ended with open gaps · review the analysis"
              : `Replaying day ${activeDay} · ${Math.round(progress * 100)}% of mission`}
          </span>
        </div>
        <Button
          variant="primary"
          trailing={<ArrowRight size={16} />}
          icon={<FileText size={15} />}
          onClick={() => dispatch({ type: "set-step", step: "report" })}
        >
          Open mission report
        </Button>
      </div>
    </div>
  );
}

function FlightEvent({ event }: { event: MissionEvent }) {
  return (
    <li className={`event-feed__item is-${event.severity}`}>
      <span className="event-feed__day">D+{String(event.day).padStart(3, "0")}</span>
      <span className="event-feed__marker" aria-hidden="true" />
      <div>
        <strong>{event.title}</strong>
        <span>{event.detail}</span>
      </div>
    </li>
  );
}
