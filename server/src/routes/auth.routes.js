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
  getMe,
  updateMe,
  changePassword,
  updateProfile,
  googleAuth,
  googleCallback,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../middleware/validate");

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many reset requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get("/reset-password/verify", verifyResetToken);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.put("/password", authenticate, changePassword);
router.put("/profile", authenticate, updateProfile);

module.exports = router;
