import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getFavoriteRestaurants,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
  syncFavoriteRestaurants,
  getFavoriteMenuItems,
  addFavoriteMenuItem,
  removeFavoriteMenuItem,
} from '../services/favoritesService';

const STORAGE_KEY = 'qb_favourites';
const ITEMS_KEY = 'qb_favourite_items';

const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveToStorage = (key, items) => {
  try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
};

export const fetchFavoriteRestaurants = createAsyncThunk('favorites/fetchRestaurants', async () => {
  const res = await getFavoriteRestaurants();
  return res.data.restaurants || [];
});

export const fetchFavoriteMenuItems = createAsyncThunk('favorites/fetchItems', async () => {
  const res = await getFavoriteMenuItems();
  return res.data.items || [];
});

export const syncFavoritesFromLocal = createAsyncThunk('favorites/sync', async (_, { getState }) => {
  const local = getState().favorites.items;
  const ids = local.map((r) => r.id);
  if (ids.length === 0) return [];
  const res = await syncFavoriteRestaurants(ids);
  return res.data.restaurants || [];
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: loadFromStorage(STORAGE_KEY),
    menuItems: loadFromStorage(ITEMS_KEY),
    synced: false,
  },
  reducers: {
    toggleFavourite(state, action) {
      const restaurant = action.payload;
      const idx = state.items.findIndex((r) => r.id === restaurant.id);
      if (idx >= 0) state.items.splice(idx, 1);
      else state.items.push(restaurant);
      saveToStorage(STORAGE_KEY, state.items);

      const token = localStorage.getItem('accessToken');
      if (token) {
        if (idx >= 0) removeFavoriteRestaurant(restaurant.id).catch(() => {});
        else addFavoriteRestaurant(restaurant.id).catch(() => {});
      }
    },
    setFavourites(state, action) {
      state.items = action.payload;
      saveToStorage(STORAGE_KEY, state.items);
    },
    toggleFavouriteMenuItem(state, action) {
      const item = action.payload;
      const idx = state.menuItems.findIndex((i) => i.id === item.id);
      if (idx >= 0) state.menuItems.splice(idx, 1);
      else state.menuItems.push(item);
      saveToStorage(ITEMS_KEY, state.menuItems);

      const token = localStorage.getItem('accessToken');
      if (token) {
        if (idx >= 0) removeFavoriteMenuItem(item.id).catch(() => {});
        else addFavoriteMenuItem(item.id).catch(() => {});
      }
    },
    setFavouriteMenuItems(state, action) {
      state.menuItems = action.payload;
      saveToStorage(ITEMS_KEY, state.menuItems);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoriteRestaurants.fulfilled, (state, action) => {
        state.items = action.payload;
        saveToStorage(STORAGE_KEY, state.items);
        state.synced = true;
      })
      .addCase(fetchFavoriteMenuItems.fulfilled, (state, action) => {
        state.menuItems = action.payload;
        saveToStorage(ITEMS_KEY, state.menuItems);
      })
      .addCase(syncFavoritesFromLocal.fulfilled, (state, action) => {
        state.items = action.payload;
        saveToStorage(STORAGE_KEY, state.items);
        state.synced = true;
      });
  },
});

export const {
  toggleFavourite, setFavourites, toggleFavouriteMenuItem, setFavouriteMenuItems,
} = favoritesSlice.actions;
export const selectFavourites = (state) => state.favorites.items;
export const selectFavouriteMenuItems = (state) => state.favorites.menuItems;
export const selectIsFavourite = (id) => (state) =>
  state.favorites.items.some((r) => r.id === id);
export const selectIsFavouriteItem = (id) => (state) =>
  state.favorites.menuItems.some((i) => i.id === id);
export default favoritesSlice.reducer;
