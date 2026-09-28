import api from "./api";

export const previewOrder = (data) => api.post("/orders/preview", data);

export const createOrder = ({
  items,
  restaurantId,
  addressId,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  notes,
  restaurantNotes,
  contactless,
  deliveryPhone,
  orderType,
  paymentMethod,
  scheduledFor,
  couponCode,
  tipAmount,
  useWallet,
  loyaltyPointsToRedeem,
}) =>
  api.post("/orders", {
    items,
    restaurantId,
    addressId,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    notes,
    restaurantNotes,
    contactless,
    deliveryPhone,
    orderType,
    paymentMethod,
    scheduledFor,
    couponCode,
    tipAmount,
    useWallet,
    loyaltyPointsToRedeem,
  });

export const getOrders = () => api.get("/orders");
export const getOrder = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);
export const createReview = (restaurantId, data) => api.post(`/restaurants/${restaurantId}/reviews`, data);
export const rateMenuItems = (ratings) => api.post("/menu/items/ratings", { ratings });
