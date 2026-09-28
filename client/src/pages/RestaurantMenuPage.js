import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import useRestaurantMenu from "../hooks/useRestaurantMenu";
import ShimmerMenu from "../components/ShimmerMenu";
import RestaurantCategory from "../components/RestaurantCategory";
import {
  MenuOffersBanner, MenuGallery, MenuItemSections, SimilarRestaurants,
  RestaurantActions, ReportRestaurantModal,
} from "../components/restaurant/RestaurantMenuExtras";
import { FaStar, FaArrowLeft, FaMapMarkerAlt, FaClock, FaSearch, FaPhone, FaShareAlt } from "react-icons/fa";
import { MdTwoWheeler } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { viewRestaurant } from "../store/recentlyViewedSlice";
import { addBrowseHistory } from "../services/favoritesService";
import { Link } from "react-router-dom";
import { MdShoppingCart } from "react-icons/md";

const getClosingStatus = (openingTime, closingTime) => {
  if (!openingTime || !closingTime) return { isOpen: true, closingIn: null };
  const parseTime = (t) => {
    if (!t) return null;
    const s = t.toString().trim().toUpperCase();
    const pm = s.includes('PM');
    const am = s.includes('AM');
    const cleaned = s.replace(/[APM\s]/g, '');
    const [h, m = '0'] = cleaned.split(':');
    let hour = parseInt(h, 10);
    const min = parseInt(m, 10);
    if (pm && hour !== 12) hour += 12;
    if (am && hour === 12) hour = 0;
    return hour * 60 + min;
  };
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const open = parseTime(openingTime);
  const close = parseTime(closingTime);
  if (open === null || close === null) return { isOpen: true, closingIn: null };
  const isOpen = nowMins >= open && nowMins < close;
  const closingIn = isOpen ? close - nowMins : null;
  return { isOpen, closingIn };
};

