"use client";

import type { NormalizedPosition } from "@/lib/trading212/types";

interface Props {
  positions: NormalizedPosition[];
  accountCurrency: string;
}

const COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
  "#a3e635",
  "#fb923c",
  "#c084fc",
  "#2dd4bf",
  "#fb7185",
  "#c4b5fd",
  "#38bdf8",
  "#e879f9",
];

function formatCzk(value: number): string {
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function PortfolioAllocation({
  positions,
  accountCurrency,
}: Props) {
  if (positions.length === 0) return null;

  const totalValue = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0);
  if (totalValue <= 0) return null;

  const sorted = [...positions].sort(
    (a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0),
  );

  const threshold = totalValue * 0.02;
  const main = sorted.filter((p) => (p.currentValue ?? 0) >= threshold);
  const rest = sorted.filter((p) => (p.currentValue ?? 0) < threshold);

  interface Slice {
    ticker: string;
    name: string;
    value: number;
    percent: number;
    color: string;
  }

  const slices: Slice[] = main.map((p, i) => ({
    ticker: p.ticker,
    name: p.name ?? p.ticker,
    value: p.currentValue ?? 0,
    percent: ((p.currentValue ?? 0) / totalValue) * 100,
    color: COLORS[i % COLORS.length],
  }));

  if (rest.length > 0) {
    const restValue = rest.reduce((s, p) => s + (p.currentValue ?? 0), 0);
    slices.push({
      ticker: "__rest__",
      name: `Ostatní (${rest.length})`,
      value: restValue,
      percent: (restValue / totalValue) * 100,
      color: "#334155",
    });
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 98;
  const innerR = 62;

  const paths = slices.reduce(
    (acc, slice) => {
      const angle = (slice.percent / 100) * 360;
      const startAngle = acc.lastAngle;
      const endAngle = startAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1o = +(cx + outerR * Math.cos(startRad)).toFixed(4);
      const y1o = +(cy + outerR * Math.sin(startRad)).toFixed(4);
      const x2o = +(cx + outerR * Math.cos(endRad)).toFixed(4);
      const y2o = +(cy + outerR * Math.sin(endRad)).toFixed(4);
      const x1i = +(cx + innerR * Math.cos(startRad)).toFixed(4);
      const y1i = +(cy + innerR * Math.sin(startRad)).toFixed(4);
      const x2i = +(cx + innerR * Math.cos(endRad)).toFixed(4);
      const y2i = +(cy + innerR * Math.sin(endRad)).toFixed(4);

      const largeArc = angle > 180 ? 1 : 0;

      const d = [
        `M ${x1o} ${y1o}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x2i} ${y2i}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i}`,
        "Z",
      ].join(" ");

      acc.items.push({ ...slice, d });
      acc.lastAngle = endAngle;
      return acc;
    },
    { items: [] as (Slice & { d: string })[], lastAngle: -90 },
  ).items;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-52 w-52 shrink-0"
        aria-label="Alokace portfolia"
      >
        {paths.map((slice) => (
          <path
            key={slice.ticker}
            d={slice.d}
            fill={slice.color}
            className="transition-all hover:opacity-80 hover:scale-[1.02] origin-center"
          >
            <title>{`${slice.name}: ${slice.percent.toFixed(1)}%`}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={innerR - 2} fill="#12121a" />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-slate-200 text-sm font-bold"
        >
          {formatCzk(totalValue)}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          {accountCurrency}
        </text>
      </svg>

      <div className="flex-1 space-y-2">
        {slices.slice(0, 10).map((slice) => (
          <div
            key={slice.ticker}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-slate-400">{slice.name}</span>
            </div>
            <span className="shrink-0 text-xs tabular-nums">
              <span className="text-slate-300 font-medium">
                {slice.percent.toFixed(1)}%
              </span>
              <span className="text-slate-600 ml-1">
                {formatCzk(slice.value)}
              </span>
            </span>
          </div>
        ))}
        {slices.length > 10 && (
          <p className="text-xs text-slate-600">
            +{slices.length - 10} dalších
          </p>
        )}
      </div>
    </div>
  );
}
