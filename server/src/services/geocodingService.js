const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "CravonFoodApp/1.0 (contact@cravon.com)";

const nominatimFetch = async (path) => {
  const res = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
    },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  return res.json();
};

const cleanDisplayName = (name = "") => name.replace(/,\s*India\s*$/, "").trim();

const searchLocations = async (query) => {
  const q = String(query || "").trim();
  if (!q) return [];

  const indiaVB = "&viewbox=68.7,8.4,97.25,37.6&bounded=0";
  const path = /^\d{6}$/.test(q)
    ? `/search?postalcode=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=8${indiaVB}`
    : `/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=8${indiaVB}`;

  const data = await nominatimFetch(path);
  return (data || [])
    .filter((r) => !r.address?.country_code || r.address.country_code === "in")
    .map((r) => ({
      placeId: r.place_id,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: cleanDisplayName(r.display_name),
      rawName: r.display_name,
    }));
};

const reverseGeocode = async (lat, lng) => {
  const data = await nominatimFetch(
    `/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`
  );
  if (!data?.display_name) return null;
  return {
    lat: Number(lat),
    lng: Number(lng),
    displayName: cleanDisplayName(data.display_name),
    rawName: data.display_name,
  };
};

const geocodeAddressParts = async ({ street, city, state, pincode }) => {
  const pin = String(pincode || "").trim();
  // Pincode geocoding is more precise than a free-text address search
  if (/^\d{6}$/.test(pin)) {
    const pinResults = await searchLocations(pin);
    if (pinResults.length > 0) {
      return { lat: pinResults[0].lat, lng: pinResults[0].lng };
    }
  }

  const parts = [street, city, state, pincode, "India"].filter(Boolean).join(", ");
  if (!parts.trim()) return null;

  const results = await searchLocations(parts);
  if (results.length === 0) return null;

  const match =
    (pin && results.find((r) => r.rawName?.includes(pin))) ||
    results[0];

  return { lat: match.lat, lng: match.lng };
};

module.exports = {
  searchLocations,
  reverseGeocode,
  geocodeAddressParts,
  cleanDisplayName,
};
