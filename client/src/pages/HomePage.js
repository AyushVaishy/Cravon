
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { applyFilters, clearFilters, togglePureVeg, toggleNonVeg, toggleOpenNow, toggleHasOffers, toggleNewRestaurants } from "../store/filtersSlice";
import { toggleFavourite, selectIsFavourite } from "../store/favoritesSlice";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { getRestaurants } from "../services/restaurantService";
import { selectRecentlyViewed } from "../store/recentlyViewedSlice";
import FilterModal from "../components/FilterModal";
import {
  FaChevronLeft, FaChevronRight, FaLeaf, FaSlidersH,
  FaStar, FaHeart, FaRegHeart, FaBolt,
} from "react-icons/fa";
import { ShimmerCategories, ShimmerGridCards, ShimmerBanner, ShimmerDishes, ShimmerCarousel } from "../components/Shimmer";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import PromoBannerCarousel from "../components/home/PromoBannerCarousel";
import DishCarousel from "../components/home/DishCarousel";
import { useHomeFeed, OrderAgainSection, FeaturedSection } from "../components/home/HomeDiscoverFeed";
import { ErrorPageView } from "../components/Error";
import RestaurantCard from "../components/RestaurantCard";
import { RestaurantStatusBadges } from "../utils/restaurantDisplay";

// ─── Constants ────────────────────────────────────────────────────────────────

import { BROWSE_RADIUS_KM } from "../utils/locationStorage";

const RADIUS = BROWSE_RADIUS_KM;
const LIMIT  = 20;

