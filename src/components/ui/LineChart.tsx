import { useId, useMemo } from "react";
import { hashString } from "../../engine/math";

export interface ChartSeries {
  label: string;
  values: number[];
  color: string;
  dashed?: boolean;
}

interface LineChartProps {
  series: ChartSeries[];
  max?: number;
  height?: number;
  activeIndex?: number;
  unit?: string;
  yTicks?: number;
  className?: string;
}

export function LineChart({
  series,
  max,
  height = 150,
  activeIndex,
  unit = "",
  yTicks = 4,
  className = "",
}: LineChartProps) {
  const gradientId = useId().replaceAll(":", "");
  const pointCount = Math.max(...series.map((item) => item.values.length), 1);
  const resolvedMax = useMemo(() => {
    if (max && max > 0) return max;
    const all = series.flatMap((item) => item.values).filter(Number.isFinite);
    const peak = all.length ? Math.max(...all) : 1;
    return peak > 0 ? peak * 1.08 : 1;
  }, [max, series]);

  const paths = useMemo(() => {
    return series.map((item) => {
      const count = item.values.length;
      if (count === 0) return { ...item, path: "", area: "" };
      const points = item.values.map((value, index) => {
        const x = count === 1 ? 0 : (index / (count - 1)) * 1000;
        const y = 100 - Math.max(0, Math.min(1, value / resolvedMax)) * 94 - 2;
        return [x, y] as const;
      });
      const path = points
        .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
        .join(" ");
      const area = `${path} L1000,100 L0,100 Z`;
      return { ...item, path, area };
    });
  }, [series, resolvedMax]);

  const activeX =
    activeIndex !== undefined && pointCount > 1
      ? (Math.min(activeIndex, pointCount - 1) / (pointCount - 1)) * 1000
      : undefined;

  const ticks = Array.from({ length: yTicks + 1 }, (_, index) => {
    const value = (resolvedMax / yTicks) * index;
    return { value, y: 100 - (index / yTicks) * 94 - 2 };
  });

  return (
    <div className={`line-chart ${className}`.trim()}>
      <div className="line-chart__axis" aria-hidden="true">
        {[...ticks].reverse().map((tick) => (
          <span key={tick.value}>
            {formatAxis(tick.value)}
            {unit}
          </span>
        ))}
      </div>
      <div className="line-chart__plot" style={{ height }}>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" role="img" aria-label={series.map((item) => item.label).join(", ")}>
          <defs>
            <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series[0]?.color ?? "#6ce7ff"} stopOpacity="0.22" />
              <stop offset="100%" stopColor={series[0]?.color ?? "#6ce7ff"} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => (
            <line
              key={tick.y}
              x1="0"
              x2="1000"
              y1={tick.y}
              y2={tick.y}
              stroke="rgba(147, 183, 216, 0.11)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {paths.map((item, index) => (
            <g key={item.label}>
              {index === 0 ? (
                <path d={item.area} fill={`url(#fill-${gradientId})`} />
              ) : null}
              <path
                d={item.path}
                fill="none"
                stroke={item.color}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={item.dashed ? "5 4" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
          {activeX !== undefined ? (
            <g>
              <line
                x1={activeX}
                x2={activeX}
                y1="0"
                y2="100"
                stroke="rgba(232, 246, 255, 0.55)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              {paths.map((item) => {
                const count = item.values.length;
                if (count === 0 || activeIndex === undefined) return null;
                const index = Math.min(activeIndex, count - 1);
                const x = count === 1 ? 0 : (index / (count - 1)) * 1000;
                const value = item.values[index] ?? 0;
                const y = 100 - Math.max(0, Math.min(1, value / resolvedMax)) * 94 - 2;
                return (
                  <circle
                    key={`dot-${item.label}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={item.color}
                    stroke="#05080e"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          ) : null}
        </svg>
      </div>
      <div className="line-chart__legend">
        {series.map((item) => (
          <span key={item.label} className="line-chart__legend-item">
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatAxis(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(0);
  return value.toFixed(1);
}

export function chartColor(seed: string): string {
  const colors = ["#6ce7ff", "#ffb05c", "#9fffc4", "#ff8f9d", "#c3a7ff"];
  return colors[hashString(seed) % colors.length];
}
