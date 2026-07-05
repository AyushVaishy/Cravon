/** Haversine distance in km between two lat/lng points */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const BROWSE_RADIUS_KM = Number(process.env.BROWSE_RADIUS_KM || 15);
const DELIVERY_RADIUS_KM = Number(process.env.DELIVERY_RADIUS_KM || 12);

const isValidCoord = (lat, lng) =>
  lat != null &&
  lng != null &&
  !Number.isNaN(Number(lat)) &&
  !Number.isNaN(Number(lng)) &&
  !(Number(lat) === 0 && Number(lng) === 0);

const filterByRadius = (items, lat, lng, radiusKm, getCoords = (item) => item) => {
  if (!isValidCoord(lat, lng)) return items;
  return items
    .map((item) => {
      const coords = getCoords(item);
      const distanceKm = haversineKm(Number(lat), Number(lng), coords.lat, coords.lng);
      return { item, distanceKm };
    })
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map(({ item, distanceKm }) => ({ ...item, distanceKm: Math.round(distanceKm * 10) / 10 }));
};

module.exports = {
  haversineKm,
  BROWSE_RADIUS_KM,
  DELIVERY_RADIUS_KM,
  isValidCoord,
  filterByRadius,
};
