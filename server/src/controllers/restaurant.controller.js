const prisma = require("../config/prisma");
const { haversineKm, BROWSE_RADIUS_KM, isValidCoord } = require("../utils/geo");

const ALLOWED_UPDATE_FIELDS = [
  "name", "description", "cuisines", "imageUrl", "lat", "lng",
  "address", "city", "costForTwo", "deliveryTime", "openingTime",
  "closingTime", "fssaiNumber", "phone",
];

const getRestaurants = async (req, res, next) => {
  try {
    const { lat, lng, radius = BROWSE_RADIUS_KM, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const radiusKm = Number(radius);

    const allRestaurants = await prisma.restaurant.findMany({
      where: { isApproved: true },
      orderBy: { avgRating: "desc" },
    });

    let source = allRestaurants;
    if (isValidCoord(lat, lng)) {
      source = allRestaurants
        .map((r) => ({
          ...r,
          distanceKm: Math.round(haversineKm(Number(lat), Number(lng), r.lat, r.lng) * 10) / 10,
        }))
        .filter((r) => r.distanceKm <= radiusKm)
        .sort((a, b) => {
          if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
          return a.distanceKm - b.distanceKm;
        });
    } else {
      source = [];
    }

    const total = source.length;
    const restaurants = source.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ restaurants, total, radiusKm: isValidCoord(lat, lng) ? radiusKm : null });
  } catch (err) {
    next(err);
  }
};

const getRestaurant = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: { reviews: { include: { user: { select: { name: true } } } } },
    });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const payload = { ...restaurant };
    if (isValidCoord(lat, lng)) {
      payload.distanceKm =
        Math.round(haversineKm(Number(lat), Number(lng), restaurant.lat, restaurant.lng) * 10) / 10;
    }

    res.json({ restaurant: payload });
  } catch (err) {
    next(err);
  }
};

const searchRestaurants = async (req, res, next) => {
  try {
    const { q, lat, lng, radius = BROWSE_RADIUS_KM, sort = "relevance" } = req.query;
    const qNorm = String(q || "").trim();
    if (!qNorm) return res.status(400).json({ message: "Query parameter q is required" });
    const qLower = qNorm.toLowerCase();

    const directMatches = await prisma.restaurant.findMany({
      where: {
        isApproved: true,
        OR: [
          { name: { contains: qNorm, mode: "insensitive" } },
          { city: { contains: qNorm, mode: "insensitive" } },
          { description: { contains: qNorm, mode: "insensitive" } },
          { cuisines: { hasSome: [qNorm] } },
          {
            menuItems: {
              some: { name: { contains: qNorm, mode: "insensitive" }, isAvailable: true },
            },
          },
        ],
      },
      include: {
        menuItems: {
          where: { name: { contains: qNorm, mode: "insensitive" }, isAvailable: true },
          take: 5,
          select: { id: true, name: true, price: true, imageUrl: true, isVeg: true },
        },
      },
    });

    const matchedIds = new Set(directMatches.map((r) => r.id));
    const allApproved = await prisma.restaurant.findMany({ where: { isApproved: true } });
    const cuisinePartial = allApproved.filter(
      (r) =>
        !matchedIds.has(r.id) &&
        (r.cuisines || []).some((c) => c.toLowerCase().includes(qLower))
    );

    const scoreRestaurant = (r) => {
      const name = (r.name || "").toLowerCase();
      if (name === qLower) return 100;
      if (name.startsWith(qLower)) return 85;
      if (name.includes(qLower)) return 70;
      if ((r.menuItems || []).length > 0) return 55;
      if ((r.cuisines || []).some((c) => c.toLowerCase().includes(qLower))) return 45;
      if ((r.city || "").toLowerCase().includes(qLower)) return 35;
      return 10;
    };

    const matchReasonFor = (r) => {
      const name = (r.name || "").toLowerCase();
      if (name.includes(qLower)) return "restaurant";
      if ((r.menuItems || []).length > 0) return "dish";
      if ((r.cuisines || []).some((c) => c.toLowerCase().includes(qLower))) return "cuisine";
      if ((r.city || "").toLowerCase().includes(qLower)) return "city";
      return "restaurant";
    };

    let merged = [
      ...directMatches,
      ...cuisinePartial.map((r) => ({ ...r, menuItems: [] })),
    ].map((r) => ({
      ...r,
      relevanceScore: scoreRestaurant(r),
      matchReason: matchReasonFor(r),
    }));

    if (isValidCoord(lat, lng)) {
      const radiusKm = Number(radius);
      merged = merged
        .map((r) => ({
          ...r,
          distanceKm: Math.round(haversineKm(Number(lat), Number(lng), r.lat, r.lng) * 10) / 10,
        }))
        .filter((r) => r.distanceKm <= radiusKm);
    }

    if (sort === "distance" && isValidCoord(lat, lng)) {
      merged.sort((a, b) => {
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
    } else {
      merged.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
      });
    }

    const dishes = [];
    const dishSeen = new Set();
    for (const r of merged) {
      for (const item of r.menuItems || []) {
        const key = `${r.id}-${item.name.toLowerCase()}`;
        if (dishSeen.has(key)) continue;
        dishSeen.add(key);
        dishes.push({
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          isVeg: item.isVeg,
          restaurantId: r.id,
          restaurantName: r.name,
          restaurantImageUrl: r.imageUrl,
          distanceKm: r.distanceKm ?? null,
        });
        if (dishes.length >= 16) break;
      }
      if (dishes.length >= 16) break;
    }

    const restaurants = merged.map(({ menuItems, ...rest }) => ({
      ...rest,
      matchedDishes: (menuItems || []).map((m) => m.name),
    }));

    res.json({ restaurants, dishes, total: restaurants.length, query: qNorm });
  } catch (err) {
    next(err);
  }
};

