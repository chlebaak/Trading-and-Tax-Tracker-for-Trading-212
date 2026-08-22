"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import CountUp from "./ui/CountUp";
import { formatCzk, formatShortCzk, signed } from "@/lib/format";

type Tab = "portfolio" | "tax";

export interface HeroStat {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger" | "warning" | "info";
}

interface CashBreakdown {
  available: number | null;
  inPies: number | null;
  reserved: number | null;
}

interface Props {
  accountValue: number;
  investmentsValue: number | null;
  cashTotal: number | null;
  cashBreakdown: CashBreakdown | null;
  totalPL: number;
  unrealizedPercent: number | null;
  realizedPL: number;
  realizedPercent: number | null;
  stats: HeroStat[];
  fetchedAt: string;
  cached: boolean;
  valueTestPercent: number;
  valueTestIsUnderLimit: boolean;
  isValueNearLimit: boolean;
  portfolioSection: ReactNode;
  taxSection: ReactNode;
}

const TONE_TEXT: Record<NonNullable<HeroStat["tone"]>, string> = {
  default: "text-slate-100",
  success: "text-teal-400",
  danger: "text-rose-400",
  warning: "text-amber-300",
  info: "text-cyan-400",
};

export default function DashboardShell({
  accountValue,
  investmentsValue,
  cashTotal,
  cashBreakdown,
  totalPL,
  unrealizedPercent,
  realizedPL,
  realizedPercent,
  stats,
  fetchedAt,
  cached,
  valueTestPercent,
  valueTestIsUnderLimit,
  isValueNearLimit,
  portfolioSection,
  taxSection,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");

  const barColor = !valueTestIsUnderLimit
    ? "bg-rose-400"
    : isValueNearLimit
      ? "bg-amber-400"
      : "bg-teal-400";

  return (
    <div className="relative min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05070f]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#05070f]/75">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/25">
              T2
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">T212 Dashboard</p>
              <p className="flex items-center gap-1.5 text-[11px] leading-tight text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    cached
                      ? "bg-slate-500"
                      : "animate-pulse bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]"
                  }`}
                />
                {cached ? "Z cache" : "Živě"} ·{" "}
                {new Date(fetchedAt).toLocaleString("cs-CZ", {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
            <TabButton
              active={activeTab === "portfolio"}
              onClick={() => setActiveTab("portfolio")}
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Portfolio"
            />
            <TabButton
              active={activeTab === "tax"}
              onClick={() => setActiveTab("tax")}
              icon={<Receipt className="h-4 w-4" />}
              label="Daně"
            />
          </div>

          <div className="ml-auto hidden items-center gap-2.5 md:flex">
            <span className="text-xs text-slate-500">Hodnotový test</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${Math.min(100, valueTestPercent)}%` }}
              />
            </div>
            <span className="w-9 text-right text-xs font-medium text-slate-400 tabular-nums">
              {Math.round(valueTestPercent)}%
            </span>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="card animate-rise overflow-hidden">
          <div className="flex flex-col gap-6 p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Hodnota účtu
                </p>
                <p className="mt-1.5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  <CountUp value={accountValue} format={formatCzk} />
                  <span className="ml-2 text-xl font-semibold text-slate-500 sm:text-2xl">
                    Kč
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <PLChip
                    label="nerealizovaný"
                    value={totalPL}
                    percent={unrealizedPercent}
                  />
                  <PLChip
                    label="realizovaný"
                    value={realizedPL}
                    percent={realizedPercent}
                  />
                </div>
              </div>

              {/* Stocks vs cash split */}
              {investmentsValue != null && cashTotal != null && (
                <AssetSplit
                  investmentsValue={investmentsValue}
                  cashTotal={cashTotal}
                  breakdown={cashBreakdown}
                />
              )}
            </div>

            {/* Secondary stats */}
            <div className="-mx-6 -mb-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-white/[0.06] px-6 pt-5 pb-6 sm:grid-cols-4 sm:-mx-7 sm:-mb-7 sm:px-7 sm:pb-7">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-1 text-base font-bold tracking-tight tabular-nums ${TONE_TEXT[stat.tone ?? "default"]}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tab content ──────────────────────────────────────── */}
        <div key={activeTab} className="animate-rise">
          {activeTab === "portfolio" ? portfolioSection : taxSection}
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-white/[0.08] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PLChip({
  label,
  value,
  percent,
}: {
  label: string;
  value: number;
  percent?: number | null;
}) {
  const positive = value >= 0;
  return (
    <span
      className="flex items-center gap-2"
      title={`${label} P/L: ${signed(value)}${formatCzk(Math.abs(value))} Kč`}
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${
          positive
            ? "bg-teal-500/10 text-teal-400 ring-teal-500/20"
            : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
        }`}
      >
        {positive ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        <span className="tabular-nums">
          {signed(value)}
          {formatShortCzk(Math.abs(value))}
        </span>
        {percent != null && (
          <span className="text-xs font-medium opacity-75 tabular-nums">
            · {signed(percent)}
            {Math.abs(percent).toFixed(1)} %
          </span>
        )}
      </span>
      <span className="text-xs font-normal text-slate-500">{label}</span>
    </span>
  );
}

function AssetSplit({
  investmentsValue,
  cashTotal,
  breakdown,
}: {
  investmentsValue: number;
  cashTotal: number;
  breakdown: CashBreakdown | null;
}) {
  const total = investmentsValue + cashTotal;
  if (total <= 0) return null;

  const invPct = (investmentsValue / total) * 100;
  const cashPct = (cashTotal / total) * 100;

  return (
    <div className="max-w-md min-w-56 flex-1">
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        Akcie vs hotovost
      </p>
      <div className="flex h-3.5 w-full gap-px overflow-hidden rounded-full bg-white/[0.05]">
        {invPct > 0 && (
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-700 first:rounded-l-full"
            style={{ width: `${Math.max(invPct, 1)}%` }}
            title={`Akcie · ${invPct.toFixed(1)} %`}
          />
        )}
        {cashPct > 0 && (
          <div
            className="h-full min-w-[3px] bg-slate-500/80 transition-all duration-700 last:rounded-r-full"
            style={{ width: `${Math.max(cashPct, 1)}%` }}
            title={`Hotovost · ${cashPct.toFixed(1)} %`}
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-teal-400" />
          Akcie{" "}
          <strong className="font-semibold text-slate-200 tabular-nums">
            {invPct.toFixed(0)} %
          </strong>{" "}
          <span className="text-slate-500 tabular-nums">
            {formatCzk(investmentsValue)} Kč
          </span>
        </span>
        <CashLabel
          cashPct={cashPct}
          cashTotal={cashTotal}
          breakdown={breakdown}
        />
      </div>
    </div>
  );
}

function CashLabel({
  cashPct,
  cashTotal,
  breakdown,
}: {
  cashPct: number;
  cashTotal: number;
  breakdown: CashBreakdown | null;
}) {
  const rows = breakdown
    ? (
        [
          ["Volná", breakdown.available],
          ["V piech", breakdown.inPies],
          ["Rezervovaná", breakdown.reserved],
        ] as [string, number | null][]
      ).filter((r): r is [string, number] => r[1] != null && r[1] > 0)
    : [];

  return (
    <span className="group relative flex items-center gap-1.5 text-slate-400">
      <span className="h-2 w-2 shrink-0 rounded-full bg-slate-500" />
      Hotovost{" "}
      <strong className="font-semibold text-slate-200 tabular-nums">
        {cashPct.toFixed(0)} %
      </strong>{" "}
      <span className="text-slate-500 tabular-nums">
        {formatCzk(cashTotal)} Kč
      </span>
      {rows.length > 0 && (
        <span className="pointer-events-none absolute right-0 bottom-full z-50 mb-2 hidden w-48 rounded-xl border border-white/10 bg-[#0d1322] p-3 shadow-xl shadow-black/40 group-hover:block">
          <span className="mb-1.5 block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Rozpad hotovosti
          </span>
          {rows.map(([label, v]) => (
            <span
              key={label}
              className="flex justify-between py-0.5 text-xs text-slate-400 tabular-nums"
            >
              <span>{label}</span>
              <span>{formatCzk(v)} Kč</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
