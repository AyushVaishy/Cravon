import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const DashboardTopBar = ({ location, isDark, toggleTheme }) => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recent, setRecent] = useState(loadRecentSearches);
  const [trending, setTrending] = useState([]);

  const searchRef = useRef(null);

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

  const locationLabel = location?.savedLabel || (location?.address ? location.address.split(",")[0] : "Your Location");

  const glassClasses =
    "bg-white/40 dark:bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]";

  const showAssist = searchFocused && !searchQuery.trim();
  const showSuggestions = searchFocused && searchQuery.trim() && suggestions.length > 0;

  return (
    <div className="sticky top-0 z-40 px-6 md:px-8 py-3 flex items-center justify-between gap-4 md:gap-6 bg-transparent">
      <div className="relative flex-1 max-w-2xl" ref={searchRef}>
        <form onSubmit={handleSearch}>
          <div
            className={`flex items-center px-1.5 h-11 rounded-full ${glassClasses} transition-all duration-300 ${
              searchFocused ? "ring-2 ring-white/80 dark:ring-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]" : ""
            }`}
          >
            <input
              type="text"
              placeholder="Search restaurants, dishes, cuisines…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="flex-1 h-full bg-transparent border-none outline-none text-[14px] font-semibold px-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            {supported && (
              <button
                type="button"
                onClick={startVoice}
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-1 transition-all ${
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mr-2 font-bold"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-white/80 dark:bg-[#2A2A2A]/80 shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#333] hover:scale-105 transition-all"
              aria-label="Search"
            >
              <FaSearch size={12} />
            </button>
          </div>
        </form>

        {showAssist && (
          <div
            className={`absolute top-14 left-0 right-0 rounded-3xl overflow-hidden z-50 animate-slide-up ${glassClasses} !bg-white/70 dark:!bg-[#1A1A1A]/80 max-h-[70vh] overflow-y-auto`}
          >
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
          <div
            className={`absolute top-14 left-0 right-0 rounded-3xl overflow-hidden z-50 animate-slide-up ${glassClasses} !bg-white/70 dark:!bg-[#1A1A1A]/80`}
          >
            {suggestions.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => {
                  navigate(`/home/restaurants/${r.id}`);
                  setSearchFocused(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/40 dark:hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-gray-100/50 dark:bg-gray-800/50">
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
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{r.name}</p>
                  <p className="text-[12px] font-medium text-gray-600 dark:text-gray-400 truncate mt-0.5">
                    {Array.isArray(r.cuisines) ? r.cuisines.slice(0, 2).join(" · ") : r.cuisines}
                    {r.matchedDishes?.length > 0 && ` · ${r.matchedDishes[0]}`}
                  </p>
                </div>
                <span className="ml-auto text-[#FF5A5F] font-bold shrink-0 text-sm">→</span>
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

      <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
        <button
          type="button"
          className={`hidden sm:flex w-11 h-11 rounded-full ${glassClasses} items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105 transition-all`}
        >
          <FiBell size={18} />
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("openLocationSidebar"))}
          className={`h-11 px-4 rounded-full ${glassClasses} flex items-center gap-2 text-[14px] font-bold text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105 transition-all shrink-0`}
        >
          <FaMapMarkerAlt size={14} className="text-[#FF5A5F]" />
          <span className="max-w-[100px] truncate hidden md:inline">{locationLabel}</span>
          <FaChevronDown size={10} className="text-gray-500 ml-0.5" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`w-11 h-11 rounded-full ${glassClasses} flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105 transition-all shrink-0`}
        >
          {isDark ? (
            <FiSun size={18} className="text-amber-400" />
          ) : (
            <FiMoon size={18} className="text-indigo-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardTopBar;
