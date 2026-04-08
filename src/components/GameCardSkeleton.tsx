export function GameCardSkeleton() {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 flex flex-col w-full overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-3 bg-gray-50 rounded w-16" />
              <div className="h-3 bg-gray-50 rounded w-12" />
            </div>
          </div>
        </div>
        <div className="w-20 h-8 bg-gray-100 rounded-xl" />
      </div>

      {/* Stats Divider Skeleton */}
      <div className="mx-5 border-t border-gray-50" />

      {/* Footer Stats Skeleton */}
      <div className="bg-gray-50/30 grid grid-cols-4 gap-1 p-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex flex-col items-center gap-1.5 ${i > 1 ? 'border-l border-gray-100' : ''}`}>
            <div className="h-2 bg-gray-100 rounded w-10" />
            <div className="h-3 bg-gray-100 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
