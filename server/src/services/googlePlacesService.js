const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

const cleanDisplayName = (name = "") => name.replace(/,\s*India\s*$/, "").trim();

const googleFetch = async (path) => {
  if (!GOOGLE_KEY) return null;
  const res = await fetch(`${path}${path.includes("?") ? "&" : "?"}key=${GOOGLE_KEY}`);
  if (!res.ok) throw new Error(`Google Places failed (${res.status})`);
  return res.json();
};

const autocompletePlaces = async (query) => {
  const q = String(query || "").trim();
  if (!q || !GOOGLE_KEY) return null;

  const data = await googleFetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:in&language=en`
  );
  if (data?.status !== "OK" && data?.status !== "ZERO_RESULTS") return null;

  return (data.predictions || []).map((p) => ({
    placeId: p.place_id,
    displayName: cleanDisplayName(p.description),
    rawName: p.description,
    source: "google",
  }));
};

const getPlaceDetails = async (placeId) => {
  if (!placeId || !GOOGLE_KEY) return null;

  const data = await googleFetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry,formatted_address,address_component`
  );
  if (data?.status !== "OK" || !data.result?.geometry?.location) return null;

  const { lat, lng } = data.result.geometry.location;
  const components = data.result.address_components || [];

  const pick = (type) => components.find((c) => c.types.includes(type))?.long_name || "";
  const pincode = pick("postal_code");
  const city =
    pick("locality") || pick("administrative_area_level_2") || pick("sublocality") || "";
  const state = pick("administrative_area_level_1") || "";
  const street =
    [pick("premise"), pick("sublocality_level_1"), pick("route")]
      .filter(Boolean)
      .join(", ") || pick("neighborhood") || "";

  return {
    placeId,
    lat,
    lng,
    displayName: cleanDisplayName(data.result.formatted_address || ""),
    rawName: data.result.formatted_address || "",
    street,
    city,
    state,
    pincode,
    source: "google",
  };
};

const isGooglePlacesEnabled = () => Boolean(GOOGLE_KEY);

module.exports = {
  autocompletePlaces,
  getPlaceDetails,
  isGooglePlacesEnabled,
  cleanDisplayName,
};
