const express = require("express");
const { getBanners, getPopularDishes } = require("../controllers/discovery.controller");

const router = express.Router();

router.get("/banners", getBanners);
router.get("/dishes", getPopularDishes);

module.exports = router;
