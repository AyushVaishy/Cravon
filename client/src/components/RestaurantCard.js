import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { toggleFavourite, selectIsFavourite } from "../store/favoritesSlice";
import { RestaurantStatusBadges } from "../utils/restaurantDisplay";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";

const RestaurantCard = ({ resData }) => {
  const dispatch = useDispatch();
  const isFav = useSelector(selectIsFavourite(resData.id));
  const { id, name, cuisines, avgRating, costForTwo, deliveryTime, imageUrl } = resData;

  const cuisineList = Array.isArray(cuisines) ? cuisines : (cuisines || "").split(",").map((c) => c.trim());
  const displayCuisines = cuisineList.slice(0, 2);
  const extraCount = cuisineList.length - displayCuisines.length;

  const handleFavClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavourite(resData));
  };

  return (
    <Link to={`/home/restaurants/${id}`} className="block">
      <div className="m-2 bg-card rounded-xl shadow hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border overflow-hidden">
        <div className="relative w-full h-[160px] overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src={imageUrl || PLACEHOLDER_IMG}
            alt={name}
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
          <RestaurantStatusBadges resData={resData} />
          <button
            onClick={handleFavClick}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-black/50 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform z-10"
          >
            {isFav ? <FaHeart className="text-red-500" size={14} /> : <FaRegHeart className="text-gray-600 dark:text-gray-300" size={14} />}
          </button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1">{name}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            {displayCuisines.join(", ")}
            {extraCount > 0 && ` +${extraCount} more`}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
              <FaStar size={11} /> {avgRating || "New"}
            </span>
            <span className="text-muted-foreground text-xs">{deliveryTime ?? 30} mins</span>
            <span className="text-muted-foreground text-xs">₹{Math.round((costForTwo || 0) / 100)} for two</span>
          </div>
          {resData.isPureVeg && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              🌿 Pure Veg
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
