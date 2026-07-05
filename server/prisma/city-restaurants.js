/**
 * Programmatic multi-city restaurant seed — 400 restaurants across famous areas.
 * Combined with zomato-parsed.json (100 Bangalore) → 500 total.
 */

const TARGET_CITY_RESTAURANTS = 400;
const BANGALORE_ZOMATO_COUNT = 100;
const TARGET_TOTAL_RESTAURANTS = BANGALORE_ZOMATO_COUNT + TARGET_CITY_RESTAURANTS;

const CUISINE_TEMPLATES = [
  { cuisines: ["North Indian", "Mughlai"], label: "Darbar", dishes: ["Butter Chicken", "Dal Makhani", "Paneer Tikka", "Garlic Naan", "Phirni", "Biryani", "Raita", "Gulab Jamun"] },
  { cuisines: ["Biryani", "Hyderabadi"], label: "Biryani", dishes: ["Chicken Biryani", "Mutton Biryani", "Paneer Biryani", "Mirchi Ka Salan", "Raita", "Double Ka Meetha", "Kebab"] },
  { cuisines: ["South Indian"], label: "Dosa", dishes: ["Masala Dosa", "Idli Sambar", "Filter Coffee", "Medu Vada", "Rava Uttapam", "Pongal", "Rasam"] },
  { cuisines: ["Chinese"], label: "Wok", dishes: ["Chicken Fried Rice", "Veg Manchurian", "Hakka Noodles", "Spring Rolls", "Hot & Sour Soup", "Chilli Chicken"] },
  { cuisines: ["Street Food", "North Indian"], label: "Chaat", dishes: ["Gol Gappe", "Aloo Tikki", "Dahi Bhalla", "Chole Bhature", "Pani Puri", "Lassi"] },
  { cuisines: ["Pizza", "Italian"], label: "Pizza", dishes: ["Margherita Pizza", "Farmhouse Pizza", "Garlic Bread", "Pasta Arrabiata", "Tiramisu", "Brownie"] },
  { cuisines: ["Cafe", "Continental"], label: "Cafe", dishes: ["Cold Coffee", "Avocado Toast", "Pasta Pesto", "Caesar Salad", "Cheesecake", "Waffles"] },
  { cuisines: ["Bengali", "Seafood"], label: "Bhoj", dishes: ["Fish Curry", "Rice", "Shukto", "Mishti Doi", "Rasgulla", "Kathi Roll"] },
  { cuisines: ["Maharashtrian", "Street Food"], label: "Misal", dishes: ["Misal Pav", "Vada Pav", "Pav Bhaji", "Poha", "Solkadhi", "Modak"] },
  { cuisines: ["Punjabi", "North Indian"], label: "Dhaba", dishes: ["Dal Tadka", "Paneer Butter Masala", "Tandoori Roti", "Lassi", "Jeera Rice", "Kulfi"] },
  { cuisines: ["Awadhi", "Mughlai"], label: "Kebab", dishes: ["Galouti Kebab", "Mutton Biryani", "Sheermal", "Korma", "Shahi Tukda", "Roomali Roti"] },
  { cuisines: ["Chettinad", "South Indian"], label: "Chettinad", dishes: ["Chicken Chettinad", "Appam", "Fish Curry", "Kuzhi Paniyaram", "Payasam", "Parotta"] },
  { cuisines: ["Burgers", "Fast Food"], label: "Burger", dishes: ["Classic Burger", "Veggie Burger", "Loaded Fries", "Chicken Wings", "Milkshake", "Brownie"] },
  { cuisines: ["Arabian", "Fast Food"], label: "Shawarma", dishes: ["Chicken Shawarma", "Falafel Wrap", "Hummus", "Garlic Sauce", "Mint Lemonade", "Kebab Plate"] },
  { cuisines: ["Seafood", "Coastal"], label: "Coastal", dishes: ["Prawn Fry", "Fish Curry", "Neer Dosa", "Crab Masala", "Coconut Rice", "Payasam"] },
  { cuisines: ["Rajasthani", "North Indian"], label: "Thali", dishes: ["Dal Baati", "Gatte Ki Sabzi", "Ker Sangri", "Roti", "Ghevar", "Lassi"] },
  { cuisines: ["Gujarati", "Vegetarian"], label: "Bhavan", dishes: ["Dhokla", "Thepla", "Undhiyu", "Fafda", "Jalebi", "Chaas"] },
  { cuisines: ["Sweets", "North Indian"], label: "Mithai", dishes: ["Rasgulla", "Gulab Jamun", "Kachori", "Samosa", "Rabri", "Lassi"] },
];

