const OFFER_TAGS = [
  null,
  "20% OFF up to ₹100",
  "Free Delivery",
  "50% OFF up to ₹80",
  "30% OFF on first order",
  "Flat ₹50 OFF",
];

const seededRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const isPureVegFromCuisines = (cuisines = []) => {
  const joined = cuisines.join(" ").toLowerCase();
  if (joined.includes("vegetarian") || joined.includes("gujarati") || joined.includes("sweets")) {
    return true;
  }
  const meatHeavy = ["biryani", "mughlai", "awadhi", "seafood", "chettinad", "arabian", "kebab", "burgers"];
  if (meatHeavy.some((k) => joined.includes(k))) return false;
  return joined.includes("south indian") || joined.includes("pizza") || joined.includes("cafe");
};

const pickOfferTag = (seed) => OFFER_TAGS[Math.floor(seededRandom(seed) * OFFER_TAGS.length)];

const pickIsOpen = (seed) => seededRandom(seed + 500) > 0.1;

const enrichRestaurantSeed = (record, index) => ({
  isPureVeg: isPureVegFromCuisines(record.cuisines),
  offerTag: pickOfferTag(index * 13 + 7),
  isOpen: pickIsOpen(index),
});

module.exports = {
  OFFER_TAGS,
  isPureVegFromCuisines,
  pickOfferTag,
  pickIsOpen,
  enrichRestaurantSeed,
};
