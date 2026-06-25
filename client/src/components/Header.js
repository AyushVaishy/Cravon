import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { performLogout } from "../utils/authHelpers";
import { selectUnreadCount, selectNotifications, markAllRead, clearNotifications } from "../store/notificationsSlice";
import toast from "react-hot-toast";
import { FaShoppingCart, FaTrash, FaEdit, FaPlus, FaSearch, FaMapMarkerAlt, FaUserCircle, FaStore } from "react-icons/fa";
import { FiLogIn, FiLogOut, FiSun, FiMoon } from "react-icons/fi";
import SignInSidebar from './SignInSidebar';
import { getAddresses, deleteAddress as deleteAddressAPI } from '../services/addressService';


const GET_LOCATION_API_URL =
  "https://india-pincode-with-latitude-and-longitude.p.rapidapi.com/api/v1/pincode/";
const apiKey = process.env.REACT_APP_RAPIDAPI_KEY || "";

// Since all location results are from India (countrycodes=in), strip ", India" suffix
const cleanDisplayName = (name = "") => name.replace(/,\s*India\s*$/, "").trim();

const DEFAULT_ADDRESSES = [
  {
    label: "Home",
    address:
      "Shri Ram Pg Near Shiv Dairy Chappan Bhog, Maktulpuri, Mathura Vihar Colony, Nehru Nagar, Roorkee, Uttarakhand 247667, India",
    lat: 29.8542626,
    lng: 77.8880002,
  },
  {
    label: "Work",
    address: "Ff, Pocket E, Sarita Vihar, New Delhi, Delhi 110076, India",
    lat: 28.546568,
    lng: 77.291870,
  },
];

