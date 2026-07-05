
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { applyFilters, clearFilters, toggleVeg } from "../store/filtersSlice";
import { toggleFavourite, selectIsFavourite } from "../store/favoritesSlice";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { getRestaurants } from "../services/restaurantService";
import { selectRecentlyViewed } from "../store/recentlyViewedSlice";
import FilterModal from "../components/FilterModal";
import {
  FaChevronLeft, FaChevronRight, FaLeaf, FaSlidersH,
  FaClock, FaStar, FaHeart, FaRegHeart, FaMapMarkerAlt,
} from "react-icons/fa";
import { ShimmerCategories, ShimmerBrands, ShimmerCarousel, ShimmerGridCards } from "../components/Shimmer";
import HomeDiscoverSections from "../components/home/HomeDiscoverSections";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import PromoBannerCarousel from "../components/home/PromoBannerCarousel";
import DishCarousel from "../components/home/DishCarousel";
import CuratedCollections from "../components/home/CuratedCollections";
import { buildCollections } from "../data/homeFeed";
import { RestaurantStatusBadges } from "../utils/restaurantDisplay";

// ─── Constants ────────────────────────────────────────────────────────────────

import { BROWSE_RADIUS_KM } from "../utils/locationStorage";

const RADIUS = BROWSE_RADIUS_KM;
const LIMIT  = 20;

