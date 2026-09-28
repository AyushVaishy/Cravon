import { createSlice } from '@reduxjs/toolkit';
import { cartLineKey } from '../utils/cartUtils';

const CART_STORAGE_KEY = 'cravon_cart';

const loadCartItems = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const persistCartItems = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: loadCartItems() },
  reducers: {
    addItem: (state, action) => {
      const newItem = action.payload;
      const menuItemId = newItem.menuItemId || newItem.id;
      const lineKey = cartLineKey({ ...newItem, menuItemId });
      const maxQty = newItem.maxQty || 10;

      const existing = state.items.find((item) => cartLineKey(item) === lineKey);
      const qtyToAdd = newItem.quantity || 1;

      if (existing) {
        existing.quantity = Math.min(existing.quantity + qtyToAdd, maxQty);
      } else {
        state.items.push({
          ...newItem,
          menuItemId,
          id: menuItemId,
          lineKey,
          quantity: Math.min(qtyToAdd, maxQty),
        });
      }
      persistCartItems(state.items);
    },
    removeItem: (state, action) => {
      const key = action.payload;
      state.items = state.items.filter((item) => cartLineKey(item) !== key && item.lineKey !== key && item.id !== key);
      persistCartItems(state.items);
    },
    clearRestaurantItems: (state, action) => {
      const restaurantId = action.payload;
      state.items = state.items.filter((item) => item.restaurantId !== restaurantId);
      persistCartItems(state.items);
    },
    clearCart: () => {
      persistCartItems([]);
      return { items: [] };
    },
    updateQuantity: (state, action) => {
      const { lineKey, id, quantity, maxQty = 10 } = action.payload;
      const item = state.items.find((i) => i.lineKey === lineKey || cartLineKey(i) === lineKey || i.id === id);
      if (item) item.quantity = Math.min(Math.max(1, quantity), maxQty);
      persistCartItems(state.items);
    },
    setCart: (state, action) => {
      state.items = action.payload || [];
      persistCartItems(state.items);
    },
  },
});

export const { addItem, removeItem, clearRestaurantItems, clearCart, updateQuantity, setCart } = cartSlice.actions;
export default cartSlice.reducer;
