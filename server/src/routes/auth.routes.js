const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateMe,
  changePassword,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
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
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get("/reset-password/verify", verifyResetToken);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.put("/password", authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
