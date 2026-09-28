import { createSlice } from '@reduxjs/toolkit';

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'delivery_time', label: 'Delivery Time' },
  { value: 'distance', label: 'Distance' },
  { value: 'cost_asc', label: 'Cost: Low to High' },
  { value: 'cost_desc', label: 'Cost: High to Low' },
];

export const RATING_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 3.5, label: '3.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 5.0, label: '5.0' },
];

export const COST_OPTIONS = [
  { value: null,   label: 'Any' },
  { value: 'low',  label: '₹ (Under ₹200 for two)' },
  { value: 'mid',  label: '₹₹ (₹200 – ₹500 for two)' },
  { value: 'high', label: '₹₹₹ (Above ₹500 for two)' },
];

export const DELIVERY_TIME_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 30,   label: 'Under 30 mins' },
  { value: 45,   label: 'Under 45 mins' },
  { value: 60,   label: 'Under 60 mins' },
];

export const DISTANCE_OPTIONS = [
  { value: null, label: 'Any (15 km)' },
  { value: 3, label: 'Within 3 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 8, label: 'Within 8 km' },
  { value: 10, label: 'Within 10 km' },
];

const initialState = {
  sortBy: 'popularity',
  cuisines: [],
  rating: null,
  costRange: null,
  vegOnly: false,
  nonVegOnly: false,
  pureVeg: false,
  openNowOnly: false,
  hasOffers: false,
  freeDelivery: false,
  maxDistance: null,
  acceptsOnlinePayment: false,
  newRestaurants: false,
  deliveryTimeMax: null,
};

/** Build query params for GET /api/restaurants */
export const filtersToParams = (filters) => {
  const p = { sortBy: filters.sortBy || 'popularity' };
  if (filters.cuisines?.length) p.cuisines = filters.cuisines.join(',');
  if (filters.rating != null) p.rating = filters.rating;
  if (filters.costRange) p.costRange = filters.costRange;
  if (filters.deliveryTimeMax != null) p.deliveryTimeMax = filters.deliveryTimeMax;
  if (filters.pureVeg) p.pureVeg = 'true';
  if (filters.vegOnly) p.vegOnly = 'true';
  if (filters.nonVegOnly) p.nonVegOnly = 'true';
  if (filters.openNowOnly) p.openNow = 'true';
  if (filters.hasOffers) p.hasOffers = 'true';
  if (filters.freeDelivery) p.freeDelivery = 'true';
  if (filters.maxDistance != null) p.maxDistance = filters.maxDistance;
  if (filters.acceptsOnlinePayment) p.acceptsOnlinePayment = 'true';
  if (filters.newRestaurants) p.newRestaurants = 'true';
  return p;
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    applyFilters: (state, action) => ({ ...state, ...action.payload }),
    clearFilters: () => ({ ...initialState }),
    toggleVeg: (state) => {
      state.vegOnly = !state.vegOnly;
      if (state.vegOnly) state.nonVegOnly = false;
    },
    toggleNonVeg: (state) => {
      state.nonVegOnly = !state.nonVegOnly;
      if (state.nonVegOnly) { state.vegOnly = false; state.pureVeg = false; }
    },
    togglePureVeg: (state) => {
      state.pureVeg = !state.pureVeg;
      if (state.pureVeg) { state.nonVegOnly = false; state.vegOnly = false; }
    },
    toggleOpenNow: (state) => { state.openNowOnly = !state.openNowOnly; },
    toggleHasOffers: (state) => { state.hasOffers = !state.hasOffers; },
    toggleFreeDelivery: (state) => { state.freeDelivery = !state.freeDelivery; },
    toggleNewRestaurants: (state) => { state.newRestaurants = !state.newRestaurants; },
    toggleAcceptsOnlinePayment: (state) => { state.acceptsOnlinePayment = !state.acceptsOnlinePayment; },
  },
});

export const {
  applyFilters, clearFilters, toggleVeg, toggleNonVeg, togglePureVeg,
  toggleOpenNow, toggleHasOffers, toggleFreeDelivery, toggleNewRestaurants,
  toggleAcceptsOnlinePayment,
} = filtersSlice.actions;
export default filtersSlice.reducer;
