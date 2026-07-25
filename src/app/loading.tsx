export default function Loading() {
  return (
    <div className="relative min-h-screen bg-[#060914]">
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#070b16]/90">
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]"
            />
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
          <div className="h-96 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
        </div>
      </div>
    </div>
  );
}
