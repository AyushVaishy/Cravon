import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPopularDishes } from "../../services/discoveryService";

const PLACEHOLDER = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop";

const DishCarousel = ({ lat, lng }) => {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);
    getPopularDishes(lat, lng, { limit: 14 })
      .then((res) => setDishes(res.data.dishes || []))
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="min-w-[100px] flex flex-col items-center animate-pulse">
            <div className="w-20 h-20 rounded-2xl bg-muted" />
            <div className="h-3 w-16 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (dishes.length === 0) return null;

  return (
    <div className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-3">
      {dishes.map((dish) => (
        <button
          key={dish.id}
          type="button"
          onClick={() => navigate(`/home/restaurants/${dish.restaurantId}`)}
          className="flex flex-col items-center min-w-[96px] sm:min-w-[108px] group focus:outline-none"
        >
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden glass-circle group-hover:scale-105 transition-transform shadow-sm">
            <img
              src={dish.imageUrl || PLACEHOLDER}
              alt={dish.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
            {dish.isVeg && (
              <span className="absolute bottom-1 right-1 w-3 h-3 border-2 border-green-600 bg-white rounded-sm" title="Veg" />
            )}
          </div>
          <p className="text-xs font-semibold text-foreground text-center mt-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors px-0.5">
            {dish.name}
          </p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[96px]">{dish.restaurantName}</p>
        </button>
      ))}
    </div>
  );
};

export default DishCarousel;
