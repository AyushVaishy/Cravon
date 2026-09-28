const router = require("express").Router();
const {
  getCart,
  syncCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  saveForLater,
  getSavedCarts,
  restoreSavedCart,
} = require("../controllers/cart.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/", getCart);
router.put("/sync", syncCart);
router.post("/save-for-later", saveForLater);
router.get("/saved", getSavedCarts);
router.post("/saved/:id/restore", restoreSavedCart);
router.post("/items", addItem);
router.patch("/items/:cartItemId", updateItem);
router.delete("/items/:cartItemId", removeItem);
router.delete("/", clearCart);

module.exports = router;
