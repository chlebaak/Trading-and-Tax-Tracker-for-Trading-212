"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface Props {
  text: string;
  className?: string;
}

/** CSS-positioned hover/focus tooltip with an info icon trigger. */
export default function InfoTooltip({ text, className = "" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Více informací"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="text-slate-600 transition-colors hover:text-slate-400"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0d1322] p-3 text-xs leading-relaxed font-normal text-slate-300 shadow-xl shadow-black/40">
          {text}
          <span className="absolute top-full left-1/2 -mt-[5px] -translate-x-1/2 border-[5px] border-transparent border-t-[#0d1322]" />
        </span>
      )}
    </span>
  );
}
