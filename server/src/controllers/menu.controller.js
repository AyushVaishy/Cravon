const prisma = require("../config/prisma");

const getMenu = async (req, res, next) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: req.params.restaurantId, isAvailable: true },
      orderBy: { category: "asc" },
    });

    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const bestsellers = [...items]
      .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
      .slice(0, 8)
      .filter((i) => (i.orderCount || 0) > 0);

    const recommended = [...items]
      .sort((a, b) => {
        const scoreA = (a.orderCount || 0) * 2 + (a.offerPrice ? 1 : 0);
        const scoreB = (b.orderCount || 0) * 2 + (b.offerPrice ? 1 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 6);

    const combos = items.filter((i) => i.isCombo);

    res.json({ menu: grouped, bestsellers, recommended, combos });
  } catch (err) {
    next(err);
  }
};

// Owner/admin: returns flat list including unavailable items for management UI
const getMenuAll = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: req.params.restaurantId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
};

const addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { name, description, price, category, imageUrl, isVeg } = req.body;
    const item = await prisma.menuItem.create({
      data: { restaurantId: req.params.restaurantId, name, description, price, category, imageUrl, isVeg },
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    const restaurant = await prisma.restaurant.findUnique({ where: { id: item.restaurantId } });
    if (restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await prisma.menuItem.update({ where: { id: req.params.itemId }, data: req.body });
    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    const restaurant = await prisma.restaurant.findUnique({ where: { id: item.restaurantId } });
    if (restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.menuItem.update({ where: { id: req.params.itemId }, data: { isAvailable: false } });
    res.json({ message: "Menu item removed" });
  } catch (err) {
    next(err);
  }
};

const rateMenuItems = async (req, res, next) => {
  try {
    const ratings = Array.isArray(req.body.ratings) ? req.body.ratings : [];
    if (ratings.length === 0) {
      return res.status(400).json({ message: "ratings array is required" });
    }
    if (ratings.length > 30) {
      return res.status(400).json({ message: "Too many item ratings" });
    }

    const saved = [];
    for (const entry of ratings) {
      const rating = Number(entry.rating);
      const menuItemId = entry.menuItemId;
      if (!menuItemId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Each rating needs a menuItemId and a score from 1 to 5" });
      }

      const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
      if (!item) return res.status(404).json({ message: "Menu item not found" });

      const delivered = await prisma.orderItem.findFirst({
        where: {
          menuItemId,
          order: { userId: req.user.id, status: "DELIVERED" },
        },
      });
      if (!delivered) {
        return res.status(403).json({ message: "You can rate a dish only after it has been delivered" });
      }

      await prisma.itemRating.upsert({
        where: { userId_menuItemId: { userId: req.user.id, menuItemId } },
        create: { userId: req.user.id, menuItemId, rating },
        update: { rating },
      });

      const all = await prisma.itemRating.findMany({ where: { menuItemId }, select: { rating: true } });
      const avg = all.reduce((sum, row) => sum + row.rating, 0) / all.length;
      const updated = await prisma.menuItem.update({
        where: { id: menuItemId },
        data: { avgRating: Math.round(avg * 10) / 10, ratingCount: all.length },
        select: { id: true, name: true, avgRating: true, ratingCount: true },
      });
      saved.push(updated);
    }

    res.status(201).json({ items: saved });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenu, getMenuAll, addMenuItem, updateMenuItem, deleteMenuItem, rateMenuItems };
