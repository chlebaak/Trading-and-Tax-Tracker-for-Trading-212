"use client";

import { useState, type ReactNode } from "react";

type Tab = "portfolio" | "tax";

interface Kpi {
  label: string;
  value: string;
  accent: "slate" | "emerald" | "rose" | "blue" | "amber";
}

interface Props {
  kpis: Kpi[];
  fetchedAt: string;
  cached: boolean;
  valueTestPercent: number;
  valueTestIsUnderLimit: boolean;
  isValueNearLimit: boolean;
  portfolioSection: ReactNode;
  taxSection: ReactNode;
}

export default function DashboardShell({
  kpis,
  fetchedAt,
  cached,
  valueTestPercent,
  valueTestIsUnderLimit,
  isValueNearLimit,
  portfolioSection,
  taxSection,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");

  const barColor = valueTestIsUnderLimit
    ? isValueNearLimit
      ? "bg-amber-400"
      : "bg-teal-400"
    : "bg-pink-400";

  return (
    <div className="relative min-h-screen bg-transparent text-slate-200">
      {/* Glass navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#070b16]/90 supports-[backdrop-filter]:bg-[#070b16]/90">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
              T2
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">T212 Dashboard</p>
              <p className="text-[11px] leading-tight text-slate-500">
                {cached ? "Z cache" : "Živě"} ·{" "}
                {new Date(fetchedAt).toLocaleString("cs-CZ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === "portfolio" ? "bg-white/[0.08] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
            >
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                  />
                </svg>
                Portfolio
              </span>
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === "tax" ? "bg-white/[0.08] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
            >
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Daně
              </span>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Hodnotový test
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-white/[0.06] sm:w-28">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${valueTestPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400">
              {Math.round(valueTestPercent)}%
            </span>
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Ribbon */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              accent={kpi.accent}
            />
          ))}
        </div>

        <div>{activeTab === "portfolio" ? portfolioSection : taxSection}</div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const c =
    {
      slate: "text-slate-100",
      emerald: "text-teal-400",
      rose: "text-pink-400",
      blue: "text-cyan-400",
      amber: "text-amber-300",
    }[accent] ?? "text-slate-100";

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] px-4 py-3.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.04]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1.5 text-lg font-bold tracking-tight ${c}`}>{value}</p>
    </div>
  );
}
