const prisma = require("../config/prisma");
const { haversineKm, BROWSE_RADIUS_KM, isValidCoord } = require("../utils/geo");

const RESTAURANT_CARD_SELECT = {
  id: true,
  name: true,
  cuisines: true,
  imageUrl: true,
  lat: true,
  lng: true,
  address: true,
  city: true,
  avgRating: true,
  totalRatings: true,
  deliveryTime: true,
  costForTwo: true,
  isOpen: true,
  isPureVeg: true,
  isFeatured: true,
  offerTag: true,
  openingTime: true,
  closingTime: true,
  createdAt: true,
};

const PROMO_BANNERS = [
  {
    id: "welcome50",
    title: "WELCOME50",
    subtitle: "50% off up to ₹100 on first order",
    cta: "Order now",
    gradient: "from-orange-500 to-red-500",
    searchQuery: "Biryani",
    seasonal: false,
  },
  {
    id: "freedel",
    title: "Free Delivery",
    subtitle: "On orders above ₹199 this week",
    cta: "Explore",
    gradient: "from-emerald-500 to-teal-600",
    searchQuery: "Pizza",
    seasonal: false,
  },
  {
    id: "weekend",
    title: "Weekend Treats",
    subtitle: "Top-rated spots near you",
    cta: "See restaurants",
    gradient: "from-violet-500 to-purple-600",
    searchQuery: "North Indian",
    seasonal: false,
  },
];

const getSeasonalBanners = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const seasonal = [];

  if (month === 10 || (month === 11 && day <= 15)) {
    seasonal.push({
      id: "diwali",
      title: "Diwali Dhamaka 🪔",
      subtitle: "Festive feasts & sweet treats — up to 60% off",
      cta: "Celebrate now",
      gradient: "from-amber-500 via-orange-500 to-red-600",
      searchQuery: "Sweets",
      seasonal: true,
      festival: "Diwali",
    });
  }
  if (month === 3) {
    seasonal.push({
      id: "holi",
      title: "Holi Specials 🎨",
      subtitle: "Colourful combos & thandai favourites",
      cta: "Order festive food",
      gradient: "from-pink-500 via-fuchsia-500 to-purple-600",
      searchQuery: "North Indian",
      seasonal: true,
      festival: "Holi",
    });
  }
  if (month === 12) {
    seasonal.push({
      id: "christmas",
      title: "Christmas Cheer 🎄",
      subtitle: "Cakes, bakes & winter warmers near you",
      cta: "Festive picks",
      gradient: "from-red-600 via-green-700 to-emerald-800",
      searchQuery: "Cake",
      seasonal: true,
      festival: "Christmas",
    });
  }
  if (month === 1 && day <= 7) {
    seasonal.push({
      id: "newyear",
      title: "New Year Bash 🎉",
      subtitle: "Party platters & midnight munchies",
      cta: "Ring in 2026",
      gradient: "from-indigo-600 via-violet-600 to-purple-700",
      searchQuery: "Burger",
      seasonal: true,
      festival: "New Year",
    });
  }
  if (month === 8 && day >= 10 && day <= 20) {
    seasonal.push({
      id: "independence",
      title: "Independence Day 🇮🇳",
      subtitle: "Tri-colour treats & desi delights",
      cta: "Explore offers",
      gradient: "from-orange-500 via-white/20 to-green-600",
      searchQuery: "Biryani",
      seasonal: true,
      festival: "Independence Day",
    });
  }
  if (month === 6 || month === 7) {
    seasonal.push({
      id: "monsoon",
      title: "Monsoon Munchies ☔",
      subtitle: "Pakoras, chai & comfort food delivered hot",
      cta: "Stay cosy",
      gradient: "from-sky-600 to-blue-800",
      searchQuery: "South Indian",
      seasonal: true,
      festival: "Monsoon",
    });
  }

  return seasonal;
};

