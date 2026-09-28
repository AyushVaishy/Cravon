import api from './api';

export const getFavoriteRestaurants = () => api.get('/favorites/restaurants');
export const addFavoriteRestaurant = (restaurantId) => api.post(`/favorites/restaurants/${restaurantId}`);
export const removeFavoriteRestaurant = (restaurantId) => api.delete(`/favorites/restaurants/${restaurantId}`);
export const syncFavoriteRestaurants = (restaurantIds) =>
  api.post('/favorites/restaurants/sync', { restaurantIds });

export const getFavoriteMenuItems = () => api.get('/favorites/items');
export const addFavoriteMenuItem = (menuItemId) => api.post(`/favorites/items/${menuItemId}`);
export const removeFavoriteMenuItem = (menuItemId) => api.delete(`/favorites/items/${menuItemId}`);

export const getBrowseHistory = () => api.get('/favorites/history');
export const addBrowseHistory = (restaurantId) => api.post('/favorites/history', { restaurantId });
export const clearBrowseHistory = () => api.delete('/favorites/history');

export const reportRestaurant = (restaurantId, data) =>
  api.post(`/restaurants/${restaurantId}/report`, data);

export const getSimilarRestaurants = (restaurantId, lat, lng) =>
  api.get(`/restaurants/${restaurantId}/similar`, { params: { lat, lng } });
