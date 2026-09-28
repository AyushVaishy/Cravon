const router = require('express').Router();
const { getStats, getUsers, getAllRestaurants, approveRestaurant, toggleFeaturedRestaurant, getAllOrders, updateOrderStatus } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/restaurants', getAllRestaurants);
router.patch('/restaurants/:id/approve', approveRestaurant);
router.patch('/restaurants/:id/featured', toggleFeaturedRestaurant);
router.get('/orders', getAllOrders);
router.patch('/orders/:orderId/status', updateOrderStatus);

module.exports = router;
