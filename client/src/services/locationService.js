import api from "./api";

export const searchLocations = (q) => api.get("/location/search", { params: { q } });

export const getPlaceDetails = (placeId) =>
  api.get("/location/place", { params: { placeId } });

export const getMapsConfig = () => api.get("/location/maps-config");

export const reverseGeocode = (lat, lng) =>
  api.get("/location/reverse", { params: { lat, lng } });

export const checkServiceability = ({ restaurantId, lat, lng, pincode }) =>
  api.get("/location/serviceability", {
    params: { restaurantId, lat, lng, pincode },
  });

export const checkAreaServiceability = ({ lat, lng, pincode }) =>
  api.get("/location/serviceability", { params: { lat, lng, pincode } });
