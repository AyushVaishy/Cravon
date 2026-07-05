/**
 * Cravon DB Seed — Zomato CSV (100 Bangalore) + dummy multi-city restaurants
 * Idempotent: wipes seeded data then recreates.
 * Usage: npm run db:seed
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");
const { generateCityRestaurants, getCitySummary, TARGET_TOTAL_RESTAURANTS } = require("./city-restaurants");
const { enrichRestaurantSeed } = require("../src/utils/restaurantMeta");

const prisma = new PrismaClient();

// ─── Static Users ─────────────────────────────────────────────────────────────

const USERS = [
  { name: "Admin User",      email: "admin@cravon.com",  role: "ADMIN" },
  { name: "Rajesh Kumar",    email: "owner1@cravon.com", role: "RESTAURANT_OWNER" },
  { name: "Priya Sharma",    email: "owner2@cravon.com", role: "RESTAURANT_OWNER" },
  { name: "Arun Nair",       email: "owner3@cravon.com", role: "RESTAURANT_OWNER" },
  { name: "Sunita Verma",    email: "user1@cravon.com",  role: "USER" },
  { name: "Karan Mehta",     email: "user2@cravon.com",  role: "USER" },
  { name: "Ananya Iyer",     email: "user3@cravon.com",  role: "USER" },
];

// ─── Restaurant image pool by cuisine ────────────────────────────────────────

const CUISINE_IMAGES = {
  "North Indian": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600",
  "South Indian": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600",
  "Chinese":      "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600",
  "Pizza":        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
  "Biryani":      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600",
  "Cafe":         "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600",
  "Burgers":      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  "Italian":      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
  "Desserts":     "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600",
  "Seafood":      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600",
  "default":      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
};

// ─── Menu item image pool by category ────────────────────────────────────────

const DISH_IMAGES = [
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
];

function restaurantImage(cuisines) {
  for (const c of cuisines) {
    if (CUISINE_IMAGES[c]) return CUISINE_IMAGES[c];
  }
  return CUISINE_IMAGES["default"];
}

function dishImage(index) {
  return DISH_IMAGES[index % DISH_IMAGES.length];
}

// ─── Category inference from dish name ───────────────────────────────────────

const VEG_KEYWORDS = ["paneer", "veg", "aloo", "dal", "palak", "mushroom", "tofu", "chole",
  "rajma", "corn", "veggie", "gobhi", "malai", "matar", "lassi", "tea", "coffee",
  "juice", "shake", "kheer", "gulab", "halwa", "ice cream", "cake", "pastry",
  "bread", "roti", "naan", "paratha", "idli", "dosa", "uttapam", "upma", "poha",
  "chaat", "pani puri", "bhel", "samosa", "pakoda", "spring roll"];

const CATEGORY_MAP = [
  { keywords: ["biryani", "rice", "pulao", "fried rice"], cat: "Rice & Biryani" },
  { keywords: ["paneer", "dal", "curry", "gravy", "sabzi", "matar", "chole"], cat: "Main Course" },
  { keywords: ["soup", "shorba"], cat: "Soups" },
  { keywords: ["salad", "raita", "slaw"], cat: "Salads" },
  { keywords: ["bread", "roti", "naan", "paratha", "kulcha"], cat: "Breads" },
  { keywords: ["idli", "dosa", "uttapam", "vada", "upma"], cat: "South Indian" },
  { keywords: ["pasta", "pizza", "burger", "sandwich", "wrap"], cat: "Continental" },
  { keywords: ["cake", "ice cream", "pastry", "brownie", "kheer", "gulab", "halwa", "rasgulla", "kulfi"], cat: "Desserts" },
  { keywords: ["coffee", "tea", "lassi", "shake", "juice", "mojito", "smoothie"], cat: "Beverages" },
  { keywords: ["chaat", "pani puri", "bhel", "samosa", "pakoda", "spring roll", "tikka", "kebab", "starter"], cat: "Starters" },
];

function inferCategory(dishName) {
  const lower = dishName.toLowerCase();
  for (const { keywords, cat } of CATEGORY_MAP) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "Main Course";
}

function inferIsVeg(dishName) {
  const lower = dishName.toLowerCase();
  return VEG_KEYWORDS.some((k) => lower.includes(k));
}

// ─── Price generation ────────────────────────────────────────────────────────

function generatePrice(costForTwo, category) {
  const base = costForTwo ? costForTwo / 2 / 100 : 200; // convert paise → rupees, divide by items
  const categoryMultipliers = {
    "Starters": 0.4,
    "Soups": 0.3,
    "Salads": 0.35,
    "Breads": 0.2,
    "Beverages": 0.25,
    "Desserts": 0.3,
    "Main Course": 0.5,
    "Rice & Biryani": 0.55,
    "South Indian": 0.4,
    "Continental": 0.6,
  };
  const multiplier = categoryMultipliers[category] || 0.5;
  const price = Math.round((base * multiplier) / 10) * 10; // round to nearest 10
  return Math.max(price, 50) * 100; // min ₹50, convert to paise
}

// ─── Menu item generation from dish names ────────────────────────────────────

function generateMenuItems(dishes, cuisines, costForTwo) {
  const items = [];

  // Use real dish names from CSV
  for (const dish of dishes.slice(0, 10)) {
    const category = inferCategory(dish);
    const isVeg = inferIsVeg(dish);
    items.push({
      name: dish,
      description: `A delightful ${isVeg ? "vegetarian" : ""} ${category.toLowerCase()} dish loved by our guests`,
      price: generatePrice(costForTwo, category),
      category,
      imageUrl: dishImage(items.length),
      isVeg,
      isAvailable: true,
    });
  }

  // If too few dish names, pad with cuisine-appropriate generics
  const GENERIC_BY_CUISINE = {
    "North Indian": [
      { name: "Butter Chicken", isVeg: false, cat: "Main Course" },
      { name: "Paneer Butter Masala", isVeg: true, cat: "Main Course" },
      { name: "Dal Makhani", isVeg: true, cat: "Main Course" },
      { name: "Garlic Naan", isVeg: true, cat: "Breads" },
      { name: "Gulab Jamun", isVeg: true, cat: "Desserts" },
    ],
    "South Indian": [
      { name: "Masala Dosa", isVeg: true, cat: "South Indian" },
      { name: "Idli Sambar", isVeg: true, cat: "South Indian" },
      { name: "Vada", isVeg: true, cat: "South Indian" },
      { name: "Rava Uttapam", isVeg: true, cat: "South Indian" },
    ],
    "Chinese": [
      { name: "Chicken Fried Rice", isVeg: false, cat: "Rice & Biryani" },
      { name: "Veg Manchurian", isVeg: true, cat: "Main Course" },
      { name: "Hakka Noodles", isVeg: true, cat: "Main Course" },
      { name: "Spring Rolls", isVeg: true, cat: "Starters" },
    ],
    "default": [
      { name: "Chef's Special", isVeg: false, cat: "Main Course" },
      { name: "Veg Platter", isVeg: true, cat: "Main Course" },
      { name: "Fresh Lime Soda", isVeg: true, cat: "Beverages" },
    ],
  };

  if (items.length < 5) {
    const cuisine = cuisines[0] || "default";
    const generics = GENERIC_BY_CUISINE[cuisine] || GENERIC_BY_CUISINE["default"];
    for (const g of generics) {
      if (items.length >= 10) break;
      if (items.some((i) => i.name === g.name)) continue;
      items.push({
        name: g.name,
        description: `Classic ${g.cat.toLowerCase()} prepared fresh`,
        price: generatePrice(costForTwo, g.cat),
        category: g.cat,
        imageUrl: dishImage(items.length),
        isVeg: g.isVeg,
        isAvailable: true,
      });
    }
  }

  return items;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const BANGALORE = require(path.join(__dirname, "zomato-parsed.json"));
  const CITY_DATA = generateCityRestaurants();
  const PARSED = [...BANGALORE, ...CITY_DATA];
  const PASSWORD = await bcrypt.hash("Test1234!", 12);
  const OWNER_EMAILS = USERS.filter((u) => u.role === "RESTAURANT_OWNER").map((u) => u.email);

  const summary = getCitySummary();
  console.log(`📍 Target: ${TARGET_TOTAL_RESTAURANTS} total (${BANGALORE.length} Bangalore Zomato + ${CITY_DATA.length} multi-city)`);
  console.log(`   Cities: ${summary.map((s) => `${s.city} (${s.count})`).join(", ")}`);

  console.log("🧹 Cleaning previous seed data…");

  const seedUsers = await prisma.user.findMany({
    where: { email: { in: USERS.map((u) => u.email) } },
    select: { id: true },
  });
  const seedUserIds = seedUsers.map((u) => u.id);

  if (seedUserIds.length > 0) {
    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: { in: seedUserIds } },
      select: { id: true },
    });
    const restIds = restaurants.map((r) => r.id);

    const orderFilter = {
      OR: [
        { userId: { in: seedUserIds } },
        ...(restIds.length ? [{ restaurantId: { in: restIds } }] : []),
      ],
    };

    await prisma.orderItem.deleteMany({ where: { order: orderFilter } });
    await prisma.order.deleteMany({ where: orderFilter });

    await prisma.review.deleteMany({
      where: {
        OR: [
          { userId: { in: seedUserIds } },
          ...(restIds.length ? [{ restaurantId: { in: restIds } }] : []),
        ],
      },
    });

    await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: seedUserIds } } } });
    await prisma.cart.deleteMany({ where: { userId: { in: seedUserIds } } });

    if (restIds.length > 0) {
      await prisma.cartItem.deleteMany({ where: { cart: { restaurantId: { in: restIds } } } });
      await prisma.cart.deleteMany({ where: { restaurantId: { in: restIds } } });
      await prisma.menuItem.deleteMany({ where: { restaurantId: { in: restIds } } });
      await prisma.restaurant.deleteMany({ where: { id: { in: restIds } } });
    }

    await prisma.address.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });
  }

  // ── Create users ────────────────────────────────────────────────────────────
  console.log("👤 Creating users…");
  const createdUsers = {};
  for (const u of USERS) {
    const user = await prisma.user.create({
      data: { name: u.name, email: u.email, password: PASSWORD, role: u.role },
    });
    createdUsers[u.email] = user;
  }

  // ── Create restaurants from Zomato data ────────────────────────────────────
  console.log(`🍽️  Creating ${PARSED.length} restaurants…`);
  let menuTotal = 0;

  for (let i = 0; i < PARSED.length; i++) {
    const r = PARSED[i];
    const ownerEmail = OWNER_EMAILS[i % OWNER_EMAILS.length];
    const owner = createdUsers[ownerEmail];

    const meta = enrichRestaurantSeed(r, i);

    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: owner.id,
        name: r.name,
        description: `${r.cuisines.join(", ")} cuisine in ${r.location || "Bangalore"}. Popular for ${(r.dishLiked[0] || "great food")}.`,
        cuisines: r.cuisines,
        imageUrl: restaurantImage(r.cuisines),
        lat: r.lat,
        lng: r.lng,
        address: r.address,
        city: r.city,
        costForTwo: r.costForTwo || 50000,
        avgRating: r.avgRating ?? 0,
        phone: r.phone || null,
        isOpen: meta.isOpen,
        isPureVeg: meta.isPureVeg,
        offerTag: meta.offerTag,
        isApproved: true,
        openingTime: "09:00",
        closingTime: "23:00",
      },
    });

    const menuItems = generateMenuItems(r.dishLiked, r.cuisines, r.costForTwo);
    await prisma.menuItem.createMany({
      data: menuItems.map((item) => ({ ...item, restaurantId: restaurant.id })),
    });
    menuTotal += menuItems.length;

    if ((i + 1) % 20 === 0) console.log(`  ✓ ${i + 1}/${PARSED.length} restaurants done`);
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Users: ${USERS.length}`);
  console.log(`   Restaurants: ${PARSED.length}`);
  console.log(`   Menu items: ${menuTotal}`);
  console.log(`\n🔑 Test credentials (password: Test1234!)`);
  console.log(`   admin@cravon.com  → Admin`);
  console.log(`   owner1@cravon.com → Restaurant Owner (${Math.ceil(PARSED.length / 3)} restaurants)`);
  console.log(`   user1@cravon.com  → Customer`);
}

main()
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
