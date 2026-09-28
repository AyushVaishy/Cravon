const router = require("express").Router();
const { getRewards, applyReferralCode, redeemLoyalty } = require("../controllers/rewards.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/", getRewards);
router.post("/referral", applyReferralCode);
router.post("/loyalty/redeem", redeemLoyalty);

module.exports = router;
