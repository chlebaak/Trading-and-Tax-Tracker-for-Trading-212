"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/5 bg-[#12121a] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
          <svg
            className="h-8 w-8 text-rose-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-100">
          Načtení selhalo
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Portfolio data se nepodařilo načíst. Trading 212 API může být
          nedostupné nebo došlo k chybě připojení.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-slate-600">
            ID chyby: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/15"
        >
          Zkusit znovu
        </button>
      </div>
    </main>
  );
}
