const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  getFavoriteRestaurants,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
  getFavoriteMenuItems,
  addFavoriteMenuItem,
  removeFavoriteMenuItem,
  getBrowseHistory,
  addBrowseHistory,
  clearBrowseHistory,
  syncFavorites,
} = require("../controllers/favorites.controller");

router.use(authenticate);

router.get("/restaurants", getFavoriteRestaurants);
router.post("/restaurants/sync", syncFavorites);
router.post("/restaurants/:restaurantId", addFavoriteRestaurant);
router.delete("/restaurants/:restaurantId", removeFavoriteRestaurant);

router.get("/items", getFavoriteMenuItems);
router.post("/items/:menuItemId", addFavoriteMenuItem);
router.delete("/items/:menuItemId", removeFavoriteMenuItem);

router.get("/history", getBrowseHistory);
router.post("/history", addBrowseHistory);
router.delete("/history", clearBrowseHistory);

module.exports = router;
