const prisma = require("../config/prisma");
const { haversineKm, BROWSE_RADIUS_KM, isValidCoord } = require("../utils/geo");

const PROMO_BANNERS = [
  {
    id: "welcome50",
    title: "WELCOME50",
    subtitle: "50% off up to ₹100 on first order",
    cta: "Order now",
    gradient: "from-orange-500 to-red-500",
    searchQuery: "Biryani",
  },
  {
    id: "freedel",
    title: "Free Delivery",
    subtitle: "On orders above ₹199 this week",
    cta: "Explore",
    gradient: "from-emerald-500 to-teal-600",
    searchQuery: "Pizza",
  },
  {
    id: "weekend",
    title: "Weekend Treats",
    subtitle: "Top-rated spots near you",
    cta: "See restaurants",
    gradient: "from-violet-500 to-purple-600",
    searchQuery: "North Indian",
  },
];

const restaurantsInRadius = async (lat, lng, radiusKm) => {
  const all = await prisma.restaurant.findMany({
    where: { isApproved: true },
    select: { id: true, lat: true, lng: true },
  });
  if (!isValidCoord(lat, lng)) return [];
  return all
    .map((r) => ({
      ...r,
      distanceKm: haversineKm(Number(lat), Number(lng), r.lat, r.lng),
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

const getBanners = async (_req, res) => {
  res.json({ banners: PROMO_BANNERS });
};

const getPopularDishes = async (req, res, next) => {
  try {
    const { lat, lng, radius = BROWSE_RADIUS_KM, limit = 16 } = req.query;
    const limitNum = Math.min(24, Math.max(1, Number(limit)));
    const radiusKm = Number(radius);

    const nearby = await restaurantsInRadius(lat, lng, radiusKm);
    const restIds = nearby.map((r) => r.id);
    if (restIds.length === 0) return res.json({ dishes: [] });

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: { in: restIds }, isAvailable: true },
      include: {
        restaurant: {
          select: { id: true, name: true, avgRating: true, imageUrl: true, isOpen: true },
        },
      },
      take: 400,
    });

    const seen = new Set();
    const dishes = [];
    for (const item of items.sort((a, b) => (b.restaurant?.avgRating || 0) - (a.restaurant?.avgRating || 0))) {
      const key = item.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      dishes.push({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl || item.restaurant?.imageUrl,
        isVeg: item.isVeg,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurant?.name,
        restaurantOpen: item.restaurant?.isOpen,
      });
      if (dishes.length >= limitNum) break;
    }

    res.json({ dishes });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBanners, getPopularDishes, PROMO_BANNERS };
