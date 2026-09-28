import api from "./api";

export const getRewards = () => api.get("/rewards");
export const applyReferralCode = (code) => api.post("/rewards/referral", { code });
export const redeemLoyaltyPoints = (points) => api.post("/rewards/loyalty/redeem", { points });
