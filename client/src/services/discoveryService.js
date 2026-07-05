import api from "./api";

export const getPromoBanners = () => api.get("/discovery/banners");

export const getPopularDishes = (lat, lng, { limit = 16 } = {}) =>
  api.get("/discovery/dishes", { params: { lat, lng, limit } });
