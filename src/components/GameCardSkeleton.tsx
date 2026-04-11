export function GameCardSkeleton() {
  return (
    <div className="bg-card rounded-[24px] border-2 border-border flex flex-col w-full overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-3 bg-muted/50 rounded w-16" />
              <div className="h-3 bg-muted/50 rounded w-12" />
            </div>
          </div>
        </div>
        <div className="w-20 h-8 bg-muted rounded-xl" />
      </div>

      {/* Stats Divider Skeleton */}
      <div className="mx-5 border-t border-border/50" />

      {/* Footer Stats Skeleton */}
      <div className="bg-muted/30 grid grid-cols-4 gap-1 p-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex flex-col items-center gap-1.5 ${i > 1 ? 'border-l border-border/50' : ''}`}>
            <div className="h-2 bg-muted rounded w-10" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
