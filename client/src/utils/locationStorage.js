export const LOCATION_KEY = "cravon_location";
export const RECENT_LOCATIONS_KEY = "cravon_recent_locations";
export const BROWSE_RADIUS_KM = 15;

export const DEFAULT_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  address: "Bengaluru, Karnataka",
};

export const loadBrowseLocation = () => {
  try {
    const saved = localStorage.getItem(LOCATION_KEY) || localStorage.getItem("quickbite_location");
    const parsed = saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    localStorage.setItem(LOCATION_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return DEFAULT_LOCATION;
  }
};

export const saveBrowseLocation = (loc) => {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
};

export const loadRecentLocations = () => {
  try {
    const raw = localStorage.getItem(RECENT_LOCATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addRecentLocation = (loc) => {
  if (!loc?.address || !loc?.lat || !loc?.lng) return;
  const entry = {
    lat: loc.lat,
    lng: loc.lng,
    address: loc.address,
    placeId: loc.placeId || null,
  };
  const prev = loadRecentLocations().filter(
    (r) => r.address !== entry.address && !(r.lat === entry.lat && r.lng === entry.lng)
  );
  const next = [entry, ...prev].slice(0, 5);
  try {
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
};

export const labelForAddress = (label) => {
  if (label === "Home") return "🏠";
  if (label === "Work") return "💼";
  return "📍";
};
