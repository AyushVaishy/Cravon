import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaSearch, FaMapMarkerAlt, FaChevronDown, FaMicrophone } from "react-icons/fa";
import { FiSun, FiMoon, FiBell } from "react-icons/fi";
import SearchAssistPanel from "../search/SearchAssistPanel";
import useVoiceSearch from "../../hooks/useVoiceSearch";
import { getTrendingSearches } from "../../services/searchService";
import {
  addRecentSearch,
  loadRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
} from "../../utils/searchStorage";
import {
  selectNotifications,
  selectUnreadCount,
  markAllRead,
} from "../../store/notificationsSlice";

const DashboardTopBar = ({ location, isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [recent, setRecent] = useState(loadRecentSearches);
  const [trending, setTrending] = useState([]);

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const firstName = user?.name?.split(" ")[0] || null;

  useEffect(() => {
    getTrendingSearches()
      .then((res) => setTrending(res.data.trending || []))
      .catch(() => setTrending([]));
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/restaurants/search?q=${encodeURIComponent(q)}&lat=${location.lat}&lng=${location.lng}`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        setSuggestions((data?.restaurants || []).slice(0, 7));
      } catch {
        setSuggestions([]);
      }
    }, 260);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [searchQuery, location.lat, location.lng]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToSearch = useCallback(
    (term) => {
      const q = String(term || "").trim();
      if (!q) return;
      setRecent(addRecentSearch(q));
      navigate(`/home/search?q=${encodeURIComponent(q)}`);
      setSearchFocused(false);
      setSuggestions([]);
      setSearchQuery("");
    },
    [navigate]
  );

  const { listening, supported, start: startVoice } = useVoiceSearch({
    onResult: goToSearch,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    goToSearch(searchQuery);
  };

  const locationLabel =
    location?.savedLabel ||
    (location?.address ? location.address.split(",")[0] : "Your Location");

  const showAssist = searchFocused && !searchQuery.trim();
  const showSuggestions = searchFocused && searchQuery.trim() && suggestions.length > 0;

  const openNotifs = () => {
    setNotifOpen((v) => !v);
    if (unreadCount > 0) dispatch(markAllRead());
  };

  return (
    <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 sm:gap-5 bg-transparent">
      {/* Greeting */}
      <div className="hidden sm:block min-w-0 shrink-0 max-w-[200px] lg:max-w-[260px]">
        <h1 className="font-display text-xl lg:text-2xl font-extrabold text-foreground truncate leading-tight">
          {firstName ? `Hello, ${firstName}` : "Hello there"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          What do you want to eat today?
        </p>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-xl mx-auto" ref={searchRef}>
        <form onSubmit={handleSearch}>
          <div
            className={`elevated-search flex items-center h-12 rounded-full px-2 transition-all duration-300 ${
              searchFocused ? "ring-2 ring-primary/25 shadow-[0_8px_28px_-6px_var(--shadow-soft)]" : ""
            }`}
          >
            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-[0_4px_14px_-2px_var(--shadow-soft)] hover:bg-primary-hover transition-colors"
              aria-label="Search"
            >
              <FaSearch size={13} />
            </button>
            <input
              type="text"
              placeholder="Search restaurants, dishes, cuisines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="flex-1 h-full bg-transparent border-none outline-none text-[14px] font-semibold px-3 text-foreground placeholder:text-muted-foreground"
            />
            {supported && (
              <button
                type="button"
                onClick={startVoice}
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-0.5 transition-all ${
                  listening ? "bg-primary text-white animate-pulse" : "text-primary hover:bg-primary/10"
                }`}
                aria-label="Voice search"
              >
                <FaMicrophone size={12} />
              </button>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors mr-2 font-bold text-sm"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {showAssist && (
          <div className="absolute top-14 left-0 right-0 elevated-panel overflow-hidden z-50 animate-slide-up max-h-[70vh] overflow-y-auto">
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
        )}

        {showSuggestions && (
          <div className="absolute top-14 left-0 right-0 elevated-panel overflow-hidden z-50 animate-slide-up">
            {suggestions.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => {
                  navigate(`/home/restaurants/${r.id}`);
                  setSearchFocused(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">{r.name}</p>
                  <p className="text-[12px] font-medium text-muted-foreground truncate mt-0.5">
                    {Array.isArray(r.cuisines) ? r.cuisines.slice(0, 2).join(" · ") : r.cuisines}
                    {r.matchedDishes?.length > 0 && ` · ${r.matchedDishes[0]}`}
                  </p>
                </div>
                <span className="ml-auto text-primary font-bold shrink-0 text-sm">→</span>
              </button>
            ))}
            <button
              type="button"
              onMouseDown={() => goToSearch(searchQuery)}
              className="w-full px-4 py-3 text-sm font-semibold text-primary border-t border-border/50 hover:bg-primary/5"
            >
              See all results for &quot;{searchQuery.trim()}&quot;
            </button>
          </div>
        )}
      </div>

      {/* Actions: compact location · notifications · theme */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("openLocationSidebar"))}
          title={locationLabel}
          className="elevated-icon-btn h-11 rounded-2xl flex items-center gap-2 text-[13px] font-bold text-foreground hover:-translate-y-0.5 transition-all px-3 xl:w-11 xl:px-0 xl:justify-center"
        >
          <FaMapMarkerAlt size={14} className="text-primary shrink-0" />
          <span className="max-w-[88px] truncate xl:hidden">{locationLabel}</span>
          <FaChevronDown size={9} className="text-muted-foreground xl:hidden" />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={openNotifs}
            aria-label="Notifications"
            className="elevated-icon-btn relative w-11 h-11 rounded-2xl flex items-center justify-center text-foreground hover:-translate-y-0.5 transition-all"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-[var(--color-bg-card)]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 elevated-panel overflow-hidden z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Notifications</p>
                <span className="text-[11px] text-muted-foreground">{notifications.length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                    You&apos;re all caught up
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 border-b border-border/40 last:border-0 hover:bg-primary/5"
                    >
                      <p className="text-xs font-bold text-foreground">{n.title || "Update"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message || n.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="elevated-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center hover:-translate-y-0.5 transition-all"
        >
          {isDark ? (
            <FiSun size={18} className="text-amber-400" />
          ) : (
            <FiMoon size={18} className="text-foreground/70" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardTopBar;
