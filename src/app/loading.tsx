export default function Loading() {
  return (
    <div className="relative min-h-screen bg-[#05070f]">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05070f]/85">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="hidden space-y-1.5 sm:block">
            <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-20 animate-pulse rounded bg-white/[0.03]" />
          </div>
          <div className="flex gap-1">
            <div className="h-9 w-28 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-9 w-24 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-11 w-64 animate-pulse rounded-lg bg-white/[0.07]" />
              <div className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
            </div>
            <div className="w-full max-w-md space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.05]" />
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-white/[0.05]" />
                <div className="h-5 w-16 animate-pulse rounded bg-white/[0.07]" />
              </div>
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          <div className="h-96 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
        </div>
      </div>
    </div>
  );
}
