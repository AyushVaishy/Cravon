import { useNavigate } from "react-router-dom";
import { FaStar, FaClock } from "react-icons/fa";

const PLACEHOLDER = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";

const MiniRestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/home/restaurants/${restaurant.id}`)}
      className="min-w-[200px] sm:min-w-[220px] glass-card rounded-2xl overflow-hidden text-left hover:-translate-y-0.5 transition-transform"
    >
      <div className="relative h-28">
        <img
          src={restaurant.imageUrl || PLACEHOLDER}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        {restaurant.isOpen === false && (
          <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">CLOSED</span>
        )}
        {restaurant.offerTag && restaurant.isOpen !== false && (
          <span className="absolute top-2 left-2 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            🏷 {restaurant.offerTag}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-foreground line-clamp-1">{restaurant.name}</p>
        <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
            <FaStar size={9} /> {restaurant.avgRating || "New"}
          </span>
          <span className="flex items-center gap-1">
            <FaClock size={9} /> {restaurant.deliveryTime ?? 30} min
          </span>
        </div>
      </div>
    </button>
  );
};

const CuratedCollections = ({ collections }) => {
  if (!collections?.length) return null;

  return (
    <div className="space-y-10">
      {collections.map((col) => (
        <div key={col.id}>
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {col.emoji} {col.title}
            </h3>
            <p className="text-sm text-muted-foreground">{col.subtitle}</p>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {col.restaurants.map((r) => (
              <MiniRestaurantCard key={`${col.id}-${r.id}`} restaurant={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CuratedCollections;
