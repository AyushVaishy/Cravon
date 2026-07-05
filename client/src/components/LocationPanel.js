import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaSearch, FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
import { searchLocations, reverseGeocode, getPlaceDetails } from "../services/locationService";
import { getAddresses } from "../services/addressService";
import { resolveBrowseLocationFromAddress } from "../utils/resolveBrowseLocation";
import {
  addRecentLocation,
  loadRecentLocations,
  labelForAddress,
} from "../utils/locationStorage";

const LocationPanel = ({ isOpen, onClose, location, setLocation }) => {
  const isAuthenticated =
    useSelector((s) => s.auth.isAuthenticated) || !!localStorage.getItem("accessToken");

  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentLocations, setRecentLocations] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 150);
    setRecentLocations(loadRecentLocations());

    if (isAuthenticated) {
      getAddresses()
        .then((res) => {
          const list = (res.data.addresses || []).map((a) => ({
            id: a.id,
            label: a.label,
            street: a.street,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            address: [a.street, a.city, a.state, a.pincode].filter(Boolean).join(", "),
            lat: a.lat,
            lng: a.lng,
            contactName: a.contactName,
            contactPhone: a.contactPhone,
            isDefault: a.isDefault,
          }));
          setSavedAddresses(list);
        })
        .catch(() => setSavedAddresses([]));
    } else {
      setSavedAddresses([]);
    }
  }, [isOpen, isAuthenticated]);

  const applyLocation = (loc) => {
    const next = { ...loc };
    if (!next.addressId) {
      next.addressId = null;
      next.savedLabel = null;
    }
    setLocation(next);
    addRecentLocation(next);
    setRecentLocations(loadRecentLocations());
    onClose();
    setSearchAddress("");
    setSearchResults([]);
  };

  const isSavedAddressSelected = (addr) => location?.addressId === addr.id;

  const handleSavedAddressSelect = async (addr) => {
    setLoading(true);
    setError("");
    try {
      const resolved = await resolveBrowseLocationFromAddress({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        addressLine: addr.address,
        lat: addr.lat,
        lng: addr.lng,
      });
      if (!resolved) {
        toast.error("Could not resolve this address. Try searching by pincode.");
        return;
      }
      applyLocation({
        ...resolved,
        addressId: addr.id,
        savedLabel: addr.label,
        savedAddressLine: addr.address,
      });
    } catch {
      toast.error("Failed to load this address location");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(async (query) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await searchLocations(q);
      const results = res.data.results || [];
      if (results.length === 0) {
        setError("No results found. Try a city, area, or 6-digit pincode.");
        setSearchResults([]);
      } else {
        setSearchResults(results);
        setError("");
      }
    } catch {
      setError("Failed to fetch location. Try again.");
      setSearchResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => debouncedSearch(searchAddress), 350);
    return () => clearTimeout(t);
  }, [searchAddress, debouncedSearch]);

  const handleResultSelect = async (result) => {
    if (result.placeId && (result.lat == null || result.lng == null)) {
      setLoading(true);
      try {
        const res = await getPlaceDetails(result.placeId);
        const place = res.data.place;
        applyLocation({
          lat: place.lat,
          lng: place.lng,
          address: place.displayName,
          placeId: place.placeId,
          addressId: null,
          savedLabel: null,
        });
      } catch {
        toast.error("Could not load place details. Try another result.");
      } finally {
        setLoading(false);
      }
      return;
    }

    applyLocation({
      lat: result.lat,
      lng: result.lng,
      address: result.displayName,
      placeId: result.placeId,
      addressId: null,
      savedLabel: null,
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await reverseGeocode(latitude, longitude);
          const loc = res.data.location;
          if (loc?.displayName) {
            applyLocation({
              lat: loc.lat,
              lng: loc.lng,
              address: loc.displayName,
              addressId: null,
              savedLabel: null,
            });
            toast.success("Location detected!");
          } else {
            toast.error("Could not determine your location name");
          }
        } catch {
          toast.error("Failed to detect location");
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error("Location access denied.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[400px] max-w-[95vw] bg-card shadow-2xl z-[9999] transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="bg-primary/90 text-white p-6 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaMapMarkerAlt /> Choose location
            </h2>
            <button type="button" onClick={onClose} className="text-2xl leading-none hover:opacity-70">
              ×
            </button>
          </div>
          <p className="text-sm text-white/80">Where should we show restaurants and deliver?</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/30 rounded-xl text-primary font-semibold text-sm hover:bg-primary/10 transition disabled:opacity-60"
          >
            <span className="text-lg">📍</span>
            <div className="text-left">
              <div>Use my current location</div>
              <div className="text-xs font-normal text-primary/70">GPS + reverse geocode</div>
            </div>
          </button>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search area, city, landmark, pincode…"
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

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Results</p>
              {searchResults.map((result) => (
                <button
                  key={result.placeId || `${result.lat}-${result.lng}`}
                  type="button"
                  onClick={() => handleResultSelect(result)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaMapMarkerAlt className="text-primary text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {result.displayName.split(",")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{result.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Saved addresses</p>
              {savedAddresses.map((addr) => {
                const selected = isSavedAddressSelected(addr);
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSavedAddressSelect(addr)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{labelForAddress(addr.label)}</span>
                        <span className="font-semibold text-sm text-foreground truncate">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      {selected && (
                        <FaCheckCircle className="text-primary shrink-0" aria-label="Selected" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pl-6 leading-relaxed">{addr.address}</p>
                    {(addr.contactName || addr.contactPhone) && (
                      <p className="text-[11px] text-muted-foreground pl-6 mt-1">
                        📞 {addr.contactName || "—"}
                        {addr.contactPhone ? ` · ${addr.contactPhone}` : ""}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Sign in to use saved delivery addresses here.
            </p>
          )}

          {recentLocations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Recent</p>
              {recentLocations.map((entry) => (
                <button
                  key={`${entry.lat}-${entry.lng}-${entry.address}`}
                  type="button"
                  onClick={() => applyLocation(entry)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <FaMapMarkerAlt className="text-muted-foreground text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {entry.address.split(",")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LocationPanel;
