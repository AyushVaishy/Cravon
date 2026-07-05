import api from "./api";

export const signup = (data) => api.post("/auth/signup", data);
export const verifyEmail = (data) => api.post("/auth/verify-email", data);
export const resendVerification = (data) => api.post("/auth/resend-verification", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const logoutAllDevices = () => api.post("/auth/logout-all");
export const refreshToken = () => api.post("/auth/refresh");
export const getProfile = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/me", data);
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append("avatar", file);
  return api.put("/auth/me/avatar", form);
};
export const updateNotificationSettings = (data) => api.put("/auth/me/notifications", data);
export const requestEmailChange = (newEmail) => api.post("/auth/email-change/request", { newEmail });
export const confirmEmailChange = (code) => api.post("/auth/email-change/confirm", { code });
export const deleteAccount = (data) => api.delete("/auth/me", { data });
export const changePassword = (data) => api.put("/auth/password", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const verifyResetToken = (token) => api.get("/auth/reset-password/verify", { params: { token } });
export const resetPassword = (data) => api.post("/auth/reset-password", data);