const RestaurantMenuPage = () => {
  const { resId } = useParams();
  const navigate = useNavigate();
  const { location } = useOutletContext() || {};
  const { restaurant, menu, bestsellers, recommended, combos, loading, error } = useRestaurantMenu(resId);
  const cartItems = useSelector((s) => s.cart.items);
  const { user } = useSelector((s) => s.auth);
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartRestaurantCount = new Set(cartItems.map((i) => i.restaurantId).filter(Boolean)).size;
  const dispatch = useDispatch();

  const [scrolled, setScrolled] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 180);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (restaurant) {
      dispatch(viewRestaurant(restaurant));
      if (user) addBrowseHistory(restaurant.id).catch(() => {});
    }
  }, [restaurant, user]); // eslint-disable-line

  // ALL hooks must be called before any conditional returns
  const filteredCategories = useMemo(() => {
    if (!menu) return [];
    return Object.entries(menu)
      .map(([title, items]) => {
        let filtered = items;
        if (vegOnly) filtered = filtered.filter(i => i.isVeg);
        if (nonVegOnly) filtered = filtered.filter(i => !i.isVeg);
        if (menuSearch.trim()) {
          const q = menuSearch.toLowerCase();
          filtered = filtered.filter(i =>
            i.name.toLowerCase().includes(q) ||
            (i.description || '').toLowerCase().includes(q)
          );
        }
        return [title, filtered];
      })
      .filter(([, items]) => items.length > 0);
  }, [menu, menuSearch, vegOnly, nonVegOnly]);

  if (loading) return <ShimmerMenu />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Failed to load menu</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  if (!restaurant) return <ShimmerMenu />;

  const categories = menu ? Object.entries(menu) : [];
  const PLACEHOLDER =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop";
  const closingStatus = getClosingStatus(restaurant.openingTime, restaurant.closingTime);
  const orderingDisabled = !restaurant.isOpen || !closingStatus.isOpen;
  const galleryImages = [restaurant.imageUrl, ...(restaurant.galleryUrls || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky mini-header (appears on scroll) ── */}
      {scrolled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted">
              <FaArrowLeft className="text-muted-foreground" />
            </button>
            <span className="font-bold text-foreground truncate max-w-[200px]">{restaurant.name}</span>
          </div>
          {cartCount > 0 && (
            <Link
              to="/home/cart"
              className="flex items-center gap-2 bg-primary/50 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition"
            >
              <MdShoppingCart size={16} />
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}

      {/* ── Hero ── */}
      <div className="relative w-full h-[240px] sm:h-[300px] overflow-hidden">
        <img
          src={restaurant.imageUrl || PLACEHOLDER}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition"
        >
          <FaArrowLeft />
        </button>

        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <h1 className="text-2xl sm:text-4xl font-extrabold drop-shadow mb-1">{restaurant.name}</h1>
          <p className="text-sm sm:text-base opacity-90 mb-3 line-clamp-1">
            {Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(" • ") : restaurant.cuisines}
          </p>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 bg-green-600 text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full">
              <FaStar size={11} /> {restaurant.avgRating || "New"}
            </span>
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1 rounded-full">
              <MdTwoWheeler size={14} /> {restaurant.deliveryTime ?? 30} mins
            </span>
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1 rounded-full">
              ₹{Math.round(restaurant.costForTwo / 100)} for two
            </span>
            {(restaurant.address || restaurant.city) && (
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1 rounded-full max-w-[260px] truncate">
                <FaMapMarkerAlt size={11} />
                {restaurant.address || restaurant.city}
              </span>
            )}
            {restaurant.openingTime && restaurant.closingTime && (
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1 rounded-full">
                <FaClock size={11} /> {restaurant.openingTime} – {restaurant.closingTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Closes Soon / Closed Banner ── */}
      {orderingDisabled && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-2.5 text-red-700 dark:text-red-300 text-sm font-semibold">
          🔴 Restaurant is closed — browsing only. Ordering is disabled.
        </div>
      )}
      {closingStatus.isOpen && closingStatus.closingIn !== null && closingStatus.closingIn < 60 && (
        <div className="bg-primary/10 border-l-4 border-primary px-4 py-2.5 text-primary text-sm font-semibold flex items-center gap-2">
          ⚠️ Closes in {closingStatus.closingIn} mins — order quickly!
        </div>
      )}

      {/* ── Menu ── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {restaurant.description && (
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{restaurant.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-primary">
              <FaPhone size={10} /> {restaurant.phone}
            </a>
          )}
          {restaurant.fssaiNumber && <span>FSSAI: {restaurant.fssaiNumber}</span>}
        </div>

        <RestaurantActions restaurant={restaurant} onReport={() => setReportOpen(true)} />
        <MenuOffersBanner offerTag={restaurant.offerTag} />
        <MenuGallery images={galleryImages} name={restaurant.name} />

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
          Menu
          {categories.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({categories.reduce((s, [, items]) => s + items.length, 0)} items)
            </span>
          )}
        </h2>

        {/* Search + Veg filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <input
              type="text"
              placeholder="Search in menu…"
              value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {menuSearch && (
              <button onClick={() => setMenuSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">✕</button>
            )}
          </div>
          <button
            onClick={() => { setVegOnly(v => !v); if (!vegOnly) setNonVegOnly(false); }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all flex-shrink-0 ${
              vegOnly ? 'bg-green-600 border-green-600 text-white' : 'bg-card border-border text-foreground hover:border-green-400'
            }`}
          >
            Veg Only
          </button>
          <button
            onClick={() => { setNonVegOnly(v => !v); if (!nonVegOnly) setVegOnly(false); }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all flex-shrink-0 ${
              nonVegOnly ? 'bg-red-600 border-red-600 text-white' : 'bg-card border-border text-foreground hover:border-red-400'
            }`}
          >
            Non-Veg
          </button>
          {(menuSearch || vegOnly || nonVegOnly) && (
            <span className="text-xs text-muted-foreground">
              {filteredCategories.reduce((s, [, items]) => s + items.length, 0)} items found
            </span>
          )}
        </div>

        {recommended.length > 0 && (
          <MenuItemSections title="Recommended for you" items={recommended} restaurant={restaurant} orderingDisabled={orderingDisabled} />
        )}
        {bestsellers.length > 0 && (
          <MenuItemSections title="Bestsellers" items={bestsellers} restaurant={restaurant} orderingDisabled={orderingDisabled} />
        )}
        {combos.length > 0 && (
          <MenuItemSections title="Combo Meals" items={combos} restaurant={restaurant} orderingDisabled={orderingDisabled} />
        )}

        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No menu items available.</p>
        ) : (
          <div className="space-y-2">
            {filteredCategories.map(([title, items]) => (
              <RestaurantCategory
                key={title}
                title={title}
                items={items}
                restaurantName={restaurant.name}
                restaurantId={restaurant.id}
                orderingDisabled={orderingDisabled}
              />
            ))}
            {filteredCategories.length === 0 && (menuSearch || vegOnly || nonVegOnly) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No items match your search</p>
                <button onClick={() => { setMenuSearch(''); setVegOnly(false); setNonVegOnly(false); }} className="text-primary hover:underline text-sm">Clear filters</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Reviews Section ── */}
      {restaurant.reviews && restaurant.reviews.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-400" size={18} />
            Reviews
            <span className="text-sm font-normal text-muted-foreground">({restaurant.reviews.length})</span>
          </h2>

          {/* Rating breakdown */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-card rounded-xl border border-border">
            <div className="text-center flex-shrink-0">
              <p className="text-4xl font-extrabold text-foreground">{restaurant.avgRating || "—"}</p>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1,2,3,4,5].map((n) => (
                  <FaStar key={n} size={12} className={n <= Math.round(restaurant.avgRating || 0) ? "text-yellow-400" : "text-muted-foreground"} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{restaurant.totalRatings || restaurant.reviews.length} ratings</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map((star) => {
                const count = restaurant.reviews.filter((r) => r.rating === star).length;
                const pct = restaurant.reviews.length ? (count / restaurant.reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{star}</span>
                    <FaStar size={10} className="text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review list */}
          <div className="space-y-3">
            {restaurant.reviews.slice(0, 5).map((review, idx) => (
              <div key={idx} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(review.user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      {review.user?.name || "Customer"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                    <FaStar size={9} /> {review.rating}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
                {review.images?.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {review.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <SimilarRestaurants restaurantId={restaurant.id} lat={location?.lat} lng={location?.lng} />

      <ReportRestaurantModal open={reportOpen} onClose={() => setReportOpen(false)} restaurantId={restaurant.id} />

      {/* ── Floating cart bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <Link
            to="/home/cart"
            className="flex items-center gap-3 bg-primary/50 hover:bg-primary-hover text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm transition"
          >
            <MdShoppingCart size={18} />
            {cartCount} item{cartCount > 1 ? "s" : ""}
            {cartRestaurantCount > 1 ? ` · ${cartRestaurantCount} restaurants` : ""}
            {" "}· View Cart →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenuPage;
