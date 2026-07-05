const router = require("express").Router();
const { search, reverse, placeDetails, mapsConfig, checkServiceability } = require("../controllers/location.controller");

router.get("/search", search);
router.get("/place", placeDetails);
router.get("/maps-config", mapsConfig);
router.get("/reverse", reverse);
router.get("/serviceability", checkServiceability);

module.exports = router;