const NAME_PREFIXES = [
  "Royal", "Spice", "Golden", "Urban", "Classic", "Desi", "Tasty", "Cravon",
  "Heritage", "Metro", "Grand", "New", "Old", "Famous", "Local", "Premium",
  "Express", "Corner", "Central", "City", "District", "Market", "Street",
];

const NAME_SUFFIXES = [
  "Kitchen", "House", "Express", "Corner", "Hub", "Stop", "Lounge", "Grill",
  "Palace", "Mess", "Bhavan", "Cafe", "Bistro", "Joint", "Trail", "Box",
  "Factory", "Club", "Point", "Spot", "Delight", "Feast", "Flavours",
];

const CITY_DEFINITIONS = [
  {
    city: "Delhi",
    count: 50,
    areas: [
      { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
      { name: "Sarojini Nagar", lat: 28.5740, lng: 77.1995 },
      { name: "Lajpat Nagar", lat: 28.5673, lng: 77.2433 },
      { name: "Karol Bagh", lat: 28.6519, lng: 77.1909 },
      { name: "Hauz Khas", lat: 28.5494, lng: 77.2001 },
      { name: "Saket", lat: 28.5244, lng: 77.2066 },
      { name: "Khan Market", lat: 28.6003, lng: 77.2270 },
      { name: "Greater Kailash", lat: 28.5494, lng: 77.2410 },
      { name: "South Extension", lat: 28.5689, lng: 77.2210 },
      { name: "Rajouri Garden", lat: 28.6462, lng: 77.1214 },
      { name: "Pitampura", lat: 28.7041, lng: 77.1310 },
      { name: "Rohini", lat: 28.7495, lng: 77.0815 },
      { name: "Dwarka", lat: 28.5921, lng: 77.0460 },
      { name: "Vasant Kunj", lat: 28.5244, lng: 77.1581 },
      { name: "Nehru Place", lat: 28.5494, lng: 77.2515 },
      { name: "Chandni Chowk", lat: 28.6506, lng: 77.2303 },
      { name: "Punjabi Bagh", lat: 28.6692, lng: 77.1407 },
      { name: "Janakpuri", lat: 28.6219, lng: 77.0815 },
      { name: "Malviya Nagar", lat: 28.5355, lng: 77.2110 },
      { name: "Defence Colony", lat: 28.5733, lng: 77.2308 },
    ],
  },
  {
    city: "Mumbai",
    count: 50,
    areas: [
      { name: "Bandra West", lat: 19.0596, lng: 72.8295 },
      { name: "Andheri West", lat: 19.1197, lng: 72.8468 },
      { name: "Juhu", lat: 19.1075, lng: 72.8263 },
      { name: "Colaba", lat: 18.9067, lng: 72.8147 },
      { name: "Powai", lat: 19.1176, lng: 72.9060 },
      { name: "Lower Parel", lat: 19.0056, lng: 72.8302 },
      { name: "Borivali West", lat: 19.2307, lng: 72.8567 },
      { name: "Thane West", lat: 19.2183, lng: 72.9781 },
      { name: "Dadar", lat: 19.0178, lng: 72.8478 },
      { name: "Worli", lat: 19.0176, lng: 72.8138 },
      { name: "Malad West", lat: 19.1860, lng: 72.8485 },
      { name: "Goregaon West", lat: 19.1663, lng: 72.8526 },
      { name: "Kurla", lat: 19.0660, lng: 72.8777 },
      { name: "Ghatkopar", lat: 19.0860, lng: 72.9081 },
      { name: "Marine Drive", lat: 18.9432, lng: 72.8236 },
      { name: "Churchgate", lat: 18.9322, lng: 72.8265 },
      { name: "Lokhandwala", lat: 19.1440, lng: 72.8260 },
      { name: "Versova", lat: 19.1283, lng: 72.8120 },
    ],
  },
  {
    city: "Hyderabad",
    count: 34,
    areas: [
      { name: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
      { name: "HITEC City", lat: 17.4435, lng: 78.3772 },
      { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
      { name: "Jubilee Hills", lat: 17.4226, lng: 78.4071 },
      { name: "Madhapur", lat: 17.4485, lng: 78.3908 },
      { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
      { name: "Charminar", lat: 17.3616, lng: 78.4747 },
      { name: "Kondapur", lat: 17.4617, lng: 78.3648 },
      { name: "Begumpet", lat: 17.4447, lng: 78.4666 },
      { name: "Ameerpet", lat: 17.4375, lng: 78.4482 },
      { name: "Kukatpally", lat: 17.4849, lng: 78.4138 },
      { name: "LB Nagar", lat: 17.3660, lng: 78.5570 },
    ],
  },
  {
    city: "Chennai",
    count: 28,
    areas: [
      { name: "T Nagar", lat: 13.0418, lng: 80.2341 },
      { name: "Anna Nagar", lat: 13.0850, lng: 80.2101 },
      { name: "Adyar", lat: 13.0067, lng: 80.2577 },
      { name: "Velachery", lat: 12.9815, lng: 80.2180 },
      { name: "Mylapore", lat: 13.0339, lng: 80.2619 },
      { name: "Nungambakkam", lat: 13.0609, lng: 80.2426 },
      { name: "OMR Sholinganallur", lat: 12.9010, lng: 80.2279 },
      { name: "Porur", lat: 13.0382, lng: 80.1564 },
      { name: "Tambaram", lat: 12.9249, lng: 80.1000 },
      { name: "Egmore", lat: 13.0732, lng: 80.2609 },
      { name: "Besant Nagar", lat: 13.0060, lng: 80.2694 },
    ],
  },
  {
    city: "Pune",
    count: 22,
    areas: [
      { name: "Koregaon Park", lat: 18.5362, lng: 73.8937 },
      { name: "FC Road", lat: 18.5204, lng: 73.8408 },
      { name: "Hinjewadi", lat: 18.5912, lng: 73.7389 },
      { name: "Kothrud", lat: 18.5074, lng: 73.8077 },
      { name: "Camp", lat: 18.5204, lng: 73.8756 },
      { name: "Baner", lat: 18.5590, lng: 73.7868 },
      { name: "Wakad", lat: 18.5993, lng: 73.7625 },
      { name: "Aundh", lat: 18.5590, lng: 73.8077 },
      { name: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
      { name: "Hadapsar", lat: 18.5089, lng: 73.9260 },
    ],
  },
  {
    city: "Kolkata",
    count: 22,
    areas: [
      { name: "Park Street", lat: 22.5535, lng: 88.3519 },
      { name: "Salt Lake Sector V", lat: 22.5797, lng: 88.4141 },
      { name: "New Market", lat: 22.5591, lng: 88.3530 },
      { name: "Ballygunge", lat: 22.5300, lng: 88.3654 },
      { name: "Howrah", lat: 22.5958, lng: 88.2636 },
      { name: "Gariahat", lat: 22.5180, lng: 88.3639 },
      { name: "Esplanade", lat: 22.5660, lng: 88.3510 },
      { name: "Rajarhat", lat: 22.6220, lng: 88.4500 },
      { name: "Dum Dum", lat: 22.6270, lng: 88.4220 },
    ],
  },
  {
    city: "Lucknow",
    count: 18,
    areas: [
      { name: "Hazratganj", lat: 26.8467, lng: 80.9462 },
      { name: "Gomti Nagar", lat: 26.8606, lng: 81.0209 },
      { name: "Aminabad", lat: 26.8526, lng: 80.9234 },
      { name: "Alambagh", lat: 26.7986, lng: 80.9070 },
      { name: "Indira Nagar", lat: 26.8719, lng: 80.9580 },
      { name: "Mahanagar", lat: 26.8700, lng: 80.9500 },
    ],
  },
  {
    city: "Jaipur",
    count: 18,
    areas: [
      { name: "MI Road", lat: 26.9160, lng: 75.8120 },
      { name: "C Scheme", lat: 26.9124, lng: 75.7873 },
      { name: "Malviya Nagar", lat: 26.8540, lng: 75.8240 },
      { name: "Vaishali Nagar", lat: 26.9030, lng: 75.7400 },
      { name: "Raja Park", lat: 26.8940, lng: 75.8280 },
      { name: "Bani Park", lat: 26.9280, lng: 75.7900 },
    ],
  },
  {
    city: "Ahmedabad",
    count: 18,
    areas: [
      { name: "SG Highway", lat: 23.0225, lng: 72.5175 },
      { name: "Navrangpura", lat: 23.0360, lng: 72.5610 },
      { name: "Satellite", lat: 23.0220, lng: 72.5240 },
      { name: "Vastrapur", lat: 23.0370, lng: 72.5300 },
      { name: "Maninagar", lat: 22.9980, lng: 72.6010 },
      { name: "Prahlad Nagar", lat: 23.0120, lng: 72.5100 },
    ],
  },
  {
    city: "Noida",
    count: 16,
    areas: [
      { name: "Sector 18", lat: 28.5708, lng: 77.3261 },
      { name: "Sector 62", lat: 28.6240, lng: 77.3640 },
      { name: "Sector 50", lat: 28.5740, lng: 77.3560 },
      { name: "Sector 137", lat: 28.5020, lng: 77.4120 },
      { name: "Greater Noida", lat: 28.4744, lng: 77.5040 },
    ],
  },
  {
    city: "Gurgaon",
    count: 16,
    areas: [
      { name: "Cyber City", lat: 28.4940, lng: 77.0880 },
      { name: "DLF Phase 1", lat: 28.4720, lng: 77.0960 },
      { name: "Golf Course Road", lat: 28.4590, lng: 77.0820 },
      { name: "Sohna Road", lat: 28.4200, lng: 77.0400 },
      { name: "Old Gurgaon", lat: 28.4595, lng: 77.0266 },
    ],
  },
  {
    city: "Chandigarh",
    count: 12,
    areas: [
      { name: "Sector 17", lat: 30.7333, lng: 76.7794 },
      { name: "Sector 22", lat: 30.7280, lng: 76.7690 },
      { name: "Sector 35", lat: 30.7220, lng: 76.7680 },
      { name: "Elante Mall", lat: 30.7050, lng: 76.8010 },
      { name: "Panchkula", lat: 30.6942, lng: 76.8606 },
    ],
  },
  {
    city: "Goa",
    count: 12,
    areas: [
      { name: "Panaji", lat: 15.4909, lng: 73.8278 },
      { name: "Calangute", lat: 15.5439, lng: 73.7553 },
      { name: "Baga", lat: 15.5550, lng: 73.7517 },
      { name: "Margao", lat: 15.2832, lng: 73.9862 },
      { name: "Candolim", lat: 15.5180, lng: 73.7620 },
    ],
  },
  {
    city: "Kochi",
    count: 10,
    areas: [
      { name: "MG Road", lat: 9.9674, lng: 76.2870 },
      { name: "Edapally", lat: 10.0150, lng: 76.3100 },
      { name: "Fort Kochi", lat: 9.9658, lng: 76.2420 },
      { name: "Kakkanad", lat: 10.0150, lng: 76.3400 },
    ],
  },
  {
    city: "Ayodhya",
    count: 8,
    areas: [
      { name: "Ram Ki Paidi", lat: 26.8030, lng: 82.2044 },
      { name: "Civil Lines", lat: 26.7922, lng: 82.1998 },
      { name: "Naya Ghat", lat: 26.7955, lng: 82.2102 },
      { name: "Saket", lat: 26.7870, lng: 82.1850 },
    ],
  },
  {
    city: "Varanasi",
    count: 8,
    areas: [
      { name: "Godowlia", lat: 25.3107, lng: 83.0107 },
      { name: "Assi Ghat", lat: 25.2850, lng: 83.0060 },
      { name: "Lanka", lat: 25.2670, lng: 82.9910 },
      { name: "Sigra", lat: 25.3170, lng: 82.9900 },
    ],
  },
  {
    city: "Amritsar",
    count: 8,
    areas: [
      { name: "Golden Temple Area", lat: 31.6200, lng: 74.8765 },
      { name: "Hall Bazaar", lat: 31.6340, lng: 74.8720 },
      { name: "Ranjit Avenue", lat: 31.6450, lng: 74.8600 },
    ],
  },
  {
    city: "Indore",
    count: 8,
    areas: [
      { name: "Vijay Nagar", lat: 22.7533, lng: 75.8937 },
      { name: "Palasia", lat: 22.7240, lng: 75.8830 },
      { name: "Sarafa Bazaar", lat: 22.7196, lng: 75.8577 },
    ],
  },
  {
    city: "Bhopal",
    count: 6,
    areas: [
      { name: "MP Nagar", lat: 23.2324, lng: 77.4326 },
      { name: "New Market", lat: 23.2599, lng: 77.4126 },
      { name: "Arera Colony", lat: 23.2100, lng: 77.4300 },
    ],
  },
  {
    city: "Nagpur",
    count: 6,
    areas: [
      { name: "Sitabuldi", lat: 21.1458, lng: 79.0882 },
      { name: "Dharampeth", lat: 21.1380, lng: 79.0600 },
      { name: "Civil Lines", lat: 21.1520, lng: 79.0850 },
    ],
  },
  {
    city: "Visakhapatnam",
    count: 6,
    areas: [
      { name: "RK Beach", lat: 17.7350, lng: 83.3210 },
      { name: "Dwaraka Nagar", lat: 17.7280, lng: 83.3050 },
      { name: "Gajuwaka", lat: 17.7000, lng: 83.2200 },
    ],
  },
  {
    city: "Coimbatore",
    count: 6,
    areas: [
      { name: "RS Puram", lat: 11.0056, lng: 76.9661 },
      { name: "Peelamedu", lat: 11.0280, lng: 77.0100 },
      { name: "Gandhipuram", lat: 11.0168, lng: 76.9558 },
    ],
  },
  {
    city: "Mysuru",
    count: 6,
    areas: [
      { name: "Devaraja Market", lat: 12.3051, lng: 76.6552 },
      { name: "Vijay Nagar", lat: 12.3160, lng: 76.6200 },
      { name: "Gokulam", lat: 12.3400, lng: 76.6300 },
    ],
  },
  {
    city: "Surat",
    count: 6,
    areas: [
      { name: "Adajan", lat: 21.1950, lng: 72.7930 },
      { name: "Vesu", lat: 21.1410, lng: 72.7700 },
      { name: "Ring Road", lat: 21.1702, lng: 72.8311 },
    ],
  },
  {
    city: "Patna",
    count: 6,
    areas: [
      { name: "Boring Road", lat: 25.6093, lng: 85.1235 },
      { name: "Fraser Road", lat: 25.6120, lng: 85.1370 },
      { name: "Kankarbagh", lat: 25.5900, lng: 85.1600 },
    ],
  },
];

function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function jitter(coord, seed, spread = 0.018) {
  return coord + (seededRandom(seed) - 0.5) * spread;
}

function buildRestaurantName(city, areaName, template, index) {
  const prefix = NAME_PREFIXES[index % NAME_PREFIXES.length];
  const suffix = NAME_SUFFIXES[(index + 7) % NAME_SUFFIXES.length];
  const areaShort = areaName.split(" ")[0];
  const variants = [
    `${prefix} ${template.label} ${suffix}`,
    `${areaShort} ${template.label} ${suffix}`,
    `${city} ${template.label} ${suffix}`,
    `${prefix} ${areaShort} ${suffix}`,
  ];
  return variants[index % variants.length];
}

function pickRating(seed) {
  return Math.round((3.6 + seededRandom(seed) * 1.3) * 10) / 10;
}

function pickCost(seed) {
  const tiers = [25000, 35000, 45000, 55000, 65000, 75000, 85000, 95000];
  return tiers[Math.floor(seededRandom(seed) * tiers.length)];
}

/** Flat list compatible with zomato-parsed.json shape */
function generateCityRestaurants() {
  const out = [];
  let globalIndex = 0;

  for (const cityDef of CITY_DEFINITIONS) {
    for (let i = 0; i < cityDef.count; i++) {
      const area = cityDef.areas[i % cityDef.areas.length];
      const template = CUISINE_TEMPLATES[(globalIndex + i) % CUISINE_TEMPLATES.length];
      const seed = globalIndex * 17 + i * 31;

      out.push({
        name: buildRestaurantName(cityDef.city, area.name, template, globalIndex),
        city: cityDef.city,
        location: area.name,
        address: `${area.name}, ${cityDef.city}`,
        lat: jitter(area.lat, seed),
        lng: jitter(area.lng, seed + 1),
        cuisines: template.cuisines,
        dishLiked: template.dishes.slice(0, 6 + (globalIndex % 3)),
        costForTwo: pickCost(seed + 2),
        avgRating: pickRating(seed + 3),
        phone: null,
      });
      globalIndex++;
    }
  }

  return out;
}

function getCitySummary() {
  return CITY_DEFINITIONS.map((c) => ({ city: c.city, count: c.count, areas: c.areas.length }));
}

module.exports = {
  TARGET_CITY_RESTAURANTS,
  TARGET_TOTAL_RESTAURANTS,
  BANGALORE_ZOMATO_COUNT,
  CITY_DEFINITIONS,
  generateCityRestaurants,
  getCitySummary,
};