const Header = ({ location, setLocation }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const user = useSelector((s) => s.auth.user);
  const cartItems = useSelector((store) => store.cart.items);
  const displayUser = user || userData;
  const cartTotalQty = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState(DEFAULT_ADDRESSES);
  const [editIdx, setEditIdx] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggest, setSearchSuggest] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchPanelRef = useRef(null);
  const notifRef = useRef(null);

  const unreadCount = useSelector(selectUnreadCount);
  const notifications = useSelector(selectNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const brandIcon = `${process.env.PUBLIC_URL}/${isDark ? "cravon_dark_mode_icon.png" : "cravon_light_mode_icon.png"}`;

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const isSixDigitPincode = /^\d{6}$/.test(trimmed);
        // India bounding box for viewbox bias; countrycodes=in is the hard filter
        const indiaViewbox = "&viewbox=68.7,8.4,97.25,37.6&bounded=0";
        const url = isSixDigitPincode
          ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(trimmed)}&countrycodes=in&format=json&addressdetails=1&limit=8${indiaViewbox}`
          : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&countrycodes=in&format=json&addressdetails=1&limit=8${indiaViewbox}`;

        const response = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
          },
        });
        const data = await response.json();
        // Client-side safety filter: only show Indian results
        const indiaOnly = (data || []).filter(
          (r) => !r.address?.country_code || r.address.country_code === "in"
        );
        if (indiaOnly.length === 0) {
          setError("No results found. Try a city or area name within India.");
          setSearchResults([]);
        } else {
          setSearchResults(indiaOnly);
          setError("");
        }
      } catch (err) {
        setError("Failed to fetch location. Try again.");
        setSearchResults([]);
      }
      setLoading(false);
    },
    []
  );

  // Effect for debounced search (from first character)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchAddress);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchAddress, debouncedSearch]);

  // Global search suggestions using Swiggy suggest endpoint when query changes
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchSuggest([]);
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      try {
        setSearchLoading(true);
        // Use own backend search API
        const searchUrl = `/api/restaurants/search?q=${encodeURIComponent(q)}&lat=${location.lat}&lng=${location.lng}`;
        const apiRes = await fetch(searchUrl, { signal: controller.signal });
        const data = await apiRes.json();
        const normalized = (data?.restaurants || []).slice(0, 12).map((r) => ({
          text: r.name,
          type: 'RESTAURANT',
          subTitle: Array.isArray(r.cuisines) ? r.cuisines.slice(0, 2).join(', ') : (r.cuisines || ''),
          cloudinaryId: null,
          cta: { link: `/home/restaurants/${r.id}` },
          id: r.id,
        }));
        setSearchSuggest(normalized);
      } catch (e) {
        if (e.name !== 'AbortError') setSearchSuggest([]);
      } finally {
        setSearchLoading(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [searchQuery, location.lat, location.lng]);

  // Focus search input when sidebar opens
  useEffect(() => {
    if (sidebarOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
    // Fetch saved addresses from API when sidebar opens (user is logged in)
    if (sidebarOpen && displayUser) {
      getAddresses()
        .then((res) => {
          const apiAddresses = (res.data.addresses || []).map((a) => ({
            id: a.id,
            label: a.label,
            address: `${a.street}, ${a.city}, ${a.state} ${a.pincode}`.trim(),
            lat: a.lat,
            lng: a.lng,
          }));
          if (apiAddresses.length > 0) {
            setSavedAddresses(apiAddresses);
          }
        })
        .catch(() => {}); // silently fail — keep DEFAULT_ADDRESSES as fallback
    }
  }, [sidebarOpen]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enableDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(enableDark);
    document.documentElement.classList.toggle('dark', enableDark);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  // Listen for global event to open the address sidebar (from other components)
  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    window.addEventListener('openLocationSidebar', handler);
    return () => window.removeEventListener('openLocationSidebar', handler);
  }, []);

  // Initialize user data from localStorage and listen for changes
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    }

    // Listen for storage changes (when user signs in from another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === 'userData') {
        if (e.newValue) {
          setUserData(JSON.parse(e.newValue));
        } else {
          setUserData(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for openSignIn event (dispatched from Sign In button)
  useEffect(() => {
    const handler = () => setSignInOpen(true);
    window.addEventListener('openSignIn', handler);
    return () => window.removeEventListener('openSignIn', handler);
  }, []);

  // Toggle dark mode and persist
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Handle logout
  const handleLogout = async () => {
    await performLogout(dispatch);
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  // Add to recent searches (avoid duplicates, most recent first)
  const addToRecentSearches = (result) => {
    setRecentSearches((prev) => {
      const exists = prev.find((r) => r.display_name === result.display_name);
      if (exists) {
        return [result, ...prev.filter((r) => r.display_name !== result.display_name)];
      }
      return [result, ...prev.slice(0, 4)];
    });
  };

  // Add current location to saved addresses
  const addCurrentToSaved = () => {
    if (!location.address) return;
    setSavedAddresses((prev) => {
      if (prev.find((a) => a.address === location.address)) return prev;
      return [
        ...prev,
        {
          label: `Saved ${prev.length + 1}`,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
        },
      ];
    });
  };

  // Remove saved address (calls API if has id, otherwise local only)
  const removeSavedAddress = (idx) => {
    const addr = savedAddresses[idx];
    if (addr?.id) {
      deleteAddressAPI(addr.id).catch(() => {});
    }
    setSavedAddresses((prev) => prev.filter((_, i) => i !== idx));
  };

  // Start editing label
  const startEditLabel = (idx, label) => {
    setEditIdx(idx);
    setEditLabel(label);
  };

  // Save edited label
  const saveEditLabel = (idx) => {
    setSavedAddresses((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, label: editLabel } : a))
    );
    setEditIdx(null);
    setEditLabel("");
  };

  // Handle address selection
  const handleAddressSelect = async (result) => {
    setSidebarOpen(false);
    setSearchAddress("");
    setSearchResults([]);
    setLoading(true);
    setError("");
    setLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: cleanDisplayName(result.display_name),
    });
    addToRecentSearches(result);
    setLoading(false);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setLocation({
              lat: latitude,
              lng: longitude,
              address: cleanDisplayName(data.display_name),
            });
            setSidebarOpen(false);
            toast.success("📍 Location detected!");
          } else {
            toast.error("Could not determine your location name");
          }
        } catch {
          toast.error("Failed to reverse geocode location");
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error("Location access denied. Please search manually.");
      },
      { timeout: 10000 }
    );
  };

  // Sidebar for address selection (inlined to avoid remount + focus loss)
  const addressSidebarContent = (
    <div className={`fixed top-0 left-0 h-full w-[400px] bg-card shadow-2xl z-[9999] transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-primary/50 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FaMapMarkerAlt className="text-3xl" />
              Choose Location
            </h2>
            <button
              className="text-2xl hover:text-primary/70 transition-colors duration-300"
              onClick={() => setSidebarOpen(false)}
            >
              &times;
            </button>
          </div>
          <p className="text-primary/80 text-sm">Select your delivery address to see available restaurants</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* GPS detect */}
          <button
            onClick={handleDetectLocation}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-primary/10 border border-primary/30 dark:border-primary/30 rounded-xl text-primary font-semibold text-sm hover:bg-primary/10 dark:hover:bg-primary/20 transition mb-4"
          >
            <span className="text-lg">📍</span>
            <div className="text-left">
              <div className="font-semibold">Use my current location</div>
              <div className="text-xs font-normal text-primary">Using GPS</div>
            </div>
          </button>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for area, city, landmark..."
                className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-300 text-foreground placeholder:text-muted-foreground bg-background"
                value={searchAddress}
                onChange={e => setSearchAddress(e.target.value)}
              />
            </div>
            {loading && (
              <div className="text-center text-primary text-sm mt-3 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Searching for locations...
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            </div>
          )}
          
          {/* Show search results */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FaSearch className="text-primary" />
                SEARCH RESULTS ({searchResults.length})
              </div>
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <div
                    key={result.place_id}
                    className="border border-border rounded-lg p-4 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 group bg-card"
                    onClick={() => handleAddressSelect(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <FaMapMarkerAlt className="text-primary text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {result.display_name.split(",")[0]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {cleanDisplayName(result.display_name)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Addresses */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary" />
              SAVED ADDRESSES ({savedAddresses.length})
            </div>
            <div className="space-y-2">
              {savedAddresses.map((addr, idx) => (
                <div
                  key={addr.label + idx}
                  className={`border-2 rounded-lg p-4 transition-all duration-300 bg-card ${
                    location.address === addr.address 
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setLocation({ lat: addr.lat, lng: addr.lng, address: addr.address });
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          addr.label === "Home" ? "bg-blue-100" : 
                          addr.label === "Work" ? "bg-green-100" : "bg-primary/10"
                        }`}>
                          {addr.label === "Home" ? (
                            <span className="text-blue-600 text-sm">🏠</span>
                          ) : addr.label === "Work" ? (
                            <span className="text-green-600 text-sm">💼</span>
                          ) : (
                            <span className="text-primary text-sm">📍</span>
                          )}
                        </div>
                        {editIdx === idx ? (
                          <input
                            className="border px-2 py-1 rounded text-sm font-semibold w-24 bg-background border-border text-foreground"
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            onBlur={() => saveEditLabel(idx)}
                            onKeyDown={e => e.key === "Enter" && saveEditLabel(idx)}
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-foreground">{addr.label}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed ml-11">
                        {addr.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        className="text-primary hover:text-primary p-2 hover:bg-primary/10 rounded-full transition-all duration-300"
                        title="Edit label"
                        onClick={() => startEditLabel(idx, addr.label)}
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-full transition-all duration-300"
                        title="Delete address"
                        onClick={() => removeSavedAddress(idx)}
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          
          {/* Recent Searches */}
          <div>
            <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary" />
              RECENT SEARCHES ({recentSearches.length})
            </div>
            {recentSearches.length === 0 ? (
              <div className="text-center text-muted-foreground dark:text-muted-foreground text-sm py-8">
                <FaMapMarkerAlt className="text-4xl mx-auto mb-2 text-muted-foreground dark:text-muted-foreground" />
                <p>No recent searches yet</p>
                <p className="text-xs">Your recent location searches will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((result, idx) => (
                  <div
                    key={result.place_id + idx}
                    className="border border-border rounded-lg p-4 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 group bg-card"
                    onClick={() => handleAddressSelect(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <FaMapMarkerAlt className="text-muted-foreground dark:text-muted-foreground text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {result.display_name.split(",")[0]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {cleanDisplayName(result.display_name)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Overlay for sidebar
  const SidebarOverlay = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={() => setSidebarOpen(false)}
    ></div>
  );

  return (
    <>
      <SignInSidebar isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
      {sidebarOpen && <SidebarOverlay />}
      {addressSidebarContent}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9997]" onClick={() => setIsSearchOpen(false)}></div>
      )}
      {isSearchOpen && (
        <div ref={searchPanelRef} className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-background border border-border rounded-2xl shadow-2xl z-[9998]">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for restaurants or dishes"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {searchLoading && (
              <div className="p-4 text-muted-foreground">Searching…</div>
            )}
            {!searchLoading && searchSuggest.length === 0 && (
              <div className="p-6 text-muted-foreground">Type to search restaurants or dishes</div>
            )}
            {!searchLoading && searchSuggest.length > 0 && (
              <ul>
                {searchSuggest.map((s, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const type = (s?.type || '').toUpperCase();
                      if (type === 'RESTAURANT' && s?.cta?.link) {
                        navigate(s.cta.link);
                        setIsSearchOpen(false);
                        return;
                      }
                      // For dishes, fallback to query route
                      const q = (s?.text || '').trim();
                      if (q) {
                        navigate(`/home/search?q=${encodeURIComponent(q)}`);
                      }
                      setIsSearchOpen(false);
                    }}
                  >
                    {s?.cloudinaryId ? (
                      <img
                        src={`https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_56,h_56/${s.cloudinaryId}`}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
                        {(s?.type === 'DISH' ? '🍽' : '🏬')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{s?.text || 'Result'}</div>
                      {s?.subTitle && (
                        <div className="text-xs text-muted-foreground truncate">{s.subTitle}</div>
                      )}
                    </div>
                    <div className="ml-auto text-xs px-2 py-1 rounded bg-section text-muted-foreground">
                      {(s?.type || '').toString().toLowerCase()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Simple & Beautiful Header */}
      <header className="bg-background shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Address Section */}
            <div className="flex items-center gap-6">
              {/* Simple Logo */}
              <Link to="/home" className="flex items-center gap-3">
                <img
                  src={brandIcon}
                  alt="Cravon Logo"
                  className="w-12 h-12 rounded-full"
                />
                <div className="hidden md:block">
                  <h1 className="text-2xl font-bold text-primary">CRAVON</h1>
                  {/* <p className="text-sm text-muted-foreground">Food Delivery</p> */}
                </div>
              </Link>

              {/* Simple & Beautiful Address Selector */}
              <button
                className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 text-primary dark:text-primary px-4 py-3 rounded-lg border border-primary/30 hover:border-primary/40 transition-all duration-300 min-w-0 sm:min-w-[240px] max-w-[350px]"
                onClick={() => setSidebarOpen(true)}
              >
                <FaMapMarkerAlt className="text-primary text-lg flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-primary dark:text-primary truncate">
                    {location.address ? location.address.split(",")[0] : "Select Location"}
                  </div>
                  <div className="text-xs text-primary dark:text-primary truncate">
                    {location.address || "Choose your delivery address"}
                  </div>
                </div>
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Dark mode toggle */}
              <button
                aria-label="Toggle dark mode"
                className="w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors"
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <FiSun className="text-yellow-400 text-xl" /> : <FiMoon className="text-muted-foreground text-xl" />}
              </button>

              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { setNotifOpen(v => !v); if (!notifOpen) dispatch(markAllRead()); }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card hover:bg-muted transition-colors"
                  aria-label="Notifications"
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="font-bold text-foreground text-sm">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => dispatch(clearNotifications())}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                          <div className="text-3xl mb-2">🔔</div>
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-border/50 dark:border-border last:border-0 cursor-pointer hover:bg-muted transition-colors ${!n.read ? 'bg-primary/5/60 dark:bg-primary/10' : ''}`}
                            onClick={() => { if (n.orderId) { setNotifOpen(false); navigate(`/home/orders/${n.orderId}`); } }}
                          >
                            <div className="flex items-start gap-2">
                              <div className="text-lg flex-shrink-0 mt-0.5">
                                {n.type === 'PLACED' ? '📋' : n.type === 'CONFIRMED' ? '✅' : n.type === 'PREPARING' ? '🍳' : n.type === 'OUT_FOR_DELIVERY' ? '🚚' : n.type === 'DELIVERED' ? '🎉' : n.type === 'CANCELLED' ? '❌' : '🔔'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-xs leading-tight">{n.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!n.read && <div className="w-2 h-2 bg-primary/50 rounded-full flex-shrink-0 mt-1" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
                             <nav className="hidden lg:flex items-center gap-4">
                 <Link
                   to="help"
                   className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-primary transition-colors duration-300"
                 >
                   <span>❓</span>
                   <span className="font-medium">Help</span>
                 </Link>
                 <Link
                   to="contact"
                   className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-primary transition-colors duration-300"
                 >
                   <span>📞</span>
                   <span className="font-medium">Contact</span>
                 </Link>
               </nav>
              <button
                className="hidden md:flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsSearchOpen(true)}
              >
                <FaSearch />
                <span className="font-medium">Search</span>
              </button>

               {/* Cart Icon with restaurant indicator */}
               <div className="flex flex-col items-center">
                 <Link to="/home/cart" className="relative">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors duration-300">
                    <FaShoppingCart className="text-xl text-primary" />
                  </div>
                  {cartTotalQty > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {cartTotalQty}
                    </span>
                  )}
                </Link>
                {cartItems.length > 0 && (
                  <span className="hidden lg:block text-xs text-primary font-medium truncate max-w-[120px]">
                    {cartItems[0]?.restaurantName}
                  </span>
                )}
               </div>

              {/* User Profile / Dropdown */}
               {displayUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(displayUser.name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')}
                    </div>
                    <span className="font-medium text-foreground max-w-[120px] truncate hidden md:block">
                      {displayUser.name?.split(" ")[0] || "Account"}
                    </span>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50" role="menu">
                      <div className="px-4 py-3 bg-primary/5 border-b border-border">
                        <p className="font-semibold text-foreground text-sm truncate">{displayUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{displayUser.email}</p>
                      </div>
                      <Link to="/home/profile" className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-primary/5 transition-colors" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                        <FaUserCircle className="text-primary flex-shrink-0" size={15} />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <Link to="/home/orders" className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-primary/5 transition-colors" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="text-base w-4 text-center flex-shrink-0">📦</span>
                        <span className="text-sm">My Orders</span>
                      </Link>
                      <Link to="/home/profile?tab=reviews" className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-primary/5 transition-colors" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="text-base w-4 text-center flex-shrink-0">⭐</span>
                        <span className="text-sm">My Reviews</span>
                      </Link>
                      <Link to="/home/profile?tab=settings" className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-primary/5 transition-colors" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="text-base w-4 text-center flex-shrink-0">⚙️</span>
                        <span className="text-sm">Settings</span>
                      </Link>
                      {(displayUser.role === 'RESTAURANT_OWNER' || displayUser.role === 'ADMIN') && (
                        <Link to="/owner" className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-primary/5 transition-colors" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                          <FaStore className="text-primary flex-shrink-0" size={14} />
                          <span className="text-sm">Owner Dashboard</span>
                        </Link>
                      )}
                      {displayUser.role === 'ADMIN' && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-primary/5 transition-colors" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>
                          <span className="text-base w-4 text-center flex-shrink-0">🛡️</span>
                          <span className="text-sm">Admin Panel</span>
                        </Link>
                      )}
                      <div className="border-t border-border" />
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors" onClick={handleLogout} role="menuitem">
                        <FiLogOut size={14} className="flex-shrink-0" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSignInOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/50 hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow text-sm"
                >
                  <FiLogIn />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <SignInSidebar isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
};

export default Header;
