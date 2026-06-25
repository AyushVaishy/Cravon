import api from "./api";

export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const refreshToken = () => api.post("/auth/refresh");
export const getProfile = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/me", data);
export const changePassword = (data) => api.put("/auth/password", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const verifyResetToken = (token) => api.get("/auth/reset-password/verify", { params: { token } });
export const resetPassword = (data) => api.post("/auth/reset-password", data);
