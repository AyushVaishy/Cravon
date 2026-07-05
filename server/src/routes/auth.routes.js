const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const {
  signup,
  login,
  logout,
  logoutAllDevices,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateMe,
  changePassword,
  uploadAvatar,
  updateNotificationSettings,
  requestEmailChange,
  confirmEmailChange,
  deleteAccount,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { uploadAvatarMiddleware } = require("../middleware/uploadAvatar");
const {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  notificationSettingsSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
  deleteAccountSchema,
} = require("../middleware/validate");

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX || 10),
  message: { message: "Too many reset requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.VERIFICATION_RATE_LIMIT_MAX || 10),
  message: { message: "Too many verification requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);
router.post("/signup", validate(signupSchema), signup);
router.post("/verify-email", verificationLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", verificationLimiter, validate(resendVerificationSchema), resendVerification);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/logout-all", authenticate, logoutAllDevices);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get("/reset-password/verify", verifyResetToken);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", authenticate, getMe);
router.put("/me/avatar", authenticate, (req, res, next) => {
  uploadAvatarMiddleware(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large. Maximum upload size is 10 MB." });
    }
    return res.status(400).json({ message: err.message || "Invalid image upload" });
  });
}, uploadAvatar);
router.put("/me/notifications", authenticate, validate(notificationSettingsSchema), updateNotificationSettings);
router.put("/me", authenticate, updateMe);
router.delete("/me", authenticate, validate(deleteAccountSchema), deleteAccount);
router.post("/email-change/request", authenticate, validate(requestEmailChangeSchema), requestEmailChange);
router.post("/email-change/confirm", authenticate, validate(confirmEmailChangeSchema), confirmEmailChange);
router.put("/password", authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
