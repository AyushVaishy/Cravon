const prisma = require('../config/prisma');

const getStats = async (req, res, next) => {
  try {
    const [userCount, restaurantCount, orderCount, revenueAgg] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
    ]);
    res.json({
      users: userCount,
      restaurants: restaurantCount,
      orders: orderCount,
      revenue: revenueAgg._sum.totalAmount || 0,
    });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) { next(err); }
};

const getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ restaurants });
  } catch (err) { next(err); }
};

const approveRestaurant = async (req, res, next) => {
  try {
    const { approved } = req.body;
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { isApproved: approved },
    });
    res.json({ restaurant });
  } catch (err) { next(err); }
};

const toggleFeaturedRestaurant = async (req, res, next) => {
  try {
    const { featured } = req.body;
    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { isFeatured: !!featured },
    });
    res.json({ restaurant });
  } catch (err) { next(err); }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        restaurant: { select: { name: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ orders });
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { status },
    });
    res.json({ order });
  } catch (err) { next(err); }
};

module.exports = { getStats, getUsers, getAllRestaurants, approveRestaurant, toggleFeaturedRestaurant, getAllOrders, updateOrderStatus };
