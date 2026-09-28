import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaPlus, FaHeart, FaRegHeart } from "react-icons/fa";
import { getPopularDishes } from "../../services/discoveryService";

const PLACEHOLDER = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop";

const Stars = ({ rating }) => {
  const value = Math.min(5, Math.max(0, Math.round(Number(rating) || 4)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          size={10}
          className={i < value ? "text-accent drop-shadow-sm" : "text-muted-foreground/25"}
        />
      ))}
    </div>
  );
};

const DishCarousel = ({ lat, lng }) => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    getPopularDishes(lat, lng, { limit: 12 })
      .then((res) => setDishes(res.data.dishes || []))
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden pb-2" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer-block rounded-[22px] min-w-[210px] sm:min-w-[228px] p-3.5">
            <div className="shimmer w-full h-40 rounded-2xl" />
            <div className="shimmer h-2.5 w-20 rounded mt-3.5" />
            <div className="shimmer h-3.5 w-28 rounded mt-2.5" />
            <div className="shimmer h-3 w-16 rounded mt-2" />
            <div className="flex justify-between mt-4">
              <div className="shimmer h-5 w-12 rounded" />
              <div className="shimmer h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (dishes.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-fade-x">
      {dishes.map((dish, idx) => {
        const price = dish.price != null ? Math.round(Number(dish.price) / 100) : null;
        const offerPct =
          dish.offerPrice != null && dish.price
            ? Math.round((1 - dish.offerPrice / dish.price) * 100)
            : idx % 3 === 0
              ? 15
              : null;
        const isLiked = !!liked[dish.id];

        return (
          <div
            key={dish.id}
            className="elevated-card min-w-[210px] sm:min-w-[228px] max-w-[228px] p-3.5 flex flex-col group"
          >
            <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-3.5">
              <img
                src={dish.imageUrl || PLACEHOLDER}
                alt={dish.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              {offerPct != null && offerPct > 0 && (
                <span className="absolute top-2.5 left-2.5 bg-[#FF5A5F] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md z-10">
                  {offerPct}% Off
                </span>
              )}
              <button
                type="button"
                aria-label="Favorite"
                onClick={(e) => {
                  e.stopPropagation();
                  setLiked((prev) => ({ ...prev, [dish.id]: !prev[dish.id] }));
                }}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 dark:bg-black/55 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
              >
                {isLiked ? (
                  <FaHeart className="text-[#FF5A5F]" size={12} />
                ) : (
                  <FaRegHeart className="text-muted-foreground" size={12} />
                )}
              </button>
            </div>

            <Stars rating={dish.avgRating || 4 + (idx % 2) * 0.5} />

            <button
              type="button"
              onClick={() => navigate(`/home/restaurants/${dish.restaurantId}`)}
              className="text-left mt-1.5 focus:outline-none"
            >
              <p className="text-[15px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {dish.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {dish.restaurantName}
              </p>
            </button>

            <div className="flex items-center justify-between mt-auto pt-3.5">
              <span className="text-lg font-extrabold text-primary tabular-nums">
                {price != null ? `₹${price}` : "—"}
              </span>
              <button
                type="button"
                aria-label={`Open ${dish.name}`}
                onClick={() => navigate(`/home/restaurants/${dish.restaurantId}`)}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-[0_8px_18px_-4px_var(--shadow-soft)] hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all"
              >
                <FaPlus size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DishCarousel;
