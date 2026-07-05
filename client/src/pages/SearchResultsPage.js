import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { FaSearch, FaMicrophone, FaMapMarkerAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { searchRestaurants, getTrendingSearches } from "../services/searchService";
import RestaurantCard from "../components/RestaurantCard";
import SearchAssistPanel from "../components/search/SearchAssistPanel";
import Shimmer from "../components/Shimmer";
import useVoiceSearch from "../hooks/useVoiceSearch";
import {
  addRecentSearch,
  loadRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
} from "../utils/searchStorage";

const PLACEHOLDER = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop";

const MATCH_LABELS = {
  restaurant: "Restaurant match",
  dish: "Serves your dish",
  cuisine: "Cuisine match",
  city: "City match",
};

const DishResultCard = ({ dish }) => (
  <Link
    to={`/home/restaurants/${dish.restaurantId}`}
    className="glass-card rounded-2xl overflow-hidden flex gap-3 p-3 hover:-translate-y-0.5 transition-transform"
  >
    <img
      src={dish.imageUrl || dish.restaurantImageUrl || PLACEHOLDER}
      alt={dish.name}
      className="w-20 h-20 rounded-xl object-cover shrink-0"
      onError={(e) => { e.target.src = PLACEHOLDER; }}
    />
    <div className="min-w-0 flex-1">
      <p className="font-bold text-sm text-foreground line-clamp-1">{dish.name}</p>
      <p className="text-xs text-muted-foreground truncate">{dish.restaurantName}</p>
      <p className="text-xs text-primary font-semibold mt-1">
        ₹{Math.round((dish.price || 0) / 100)}
        {dish.distanceKm != null && (
          <span className="text-muted-foreground font-normal ml-2">· {dish.distanceKm} km</span>
        )}
      </p>
      {dish.isVeg && (
        <span className="inline-block mt-1 text-[10px] font-bold text-green-700 dark:text-green-400">🌿 Veg</span>
      )}
    </div>
  </Link>
);

const SearchResultsPage = () => {
  const { location } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "relevance";

  const [inputQuery, setInputQuery] = useState(query);
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [allFetched, setAllFetched] = useState([]);
  const [sortBy, setSortBy] = useState(sortParam);
  const [filterBy, setFilterBy] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(loadRecentSearches);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    getTrendingSearches()
      .then((res) => setTrending(res.data.trending || []))
      .catch(() => setTrending([]));
  }, []);

  useEffect(() => {
    setInputQuery(query);
    setSortBy(sortParam);
    if (query) performSearch(query, sortParam);
    else {
      setRestaurants([]);
      setDishes([]);
      setAllFetched([]);
    }
  }, [query, sortParam, location?.lat, location?.lng]); // eslint-disable-line

  const performSearch = async (searchQuery, sort = sortBy) => {
    setLoading(true);
    setError("");
    try {
      const apiSort = sort === "distance" ? "distance" : "relevance";
      const res = await searchRestaurants(location.lat, location.lng, searchQuery, { sort: apiSort });
      const data = res.data.restaurants || [];
      const dishData = res.data.dishes || [];
      setAllFetched(data);
      setDishes(dishData);
      setRestaurants(data);
      setFilterBy("all");
      setRecent(addRecentSearch(searchQuery));
    } catch {
      setError("Failed to load results. Please try again.");
      setRestaurants([]);
      setDishes([]);
      setAllFetched([]);
    }
    setLoading(false);
  };

  const goToSearch = useCallback(
    (term, sort = sortBy) => {
      const q = String(term || "").trim();
      if (!q) return;
      setSearchParams(sort === "relevance" ? { q } : { q, sort });
    },
    [setSearchParams, sortBy]
  );

  const { listening, supported, start: startVoice } = useVoiceSearch({
    onResult: (transcript) => goToSearch(transcript),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    goToSearch(inputQuery);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    if (newSortBy === "distance" || newSortBy === "relevance") {
      if (query) {
        setSearchParams(newSortBy === "relevance" ? { q: query } : { q: query, sort: newSortBy });
        return;
      }
    }
    setRestaurants((prev) => sortRestaurantsLocal(prev, newSortBy));
  };

  const handleFilterChange = (newFilterBy) => {
    setFilterBy(newFilterBy);
    const filtered = filterRestaurants(allFetched, newFilterBy);
    setRestaurants(sortRestaurantsLocal(filtered, sortBy));
  };

  const filterRestaurants = (list, fb) => {
    if (fb === "all") return list;
    return list.filter((r) => {
      switch (fb) {
        case "rating":
          return parseFloat(r.avgRating || 0) >= 4.0;
        case "fast":
          return parseInt(r.deliveryTime || 60, 10) <= 30;
        default:
          return true;
      }
    });
  };

  const sortRestaurantsLocal = (list, sb) => {
    const copy = [...list];
    return copy.sort((a, b) => {
      switch (sb) {
        case "distance":
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        case "rating":
          return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
        case "deliveryTime":
          return parseInt(a.deliveryTime || 60, 10) - parseInt(b.deliveryTime || 60, 10);
        case "costLowToHigh":
          return (a.costForTwo || 0) - (b.costForTwo || 0);
        case "costHighToLow":
          return (b.costForTwo || 0) - (a.costForTwo || 0);
        default:
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
    });
  };

  if (loading && query) {
    return <Shimmer />;
  }

  return (
    <div className="min-h-screen bg-background pt-6 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Search box */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, dishes…"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            {supported && (
              <button
                type="button"
                onClick={startVoice}
                className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 transition ${
                  listening
                    ? "border-primary bg-primary text-white animate-pulse"
                    : "border-border bg-card text-primary hover:bg-primary/5"
                }`}
                aria-label="Voice search"
              >
                <FaMicrophone />
              </button>
            )}
            <button type="submit" className="h-12 px-5 rounded-2xl bg-primary text-white font-semibold shrink-0">
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {!query ? (
          <div className="glass-card rounded-3xl overflow-hidden">
            <SearchAssistPanel
              recent={recent}
              trending={trending}
              onSelect={goToSearch}
              onRemoveRecent={(term) => setRecent(removeRecentSearch(term))}
              onClearRecent={() => setRecent(clearRecentSearches())}
              voiceSupported={supported}
              onVoiceStart={startVoice}
              listening={listening}
            />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Results for &quot;{query}&quot;</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}
                {dishes.length > 0 && ` · ${dishes.length} dish${dishes.length !== 1 ? "es" : ""}`}
              </p>
            </div>

            {dishes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-3">Dishes matching &quot;{query}&quot;</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dishes.map((d) => (
                    <DishResultCard key={`${d.restaurantId}-${d.id}`} dish={d} />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-section rounded-2xl shadow-sm border border-border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sort by</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "relevance", label: "Relevance" },
                      { value: "distance", label: "Nearest" },
                      { value: "rating", label: "Top Rated" },
                      { value: "deliveryTime", label: "Fastest" },
                      { value: "costLowToHigh", label: "Cost ↑" },
                      { value: "costHighToLow", label: "Cost ↓" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSortChange(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                          sortBy === opt.value
                            ? "bg-primary border-primary text-white"
                            : "bg-card border-border text-foreground hover:border-primary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:border-l sm:border-border sm:pl-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filter</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "rating", label: "⭐ 4.0+" },
                      { value: "fast", label: "🚀 Fast Delivery" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleFilterChange(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                          filterBy === opt.value
                            ? "bg-primary border-primary text-white"
                            : "bg-card border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {restaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {restaurants.map((r) => (
                  <div key={r.id}>
                    {r.matchReason && (
                      <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1 px-1">
                        {MATCH_LABELS[r.matchReason] || "Match"}
                        {r.matchedDishes?.length > 0 && `: ${r.matchedDishes.slice(0, 2).join(", ")}`}
                      </p>
                    )}
                    {r.distanceKm != null && (
                      <p className="text-[10px] text-muted-foreground mb-1 px-1 flex items-center gap-1">
                        <FaMapMarkerAlt size={8} /> {r.distanceKm} km away
                      </p>
                    )}
                    <RestaurantCard resData={r} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">No restaurants found</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn&apos;t find anything matching &quot;{query}&quot;. Try a dish name, cuisine, or restaurant.
                </p>
                <SearchAssistPanel
                  recent={recent}
                  trending={trending}
                  onSelect={goToSearch}
                  voiceSupported={false}
                  showVoiceHint={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
