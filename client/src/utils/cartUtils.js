export const cartLineKey = (item) =>
  `${item.menuItemId || item.id}::${JSON.stringify(item.customizations || {})}::${item.itemNotes || ''}`;

export const formatCustomizationLabel = (labels = {}) => {
  const parts = [];
  Object.values(labels).forEach((val) => {
    if (Array.isArray(val)) parts.push(...val);
    else if (val) parts.push(String(val));
  });
  return parts.join(", ");
};

/** Group cart lines by restaurant (preserves first-seen order). */
export const groupCartByRestaurant = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const rid = item.restaurantId || "unknown";
    if (!map.has(rid)) {
      map.set(rid, {
        restaurantId: rid,
        restaurantName: item.restaurantName || "Restaurant",
        imageUrl: item.imageUrl || null,
        items: [],
      });
    }
    const group = map.get(rid);
    group.items.push(item);
    if (!group.imageUrl && item.imageUrl) group.imageUrl = item.imageUrl;
    if (item.restaurantName) group.restaurantName = item.restaurantName;
  });
  return Array.from(map.values());
};

export const uniqueRestaurantCount = (items = []) =>
  new Set(items.map((i) => i.restaurantId).filter(Boolean)).size;
