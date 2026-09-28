const router = require("express").Router();
const {
  listCoupons,
  validateCouponCode,
  autoApplyCoupon,
  previewBill,
} = require("../controllers/coupon.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/", authenticate, listCoupons);
router.post("/validate", authenticate, validateCouponCode);
router.post("/auto-apply", authenticate, autoApplyCoupon);
router.post("/preview-bill", authenticate, previewBill);

module.exports = router;