const TRENDING_SEARCHES = [
  "Biryani",
  "Pizza",
  "Burger",
  "North Indian",
  "Chinese",
  "Dosa",
  "Paneer Tikka",
  "Ice Cream",
  "Rolls",
  "Cafe",
  "Butter Chicken",
  "South Indian",
];

const getTrendingSearches = async (_req, res) => {
  res.json({ trending: TRENDING_SEARCHES });
};

const createRestaurant = async (req, res, next) => {
  try {
    const {
      name, description, cuisines, imageUrl, lat, lng,
      address, city, costForTwo, deliveryTime, openingTime, closingTime, fssaiNumber, phone,
    } = req.body;
    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: req.user.id, name, description, cuisines, imageUrl, lat, lng,
        address, city, costForTwo, deliveryTime, openingTime, closingTime, fssaiNumber, phone,
        isApproved: true,
      },
    });
    res.status(201).json({ restaurant });
  } catch (err) {
    next(err);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    const existing = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Restaurant not found" });
    if (existing.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: you do not own this restaurant" });
    }

    const data = {};
    ALLOWED_UPDATE_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    });

    const restaurant = await prisma.restaurant.update({ where: { id: req.params.id }, data });
    res.json({ restaurant });
  } catch (err) {
    next(err);
  }
};

const getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: { select: { orders: true, menuItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ restaurants });
  } catch (err) {
    next(err);
  }
};

const toggleRestaurantOpen = async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { isOpen: !restaurant.isOpen },
    });
    res.json({ restaurant: updated });
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const restaurantId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const review = await prisma.review.upsert({
      where: { userId_restaurantId: { userId: req.user.id, restaurantId } },
      update: { rating, comment: comment || null },
      create: { userId: req.user.id, restaurantId, rating, comment: comment || null },
      include: { user: { select: { name: true } } },
    });

    const agg = await prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        avgRating: Math.round((agg._avg.rating || 0) * 10) / 10,
        totalRatings: agg._count.rating,
      },
    });

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRestaurants, getRestaurant, searchRestaurants, getTrendingSearches,
  createRestaurant, updateRestaurant,
  getMyRestaurants, toggleRestaurantOpen, createReview,
};
