import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaStar, FaHeart, FaRegHeart, FaMapMarkerAlt } from "react-icons/fa";
import { toggleFavourite, selectIsFavourite } from "../store/favoritesSlice";
import { RestaurantStatusBadges } from "../utils/restaurantDisplay";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";

const RestaurantCard = ({ resData }) => {
  const dispatch = useDispatch();
  const isFav = useSelector(selectIsFavourite(resData.id));
  const {
    id, name, cuisines, avgRating, totalRatings, costForTwo,
    deliveryTime, deliveryFee, imageUrl, logoUrl, distanceKm, isFeatured,
  } = resData;

  const cuisineList = Array.isArray(cuisines) ? cuisines : (cuisines || "").split(",").map((c) => c.trim());
  const displayCuisines = cuisineList.slice(0, 2);
  const extraCount = cuisineList.length - displayCuisines.length;
  const feeDisplay = deliveryFee === 0 ? "Free delivery" : `₹${Math.round((deliveryFee ?? 2900) / 100)} delivery`;

  const handleFavClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavourite(resData));
  };

  return (
    <Link to={`/home/restaurants/${id}`} className="block h-full">
      <div className="elevated-card h-full overflow-hidden flex flex-col">
        <div className="relative w-full h-[158px] overflow-hidden">
          <img
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            src={imageUrl || PLACEHOLDER_IMG}
            alt={name}
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="absolute bottom-2 left-2 w-9 h-9 rounded-full border-2 border-white object-cover shadow-md bg-white"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <RestaurantStatusBadges resData={resData} />
          {isFeatured && (
            <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow z-10">
              Featured
            </span>
          )}
          <button
            type="button"
            onClick={handleFavClick}
            className="absolute top-2 right-2 w-8 h-8 bg-white/95 dark:bg-black/55 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform z-10"
          >
            {isFav ? <FaHeart className="text-[#FF5A5F]" size={13} /> : <FaRegHeart className="text-muted-foreground" size={13} />}
          </button>
        </div>
        <div className="p-3.5 flex-1 flex flex-col">
          <h3 className="font-bold text-[15px] text-foreground line-clamp-1 mb-1">{name}</h3>
          <p className="text-[11px] text-muted-foreground mb-2.5 line-clamp-1">
            {displayCuisines.join(", ")}
            {extraCount > 0 && ` +${extraCount}`}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-auto">
            <span className="flex items-center gap-1 font-bold text-foreground">
              <FaStar size={10} className="text-accent" /> {avgRating || "New"}
              {totalRatings > 0 && (
                <span className="text-muted-foreground font-normal">({totalRatings})</span>
              )}
            </span>
            <span className="text-muted-foreground">{deliveryTime ?? 30} mins</span>
            <span className="font-semibold text-primary">₹{Math.round((costForTwo || 0) / 100)} for two</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {distanceKm != null && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <FaMapMarkerAlt size={9} className="text-primary" /> {distanceKm} km
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{feeDisplay}</span>
            {resData.isPureVeg && (
              <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                Pure Veg
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
