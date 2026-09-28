import api from "./api";

export const getCart = () => api.get("/cart");
export const syncCart = (restaurantId, items) =>
  api.put("/cart/sync", { restaurantId, items });
export const addToCart = (payload) => api.post("/cart/items", payload);
export const updateCartItem = (cartItemId, quantity) =>
  api.patch(`/cart/items/${cartItemId}`, { quantity });
export const removeCartItem = (cartItemId) =>
  api.delete(`/cart/items/${cartItemId}`);
export const clearCartApi = () => api.delete("/cart");
export const saveCartForLater = () => api.post("/cart/save-for-later");
export const getSavedCarts = () => api.get("/cart/saved");
export const restoreSavedCart = (id) => api.post(`/cart/saved/${id}/restore`);
