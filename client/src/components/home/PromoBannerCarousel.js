import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPromoBanners } from "../../services/discoveryService";

const FALLBACK_BANNERS = [
  {
    id: "welcome50",
    title: "WELCOME50",
    subtitle: "50% off up to ₹100 on first order",
    cta: "Order now",
    gradient: "from-orange-500 to-red-500",
    searchQuery: "Biryani",
  },
  {
    id: "freedel",
    title: "Free Delivery",
    subtitle: "On orders above ₹199 this week",
    cta: "Explore",
    gradient: "from-emerald-500 to-teal-600",
    searchQuery: "Pizza",
  },
];

const PromoBannerCarousel = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [active, setActive] = useState(0);

  useEffect(() => {
    getPromoBanners()
      .then((res) => {
        if (res.data.banners?.length) setBanners(res.data.banners);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const banner = banners[active];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => navigate(`/home/search?q=${encodeURIComponent(banner.searchQuery || "Biryani")}`)}
        className={`w-full text-left rounded-3xl p-6 sm:p-8 bg-gradient-to-r ${banner.gradient} text-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative min-h-[140px]`}
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-white/5" />
        <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1">Limited time</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold mb-1">{banner.title}</h3>
        <p className="text-sm text-white/90 max-w-md mb-4">{banner.subtitle}</p>
        <span className="inline-block bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full">
          {banner.cta || "Explore"} →
        </span>
      </button>
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBannerCarousel;
