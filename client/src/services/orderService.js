import api from "./api";

export const createOrder = ({
  items,
  restaurantId,
  addressId,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  notes,
  contactless,
  deliveryPhone,
}) =>
  api.post("/orders", {
    items,
    restaurantId,
    addressId,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    notes,
    contactless,
    deliveryPhone,
  });

export const getOrders = () => api.get("/orders");
export const getOrder = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);
export const createReview = (restaurantId, data) => api.post(`/restaurants/${restaurantId}/reviews`, data);
