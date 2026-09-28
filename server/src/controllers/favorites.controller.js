const prisma = require("../config/prisma");

const RESTAURANT_SELECT = {
  id: true,
  name: true,
  cuisines: true,
  imageUrl: true,
  logoUrl: true,
  lat: true,
  lng: true,
  address: true,
  city: true,
  avgRating: true,
  totalRatings: true,
  deliveryTime: true,
  deliveryFee: true,
  costForTwo: true,
  isOpen: true,
  isPureVeg: true,
  isFeatured: true,
  offerTag: true,
  openingTime: true,
  closingTime: true,
  acceptsOnlinePayment: true,
  hasVegMenu: true,
  hasNonVegMenu: true,
  createdAt: true,
};

const getFavoriteRestaurants = async (req, res, next) => {
  try {
    const favs = await prisma.favoriteRestaurant.findMany({
      where: { userId: req.user.id },
      include: { restaurant: { select: RESTAURANT_SELECT } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ restaurants: favs.map((f) => f.restaurant) });
  } catch (err) {
    next(err);
  }
};

const addFavoriteRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    await prisma.favoriteRestaurant.upsert({
      where: { userId_restaurantId: { userId: req.user.id, restaurantId } },
      create: { userId: req.user.id, restaurantId },
      update: {},
    });
    res.json({ message: "Added to favourites", restaurant });
  } catch (err) {
    next(err);
  }
};

const removeFavoriteRestaurant = async (req, res, next) => {
  try {
    await prisma.favoriteRestaurant.deleteMany({
      where: { userId: req.user.id, restaurantId: req.params.restaurantId },
    });
    res.json({ message: "Removed from favourites" });
  } catch (err) {
    next(err);
  }
};

const getFavoriteMenuItems = async (req, res, next) => {
  try {
    const favs = await prisma.favoriteMenuItem.findMany({
      where: { userId: req.user.id },
      include: {
        menuItem: {
          include: { restaurant: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items: favs.map((f) => f.menuItem) });
  } catch (err) {
    next(err);
  }
};

const addFavoriteMenuItem = async (req, res, next) => {
  try {
    const menuItemId = req.params.menuItemId;
    const item = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: { select: { id: true, name: true } } },
    });
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    await prisma.favoriteMenuItem.upsert({
      where: { userId_menuItemId: { userId: req.user.id, menuItemId } },
      create: { userId: req.user.id, menuItemId },
      update: {},
    });
    res.json({ message: "Dish saved", item });
  } catch (err) {
    next(err);
  }
};

const removeFavoriteMenuItem = async (req, res, next) => {
  try {
    await prisma.favoriteMenuItem.deleteMany({
      where: { userId: req.user.id, menuItemId: req.params.menuItemId },
    });
    res.json({ message: "Dish removed from favourites" });
  } catch (err) {
    next(err);
  }
};

const getBrowseHistory = async (req, res, next) => {
  try {
    const history = await prisma.browseHistory.findMany({
      where: { userId: req.user.id },
      include: { restaurant: { select: RESTAURANT_SELECT } },
      orderBy: { viewedAt: "desc" },
      take: 50,
    });
    res.json({ history: history.map((h) => ({ ...h.restaurant, viewedAt: h.viewedAt })) });
  } catch (err) {
    next(err);
  }
};

const addBrowseHistory = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;
    if (!restaurantId) return res.status(400).json({ message: "restaurantId required" });

    await prisma.browseHistory.upsert({
      where: { userId_restaurantId: { userId: req.user.id, restaurantId } },
      create: { userId: req.user.id, restaurantId },
      update: { viewedAt: new Date() },
    });
    res.json({ message: "History updated" });
  } catch (err) {
    next(err);
  }
};

const clearBrowseHistory = async (req, res, next) => {
  try {
    await prisma.browseHistory.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: "History cleared" });
  } catch (err) {
    next(err);
  }
};

const syncFavorites = async (req, res, next) => {
  try {
    const { restaurantIds = [] } = req.body;
    for (const restaurantId of restaurantIds) {
      const exists = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!exists) continue;
      await prisma.favoriteRestaurant.upsert({
        where: { userId_restaurantId: { userId: req.user.id, restaurantId } },
        create: { userId: req.user.id, restaurantId },
        update: {},
      });
    }
    const favs = await prisma.favoriteRestaurant.findMany({
      where: { userId: req.user.id },
      include: { restaurant: { select: RESTAURANT_SELECT } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ restaurants: favs.map((f) => f.restaurant) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
  RESTAURANT_SELECT,
};
