"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { NormalizedPosition } from "@/lib/trading212/types";
import { formatCzk } from "@/lib/format";

const COLORS = [
  "#22d3ee",
  "#2dd4bf",
  "#818cf8",
  "#fbbf24",
  "#f472b6",
  "#a3e635",
  "#38bdf8",
  "#c084fc",
  "#fb923c",
  "#34d399",
];
const REST_COLOR = "#334155";

interface Slice {
  ticker: string;
  name: string;
  value: number;
  percent: number;
  color: string;
}

function DonutTooltip({
  active,
  payload,
  accountCurrency,
}: {
  active?: boolean;
  payload?: { payload: Slice }[];
  accountCurrency: string;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1322] px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="font-semibold text-slate-200">{s.name}</p>
      <p className="mt-0.5 tabular-nums text-slate-400">
        {formatCzk(s.value)} {accountCurrency} · {s.percent.toFixed(1)} %
      </p>
    </div>
  );
}

export default function PortfolioAllocation({
  positions,
  accountCurrency,
}: {
  positions: NormalizedPosition[];
  accountCurrency: string;
}) {
  const { slices, totalValue } = useMemo(() => {
    const total = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0);
    if (total <= 0) return { slices: [] as Slice[], totalValue: 0 };

    const sorted = [...positions].sort(
      (a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0),
    );
    const threshold = total * 0.02;
    const main = sorted.filter((p) => (p.currentValue ?? 0) >= threshold);
    const rest = sorted.filter((p) => (p.currentValue ?? 0) < threshold);

    const result: Slice[] = main.map((p, i) => ({
      ticker: p.ticker,
      name: p.name ?? p.ticker,
      value: p.currentValue ?? 0,
      percent: ((p.currentValue ?? 0) / total) * 100,
      color: COLORS[i % COLORS.length],
    }));

    if (rest.length > 0) {
      const restValue = rest.reduce((s, p) => s + (p.currentValue ?? 0), 0);
      result.push({
        ticker: "__rest__",
        name: `Ostatní (${rest.length})`,
        value: restValue,
        percent: (restValue / total) * 100,
        color: REST_COLOR,
      });
    }

    return { slices: result, totalValue: total };
  }, [positions]);

  if (slices.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              cornerRadius={4}
              strokeWidth={0}
            >
              {slices.map((s) => (
                <Cell key={s.ticker} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              content={<DonutTooltip accountCurrency={accountCurrency} />}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white tabular-nums">
            {formatCzk(totalValue)}
          </span>
          <span className="text-[10px] tracking-wider text-slate-500 uppercase">
            {accountCurrency}
          </span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-1.5">
        {slices.slice(0, 10).map((s) => (
          <div
            key={s.ticker}
            className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-slate-400 group-hover:text-slate-300">
                {s.name}
              </span>
            </div>
            <span className="shrink-0 text-xs tabular-nums">
              <span className="font-semibold text-slate-200">
                {s.percent.toFixed(1)} %
              </span>
              <span className="ml-1.5 text-slate-600">
                {formatCzk(s.value)}
              </span>
            </span>
          </div>
        ))}
        {slices.length > 10 && (
          <p className="px-2 text-xs text-slate-600">
            +{slices.length - 10} dalších
          </p>
        )}
      </div>
    </div>
  );
}
