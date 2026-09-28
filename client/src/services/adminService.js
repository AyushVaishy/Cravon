import api from './api';

// ─── Admin APIs ───────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminRestaurants = () => api.get('/admin/restaurants');
export const approveRestaurant = (id, approved) => api.patch(`/admin/restaurants/${id}/approve`, { approved });
export const toggleFeaturedRestaurant = (id, featured) => api.patch(`/admin/restaurants/${id}/featured`, { featured });
export const getAdminOrders = () => api.get('/admin/orders');
export const updateAdminOrderStatus = (orderId, status) => api.patch(`/admin/orders/${orderId}/status`, { status });

// ─── Owner Restaurant APIs ────────────────────────────────────────────────────
export const getMyRestaurants = () => api.get('/restaurants/my');
export const createRestaurant = (data) => api.post('/restaurants', data);
export const updateRestaurant = (id, data) => api.put(`/restaurants/${id}`, data);
export const toggleRestaurantOpen = (id) => api.patch(`/restaurants/${id}/toggle-open`);

// ─── Owner Menu APIs ──────────────────────────────────────────────────────────
export const getMenuAll = (restaurantId) => api.get(`/menu/${restaurantId}/all`);
export const addMenuItem = (restaurantId, data) => api.post(`/menu/${restaurantId}`, data);
export const updateMenuItem = (restaurantId, itemId, data) => api.put(`/menu/${restaurantId}/items/${itemId}`, data);
export const deleteMenuItem = (restaurantId, itemId) => api.delete(`/menu/${restaurantId}/items/${itemId}`);

// ─── Owner Order APIs ─────────────────────────────────────────────────────────
export const getRestaurantOrders = (restaurantId) => api.get(`/orders/restaurant/${restaurantId}`);
export const updateOwnerOrderStatus = (orderId, status) => api.patch(`/orders/${orderId}/status`, { status });
