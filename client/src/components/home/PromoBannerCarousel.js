import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPromoBanners } from "../../services/discoveryService";

const BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=480&h=480&fit=crop",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&h=480&fit=crop",
  "https://images.unsplash.com/photo-1563379091339-3b21bbd4c4e3?w=480&h=480&fit=crop",
];

const FALLBACK_BANNERS = [
  {
    id: "welcome50",
    title: "Get Discount Voucher Up To 50%",
    subtitle: "Welcome offer — up to ₹100 off on your first order",
    cta: "Order now",
    searchQuery: "Biryani",
    imageUrl: BANNER_IMAGES[0],
  },
  {
    id: "freedel",
    title: "Free Delivery This Week",
    subtitle: "On orders above ₹199 near you",
    cta: "Explore",
    searchQuery: "Pizza",
    imageUrl: BANNER_IMAGES[1],
  },
];

const PromoBannerCarousel = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [active, setActive] = useState(0);

  useEffect(() => {
    getPromoBanners()
      .then((res) => {
        if (res.data.banners?.length) {
          setBanners(
            res.data.banners.map((b, i) => ({
              ...b,
              title: b.title || "Special offer",
              subtitle: b.subtitle || "",
              imageUrl: b.imageUrl || BANNER_IMAGES[i % BANNER_IMAGES.length],
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners.length]);

  const banner = banners[active];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          navigate(`/home/search?q=${encodeURIComponent(banner.searchQuery || "Biryani")}`)
        }
        className="w-full text-left rounded-[28px] min-h-[180px] sm:min-h-[200px] overflow-hidden relative shadow-[0_14px_44px_-10px_var(--shadow-soft)] hover:shadow-[0_18px_52px_-8px_var(--shadow-soft)] hover:-translate-y-0.5 transition-all duration-300 group"
        style={{
          background:
            "linear-gradient(118deg, var(--color-primary) 0%, var(--color-primary-hover) 42%, #FFB06A 100%)",
        }}
      >
        <div className="promo-pattern absolute inset-0 pointer-events-none" />

        {/* Layered circles */}
        <div className="absolute -right-10 -top-14 w-56 h-56 rounded-full bg-white/15" />
        <div className="absolute right-24 -bottom-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-[38%] top-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-[22px] border-white/10 hidden md:block" />
        <div className="absolute left-[42%] -bottom-8 w-24 h-24 rounded-full bg-black/5" />

        <div className="relative z-10 flex items-center justify-between gap-4 p-6 sm:p-8 pr-4 sm:pr-6">
          <div className="max-w-[58%] sm:max-w-md min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 mb-2">
              {banner.seasonal ? banner.festival || "Festival offer" : "Limited time"}
            </p>
            <h3 className="font-display text-xl sm:text-3xl lg:text-[2.15rem] font-extrabold text-white leading-[1.15] mb-2 drop-shadow-sm">
              {banner.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/90 max-w-sm mb-5 leading-relaxed line-clamp-2">
              {banner.subtitle}
            </p>
            <span className="inline-flex items-center gap-2 bg-white text-foreground text-sm font-bold px-6 py-3 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.12)] group-hover:scale-[1.04] transition-transform">
              {banner.cta || "Explore"}
              <span className="text-primary">→</span>
            </span>
          </div>

          {/* Food visual */}
          <div className="relative shrink-0 w-[118px] h-[118px] sm:w-[150px] sm:h-[150px] lg:w-[168px] lg:h-[168px] mr-1 sm:mr-3">
            <div className="absolute inset-3 rounded-full bg-white/20 blur-sm" />
            <div className="absolute inset-0 rounded-full overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.22)] ring-4 ring-white/25 group-hover:scale-105 transition-transform duration-500">
              <img
                src={banner.imageUrl || BANNER_IMAGES[0]}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = BANNER_IMAGES[0];
                }}
              />
            </div>
            <div className="absolute -bottom-1 -left-2 w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm border border-white/40" />
          </div>
        </div>
      </button>

      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-7 bg-primary shadow-soft" : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBannerCarousel;
