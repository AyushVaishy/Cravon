/** Shared animated bone — high-contrast sweep against dashboard bg */
const Bone = ({ className = "" }) => (
  <div className={`shimmer ${className}`} aria-hidden />
);

const SkeletonCard = () => (
  <div className="shimmer-block rounded-2xl overflow-hidden">
    <Bone className="w-full h-[160px]" />
    <div className="p-3.5 space-y-2.5">
      <Bone className="h-4 rounded-md w-3/4" />
      <Bone className="h-3 rounded-md w-1/2" />
      <div className="flex justify-between pt-1">
        <Bone className="h-4 w-12 rounded-md" />
        <Bone className="h-4 w-16 rounded-md" />
      </div>
    </div>
  </div>
);

/** Matches HomePage elevated restaurant grid cards */
export const ShimmerGridCard = () => (
  <div className="shimmer-block rounded-[22px] overflow-hidden" aria-hidden>
    <Bone className="w-full h-[158px]" />
    <div className="p-3.5 space-y-2.5">
      <Bone className="h-4 rounded-md w-4/5" />
      <Bone className="h-3 rounded-md w-1/2" />
      <Bone className="h-3 rounded-md w-3/5" />
      <div className="flex items-center justify-between pt-1">
        <Bone className="h-5 w-14 rounded-md" />
        <Bone className="h-3 w-20 rounded-md" />
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

/** Skeleton row of circular category images (no card box) */
export const ShimmerCategories = () => (
  <div className="flex gap-5 sm:gap-6 overflow-hidden pb-2" aria-hidden>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center min-w-[100px] sm:min-w-[112px]">
        <Bone className="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-full mb-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]" />
        <Bone className="h-3 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

/** Skeleton row of brand cards */
export const ShimmerBrands = () => (
  <div className="flex gap-3.5 sm:gap-4 overflow-hidden pb-2" aria-hidden>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="shimmer-block rounded-[22px] flex flex-col items-center min-w-[120px] sm:min-w-[132px] p-3.5">
        <Bone className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full mb-2.5" />
        <Bone className="h-3 w-20 rounded-full mb-1.5" />
        <Bone className="h-2.5 w-12 rounded-full" />
      </div>
    ))}
  </div>
);

/** Skeleton horizontal carousel of restaurant cards */
export const ShimmerCarousel = () => (
  <div className="flex gap-4 overflow-hidden pb-2" aria-hidden>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="shimmer-block rounded-[22px] overflow-hidden min-w-[240px] sm:min-w-[260px]">
        <Bone className="w-full h-[150px]" />
        <div className="p-3.5 space-y-2.5">
          <Bone className="h-4 rounded-md w-3/4" />
          <Bone className="h-3 rounded-md w-1/2" />
          <div className="flex justify-between pt-1">
            <Bone className="h-4 w-14 rounded-md" />
            <Bone className="h-4 w-20 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/** Promo banner shimmer */
export const ShimmerBanner = () => (
  <Bone className="w-full min-h-[180px] sm:min-h-[200px] rounded-[28px] shadow-[0_12px_36px_rgba(0,0,0,0.08)]" />
);

/** Popular dish card row shimmer */
export const ShimmerDishes = () => (
  <div className="flex gap-4 overflow-hidden pb-2" aria-hidden>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="shimmer-block rounded-[22px] min-w-[210px] sm:min-w-[228px] p-3.5">
        <Bone className="w-full h-40 rounded-2xl" />
        <Bone className="h-2.5 w-20 rounded mt-3.5" />
        <Bone className="h-3.5 w-28 rounded mt-2.5" />
        <Bone className="h-3 w-16 rounded mt-2" />
        <div className="flex justify-between mt-4">
          <Bone className="h-5 w-12 rounded" />
          <Bone className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

const Shimmer = () => {
  return (
    <div className="dashboard-home px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div>
        <Bone className="h-7 w-40 rounded-lg mb-4" />
        <ShimmerBanner />
      </div>
      <div>
        <Bone className="h-6 w-28 rounded-lg mb-2" />
        <Bone className="h-3 w-40 rounded-full mb-5" />
        <ShimmerCategories />
      </div>
      <div>
        <Bone className="h-6 w-36 rounded-lg mb-2" />
        <Bone className="h-3 w-48 rounded-full mb-5" />
        <ShimmerDishes />
      </div>
      <div>
        <Bone className="h-6 w-32 rounded-lg mb-5" />
        <ShimmerCarousel />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
};

export default Shimmer;
