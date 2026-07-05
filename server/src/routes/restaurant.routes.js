const router = require("express").Router();
const {
  getRestaurants,
  getRestaurant,
  searchRestaurants,
  getTrendingSearches,
  createRestaurant,
  updateRestaurant,
  getMyRestaurants,
  toggleRestaurantOpen,
  createReview,
} = require("../controllers/restaurant.controller");
const { getReviews, deleteReview, getMyReviews } = require("../controllers/review.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get("/", getRestaurants);
router.get("/search/trending", getTrendingSearches);
router.get("/search", searchRestaurants);
router.get("/my", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), getMyRestaurants);
router.get("/reviews/me", authenticate, getMyReviews);
router.get("/:id", getRestaurant);
router.post("/", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), createRestaurant);
router.put("/:id", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), updateRestaurant);
router.patch("/:id/toggle-open", authenticate, authorize("RESTAURANT_OWNER", "ADMIN"), toggleRestaurantOpen);
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", authenticate, createReview);
router.delete("/reviews/:reviewId", authenticate, deleteReview);

module.exports = router;
