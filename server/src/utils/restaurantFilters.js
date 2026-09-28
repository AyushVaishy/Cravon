const { haversineKm, isValidCoord } = require("./geo");

const COST_RANGES = {
  low: { min: 0, max: 20000 },
  mid: { min: 20000, max: 50000 },
  high: { min: 50000, max: Infinity },
};

const parseBool = (v) => v === "true" || v === true || v === "1";

const applyRestaurantFilters = (restaurants, query, orderCountMap = {}) => {
  let list = [...restaurants];
  const {
    cuisines,
    rating,
    costRange,
    deliveryTimeMax,
    pureVeg,
    vegOnly,
    nonVegOnly,
    openNow,
    hasOffers,
    freeDelivery,
    maxDistance,
    acceptsOnlinePayment,
    newRestaurants,
  } = query;

  if (cuisines) {
    const sel = new Set(String(cuisines).split(",").map((c) => c.toLowerCase().trim()).filter(Boolean));
    if (sel.size > 0) {
      list = list.filter((r) =>
        (r.cuisines || []).some((c) => sel.has(c.toLowerCase().trim()))
      );
    }
  }

  if (rating != null && rating !== "") {
    const min = Number(rating);
    if (!Number.isNaN(min)) list = list.filter((r) => parseFloat(r.avgRating || 0) >= min);
  }

  if (costRange && COST_RANGES[costRange]) {
    const { min, max } = COST_RANGES[costRange];
    list = list.filter((r) => {
      const c = r.costForTwo || 0;
      return c >= min && c < max;
    });
  }

  if (deliveryTimeMax != null && deliveryTimeMax !== "") {
    const max = Number(deliveryTimeMax);
    if (!Number.isNaN(max)) {
      list = list.filter((r) => parseInt(r.deliveryTime || 45, 10) <= max);
    }
  }

  if (parseBool(pureVeg)) list = list.filter((r) => r.isPureVeg === true);
  if (parseBool(vegOnly)) list = list.filter((r) => r.hasVegMenu !== false || r.isPureVeg);
  if (parseBool(nonVegOnly)) list = list.filter((r) => r.hasNonVegMenu === true);

  if (parseBool(openNow)) list = list.filter((r) => r.isOpen === true);

  if (parseBool(hasOffers)) list = list.filter((r) => !!r.offerTag?.trim());

  if (parseBool(freeDelivery)) list = list.filter((r) => (r.deliveryFee ?? 2900) === 0);

  if (maxDistance != null && maxDistance !== "") {
    const maxKm = Number(maxDistance);
    if (!Number.isNaN(maxKm)) list = list.filter((r) => (r.distanceKm ?? 999) <= maxKm);
  }

  if (parseBool(acceptsOnlinePayment)) {
    list = list.filter((r) => r.acceptsOnlinePayment !== false);
  }

  if (parseBool(newRestaurants)) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    list = list.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo);
  }

  return list;
};

const sortRestaurants = (list, sortBy, orderCountMap = {}) => {
  const sorted = [...list];
  switch (sortBy) {
    case "rating_desc":
      sorted.sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0));
      break;
    case "cost_asc":
      sorted.sort((a, b) => (a.costForTwo || 0) - (b.costForTwo || 0));
      break;
    case "cost_desc":
      sorted.sort((a, b) => (b.costForTwo || 0) - (a.costForTwo || 0));
      break;
    case "delivery_time":
      sorted.sort((a, b) => parseInt(a.deliveryTime || 45, 10) - parseInt(b.deliveryTime || 45, 10));
      break;
    case "distance":
      sorted.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      break;
    case "popularity":
      sorted.sort((a, b) => {
        const ordersA = orderCountMap[a.id] || 0;
        const ordersB = orderCountMap[b.id] || 0;
        if (ordersB !== ordersA) return ordersB - ordersA;
        return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
      });
      break;
    default:
      sorted.sort((a, b) => {
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      });
  }
  return sorted;
};

const enrichWithDistance = (restaurants, lat, lng) => {
  if (!isValidCoord(lat, lng)) return restaurants.map((r) => ({ ...r, distanceKm: null }));
  return restaurants.map((r) => ({
    ...r,
    distanceKm: Math.round(haversineKm(Number(lat), Number(lng), r.lat, r.lng) * 10) / 10,
  }));
};

const getOrderCountMap = async (prisma, restaurantIds) => {
  if (!restaurantIds?.length) return {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const counts = await prisma.order.groupBy({
    by: ["restaurantId"],
    where: { restaurantId: { in: restaurantIds }, createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
    _count: { restaurantId: true },
  });
  return Object.fromEntries(counts.map((c) => [c.restaurantId, c._count.restaurantId]));
};

module.exports = {
  applyRestaurantFilters,
  sortRestaurants,
  enrichWithDistance,
  getOrderCountMap,
  parseBool,
};
