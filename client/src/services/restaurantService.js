import api from "./api";

export const getRestaurants = (lat, lng, { radius = 15, limit = 20, page = 1 } = {}) =>
  api.get("/restaurants", { params: { lat, lng, radius, limit, page } });

export const getRestaurant = (id) => api.get(`/restaurants/${id}`);

export const getRestaurantMenu = (id) => api.get(`/menu/${id}`);

export { searchRestaurants, getTrendingSearches } from "./searchService";

export const createReview = (restaurantId, data) =>
  api.post(`/restaurants/${restaurantId}/reviews`, data);
