export default function BillingPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Current Plan Skeleton */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-green-500/20" />
          <div className="h-5 w-48 rounded bg-current opacity-10" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-current opacity-10" />
            <div className="h-7 w-16 rounded bg-current opacity-10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-current opacity-10" />
            <div className="h-7 w-16 rounded bg-current opacity-10" />
          </div>
        </div>
      </div>

      {/* Upgrade Options Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-40 rounded bg-current opacity-10" />
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20" />
                <div className="space-y-2">
                  <div className="h-5 w-24 rounded bg-current opacity-10" />
                  <div className="h-3 w-40 rounded bg-current opacity-10" />
                  <div className="h-6 w-20 rounded bg-current opacity-10" />
                </div>
              </div>
              <div className="h-9 w-32 rounded bg-purple-500/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