const restaurantsInRadius = async (lat, lng, radiusKm, where = {}) => {
  const all = await prisma.restaurant.findMany({
    where: { isApproved: true, ...where },
    select: RESTAURANT_CARD_SELECT,
  });
  if (!isValidCoord(lat, lng)) return [];
  return all
    .map((r) => ({
      ...r,
      distanceKm: Math.round(haversineKm(Number(lat), Number(lng), r.lat, r.lng) * 10) / 10,
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => {
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
};

const getBanners = async (_req, res) => {
  const seasonal = getSeasonalBanners();
  const banners = [...seasonal, ...PROMO_BANNERS];
  res.json({ banners, seasonalCount: seasonal.length });
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

const buildPersonalization = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId, status: { not: "CANCELLED" } },
    include: {
      restaurant: { select: { cuisines: true, name: true } },
      items: { include: { menuItem: { select: { category: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (orders.length === 0) return null;

  const cuisineCount = {};
  const restaurantIds = new Set();
  for (const order of orders) {
    restaurantIds.add(order.restaurantId);
    for (const c of order.restaurant?.cuisines || []) {
      const key = c.trim();
      if (key) cuisineCount[key] = (cuisineCount[key] || 0) + 1;
    }
  }

  const preferredCuisines = Object.entries(cuisineCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  return {
    orderCount: orders.length,
    preferredCuisines,
    orderedRestaurantIds: Array.from(restaurantIds),
    topCuisine: preferredCuisines[0] || null,
  };
};

const scoreRecommendations = (restaurants, personalization) => {
  const ordered = new Set(personalization?.orderedRestaurantIds || []);
  const prefCuisines = new Set(
    (personalization?.preferredCuisines || []).map((c) => c.toLowerCase())
  );

  return restaurants
    .map((r) => {
      let score = parseFloat(r.avgRating || 0) * 10;
      if (ordered.has(r.id)) score -= 50;
      const cuisineMatch = (r.cuisines || []).filter((c) => prefCuisines.has(c.toLowerCase())).length;
      score += cuisineMatch * 25;
      if (r.isOpen) score += 5;
      if (r.offerTag) score += 3;
      return { ...r, recommendationScore: score };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
};

const getHomeFeed = async (req, res, next) => {
  try {
    const { lat, lng, radius = BROWSE_RADIUS_KM } = req.query;
    const radiusKm = Number(radius);
    const limit = 10;

    const nearby = await restaurantsInRadius(lat, lng, radiusKm);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderCounts = await prisma.order.groupBy({
      by: ["restaurantId"],
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _count: { restaurantId: true },
    });
    const orderCountMap = Object.fromEntries(
      orderCounts.map((o) => [o.restaurantId, o._count.restaurantId])
    );

    const trending = [...nearby]
      .sort((a, b) => {
        const ordersA = orderCountMap[a.id] || 0;
        const ordersB = orderCountMap[b.id] || 0;
        if (ordersB !== ordersA) return ordersB - ordersA;
        return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
      })
      .slice(0, limit);

    const newRestaurants = [...nearby]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    const fastDelivery = nearby
      .filter((r) => r.isOpen !== false && parseInt(r.deliveryTime || 45, 10) <= 30)
      .slice(0, limit);

    const openNow = nearby.filter((r) => r.isOpen === true).slice(0, limit);

    const featured = nearby
      .filter((r) => r.isFeatured)
      .sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0))
      .slice(0, limit);

    let personalization = null;
    let recommendations = [];
    let recentlyOrdered = [];

    if (req.user?.id) {
      personalization = await buildPersonalization(req.user.id);

      const recPool = scoreRecommendations(
        nearby.filter((r) => r.isOpen !== false),
        personalization
      );
      recommendations = recPool.slice(0, limit);

      const userOrders = await prisma.order.findMany({
        where: { userId: req.user.id, status: { not: "CANCELLED" } },
        include: { restaurant: { select: RESTAURANT_CARD_SELECT } },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      const seen = new Set();
      for (const order of userOrders) {
        if (!order.restaurant || seen.has(order.restaurantId)) continue;
        if (!nearby.some((r) => r.id === order.restaurantId)) continue;
        seen.add(order.restaurantId);
        const base = nearby.find((r) => r.id === order.restaurantId) || order.restaurant;
        recentlyOrdered.push({
          ...base,
          lastOrderedAt: order.createdAt,
          lastOrderId: order.id,
        });
        if (recentlyOrdered.length >= limit) break;
      }
    } else {
      recommendations = [...nearby]
        .filter((r) => r.isOpen !== false)
        .sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0))
        .slice(0, limit);
    }

    const recommendationReason = personalization?.topCuisine
      ? `Because you love ${personalization.topCuisine}`
      : "Top picks near you";

    res.json({
      featured,
      trending,
      newRestaurants,
      fastDelivery,
      openNow,
      recommendations,
      recommendationReason,
      recentlyOrdered,
      personalization,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBanners,
  getPopularDishes,
  getHomeFeed,
  PROMO_BANNERS,
  getSeasonalBanners,
};
