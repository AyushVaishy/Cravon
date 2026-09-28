const express = require("express");
const { getBanners, getPopularDishes, getHomeFeed } = require("../controllers/discovery.controller");
const { optionalAuthenticate } = require("../middleware/optionalAuth.middleware");

const router = express.Router();

router.get("/banners", getBanners);
router.get("/dishes", getPopularDishes);
router.get("/home-feed", optionalAuthenticate, getHomeFeed);

module.exports = router;