const FOOD_CATEGORIES = [
  { id: 1,  name: "Biryani",      query: "Biryani",      imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=280&h=280&fit=crop" },
  { id: 2,  name: "Pizza",        query: "Pizza",         imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=280&h=280&fit=crop" },
  { id: 3,  name: "Burgers",      query: "Burger",        imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=280&h=280&fit=crop" },
  { id: 4,  name: "South Indian", query: "South Indian",  imageUrl: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=280&h=280&fit=crop" },
  { id: 5,  name: "Chinese",      query: "Chinese",       imageUrl: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=280&h=280&fit=crop" },
  { id: 6,  name: "North Indian", query: "North Indian",  imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=280&h=280&fit=crop" },
  { id: 7,  name: "Desserts",     query: "Desserts",      imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=280&h=280&fit=crop" },
  { id: 8,  name: "Rolls",        query: "Rolls",         imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=280&h=280&fit=crop" },
  { id: 9,  name: "Ice Cream",    query: "Ice Cream",     imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=280&h=280&fit=crop" },
  { id: 10, name: "Sandwiches",   query: "Sandwich",      imageUrl: "https://images.unsplash.com/photo-1528735602780-2ba8f1ee5a02?w=280&h=280&fit=crop" },
  { id: 11, name: "Healthy",      query: "Healthy",       imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=280&h=280&fit=crop" },
  { id: 12, name: "Cakes",        query: "Cake",          imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=280&h=280&fit=crop" },
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
    className="elevated-icon-btn w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 hover:text-primary transition-all duration-200 shrink-0"
  >
    {direction === "left"
      ? <FaChevronLeft  className="text-foreground/70" size={12} />
      : <FaChevronRight className="text-foreground/70" size={12} />}
  </button>
);

const SectionHeader = ({ title, subtitle, right, viewAllTo }) => (
  <div className="flex items-end justify-between mb-5 sm:mb-6 gap-3">
    <div className="min-w-0">
      <h2 className="font-display text-lg sm:text-xl font-extrabold text-foreground leading-tight">
        {title}
      </h2>
      {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {right && <div className="hidden sm:flex gap-2">{right}</div>}
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-0.5 transition-colors whitespace-nowrap"
        >
          View all <FaChevronRight size={10} />
        </Link>
      )}
    </div>
  </div>
);

const FilterTag = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
    {label}
    <button onClick={onRemove} className="ml-0.5 hover:text-primary/70">✕</button>
  </span>
);

// ─── Category Circle ──────────────────────────────────────────────────────────

const CategoryCard = ({ cat, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center min-w-[100px] sm:min-w-[112px] w-[100px] sm:w-[112px] group focus:outline-none bg-transparent border-0 p-0 overflow-visible"
  >
    <div className="relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] mb-2.5 overflow-visible flex items-end justify-center">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0.5 w-[58%] h-2 rounded-[100%] bg-black/15 blur-[4px] group-hover:w-[68%] group-hover:bg-black/20 transition-all duration-250"
      />
      <img
        src={cat.imageUrl}
        alt={cat.name}
        loading="lazy"
        className="relative z-[1] w-full h-full object-cover rounded-full border-0 outline-none ring-0
          shadow-[0_10px_22px_-6px_rgba(0,0,0,0.22)]
          group-hover:scale-105 group-hover:-translate-y-1
          group-hover:shadow-[0_14px_28px_-6px_rgba(0,0,0,0.28)]
          transition-all duration-250 ease-out"
        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=280&h=280&fit=crop"; }}
      />
    </div>
    <span className="relative z-[2] text-xs sm:text-[13px] font-bold text-foreground text-center group-hover:text-primary transition-colors leading-tight line-clamp-1 w-full">
      {cat.name}
    </span>
  </button>
);

// ─── Brand Circle removed (Top Brands section dropped for leaner home feed) ───

// ─── Restaurant Card (carousel) ───────────────────────────────────────────────
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
      className={`block elevated-card overflow-hidden group ${
        wide ? "min-w-[260px] sm:min-w-[280px]" : "min-w-[220px] sm:min-w-[240px]"
      }`}
    >
      <div className="relative w-full h-[150px] overflow-hidden rounded-t-[20px]">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={imageUrl || PLACEHOLDER_IMG}
          alt={name}
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <RestaurantStatusBadges resData={resData} />
        <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg">
          {deliveryTime ?? "30"} min
        </span>
        <button
          onClick={handleFav}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-black/50 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform z-10"
        >
          {isFav ? <FaHeart className="text-[#FF5A5F]" size={12} /> : <FaRegHeart className="text-muted-foreground" size={12} />}
        </button>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-[15px] text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-2.5 truncate">
          {displayCuisines.join(" · ")}
        </p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-bold text-foreground">
            <FaStar size={10} className="text-accent" /> {avgRating || "New"}
          </span>
          <span className="text-xs font-semibold text-primary">₹{Math.round((costForTwo || 0) / 100)} for two</span>
        </div>
      </div>
    </Link>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ children, className = "" }) => (
  <div className={`dashboard-section px-4 sm:px-6 lg:px-8 py-5 sm:py-6 ${className}`}>{children}</div>
);

// ─── HomePage ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { location } = useOutletContext();
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
  const recentlyViewedCarousel = useCarousel();
  const { feed: homeFeed, loading: homeFeedLoading } = useHomeFeed(location.lat, location.lng);

  useEffect(() => {
    recentlyViewedCarousel.update();
  }, [recentlyViewed]); // eslint-disable-line

  useEffect(() => {
    setPage(1);
    pageRef.current = 1;
    setFetchedRestaurants([]);
    fetchPage(1, true);
  }, [location, filters]); // eslint-disable-line

  const fetchPage = async (pageNum, reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const { data } = await getRestaurants(location.lat, location.lng, {
        radius: RADIUS, limit: LIMIT, page: pageNum, filters,
      });
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
  const allCuisines = useMemo(() => {
    const set = new Set();
    fetchedRestaurants.forEach((r) =>
      (Array.isArray(r.cuisines) ? r.cuisines : []).forEach((c) => { const t = c?.trim(); if (t) set.add(t); })
    );
    return Array.from(set).sort();
  }, [fetchedRestaurants]);

  const filteredRestaurants = fetchedRestaurants;

  const modalFilterCount = [
    filters.sortBy !== "popularity" ? 1 : 0,
    filters.cuisines.length > 0 ? 1 : 0,
    filters.rating !== null ? 1 : 0,
    filters.costRange !== null ? 1 : 0,
    filters.deliveryTimeMax !== null ? 1 : 0,
    filters.maxDistance !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const anyFilterActive = filters.pureVeg || filters.vegOnly || filters.nonVegOnly || filters.openNowOnly
    || filters.hasOffers || filters.freeDelivery || filters.newRestaurants || filters.acceptsOnlinePayment
    || modalFilterCount > 0;
  const hasMore         = fetchedRestaurants.length < total;
  const locationName    = location?.address ? location.address.split(",")[0] : "your area";
  const fastDeliveryOn  = filters.deliveryTimeMax === 30;

  const handleApplyFilters = useCallback((p) => dispatch(applyFilters(p)), [dispatch]);
  const handleClearFilters = useCallback(() => dispatch(clearFilters()), [dispatch]);
  const toggleFastDelivery = useCallback(() => {
    dispatch(applyFilters({ deliveryTimeMax: fastDeliveryOn ? null : 30 }));
  }, [dispatch, fastDeliveryOn]);

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!onlineStatus) {
    return (
      <div className="h-full min-h-[calc(100vh-7rem)] p-3 sm:p-4">
        <ErrorPageView
          kind="offline"
          embedded
          onRetry={() => window.location.reload()}
          onHome={() => navigate("/home")}
          onHelp={() => navigate("/home/help")}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-home px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <ShimmerBanner />
        <div>
          <div className="shimmer h-6 w-28 rounded-lg mb-2" />
          <div className="shimmer h-3 w-40 rounded-full mb-5" />
          <ShimmerCategories />
        </div>
        <div>
          <div className="shimmer h-6 w-36 rounded-lg mb-2" />
          <div className="shimmer h-3 w-48 rounded-full mb-5" />
          <ShimmerDishes />
        </div>
        <div>
          <div className="shimmer h-6 w-40 rounded-lg mb-5" />
          <ShimmerCarousel />
        </div>
      </div>
    );
  }

  if (!loading && fetchedRestaurants.length === 0) {
    if (error) {
      return (
        <div className="h-full min-h-[calc(100vh-7rem)] p-3 sm:p-4">
          <ErrorPageView
            kind="server"
            embedded
            error={new Error(error)}
            onRetry={() => window.location.reload()}
            onHome={() => navigate("/home")}
            onHelp={() => navigate("/home/help")}
          />
        </div>
      );
    }
    return (
      <div className="h-full min-h-[calc(100vh-7rem)] p-3 sm:p-4">
        <ErrorPageView
          kind="unserviceable"
          embedded
          onRetry={() => window.location.reload()}
          onHome={() => navigate("/home")}
          onHelp={() => navigate("/home/help")}
          onChangeLocation={() => window.dispatchEvent(new Event("openLocationSidebar"))}
        />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-home pb-8">

      {/* 1. Promo */}
      <Section className="pt-6 pb-4">
        <PromoBannerCarousel />
      </Section>

      <div className="section-divider" />

      {/* 2. Category */}
      <Section>
        <SectionHeader
          title="Category"
          subtitle={user ? "Picked for your taste" : "Tap a category to explore"}
          right={
            <>
              {categoryCarousel.canLeft  && <CarouselArrow direction="left"  onClick={() => categoryCarousel.scroll("left")} />}
              {categoryCarousel.canRight && <CarouselArrow direction="right" onClick={() => categoryCarousel.scroll("right")} />}
            </>
          }
        />
        <div className="relative overflow-visible">
          <div
            ref={categoryCarousel.ref}
            className="category-scroll flex gap-2 sm:gap-3 px-1"
          >
            {FOOD_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                onClick={() => navigate(`/home/search?q=${encodeURIComponent(cat.query)}`)}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* 3. Order Again (logged-in only) */}
      {user && (homeFeedLoading || homeFeed?.recentlyOrdered?.length > 0) && (
        <>
          <div className="section-divider" />
          <OrderAgainSection feed={homeFeed} loading={homeFeedLoading} />
        </>
      )}

      <div className="section-divider" />

      {/* 4. Popular Dishes */}
      <Section>
        <SectionHeader
          title="Popular Dishes"
          subtitle="Trending near you — tap + to order"
        />
        <DishCarousel lat={location.lat} lng={location.lng} />
      </Section>

      {/* 5. Featured */}
      {homeFeed?.featured?.length > 0 && (
        <>
          <div className="section-divider" />
          <FeaturedSection feed={homeFeed} loading={false} />
        </>
      )}

      {/* 6. Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <>
          <div className="section-divider" />
          <Section>
            <SectionHeader
              title="Recently Viewed"
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

      <div className="section-divider" />

      {/* 7. All Restaurants */}
      <Section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-foreground">All Restaurants Near Me</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} restaurants in {locationName}
              {anyFilterActive && <span className="ml-2 text-primary font-medium">· filtered</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => dispatch(togglePureVeg())}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              filters.pureVeg ? "bg-green-600 border-green-600 text-white shadow-md" : "glass-btn border-border text-foreground hover:border-green-400"
            }`}
          >
            <FaLeaf className={filters.pureVeg ? "text-white" : "text-green-500"} size={11} />
            Pure Veg
          </button>
          <button
            onClick={() => dispatch(toggleNonVeg())}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              filters.nonVegOnly ? "bg-red-600 border-red-600 text-white shadow-md" : "glass-btn border-border text-foreground hover:border-red-400"
            }`}
          >
            Non-Veg
          </button>
          <button
            onClick={() => dispatch(toggleOpenNow())}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              filters.openNowOnly
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "glass-btn border-border text-foreground hover:border-emerald-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filters.openNowOnly ? "bg-white" : "bg-emerald-500"}`} />
            Open Now
          </button>
          <button
            onClick={toggleFastDelivery}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              fastDeliveryOn ? "bg-primary border-primary text-white shadow-md" : "glass-btn border-border text-foreground hover:border-primary"
            }`}
          >
            <FaBolt size={11} className={fastDeliveryOn ? "text-white" : "text-primary"} />
            Fast Delivery
          </button>
          <button
            onClick={() => dispatch(toggleHasOffers())}
            className={`px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              filters.hasOffers ? "bg-orange-500 border-orange-500 text-white" : "glass-btn border-border"
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => dispatch(toggleNewRestaurants())}
            className={`px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-all ${
              filters.newRestaurants ? "bg-violet-600 border-violet-600 text-white" : "glass-btn border-border"
            }`}
          >
            New
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

          {filters.pureVeg && (
            <FilterTag label="Pure Veg" onRemove={() => dispatch(togglePureVeg())} />
          )}
          {filters.nonVegOnly && (
            <FilterTag label="Non-Veg" onRemove={() => dispatch(toggleNonVeg())} />
          )}
          {filters.openNowOnly && (
            <FilterTag label="Open Now" onRemove={() => dispatch(toggleOpenNow())} />
          )}
          {fastDeliveryOn && (
            <FilterTag label="Fast ≤30 min" onRemove={toggleFastDelivery} />
          )}
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
          {filters.deliveryTimeMax !== null && filters.deliveryTimeMax !== 30 && (
            <FilterTag label={`⏱ Under ${filters.deliveryTimeMax} mins`} onRemove={() => dispatch(applyFilters({ deliveryTimeMax: null }))} />
          )}
          {anyFilterActive && (
            <button onClick={handleClearFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 font-medium whitespace-nowrap">
              Clear all
            </button>
          )}
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="glass-card rounded-3xl text-center py-16 px-6">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-lg font-semibold text-foreground mb-2">No restaurants match your filters</p>
            <p className="text-sm text-muted-foreground mb-5">Try adjusting or clearing filters to see more options.</p>
            <button onClick={handleClearFilters} className="btn-primary rounded-full">Clear all filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRestaurants.map((r) => <RestaurantCard key={r.id} resData={r} />)}
              {loadingMore && <ShimmerGridCards count={3} />}
              {hasMore && <div ref={loadMoreSentinelRef} className="col-span-full h-1 w-full" aria-hidden />}
            </div>
            {!hasMore && fetchedRestaurants.length > 0 && <DashboardFooter />}
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
