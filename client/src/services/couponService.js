import api from "./api";

export const getCoupons = (params) => api.get("/coupons", { params });
export const validateCoupon = (data) => api.post("/coupons/validate", data);
export const autoApplyCoupon = (data) => api.post("/coupons/auto-apply", data);
export const previewBill = (data) => api.post("/coupons/preview-bill", data);
