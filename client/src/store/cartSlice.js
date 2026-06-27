import { createSlice } from '@reduxjs/toolkit';

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
    /* ignore quota errors */
  }
};

// Cart item shape: { id, name, price, isVeg, restaurantId, restaurantName, imageUrl, quantity }
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartItems(),
  },
  reducers: {
    addItem: (state, action) => {
      const newItem = action.payload;
      if (state.items.length > 0 && state.items[0].restaurantId !== newItem.restaurantId) {
        state.items = [];
      }
      const existing = state.items.find((item) => item.id === newItem.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...newItem, quantity: 1 });
      }
      persistCartItems(state.items);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      persistCartItems(state.items);
    },
    clearCart: () => {
      persistCartItems([]);
      return { items: [] };
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        item.quantity = quantity;
      }
      persistCartItems(state.items);
    },
  },
});

export const { addItem, removeItem, clearCart, updateQuantity } = cartSlice.actions;

export default cartSlice.reducer;
