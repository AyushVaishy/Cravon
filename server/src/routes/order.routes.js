const router = require("express").Router();
const { previewOrder, createOrder, getOrders, getOrder, updateOrderStatus, getRestaurantOrders, cancelOrder } = require("../controllers/order.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate);
router.post("/preview", previewOrder);
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/restaurant/:restaurantId", authorize("RESTAURANT_OWNER", "ADMIN"), getRestaurantOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", authorize("RESTAURANT_OWNER", "ADMIN"), updateOrderStatus);
router.patch("/:id/cancel", cancelOrder);  // user can cancel their own PLACED order

module.exports = router;
