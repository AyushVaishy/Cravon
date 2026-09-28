const router = require("express").Router();
const { getMenu, getMenuAll, addMenuItem, updateMenuItem, deleteMenuItem, rateMenuItems } = require("../controllers/menu.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.post("/items/ratings", authenticate, rateMenuItems);
router.get("/:restaurantId", getMenu);
router.get("/:restaurantId/all", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), getMenuAll);
router.post("/:restaurantId", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), addMenuItem);
router.put("/:restaurantId/items/:itemId", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), updateMenuItem);
router.delete("/:restaurantId/items/:itemId", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), deleteMenuItem);

module.exports = router;
