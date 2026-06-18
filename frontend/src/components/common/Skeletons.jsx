export function ProfileSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Profile header skeleton */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="skeleton w-24 h-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-7 w-48 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-4 w-full max-w-md rounded" />
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-7 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RepoSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="flex gap-3">
            <div className="skeleton h-4 w-12 rounded-full" />
            <div className="skeleton h-4 w-12 rounded-full" />
            <div className="skeleton h-4 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }) {
  return (
    <div className="glass-card p-6">
      <div className="skeleton h-5 w-36 rounded mb-6" />
      <div className="skeleton rounded-xl" style={{ height }} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-8 w-16 rounded" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}
