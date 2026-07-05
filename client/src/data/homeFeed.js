/** Curated home feed collection definitions (client-side filters). */

export const CURATED_COLLECTIONS = [
  {
    id: "under-200",
    title: "Best under ₹200",
    subtitle: "Budget-friendly for two",
    emoji: "💸",
    filter: (r) => r.isOpen !== false && (r.costForTwo || 0) <= 20000,
  },
  {
    id: "fast",
    title: "Express Delivery",
    subtitle: "Under 30 minutes",
    emoji: "⚡",
    filter: (r) => r.isOpen !== false && parseInt(r.deliveryTime || 45, 10) <= 30,
  },
  {
    id: "top-rated",
    title: "Top Rated",
    subtitle: "4.5+ stars only",
    emoji: "⭐",
    filter: (r) => parseFloat(r.avgRating || 0) >= 4.5,
  },
  {
    id: "offers",
    title: "Great Offers",
    subtitle: "Deals live now",
    emoji: "🏷️",
    filter: (r) => !!r.offerTag && r.isOpen !== false,
  },
  {
    id: "pure-veg",
    title: "Pure Veg Picks",
    subtitle: "100% vegetarian kitchens",
    emoji: "🌿",
    filter: (r) => r.isPureVeg === true && r.isOpen !== false,
  },
];

export const buildCollections = (restaurants) =>
  CURATED_COLLECTIONS.map((col) => ({
    ...col,
    restaurants: restaurants.filter(col.filter).slice(0, 10),
  })).filter((col) => col.restaurants.length >= 3);
