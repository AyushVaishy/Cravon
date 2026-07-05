import api from "./api";

export const searchRestaurants = (lat, lng, query, { sort } = {}) =>
  api.get("/restaurants/search", {
    params: { lat, lng, q: query, ...(sort ? { sort } : {}) },
  });

export const getTrendingSearches = () => api.get("/restaurants/search/trending");
