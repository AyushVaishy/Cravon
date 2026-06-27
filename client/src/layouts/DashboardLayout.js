import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FaSearch, FaMapMarkerAlt, FaEdit, FaTrash } from "react-icons/fa";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";
import ChatWidget from "../components/ChatWidget";
import SignInSidebar from "../components/SignInSidebar";

const DEFAULT_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  address: "Bengaluru, Karnataka",
};

const DEFAULT_ADDRESSES = [
  {
    label: "Home",
    address: "Shri Ram Pg Near Shiv Dairy, Maktulpuri, Roorkee, Uttarakhand 247667, India",
    lat: 29.8542626,
    lng: 77.8880002,
  },
  {
    label: "Work",
    address: "Ff, Pocket E, Sarita Vihar, New Delhi, Delhi 110076, India",
    lat: 28.546568,
    lng: 77.29187,
  },
];

const cleanDisplayName = (name = "") =>
  name.replace(/,\s*India\s*$/, "").trim();

// ── Location Sidebar Panel ─────────────────────────────────────────────────────
const LocationPanel = ({ isOpen, onClose, location, setLocation }) => {
  const [searchAddress,   setSearchAddress]   = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [recentSearches,  setRecentSearches]  = useState([]);
  const [savedAddresses,  setSavedAddresses]  = useState(DEFAULT_ADDRESSES);
  const [editIdx,         setEditIdx]         = useState(null);
  const [editLabel,       setEditLabel]       = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const debouncedSearch = useCallback(async (query) => {
    const q = query.trim();
    if (!q) { setSearchResults([]); setError(""); return; }
    setLoading(true);
    setError("");
    try {
      const indiaVB = "&viewbox=68.7,8.4,97.25,37.6&bounded=0";
      const url = /^\d{6}$/.test(q)
        ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=8${indiaVB}`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=8${indiaVB}`;
      const res  = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      const india = (data || []).filter(
        (r) => !r.address?.country_code || r.address.country_code === "in"
      );
      if (india.length === 0) {
        setError("No results found. Try a city or area name.");
        setSearchResults([]);
      } else {
        setSearchResults(india);
        setError("");
      }
    } catch { setError("Failed to fetch location. Try again."); setSearchResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => debouncedSearch(searchAddress), 300);
    return () => clearTimeout(t);
  }, [searchAddress, debouncedSearch]);

  const handleAddressSelect = (result) => {
    onClose();
    setSearchAddress("");
    setSearchResults([]);
    setLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: cleanDisplayName(result.display_name),
    });
    setRecentSearches((prev) => {
      const exists = prev.find((r) => r.display_name === result.display_name);
      if (exists) return [result, ...prev.filter((r) => r.display_name !== result.display_name)];
      return [result, ...prev.slice(0, 4)];
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setLocation({ lat: latitude, lng: longitude, address: cleanDisplayName(data.display_name) });
            onClose();
            toast.success("📍 Location detected!");
          } else {
            toast.error("Could not determine your location name");
          }
        } catch { toast.error("Failed to detect location"); }
        setLoading(false);
      },
      () => { setLoading(false); toast.error("Location access denied."); },
      { timeout: 10000 }
    );
  };

  const removeSaved = (idx) => setSavedAddresses((prev) => prev.filter((_, i) => i !== idx));
  const saveLabel   = (idx) => { setSavedAddresses((prev) => prev.map((a, i) => i === idx ? { ...a, label: editLabel } : a)); setEditIdx(null); };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[400px] max-w-[95vw] bg-card shadow-2xl z-[9999] transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-primary/80 text-white p-6 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaMapMarkerAlt /> Choose Location
            </h2>
            <button onClick={onClose} className="text-2xl leading-none hover:opacity-70 transition-opacity">×</button>
          </div>
          <p className="text-sm text-white/80">Select your delivery address</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* GPS */}
          <button
            onClick={handleDetectLocation}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/30 rounded-xl text-primary font-semibold text-sm hover:bg-primary/10 transition"
          >
            <span className="text-lg">📍</span>
            <div className="text-left">
              <div>Use my current location</div>
              <div className="text-xs font-normal text-primary/70">Using GPS</div>
            </div>
          </button>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for area, city, landmark..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="animate-spin w-4 h-4 rounded-full border-b-2 border-primary" />
              Searching…
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Search Results</p>
              {searchResults.map((result) => (
                <div
                  key={result.place_id}
                  onClick={() => handleAddressSelect(result)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaMapMarkerAlt className="text-primary text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{result.display_name.split(",")[0]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cleanDisplayName(result.display_name)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved addresses */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Saved Addresses</p>
            {savedAddresses.map((addr, idx) => (
              <div
                key={addr.label + idx}
                className={`p-3 rounded-xl border-2 transition-all ${
                  location.address === addr.address
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => { setLocation({ lat: addr.lat, lng: addr.lng, address: addr.address }); onClose(); }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{addr.label === "Home" ? "🏠" : addr.label === "Work" ? "💼" : "📍"}</span>
                      {editIdx === idx ? (
                        <input
                          className="input-base py-0.5 px-2 text-sm w-24"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onBlur={() => saveLabel(idx)}
                          onKeyDown={(e) => e.key === "Enter" && saveLabel(idx)}
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold text-sm text-foreground">{addr.label}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pl-6 leading-relaxed">{addr.address}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => { setEditIdx(idx); setEditLabel(addr.label); }}
                      className="p-1.5 rounded-full hover:bg-primary/10 text-primary transition-colors"
                    >
                      <FaEdit size={11} />
                    </button>
                    <button
                      onClick={() => removeSaved(idx)}
                      className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Recent</p>
              {recentSearches.map((result, idx) => (
                <div
                  key={result.place_id + idx}
                  onClick={() => handleAddressSelect(result)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <FaMapMarkerAlt className="text-muted-foreground text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{result.display_name.split(",")[0]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cleanDisplayName(result.display_name)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── DashboardLayout ────────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const routeLocation = useLocation();
  const isHomePage = routeLocation.pathname === "/home" || routeLocation.pathname === "/home/";

  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("cravon_location") || localStorage.getItem("quickbite_location");
      const parsed = saved ? JSON.parse(saved) : DEFAULT_LOCATION;
      localStorage.setItem("cravon_location", JSON.stringify(parsed));
      return parsed;
    } catch { return DEFAULT_LOCATION; }
  });

  const [isDark,        setIsDark]        = useState(false);
  const [locationOpen,  setLocationOpen]  = useState(false);
  const [signInOpen,    setSignInOpen]    = useState(false);
  const [signInTab,     setSignInTab]     = useState("login");

  const handleSetLocation = (loc) => {
    setLocation(loc);
    try { localStorage.setItem("cravon_location", JSON.stringify(loc)); } catch {}
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Initialise theme from storage / system pref
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  // Listen for location sidebar open event (fired from other components)
  useEffect(() => {
    const handler = () => setLocationOpen(true);
    window.addEventListener("openLocationSidebar", handler);
    return () => window.removeEventListener("openLocationSidebar", handler);
  }, []);

  // Listen for sign-in open event
  useEffect(() => {
    const handler = (e) => {
      const tab = e?.detail?.tab || "login";
      setSignInTab(tab);
      setSignInOpen(true);
    };
    window.addEventListener("openSignIn", handler);
    return () => window.removeEventListener("openSignIn", handler);
  }, []);

  return (
    <div className="dashboard-root flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <DashboardSidebar isDark={isDark} />

      {/* Main area – offset by sidebar on desktop */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-[96px] md:mr-[16px] mb-16 md:mb-0">
        {/* Top bar */}
        {isHomePage && (
          <DashboardTopBar
            location={location}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        )}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet context={{ location, setLocation: handleSetLocation }} />
        </main>
      </div>

      {/* Overlays */}
      <LocationPanel
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        location={location}
        setLocation={handleSetLocation}
      />
      <SignInSidebar isOpen={signInOpen} onClose={() => setSignInOpen(false)} initialTab={signInTab} />

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default DashboardLayout;