const FOOD_CATEGORIES = [
  { id: 1,  name: "Biryani",      query: "Biryani",      imageUrl: "https://images.unsplash.com/photo-1563379091339-3b21bbd4c4e3?w=200&h=200&fit=crop" },
  { id: 2,  name: "Pizza",        query: "Pizza",         imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop" },
  { id: 3,  name: "Burgers",      query: "Burger",        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop" },
  { id: 4,  name: "South Indian", query: "South Indian",  imageUrl: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&h=200&fit=crop" },
  { id: 5,  name: "Chinese",      query: "Chinese",       imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop" },
  { id: 6,  name: "North Indian", query: "North Indian",  imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop" },
  { id: 7,  name: "Desserts",     query: "Desserts",      imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop" },
  { id: 8,  name: "Rolls",        query: "Rolls",         imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop" },
  { id: 9,  name: "Ice Cream",    query: "Ice Cream",     imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop" },
  { id: 10, name: "Sandwiches",   query: "Sandwich",      imageUrl: "https://images.unsplash.com/photo-1528735602780-2ba8f1ee5a02?w=200&h=200&fit=crop" },
  { id: 11, name: "Healthy",      query: "Healthy",       imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop" },
  { id: 12, name: "Cakes",        query: "Cake",          imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop" },
];

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop";

// ─── useCarousel hook ─────────────────────────────────────────────────────────

const useCarousel = () => {
  const ref = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
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
    return () => { c.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [update]);

  const scroll = useCallback((dir) => {
    const c = ref.current;
    if (c) c.scrollTo({ left: c.scrollLeft + (dir === "left" ? -320 : 320), behavior: "smooth" });
  }, []);

  return { ref, canLeft, canRight, scroll, update };
};

// ─── Reusable small components ────────────────────────────────────────────────

const CarouselArrow = ({ direction, onClick }) => (
  <button
    onClick={onClick}
    aria-label={`Scroll ${direction}`}
    className="glass-icon-btn w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shrink-0"
  >
    {direction === "left"
      ? <FaChevronLeft  className="text-foreground/70" size={12} />
      : <FaChevronRight className="text-foreground/70" size={12} />}
  </button>
);

const SectionHeader = ({ title, subtitle, right }) => (
  <div className="flex items-end justify-between mb-5 sm:mb-6">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {right && <div className="hidden sm:flex gap-2">{right}</div>}
  </div>
);

const FilterTag = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
    {label}
    <button onClick={onRemove} className="ml-0.5 hover:text-primary/70">✕</button>
  </span>
);

// ─── Category Circle ──────────────────────────────────────────────────────────

const CategoryCircle = ({ cat, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center min-w-[90px] sm:min-w-[100px] group focus:outline-none"
  >
    <div className="glass-circle w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2.5 group-hover:scale-[1.08] group-hover:shadow-glow transition-all duration-300">
      <img
        src={cat.imageUrl}
        alt={cat.name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop"; }}
      />
    </div>
    <span className="text-xs sm:text-sm font-semibold text-foreground text-center group-hover:text-primary transition-colors leading-tight">
      {cat.name}
    </span>
  </button>
);

// ─── Brand Circle ──────────────────────────────────────────────────────────────

const BrandCircle = ({ restaurant }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/home/restaurants/${restaurant.id}`)}
      className="flex flex-col items-center min-w-[110px] sm:min-w-[130px] group focus:outline-none"
    >
      <div className="relative glass-circle w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-2.5 group-hover:scale-[1.07] group-hover:shadow-glow transition-all duration-300">
        <img
          src={restaurant.imageUrl || PLACEHOLDER_IMG}
          alt={restaurant.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <p className="text-xs sm:text-sm font-bold text-foreground text-center line-clamp-1 group-hover:text-primary transition-colors w-full px-1">
        {restaurant.name}
      </p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
        <FaClock size={9} /> {restaurant.deliveryTime ?? 30} min
      </p>
    </button>
  );
};

// ─── Glass Restaurant Card (carousel) ─────────────────────────────────────────

const GlassRestaurantCard = ({ resData, wide = false }) => {
  const dispatch = useDispatch();
  const isFav    = useSelector(selectIsFavourite(resData.id));
  const { id, name, cuisines, avgRating, costForTwo, deliveryTime, imageUrl } = resData;

  const cuisineList     = Array.isArray(cuisines) ? cuisines : (cuisines || "").split(",").map((c) => c.trim());
  const displayCuisines = cuisineList.slice(0, 2);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavourite(resData));
  };

  return (
    <Link
      to={`/home/restaurants/${id}`}
      className={`block glass-card rounded-3xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-md ${
        wide ? "min-w-[280px] sm:min-w-[300px]" : "min-w-[230px] sm:min-w-[260px]"
      }`}
    >
      <div className="relative w-full h-[165px] overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={imageUrl || PLACEHOLDER_IMG}
          alt={name}
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <RestaurantStatusBadges resData={resData} />
        <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-lg">
          🚀 {deliveryTime ?? "30"} min
        </span>
        <button
          onClick={handleFav}
          className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform z-10"
        >
          {isFav ? <FaHeart className="text-red-400" size={13} /> : <FaRegHeart className="text-white" size={13} />}
        </button>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex flex-wrap gap-1 mb-2.5">
          {displayCuisines.map((c) => (
            <span key={c} className="text-xs bg-white/20 dark:bg-white/5 text-muted-foreground px-1.5 py-0.5 rounded-md">{c}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg">
            <FaStar size={10} /> {avgRating || "New"}
          </span>
          <span className="text-xs text-muted-foreground">₹{Math.round((costForTwo || 0) / 100)} for two</span>
        </div>
      </div>
    </Link>
  );
};

// ─── Glass Grid Card (4-col grid) ─────────────────────────────────────────────

const GlassGridCard = ({ resData }) => {
  const dispatch = useDispatch();
  const isFav    = useSelector(selectIsFavourite(resData.id));
  const { id, name, cuisines, avgRating, costForTwo, deliveryTime, imageUrl, address } = resData;

  const cuisineList = Array.isArray(cuisines) ? cuisines : (cuisines || "").split(",").map((c) => c.trim());

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavourite(resData));
  };

  return (
    <Link to={`/home/restaurants/${id}`} className="block">
      <div className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-glow-md transition-all duration-300">
        <div className="relative w-full h-[150px] overflow-hidden">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={imageUrl || PLACEHOLDER_IMG}
            alt={name}
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <RestaurantStatusBadges resData={resData} />
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-1.5 py-0.5 rounded-md">
            🚀 {deliveryTime ?? "30"} min
          </span>
          <button
            onClick={handleFav}
            className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform z-10"
          >
            {isFav ? <FaHeart className="text-red-400" size={12} /> : <FaRegHeart className="text-white" size={12} />}
          </button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">{name}</h3>
          {address && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5 truncate">
              <FaMapMarkerAlt size={9} className="text-primary shrink-0" />
              {typeof address === "string" ? address.split(",")[0] : ""}
            </p>
          )}
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {cuisineList.slice(0, 2).join(" · ")}
          </p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
              <FaStar size={9} /> {avgRating || "New"}
            </span>
            <span className="text-xs text-muted-foreground">₹{Math.round((costForTwo || 0) / 100)} for two</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ children, className = "" }) => (
  <div className={`dashboard-section px-4 sm:px-6 py-8 ${className}`}>{children}</div>
);

// ─── HomePage ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { location, setLocation } = useOutletContext();
  const { user }       = useSelector((s) => s.auth);
  const filters        = useSelector((s) => s.filters);
  const recentlyViewed = useSelector(selectRecentlyViewed);
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const onlineStatus   = useOnlineStatus();

  const [fetchedRestaurants, setFetchedRestaurants] = useState([]);
  const [total,              setTotal]              = useState(0);
  const [page,               setPage]               = useState(1);
  const [loading,            setLoading]            = useState(false);
  const [loadingMore,        setLoadingMore]         = useState(false);
  const [error,              setError]              = useState("");
  const [filterModalOpen,    setFilterModalOpen]     = useState(false);

  const loadMoreSentinelRef = useRef(null);
  const isFetchingRef       = useRef(false);
  const pageRef             = useRef(1);

  const categoryCarousel       = useCarousel();
  const topBrandsCarousel      = useCarousel();
  const topRestaurantsCarousel = useCarousel();
  const recentlyViewedCarousel = useCarousel();

  useEffect(() => {
    topBrandsCarousel.update();
    topRestaurantsCarousel.update();
    recentlyViewedCarousel.update();
  }, [fetchedRestaurants]); // eslint-disable-line

  useEffect(() => {
    setPage(1);
    pageRef.current = 1;
    setFetchedRestaurants([]);
    fetchPage(1, true);
  }, [location]); // eslint-disable-line

  const fetchPage = async (pageNum, reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const { data } = await getRestaurants(location.lat, location.lng, { radius: RADIUS, limit: LIMIT, page: pageNum });
      const restaurants = data.restaurants ?? [];
      const serverTotal = data.total ?? 0;
      setFetchedRestaurants((prev) => (reset || pageNum === 1 ? restaurants : [...prev, ...restaurants]));
      setTotal(serverTotal);
      setPage(pageNum);
      pageRef.current = pageNum;
    } catch {
      setError("Failed to load restaurants. Please try again.");
    }
    setLoading(false);
    setLoadingMore(false);
    isFetchingRef.current = false;
  };

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const scrollRoot = sentinel.closest("main") || null;
    const hasMorePages = fetchedRestaurants.length < total;

    if (!hasMorePages || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isFetchingRef.current) return;
        if (pageRef.current * LIMIT >= total) return;
        fetchPage(pageRef.current + 1);
      },
      { root: scrollRoot, rootMargin: "320px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchedRestaurants.length, total, loading, loadingMore]); // eslint-disable-line

  // ── Derived data ─────────────────────────────────────────────────────────────
  const topBrands = useMemo(
    () => [...fetchedRestaurants].filter((r) => r.avgRating).sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating)).slice(0, 10),
    [fetchedRestaurants]
  );

  const topRestaurants = useMemo(
    () => [...fetchedRestaurants].filter((r) => r.avgRating).sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating)).slice(0, 10),
    [fetchedRestaurants]
  );

  const curatedCollections = useMemo(
    () => buildCollections(fetchedRestaurants),
    [fetchedRestaurants]
  );

  const allCuisines = useMemo(() => {
    const set = new Set();
    fetchedRestaurants.forEach((r) =>
      (Array.isArray(r.cuisines) ? r.cuisines : []).forEach((c) => { const t = c?.trim(); if (t) set.add(t); })
    );
    return Array.from(set).sort();
  }, [fetchedRestaurants]);

  const filteredRestaurants = useMemo(() => {
    let list = [...fetchedRestaurants];
    if (filters.vegOnly) {
      list = list.filter((r) => r.isPureVeg === true);
    }
    if (filters.cuisines.length > 0) {
      const sel = new Set(filters.cuisines.map((c) => c.toLowerCase().trim()));
      list = list.filter((r) =>
        (Array.isArray(r.cuisines) ? r.cuisines : []).map((c) => c.toLowerCase().trim()).some((c) => sel.has(c))
      );
    }
    if (filters.rating !== null) list = list.filter((r) => parseFloat(r.avgRating || 0) >= filters.rating);
    if (filters.costRange !== null) {
      list = list.filter((r) => {
        const c = r.costForTwo || 0;
        if (filters.costRange === "low")  return c < 20000;
        if (filters.costRange === "mid")  return c >= 20000 && c <= 50000;
        if (filters.costRange === "high") return c > 50000;
        return true;
      });
    }
    if (filters.deliveryTimeMax !== null)
      list = list.filter((r) => parseInt(r.deliveryTime || 45, 10) <= filters.deliveryTimeMax);
    if (filters.sortBy === "rating_desc")
      list.sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0));
    else if (filters.sortBy === "cost_asc")  list.sort((a, b) => (a.costForTwo || 0) - (b.costForTwo || 0));
    else if (filters.sortBy === "cost_desc") list.sort((a, b) => (b.costForTwo || 0) - (a.costForTwo || 0));
    return list;
  }, [fetchedRestaurants, filters]);

  const modalFilterCount = [
    filters.sortBy !== "popularity" ? 1 : 0,
    filters.cuisines.length > 0 ? 1 : 0,
    filters.rating !== null ? 1 : 0,
    filters.costRange !== null ? 1 : 0,
    filters.deliveryTimeMax !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const anyFilterActive = filters.vegOnly || modalFilterCount > 0;
  const hasMore         = fetchedRestaurants.length < total;
  const locationName    = location?.address ? location.address.split(",")[0] : "your area";

  const handleApplyFilters = useCallback((p) => dispatch(applyFilters(p)), [dispatch]);
  const handleClearFilters = useCallback(() => dispatch(clearFilters()), [dispatch]);

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!onlineStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="glass-card rounded-3xl p-10 text-center max-w-sm">
          <div className="text-5xl mb-4">🚨</div>
          <h2 className="text-xl font-bold text-foreground mb-2">You're offline!</h2>
          <p className="text-muted-foreground text-sm">Please check your internet connection.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-10">
        <ShimmerCategories />
        <ShimmerBrands />
        <ShimmerCarousel />
      </div>
    );
  }

  if (!loading && fetchedRestaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12">
        <div className="glass-card rounded-3xl p-10 text-center max-w-sm">
          <img
            src={require("../assets/location_unserviceable.webp")}
            alt="Service not available"
            className="w-40 h-40 object-contain opacity-90 mx-auto mb-5"
          />
          <h2 className="text-2xl font-bold text-foreground mb-2">We'll be there soon!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {error || "Cravon isn't serving this location yet. We're expanding rapidly!"}
          </p>
          <button
            onClick={() => window.dispatchEvent(new Event("openLocationSidebar"))}
            className="btn-primary rounded-full px-6"
          >
            Choose a different location
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-home pb-8">

      {/* ── 0. PROMO BANNERS ─────────────────────────────────────── */}
      <Section className="pt-6 pb-4">
        <PromoBannerCarousel />
      </Section>

      <div className="section-divider" />

      {/* ── 1. WHAT'S ON YOUR MIND (categories) ─────────────────── */}
      <Section>
        <SectionHeader
          title={user ? `${user.name.split(" ")[0]}, what's on your mind? 🤤` : "What's on your mind? 🤤"}
          subtitle="Tap a category to explore"
          right={
            <>
              {categoryCarousel.canLeft  && <CarouselArrow direction="left"  onClick={() => categoryCarousel.scroll("left")} />}
              {categoryCarousel.canRight && <CarouselArrow direction="right" onClick={() => categoryCarousel.scroll("right")} />}
            </>
          }
        />
        <div ref={categoryCarousel.ref} className="flex gap-5 sm:gap-7 overflow-x-auto scrollbar-hide pb-3">
          {FOOD_CATEGORIES.map((cat) => (
            <CategoryCircle
              key={cat.id}
              cat={cat}
              onClick={() => navigate(`/home/search?q=${encodeURIComponent(cat.query)}`)}
            />
          ))}
        </div>
      </Section>

      <div className="section-divider" />

      {/* ── 1b. DISH CAROUSEL ───────────────────────────────────── */}
      <Section>
        <SectionHeader
          title="Craving something? 🍽️"
          subtitle="Popular dishes near you — tap to order from the restaurant"
        />
        <DishCarousel lat={location.lat} lng={location.lng} />
      </Section>

      <div className="section-divider" />
      <Section>
        <SectionHeader
          title="Best Restaurants for You 🌟"
          subtitle="Most loved spots near you"
          right={
            <>
              {topBrandsCarousel.canLeft  && <CarouselArrow direction="left"  onClick={() => topBrandsCarousel.scroll("left")} />}
              {topBrandsCarousel.canRight && <CarouselArrow direction="right" onClick={() => topBrandsCarousel.scroll("right")} />}
            </>
          }
        />
        {topBrands.length === 0 ? (
          <ShimmerBrands />
        ) : (
          <div ref={topBrandsCarousel.ref} className="flex gap-5 sm:gap-7 overflow-x-auto scrollbar-hide pb-3">
            {topBrands.map((r) => <BrandCircle key={r.id} restaurant={r} />)}
          </div>
        )}
      </Section>

      <div className="section-divider" />

      {/* ── 3. TOP RESTAURANTS IN LOCATION ──────────────────────── */}
      <Section>
        <SectionHeader
          title={`Top Restaurants in ${locationName} 📍`}
          subtitle="Best rated places to order from"
          right={
            <>
              {topRestaurantsCarousel.canLeft  && <CarouselArrow direction="left"  onClick={() => topRestaurantsCarousel.scroll("left")} />}
              {topRestaurantsCarousel.canRight && <CarouselArrow direction="right" onClick={() => topRestaurantsCarousel.scroll("right")} />}
            </>
          }
        />
        {topRestaurants.length === 0 ? (
          <ShimmerCarousel />
        ) : (
          <div ref={topRestaurantsCarousel.ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
            {topRestaurants.map((r) => <GlassRestaurantCard key={r.id} resData={r} wide />)}
          </div>
        )}
      </Section>

      {/* ── 3.5. RECENTLY VIEWED ─────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <>
          <div className="section-divider" />
          <Section>
            <SectionHeader
              title="Your Recently Viewed 👀"
              subtitle="Pick up where you left off"
              right={
                <>
                  {recentlyViewedCarousel.canLeft  && <CarouselArrow direction="left"  onClick={() => recentlyViewedCarousel.scroll("left")} />}
                  {recentlyViewedCarousel.canRight && <CarouselArrow direction="right" onClick={() => recentlyViewedCarousel.scroll("right")} />}
                </>
              }
            />
            <div ref={recentlyViewedCarousel.ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
              {recentlyViewed.map((r) => <GlassRestaurantCard key={r.id} resData={r} />)}
            </div>
          </Section>
        </>
      )}

      {curatedCollections.length > 0 && (
        <>
          <div className="section-divider" />
          <Section>
            <SectionHeader title="Curated for you ✨" subtitle="Hand-picked collections near your location" />
            <CuratedCollections collections={curatedCollections} />
          </Section>
        </>
      )}

      <div className="section-divider" />

      {/* ── 4. ALL RESTAURANTS NEAR YOU ──────────────────────────── */}
      <Section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">All Restaurants Near Me 🏙️</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} restaurants in {locationName}
              {anyFilterActive && <span className="ml-2 text-primary font-medium">· filtered</span>}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => dispatch(toggleVeg())}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              filters.vegOnly
                ? "bg-green-600 border-green-600 text-white shadow-md"
                : "glass-btn border-border text-foreground hover:border-green-400"
            }`}
          >
            <FaLeaf className={filters.vegOnly ? "text-white" : "text-green-500"} size={11} />
            Pure Veg
          </button>

          <button
            onClick={() => setFilterModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              modalFilterCount > 0
                ? "bg-primary/80 border-primary text-white shadow-md"
                : "glass-btn border-border text-foreground hover:border-primary"
            }`}
          >
            <FaSlidersH size={13} />
            Filters
            {modalFilterCount > 0 && (
              <span className="ml-0.5 bg-white text-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {modalFilterCount}
              </span>
            )}
          </button>

          {filters.sortBy !== "popularity" && (
            <FilterTag
              label={{ rating_desc: "Rating ↓", cost_asc: "Cost ↑", cost_desc: "Cost ↓" }[filters.sortBy]}
              onRemove={() => dispatch(applyFilters({ sortBy: "popularity" }))}
            />
          )}
          {filters.rating !== null && (
            <FilterTag label={`⭐ ${filters.rating}+`} onRemove={() => dispatch(applyFilters({ rating: null }))} />
          )}
          {filters.cuisines.map((c) => (
            <FilterTag key={c} label={c} onRemove={() => dispatch(applyFilters({ cuisines: filters.cuisines.filter((x) => x !== c) }))} />
          ))}
          {filters.costRange !== null && (
            <FilterTag label={{ low: "₹", mid: "₹₹", high: "₹₹₹" }[filters.costRange]} onRemove={() => dispatch(applyFilters({ costRange: null }))} />
          )}
          {filters.deliveryTimeMax !== null && (
            <FilterTag label={`⏱ Under ${filters.deliveryTimeMax} mins`} onRemove={() => dispatch(applyFilters({ deliveryTimeMax: null }))} />
          )}
          {anyFilterActive && (
            <button onClick={handleClearFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 font-medium whitespace-nowrap">
              Clear all
            </button>
          )}
        </div>

        {/* Grid */}
        {filteredRestaurants.length === 0 ? (
          <div className="glass-card rounded-3xl text-center py-16 px-6">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-lg font-semibold text-foreground mb-2">No restaurants match your filters</p>
            <p className="text-sm text-muted-foreground mb-5">Try adjusting or clearing filters to see more options.</p>
            <button onClick={handleClearFilters} className="btn-primary rounded-full">Clear all filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRestaurants.map((r) => <GlassGridCard key={r.id} resData={r} />)}
              {loadingMore && <ShimmerGridCards count={4} />}
              {hasMore && <div ref={loadMoreSentinelRef} className="col-span-full h-1 w-full" aria-hidden />}
            </div>
            {!hasMore && fetchedRestaurants.length > 0 && (
              <>
                <HomeDiscoverSections setLocation={setLocation} extraCuisines={allCuisines} />
                <DashboardFooter />
              </>
            )}
          </>
        )}
      </Section>

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        current={filters}
        allCuisines={allCuisines}
      />
    </div>
  );
};

export default HomePage;
