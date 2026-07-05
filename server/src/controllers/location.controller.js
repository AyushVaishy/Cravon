const prisma = require("../config/prisma");
const { searchLocations, reverseGeocode } = require("../services/geocodingService");
const {
  autocompletePlaces,
  getPlaceDetails,
  isGooglePlacesEnabled,
} = require("../services/googlePlacesService");
const {
  haversineKm,
  BROWSE_RADIUS_KM,
  DELIVERY_RADIUS_KM,
  isValidCoord,
} = require("../utils/geo");

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ message: "Query q is required" });

    const query = q.trim();
    const googleResults = await autocompletePlaces(query);
    if (googleResults?.length) {
      return res.json({ results: googleResults, provider: "google" });
    }

    const results = await searchLocations(query);
    res.json({ results, provider: "nominatim" });
  } catch (err) {
    next(err);
  }
};

const placeDetails = async (req, res, next) => {
  try {
    const { placeId } = req.query;
    if (!placeId?.trim()) return res.status(400).json({ message: "placeId is required" });

    const details = await getPlaceDetails(placeId.trim());
    if (!details) return res.status(404).json({ message: "Place not found" });
    res.json({ place: details, provider: "google" });
  } catch (err) {
    next(err);
  }
};

const mapsConfig = async (req, res) => {
  res.json({
    googlePlacesEnabled: isGooglePlacesEnabled(),
    googleMapsJsKey: process.env.GOOGLE_MAPS_JS_KEY || process.env.GOOGLE_MAPS_API_KEY || null,
  });
};

const reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!isValidCoord(lat, lng)) return res.status(400).json({ message: "Valid lat and lng are required" });
    const result = await reverseGeocode(Number(lat), Number(lng));
    if (!result) return res.status(404).json({ message: "Could not resolve this location" });
    res.json({ location: result });
  } catch (err) {
    next(err);
  }
};

const checkServiceability = async (req, res, next) => {
  try {
    const { restaurantId, lat, lng, pincode } = req.query;

    if (!isValidCoord(lat, lng) && !pincode) {
      return res.status(400).json({ message: "Provide lat/lng or pincode" });
    }

    let deliveryLat = Number(lat);
    let deliveryLng = Number(lng);

    if (!isValidCoord(deliveryLat, deliveryLng) && pincode) {
      const pinResults = await searchLocations(String(pincode).trim());
      if (!pinResults.length) {
        return res.json({
          serviceable: false,
          message: "Could not verify this pincode. Try a more specific address.",
        });
      }
      deliveryLat = pinResults[0].lat;
      deliveryLng = pinResults[0].lng;
    }

    if (restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true, lat: true, lng: true, isOpen: true, isApproved: true, city: true },
      });

      if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
      if (!restaurant.isOpen || !restaurant.isApproved) {
        return res.json({
          serviceable: false,
          message: "This restaurant is not available for orders right now.",
          distanceKm: null,
          maxDeliveryKm: DELIVERY_RADIUS_KM,
        });
      }

      const distanceKm = haversineKm(deliveryLat, deliveryLng, restaurant.lat, restaurant.lng);
      const serviceable = distanceKm <= DELIVERY_RADIUS_KM;

      return res.json({
        serviceable,
        distanceKm: Math.round(distanceKm * 10) / 10,
        maxDeliveryKm: DELIVERY_RADIUS_KM,
        restaurantName: restaurant.name,
        message: serviceable
          ? `Delivery available (${Math.round(distanceKm * 10) / 10} km away)`
          : `Sorry, ${restaurant.name} doesn't deliver to this address (${Math.round(distanceKm * 10) / 10} km away). Max delivery range is ${DELIVERY_RADIUS_KM} km.`,
      });
    }

    // Area serviceability: any restaurant within browse radius?
    const restaurants = await prisma.restaurant.findMany({
      where: { isOpen: true, isApproved: true },
      select: { id: true, name: true, lat: true, lng: true },
    });

    const nearby = restaurants
      .map((r) => ({
        ...r,
        distanceKm: haversineKm(deliveryLat, deliveryLng, r.lat, r.lng),
      }))
      .filter((r) => r.distanceKm <= BROWSE_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      serviceable: nearby.length > 0,
      restaurantCount: nearby.length,
      browseRadiusKm: BROWSE_RADIUS_KM,
      nearestKm: nearby[0] ? Math.round(nearby[0].distanceKm * 10) / 10 : null,
      message:
        nearby.length > 0
          ? `${nearby.length} restaurant(s) deliver to this area`
          : `No restaurants deliver to this area yet. Try a nearby city (within ${BROWSE_RADIUS_KM} km).`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { search, reverse, placeDetails, mapsConfig, checkServiceability };
