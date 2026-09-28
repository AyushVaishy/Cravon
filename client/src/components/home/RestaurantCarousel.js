import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaChevronLeft, FaChevronRight, FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { toggleFavourite, selectIsFavourite } from "../../store/favoritesSlice";
import { RestaurantStatusBadges } from "../../utils/restaurantDisplay";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";

const useCarousel = () => {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    setCanLeft(c.scrollLeft > 2);
    setCanRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 2);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    update();
    c.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      c.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = useCallback((dir) => {
    const c = ref.current;
    if (c) c.scrollTo({ left: c.scrollLeft + (dir === "left" ? -320 : 320), behavior: "smooth" });
  }, []);

  return { ref, canLeft, canRight, scroll, update };
};

const CarouselArrow = ({ direction, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Scroll ${direction}`}
    className="glass-icon-btn w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shrink-0"
  >
    {direction === "left"
      ? <FaChevronLeft className="text-foreground/70" size={12} />
      : <FaChevronRight className="text-foreground/70" size={12} />}
  </button>
);

const RestaurantCarouselCard = ({ restaurant, badge }) => {
  const dispatch = useDispatch();
  const isFav = useSelector(selectIsFavourite(restaurant.id));
  const cuisines = Array.isArray(restaurant.cuisines) ? restaurant.cuisines : [];

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavourite(restaurant));
  };

  return (
    <Link
      to={`/home/restaurants/${restaurant.id}`}
      className="block glass-card rounded-3xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-md min-w-[230px] sm:min-w-[260px]"
    >
      <div className="relative w-full h-[165px] overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={restaurant.imageUrl || PLACEHOLDER_IMG}
          alt={restaurant.name}
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {badge && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            {badge}
          </span>
        )}
        <RestaurantStatusBadges resData={restaurant} />
        <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-lg">
          🚀 {restaurant.deliveryTime ?? 30} min
        </span>
        <button
          type="button"
          onClick={handleFav}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform z-10"
        >
          {isFav ? <FaHeart className="text-red-400" size={13} /> : <FaRegHeart className="text-white" size={13} />}
        </button>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {restaurant.name}
        </h3>
        <div className="flex flex-wrap gap-1 mb-2.5">
          {cuisines.slice(0, 2).map((c) => (
            <span key={c} className="text-xs bg-white/20 dark:bg-white/5 text-muted-foreground px-1.5 py-0.5 rounded-md">{c}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg">
            <FaStar size={10} /> {restaurant.avgRating || "New"}
          </span>
          <span className="text-xs text-muted-foreground">₹{Math.round((restaurant.costForTwo || 0) / 100)} for two</span>
        </div>
      </div>
    </Link>
  );
};

const RestaurantCarousel = ({ title, subtitle, restaurants = [], badge, emptyMessage }) => {
  const carousel = useCarousel();

  useEffect(() => {
    carousel.update();
  }, [restaurants]); // eslint-disable-line

  if (!restaurants?.length) return null;

  return (
    <div>
      <div className="flex items-end justify-between mb-5 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="hidden sm:flex gap-2">
          {carousel.canLeft && <CarouselArrow direction="left" onClick={() => carousel.scroll("left")} />}
          {carousel.canRight && <CarouselArrow direction="right" onClick={() => carousel.scroll("right")} />}
        </div>
      </div>
      <div ref={carousel.ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
        {restaurants.map((r) => (
          <RestaurantCarouselCard key={r.id} restaurant={r} badge={badge || (r.isFeatured ? "Featured" : null)} />
        ))}
      </div>
      {emptyMessage && restaurants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>
      )}
    </div>
  );
};

export default RestaurantCarousel;
