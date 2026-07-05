const SkeletonCard = () => (
  <div className="bg-card rounded-xl shadow overflow-hidden animate-pulse">
    <div className="w-full h-[160px] bg-muted" />
    <div className="p-3">
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2 mb-3" />
      <div className="flex justify-between">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
    </div>
  </div>
);

/** Matches HomePage GlassGridCard layout */
export const ShimmerGridCard = () => (
  <div className="glass-card rounded-2xl overflow-hidden animate-pulse" aria-hidden>
    <div className="w-full h-[150px] bg-muted/80" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-muted rounded-md w-4/5" />
      <div className="h-3 bg-muted rounded-md w-1/2" />
      <div className="h-3 bg-muted rounded-md w-3/5" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 w-14 bg-muted rounded-md" />
        <div className="h-3 w-20 bg-muted rounded-md" />
      </div>
    </div>
  </div>
);

/** Row of grid card shimmers for infinite scroll / load-more */
export const ShimmerGridCards = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <ShimmerGridCard key={`shimmer-${i}`} />
    ))}
  </>
);

/** Skeleton row of circular category cards */
export const ShimmerCategories = () => (
  <div className="flex gap-6 sm:gap-10 overflow-hidden pb-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center min-w-[90px] sm:min-w-[110px] animate-pulse">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted mb-3" />
        <div className="h-3 w-16 bg-muted rounded-full" />
      </div>
    ))}
  </div>
);

/** Skeleton row of circular brand cards */
export const ShimmerBrands = () => (
  <div className="flex gap-5 overflow-hidden pb-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center min-w-[110px] sm:min-w-[130px] animate-pulse">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-muted mb-3 shadow" />
        <div className="h-3 w-20 bg-muted rounded-full mb-1.5" />
        <div className="h-2.5 w-12 bg-muted rounded-full" />
      </div>
    ))}
  </div>
);

/** Skeleton horizontal carousel of restaurant cards */
export const ShimmerCarousel = () => (
  <div className="flex gap-4 overflow-hidden pb-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="min-w-[240px] sm:min-w-[260px] animate-pulse">
        <div className="bg-card rounded-xl shadow overflow-hidden">
          <div className="w-full h-[150px] bg-muted" />
          <div className="p-3">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Shimmer = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-8 mt-[70px]">
      {/* Categories skeleton */}
      <div className="mb-8">
        <div className="h-7 w-56 bg-muted rounded-lg animate-pulse mb-5" />
        <ShimmerCategories />
      </div>
      {/* Brands skeleton */}
      <div className="mb-8">
        <div className="h-7 w-48 bg-muted rounded-lg animate-pulse mb-5" />
        <ShimmerBrands />
      </div>
      {/* Grid skeleton */}
      <div className="h-7 w-64 bg-muted rounded-lg animate-pulse mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
};

export default Shimmer;
