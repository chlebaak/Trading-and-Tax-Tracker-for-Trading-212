"use client";

import { CheckCircle2, TriangleAlert, OctagonX } from "lucide-react";
import InfoTooltip from "./ui/InfoTooltip";
import { formatCzk } from "@/lib/format";

interface Props {
  year: number;
  totalSold: number;
  limit: number;
  isUnderLimit: boolean;
  isNearLimit: boolean;
  taxableQuantity: number;
  estimatedSavingsCzk: number;
}

const SECTION4_EXPLANATION =
  "Podle §4 zákona o daních z příjmů je výnos z prodeje cenných papírů osvobozen od daně, pokud celková cena prodejů v roce nepřesáhne 100 000 Kč (hodnotový test), nebo pokud jste cenné papíry drželi déle než 3 roky (časový test).";

type State = "ok" | "warning" | "danger";

export default function TaxVerdict({
  year,
  totalSold,
  limit,
  isUnderLimit,
  isNearLimit,
  taxableQuantity,
  estimatedSavingsCzk,
}: Props) {
  const state: State = !isUnderLimit
    ? "danger"
    : isNearLimit
      ? "warning"
      : "ok";

  const config = {
    ok: {
      icon: <CheckCircle2 className="h-6 w-6 text-teal-400" />,
      ring: "ring-teal-500/20",
      bg: "bg-teal-500/[0.05]",
      title: `V roce ${year} pravděpodobně neplatíte daň z prodeje`,
    },
    warning: {
      icon: <TriangleAlert className="h-6 w-6 text-amber-400" />,
      ring: "ring-amber-500/25",
      bg: "bg-amber-500/[0.05]",
      title: `Blízko ročního limitu — další prodeje mohou být zdaněné`,
    },
    danger: {
      icon: <OctagonX className="h-6 w-6 text-rose-400" />,
      ring: "ring-rose-500/25",
      bg: "bg-rose-500/[0.06]",
      title: `Hodnotový test pro rok ${year} překročen`,
    },
  }[state];

  return (
    <div className={`card ${config.bg} flex gap-4 p-5 ring-1 ${config.ring}`}>
      <div className="shrink-0 pt-0.5">{config.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-slate-100">
            {config.title}
          </p>
          <InfoTooltip text={SECTION4_EXPLANATION} />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {state === "danger" ? (
            <>
              Prodáno za{" "}
              <strong className="text-slate-200 tabular-nums">
                {formatCzk(totalSold)} Kč
              </strong>{" "}
              — nad limit {formatCzk(limit)} Kč podléhá zisk dani 15 %. Zvažte
              další prodeje až po Novém roce.
            </>
          ) : state === "warning" ? (
            <>
              Prodáno za{" "}
              <strong className="text-slate-200 tabular-nums">
                {formatCzk(totalSold)} Kč
              </strong>{" "}
              z limitu {formatCzk(limit)} Kč. Zbývá vám{" "}
              <strong className="text-amber-300 tabular-nums">
                {formatCzk(limit - totalSold)} Kč
              </strong>{" "}
              bez zdanění.
            </>
          ) : (
            <>
              Prodáno jen za{" "}
              <strong className="text-slate-200 tabular-nums">
                {formatCzk(totalSold)} Kč
              </strong>{" "}
              ze zákonného limitu {formatCzk(limit)} Kč.
              {taxableQuantity > 0 &&
                estimatedSavingsCzk > 0 && (
                  <>
                    {" "}
                    Čekáním na časový test u{" "}
                    <strong className="text-slate-200 tabular-nums">
                      {taxableQuantity} ks
                    </strong>{" "}
                    šetříte odhadem{" "}
                    <strong className="text-teal-300 tabular-nums">
                      {formatCzk(estimatedSavingsCzk)} Kč
                    </strong>{" "}
                    na dani.
                  </>
                )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
