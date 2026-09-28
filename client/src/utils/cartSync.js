import { syncCart as syncCartApi } from "../services/cartService";
import { cartLineKey } from "./cartUtils";

let syncTimer = null;

export const mapServerCartToRedux = (serverCart, restaurantName) => {
  if (!serverCart?.items?.length) return [];
  const restNameById = {};
  (serverCart.restaurants || []).forEach((r) => {
    if (r?.id) restNameById[r.id] = r.name;
  });
  return serverCart.items.map((item) => {
    const customLabel = item.customizations && typeof item.customizations === "object"
      ? Object.values(item.customizations).flat().filter(Boolean).join(", ")
      : "";
    const restaurantId = item.restaurantId || serverCart.restaurantId;
    return {
      menuItemId: item.menuItemId,
      id: item.menuItemId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      customizations: item.customizations,
      customizationLabel: customLabel,
      itemNotes: item.itemNotes,
      lineKey: item.lineKey || cartLineKey(item),
      restaurantId,
      restaurantName:
        item.restaurantName ||
        restNameById[restaurantId] ||
        serverCart.restaurant?.name ||
        restaurantName,
      cartItemId: item.cartItemId || item.id,
      isVeg: item.isVeg,
    };
  });
};

export const mapReduxCartToServer = (items) =>
  items.map((item) => ({
    menuItemId: item.menuItemId || item.id,
    quantity: item.quantity,
    unitPrice: item.price,
    customizations: item.customizations || null,
    itemNotes: item.itemNotes || null,
    lineKey: cartLineKey(item),
    restaurantId: item.restaurantId,
  }));

export const debouncedSyncCart = (items, restaurantId) => {
  if (!localStorage.getItem("accessToken") || !items.length) return;
  const primaryId = restaurantId || items[0]?.restaurantId;
  if (!primaryId) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncCartApi(primaryId, mapReduxCartToServer(items)).catch(() => {});
  }, 800);
};

export const mergeCartOnLogin = async (localItems, dispatch, setCart) => {
  if (!localStorage.getItem("accessToken")) return;
  try {
    const { syncCart: syncApi, getCart } = await import("../services/cartService");
    if (localItems.length > 0) {
      const restaurantId = localItems[0].restaurantId;
      await syncApi(restaurantId, mapReduxCartToServer(localItems));
      return;
    }
    const res = await getCart();
    const serverItems = mapServerCartToRedux(res.data.cart);
    if (serverItems.length > 0) {
      dispatch(setCart(serverItems));
    }
  } catch {
    /* keep local cart */
  }
};
