import { searchLocations } from "../services/locationService";

/**
 * Resolve browse location consistently — pincode search first (same as typing pincode in location bar).
 * Saved addresses often had wrong lat/lng from fuzzy full-address geocoding (e.g. near Ayodhya seed data).
 */
export const resolveBrowseLocationFromAddress = async ({
  street,
  city,
  state,
  pincode,
  addressLine,
  lat,
  lng,
}) => {
  const pin = String(pincode || "").trim();

  if (/^\d{6}$/.test(pin)) {
    const res = await searchLocations(pin);
    const pick = res.data.results?.[0];
    if (pick) {
      return { lat: pick.lat, lng: pick.lng, address: pick.displayName };
    }
  }

  const query = addressLine || [street, city, state, pincode].filter(Boolean).join(", ");
  if (query.trim()) {
    const res = await searchLocations(query.trim());
    const pick = res.data.results?.[0];
    if (pick) {
      return { lat: pick.lat, lng: pick.lng, address: pick.displayName };
    }
  }

  if (lat != null && lng != null && !(Number(lat) === 0 && Number(lng) === 0)) {
    return { lat: Number(lat), lng: Number(lng), address: addressLine || query };
  }

  return null;
};
