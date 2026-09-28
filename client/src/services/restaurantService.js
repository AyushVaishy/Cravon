import api from "./api";
import { filtersToParams } from "../store/filtersSlice";

export const getRestaurants = (lat, lng, { radius = 15, limit = 20, page = 1, filters = {} } = {}) =>
  api.get("/restaurants", {
    params: { lat, lng, radius, limit, page, ...filtersToParams(filters) },
  });

export const getRestaurant = (id, lat, lng) =>
  api.get(`/restaurants/${id}`, { params: lat && lng ? { lat, lng } : {} });

export const getRestaurantMenu = (id) => api.get(`/menu/${id}`);

export { searchRestaurants, getTrendingSearches } from "./searchService";

export const createReview = (restaurantId, data) =>
  api.post(`/restaurants/${restaurantId}/reviews`, data);
