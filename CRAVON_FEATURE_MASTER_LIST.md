# Cravon — Master Feature List (Swiggy / Zomato Parity)

**Purpose:** Single checklist for everything a full-stack food delivery platform should have — user POV roadmap + owner + admin + AI + technical portfolio features.  
**Priority order:** 1) User Dashboard → 2) Restaurant Owner → 3) Super Admin → 4) AI & Technical  
**Legend:**

| Symbol | Meaning |
|--------|---------|
| ✅ | **Done** — works end-to-end |
| ⚠️ | **Partial / Bug** — started but broken, fake, or incomplete |
| ❌ | **Not implemented** |

**Last updated:** July 1, 2026 (full user POV roadmap sync)

---

# PART 1 — USER DASHBOARD (Customer App)

**Route base:** `/home/*`  
**Overall completion:** ~52% (see summary at end of Part 1)

---

## A. Authentication & Account

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | User registration (email + password signup) | ✅ | Signup → 6-digit email OTP → verify before session; `POST /auth/signup`, `/verify-email`, `/resend-verification` |
| 2 | Email & password login | ✅ | Blocks unverified local accounts; resends OTP on login attempt |
| 3 | Google OAuth login / signup | ✅ | `GET /auth/google`, callback, account linking by email |
| 4 | Facebook social login / signup | ✅ | `GET /auth/facebook`, callback, account linking by email |
| 5 | Phone OTP login | ❌ | Not started — planned post-v1 |
| 6 | Forgot password | ✅ | Sign-in sidebar + Profile Settings |
| 7 | Reset password via email link | ✅ | SendGrid / SMTP; `ResetPasswordPage.js` |
| 8 | JWT authentication | ✅ | Access token in `localStorage`; axios interceptor |
| 9 | Refresh token | ✅ | Rotation on 401; `POST /auth/refresh` |
| 10 | Remember me (extended session) | ✅ | Login checkbox → 30-day refresh cookie vs 7-day default |
| 11 | Auto login on page refresh (session restore) | ✅ | `GET /auth/me` on app load |
| 12 | Logout | ✅ | `performLogout()` → `POST /auth/logout` + clears Redux |
| 13 | Logout from all devices | ✅ | `POST /auth/logout-all` — invalidates all sessions via `refreshTokenVersion` |
| 14 | Email verification on signup (OTP) | ✅ | 6-digit code; 10 min expiry; branded HTML email |
| 15 | Role-based redirect after login (USER → /home) | ✅ | USER → `/home`, OWNER → `/owner`, ADMIN → `/admin` |
| 16 | Protected routes (must login to order) | ✅ | Browse/cart public; checkout prompts sign-in |
| 17 | Guest browse restaurants without login | ✅ | `/home` public; login only at checkout |
| 18 | Sign up as Customer vs Restaurant Owner | ✅ | Role toggle on signup + OAuth `state` |
| 19 | Profile management (view / edit name, phone) | ✅ | Profile page tabs |
| 20 | Change password | ✅ | Profile Settings; social users can add password |
| 21 | Upload profile picture | ✅ | Profile tab — image upload → `PUT /auth/me/avatar` (max 10 MB) |
| 22 | Account settings | ✅ | Settings tab — password, theme, notifications, sessions, delete account |
| 23 | Notification settings (email / push prefs) | ✅ | Settings → toggles persisted via `PUT /auth/me/notifications` |
| 24 | Email change | ✅ | Profile → change email with OTP to new address |
| 25 | Delete my account | ✅ | Settings → password or `DELETE MY ACCOUNT` confirmation |
| 26 | Guest cart in `localStorage` | ✅ | Persists pre-login cart |

**Section completion:** 100% (24 done · 0 partial · 1 not started — phone OTP excluded from v1)

**Also implemented:** social ↔ email account linking, production cookies, SendGrid email, remember-me sessions, logout-all-devices, avatar upload, email change OTP, notification prefs, account deletion.

### Auth by method

| Capability | Email + password | Google OAuth | Facebook OAuth | Phone OTP |
|------------|------------------|--------------|----------------|----------|
| Signup | ✅ (+ email OTP) | ✅ | ✅ | ❌ |
| Login | ✅ | ✅ | ✅ | ❌ |
| Logout / refresh | ✅ | ✅ | ✅ | ❌ |
| Forgot / reset / change password | ✅ | ✅ (add password) | ✅ (add password) | ❌ |
| Email verification | ✅ OTP | ✅ (via Google) | ✅ (if email shared) | ❌ |

### Production deployment checklist (auth)

| Item | Dev | Production (Render) |
|------|-----|---------------------|
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/auth/google/callback` | `https://cravon.onrender.com/api/auth/google/callback` |
| `FACEBOOK_CALLBACK_URL` | `http://localhost:5000/api/auth/facebook/callback` | `https://cravon.onrender.com/api/auth/facebook/callback` |
| Email (OTP + reset) | SendGrid or Gmail SMTP | `SENDGRID_API_KEY` + verified `EMAIL_FROM` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | dev placeholders | Strong random secrets |
| Run migrations | `npx prisma migrate dev` | `npx prisma migrate deploy` |

---

## B. Location

**Section completion:** 100% (15 done · 0 partial · 0 not started)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 27 | Detect current location (GPS) | ✅ | Browser geolocation in `LocationPanel.js` |
| 28 | Search delivery / browse location | ✅ | Address search via backend geocoding proxy |
| 29 | Google Maps integration | ✅ | Google Maps JS picker when `GOOGLE_MAPS_API_KEY` set; OpenStreetMap/Leaflet fallback |
| 30 | Address autocomplete | ✅ | Google Places via server proxy when key set; Nominatim fallback |
| 31 | Reverse geocoding (lat/lng → address) | ✅ | Backend proxy used on GPS pin |
| 32 | Persist selected browse location | ✅ | `localStorage` `cravon_location` |
| 33 | Default location fallback (Bengaluru) | ✅ | |
| 34 | Recent location searches | ✅ | `cravon_recent_locations` in localStorage |
| 35 | Location-based restaurant listing (radius) | ✅ | 15 km Haversine on backend + `HomePage` |
| 36 | Distance calculation (Haversine) | ✅ | Server-side on restaurant queries |
| 37 | Delivery availability / serviceability check | ✅ | Radius + pincode via `/api/location/serviceability` |
| 38 | Detect wrong / unserviceable address at checkout | ✅ | Client pre-check + server validation in `createOrder` |
| 39 | "No restaurants in your area" empty state | ✅ | `HomePage.js` |
| 40 | Multiple cities support | ✅ | 500 restaurants · 26 cities in seed |
| 41 | Saved addresses synced with location panel | ✅ | API-backed when logged in |

---

## C. Saved Addresses (Delivery)

**Section completion:** 100% (11 done · 0 partial · 0 not started)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 42 | Save multiple delivery addresses | ✅ | Profile + checkout (`AddressForm.js`) |
| 43 | Add delivery address | ✅ | |
| 44 | Edit delivery address | ✅ | `PUT /addresses/:id` |
| 45 | Delete delivery address | ✅ | Profile with confirm dialog |
| 46 | Default address | ✅ | "Make default" on Profile; badge on Cart |
| 47 | Address labels (Home / Work / Other) | ✅ | One Home + one Work max; Other requires custom name |
| 48 | Map pin / drag to set location on address | ✅ | "Pin location on map (GPS)" in `AddressForm.js` |
| 49 | Geocoded lat/lng on saved address | ✅ | Pincode-first geocode + optional GPS lat/lng |
| 50 | Contact name + phone on address | ✅ | Required on save; passed to delivery partner |
| 51 | Address used in order (`addressId` in DB) | ✅ | Checkout sends `addressId` |
| 52 | Saved address selection in location panel | ✅ | Highlights selected address |

---

## D. Home Page & Discovery

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 53 | Home page with restaurant list | ✅ | `HomePage.js` |
| 54 | Personalized homepage | ⚠️ | Location-based only — no ML personalization |
| 55 | Restaurant recommendations ("Recommended for you") | ❌ | No ML / preference engine |
| 56 | Trending restaurants | ❌ | No dedicated trending section |
| 57 | Trending dishes | ✅ | `DishCarousel.js` + `GET /api/discovery/dishes` |
| 58 | Popular cuisines / categories | ✅ | Food category shortcuts (Pizza, Biryani, etc.) |
| 59 | Offers banner / promotional hero | ✅ | `PromoBannerCarousel.js` + `GET /api/discovery/banners` |
| 60 | Festival / seasonal offers | ❌ | Generic banners only |
| 61 | Curated collections ("Best under ₹200") | ✅ | `CuratedCollections.js` — 5 collection types |
| 62 | Recently viewed restaurants | ✅ | Redux — local only |
| 63 | Recently ordered (homepage section) | ❌ | Reorder exists from order history — not on home feed |
| 64 | Top-rated / best restaurants section | ✅ | Sorted by `avgRating` |
| 65 | Fast delivery restaurants section | ❌ | Filter exists on search — no home section |
| 66 | New restaurants section | ❌ | No "new on Cravon" feed |
| 67 | Pure veg restaurants | ✅ | `Restaurant.isPureVeg` + Pure Veg toggle on home |
| 68 | Nearby restaurants (distance-sorted) | ✅ | Radius listing + distance on cards |
| 69 | Open now restaurants | ⚠️ | Closed badge shown — no "Open now" home filter/section |
| 70 | Featured / promoted restaurants | ❌ | No featured slot on homepage |
| 71 | Infinite scroll restaurant list | ✅ | IntersectionObserver + shimmer cards |
| 72 | Restaurant offer badges on cards | ✅ | Real `Restaurant.offerTag` from DB |
| 73 | Offline detection banner | ✅ | `useOnlineStatus` hook |
| 74 | Closed restaurant badge on card | ✅ | CLOSED overlay on cards |
| 75 | "Closing soon" indicator | ✅ | `RestaurantStatusBadges` — within 60 min of closing |

---

## E. Search

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 76 | Search restaurants by name | ✅ | Backend name match + relevance score |
| 77 | Search food items / dishes | ✅ | `MenuItem.name` search + dish results section |
| 78 | Search cuisines | ✅ | Exact + partial cuisine match |
| 79 | Search by location / city | ✅ | Backend city match |
| 80 | Instant search (live suggestions) | ✅ | `DashboardTopBar.js` — debounced suggestions |
| 81 | Auto suggestions | ✅ | Top bar + search assist dropdown |
| 82 | Voice search | ✅ | Web Speech API — mic in top bar + search page |
| 83 | Recent searches (persisted) | ✅ | `searchStorage.js` localStorage |
| 84 | Trending searches | ✅ | `GET /api/restaurants/search/trending` + chips |
| 85 | Search history page | ⚠️ | Recent searches shown — no full history management UI |
| 86 | Dedicated search results page | ✅ | `/home/search?q=` |
| 87 | Search inside restaurant menu | ✅ | Menu page search |
| 88 | Search sorted by distance | ✅ | "Nearest" sort + API `sort=distance` |
| 89 | Search available on all app pages | ✅ | Top bar via `DashboardLayout` |

---

## F. Filters & Sorting

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 90 | Advanced filter modal | ✅ | `FilterModal.js` |
| 91 | Veg only filter | ⚠️ | Cuisine name hack — not accurate at restaurant level |
| 92 | Non-veg filter | ⚠️ | Same limitation |
| 93 | Pure veg restaurants only toggle | ⚠️ | Same limitation |
| 94 | Open now filter | ❌ | |
| 95 | Offers / discounts available filter | ❌ | |
| 96 | Free delivery filter | ❌ | |
| 97 | Fast delivery filter (under 30/45 min) | ✅ | Client-side on search/home |
| 98 | Rating filter (4+, 4.5+) | ✅ | Client-side |
| 99 | Price filter (cost for two) | ✅ | Client-side |
| 100 | Cuisine filter | ✅ | |
| 101 | Distance filter | ❌ | Distance shown — no max-distance filter |
| 102 | Delivery time filter | ✅ | Under 30/45 min |
| 103 | Sort by popularity / orders count | ❌ | |
| 104 | Sort by rating | ✅ | |
| 105 | Sort by delivery time | ✅ | |
| 106 | Sort by price (cost for two) | ✅ | |
| 107 | Sort by distance | ⚠️ | Works on search page — not on home infinite scroll |
| 108 | Accepts online payment filter | ❌ | |
| 109 | New restaurants filter | ❌ | |
| 110 | Server-side filtering (full dataset) | ❌ | Filters apply to fetched page only |

---

## G. Restaurant Listing (Cards)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 111 | Restaurant cover / hero image on card | ✅ | `RestaurantCard.js` |
| 112 | Restaurant logo | ⚠️ | Uses cover image — no separate logo field on card |
| 113 | Rating display | ✅ | |
| 114 | Reviews count | ✅ | |
| 115 | Cuisine type(s) | ✅ | |
| 116 | Average price (cost for two) | ✅ | |
| 117 | Delivery fee on card | ⚠️ | Flat platform fee logic — not per-restaurant on card |
| 118 | Delivery time estimate | ✅ | |
| 119 | Distance from user | ✅ | When location set |
| 120 | Open / Closed status badge | ✅ | |
| 121 | Restaurant tags (pure veg, etc.) | ✅ | Offer tag + status badges |
| 122 | Promoted / featured badge | ❌ | |
| 123 | Favorite / heart button on card | ✅ | |

---

## H. Restaurant & Menu Details

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 124 | Restaurant detail page | ✅ | `/home/restaurants/:id` |
| 125 | Restaurant description | ✅ | |
| 126 | Opening hours display | ⚠️ | Data in DB — limited UI |
| 127 | Restaurant address / area | ✅ | |
| 128 | Restaurant contact / phone | ⚠️ | Field exists — limited display |
| 129 | Restaurant images (hero + gallery) | ⚠️ | Hero image — no multi-image gallery |
| 130 | FSSAI license number display | ⚠️ | Field exists — rarely shown |
| 131 | Menu grouped by category (accordion) | ✅ | `RestaurantCategory.js` |
| 132 | Recommended section on menu | ❌ | |
| 133 | Bestseller section on menu | ⚠️ | Fake deterministic hash badge per item |
| 134 | Offers section on restaurant page | ❌ | Offer tag on card only |
| 135 | Search in menu | ✅ | |
| 136 | Restaurant reviews list | ✅ | If reviews loaded in API |
| 137 | Restaurant ratings breakdown (5-star distribution) | ✅ | |
| 138 | Photos by users in reviews | ❌ | |
| 139 | Similar restaurants | ❌ | |
| 140 | Share restaurant link | ❌ | |
| 141 | Report restaurant / issue | ❌ | |
| 142 | Block ordering when restaurant closed | ❌ | Badge shown but ordering not blocked |

---

## I. Food Item (Menu Item)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 143 | Food item image | ✅ | URL-based |
| 144 | Name & description | ✅ | |
| 145 | Price | ✅ | |
| 146 | Discount / offer price | ❌ | Single price only |
| 147 | Veg / Non-veg indicator | ✅ | `isVeg` field + icon |
| 148 | Bestseller badge | ⚠️ | Fake deterministic hash |
| 149 | Item rating | ❌ | Restaurant-level only |
| 150 | Preparation time | ❌ | |
| 151 | Calories | ❌ | |
| 152 | Nutrition info | ❌ | |
| 153 | Ingredients list | ❌ | |
| 154 | Allergens info | ❌ | |
| 155 | Customizations (size, spice level) | ⚠️ | Modal UI — **not applied to cart** |
| 156 | Add-ons / extras (cheese, toppings) | ⚠️ | Modal UI — **not applied to cart** |
| 157 | Multiple sizes / variants (Half / Full) | ⚠️ | Part of customization modal — broken |
| 158 | Quantity selector | ✅ | Add to cart with qty |
| 159 | Cooking instructions per item | ⚠️ | Order-level notes only — not per item |
| 160 | Favorite / save food item | ❌ | Restaurant favourites only |
| 161 | Item in stock / out of stock (`isAvailable`) | ⚠️ | DB field exists; UI may still show add button |
| 162 | Block add-to-cart for out-of-stock item | ❌ | Not enforced on frontend |
| 163 | Combo meals / meal boxes | ❌ | |
| 164 | Share food item link | ❌ | |

---

## J. Wishlist & Favourites

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 165 | Favorite restaurants (heart on card) | ✅ | |
| 166 | Favourites list in profile | ✅ | |
| 167 | Favorite food items | ❌ | |
| 168 | Saved restaurants (server sync) | ❌ | localStorage only |
| 169 | Saved dishes (server sync) | ❌ | |
| 170 | Favourites persist across devices | ❌ | |
| 171 | Browsing history | ⚠️ | Recently viewed only — local |

---

## K. Cart

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 172 | Add item to cart | ✅ | Redux `cartSlice` |
| 173 | Update quantity (increase / decrease) | ✅ | |
| 174 | Remove item from cart | ✅ | |
| 175 | Clear cart | ⚠️ | Remove items one-by-one — no "clear all" button |
| 176 | Single-restaurant cart (lock) | ✅ | Clears on restaurant switch |
| 177 | Restaurant switching warning | ✅ | Toast on switch |
| 178 | Cart persistence on page refresh | ❌ | Redux only — lost on reload |
| 179 | Server-side cart sync (`/api/cart`) | ❌ | API exists — client not wired |
| 180 | Offline cart (guest localStorage) | ✅ | Guest cart before login |
| 181 | Floating cart bar on menu page | ✅ | |
| 182 | Cart page with item list | ✅ | `/home/cart` |
| 183 | Cart count badge in sidebar | ✅ | |
| 184 | Cart item customization summary | ❌ | Customizations not stored |
| 185 | Coupon apply | ⚠️ | **Client-only — server ignores discount** |
| 186 | Coupon remove | ⚠️ | Client-side only |
| 187 | Delivery instructions | ✅ | Cooking instructions → order `notes` |
| 188 | Restaurant instructions | ❌ | No separate restaurant note field |
| 189 | Packaging fee in bill | ❌ | |
| 190 | Platform fee in bill | ❌ | |
| 191 | Delivery fee in bill | ✅ | Flat fee logic |
| 192 | GST / taxes line item | ✅ | Client calculated |
| 193 | Tip delivery partner | ❌ | |
| 194 | Price breakdown / bill transparency | ✅ | |
| 195 | Total payable | ✅ | |
| 196 | Minimum order value enforcement | ❌ | |
| 197 | Maximum item quantity limit | ❌ | |
| 198 | Save cart for later | ❌ | |
| 199 | Contactless delivery option | ✅ | Checkbox on Cart → `Order.contactless` |
| 200 | Alternate phone for delivery | ✅ | Optional alt phone on Cart |

---

## L. Offers & Coupons

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 201 | Coupon listing / browse offers page | ❌ | Codes entered at checkout only |
| 202 | Restaurant-specific coupons | ❌ | |
| 203 | Platform coupons | ⚠️ | `WELCOME50`, `CRAVON20`, `FREEDEL` — client fake |
| 204 | First order offers | ⚠️ | `WELCOME50` — client only |
| 205 | Cashback offers | ❌ | |
| 206 | Free delivery offers | ⚠️ | `FREEDEL` — client only |
| 207 | Coupon validation (server-side) | ❌ | Week 2 planned |
| 208 | Auto-apply best coupon | ❌ | |
| 209 | Bank / card cashback offers | ❌ | |
| 210 | Referral program (invite friend) | ❌ | FAQ text only |
| 211 | Referral reward coupon | ❌ | |
| 212 | Cravon One / membership subscription | ❌ | FAQ text only |
| 213 | Loyalty points / rewards | ❌ | |
| 214 | Cashback to wallet | ❌ | |

---

## M. Checkout

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 215 | Checkout / cart summary page | ✅ | `CartPage.js` |
| 216 | Address selection at checkout | ✅ | |
| 217 | Add new address at checkout | ✅ | |
| 218 | Payment method selection | ❌ | COD implied — no method picker |
| 219 | Order summary review | ✅ | |
| 220 | Estimated delivery time | ⚠️ | Static estimate — not dynamic ETA |
| 221 | Place order | ✅ | `POST /api/orders` |
| 222 | Schedule order for later (date + time slot) | ❌ | |
| 223 | Pickup / takeaway mode (no delivery) | ❌ | |
| 224 | Cooking / delivery instructions field | ✅ | |

---

## N. Payments

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 225 | Cash on Delivery (COD) | ⚠️ | Label only — no payment method field in DB |
| 226 | UPI (GPay, PhonePe, Paytm) | ❌ | |
| 227 | Credit card | ❌ | |
| 228 | Debit card | ❌ | |
| 229 | Net Banking | ❌ | |
| 230 | Wallet (Paytm, Amazon Pay, Cravon Wallet) | ❌ | FAQ text only for platform wallet |
| 231 | Razorpay / Stripe integration | ❌ | Planned Week 2 |
| 232 | Pay on delivery vs pay now toggle | ❌ | |
| 233 | Saved payment methods | ❌ | |
| 234 | Sodexo / meal card | ❌ | |
| 235 | Payment failure handling + retry | ❌ | |
| 236 | Payment receipt / invoice | ❌ | |
| 237 | Refund to original payment method | ❌ | |
| 238 | Refund to wallet | ❌ | |
| 239 | Partial payment (wallet + card) | ❌ | |

---

## O. Order Tracking (Live)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 240 | Order placed status | ✅ | PLACED |
| 241 | Restaurant accepted (confirmed) | ✅ | CONFIRMED |
| 242 | Preparing status | ✅ | PREPARING |
| 243 | Ready for pickup status | ⚠️ | Not a distinct step in UI pipeline |
| 244 | Picked up status | ⚠️ | Merged into out-for-delivery flow |
| 245 | Out for delivery status | ✅ | |
| 246 | Delivered status | ✅ | |
| 247 | Cancelled status | ✅ | |
| 248 | Order status stepper UI | ✅ | Visual pipeline |
| 249 | Live tracking map | ⚠️ | `DeliveryMap.js` — simulated offset |
| 250 | ETA countdown / updates | ⚠️ | Fixed 2 min from order time — fake |
| 251 | Delivery partner details (name, photo) | ⚠️ | Hardcoded "Raju Kumar" |
| 252 | Restaurant contact on tracking | ❌ | |
| 253 | Call delivery partner button | ❌ | Button non-functional |
| 254 | Call restaurant button | ❌ | |
| 255 | Real-time status updates (WebSockets / SSE) | ❌ | Polling only — 8s interval |
| 256 | Real rider GPS tracking | ❌ | Simulated in v0.4 |
| 257 | Order auto-progresses via timer | ⚠️ | `setTimeout` in backend — demo only |
| 258 | Share live tracking link | ❌ | |
| 259 | Delivery partner rating after delivery | ❌ | |

---

## P. Orders (History & Management)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 260 | Place order API | ✅ | `POST /api/orders` |
| 261 | Price snapshot at order time | ✅ | `OrderItem.priceAtTime` |
| 262 | Order confirmation screen / toast | ✅ | |
| 263 | Active orders tab | ❌ | Single combined list |
| 264 | Previous / past orders tab | ❌ | Single combined list |
| 265 | Order history list | ✅ | `/home/orders` + profile tab |
| 266 | Order detail page | ✅ | `/home/orders/:id` |
| 267 | Order ID / order number | ✅ | |
| 268 | Order items list on detail | ✅ | |
| 269 | Order status display | ✅ | |
| 270 | Pagination on order history | ✅ | 5 per page |
| 271 | Cancel order (early status) | ✅ | PLACED / CONFIRMED |
| 272 | Cancellation reason selection | ❌ | |
| 273 | Cancellation fee logic | ❌ | |
| 274 | Reorder (repeat past order) | ✅ | Rebuilds cart |
| 275 | Download invoice / receipt PDF | ❌ | |
| 276 | Refund status on order | ❌ | |
| 277 | Return support (if applicable) | ❌ | |
| 278 | Order help / "issue with this order" | ❌ | |
| 279 | Orders link in main sidebar | ❌ | Only via profile or URL |
| 280 | Email / SMS order confirmation | ❌ | |

---

## Q. Reviews & Ratings

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 281 | Restaurant rating (view) | ✅ | On menu page |
| 282 | Submit restaurant review after delivery | ✅ | From order detail page |
| 283 | Star rating 1–5 | ✅ | |
| 284 | Text review / comment | ✅ | |
| 285 | Food item rating | ❌ | Restaurant-level only |
| 286 | Delivery rating | ❌ | |
| 287 | Upload food photos with review | ❌ | |
| 288 | View my reviews in profile | ✅ | |
| 289 | Edit my review | ❌ | |
| 290 | Delete my review | ❌ | API exists — no UI |
| 291 | One review per restaurant per user | ✅ | DB unique constraint |
| 292 | Require delivered order before review | ⚠️ | **Bug — weaker route wired** |
| 293 | Helpful votes on reviews | ❌ | |
| 294 | Report inappropriate review | ❌ | |

---

## R. Profile & User Dashboard

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 295 | User dashboard / profile hub | ✅ | `/home/profile` |
| 296 | Profile tab (name, email, phone) | ✅ | |
| 297 | Saved addresses tab | ✅ | |
| 298 | Wishlist / favourites tab | ✅ | |
| 299 | Order history tab | ✅ | |
| 300 | Wallet tab | ❌ | |
| 301 | Coupons tab | ❌ | |
| 302 | Reviews tab | ✅ | |
| 303 | Notifications tab / center | ❌ | Bell icon only |
| 304 | Settings tab | ✅ | Password + theme |
| 305 | Dark / light mode toggle | ✅ | Profile + layout |
| 306 | Language selection (Hindi, etc.) | ❌ | |
| 307 | Logout from profile | ⚠️ | Does not invalidate all refresh tokens server-side |

---

## S. Notifications

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 308 | Push notifications (browser / mobile) | ❌ | |
| 309 | Email notifications | ❌ | OTP/reset only — no order emails |
| 310 | In-app notification store (Redux) | ✅ | Events added on order |
| 311 | Notification bell icon in header | ⚠️ | Visible — **click does nothing** |
| 312 | Notification dropdown list | ❌ | Exists in unused `Header.js` |
| 313 | Unread notification count | ❌ | |
| 314 | Mark notification as read | ❌ | |
| 315 | Notifications persist after refresh | ❌ | In-memory only |
| 316 | Order update notifications | ⚠️ | In-app Redux only |
| 317 | Offers / coupon notifications | ❌ | |
| 318 | Refund update notifications | ❌ | |
| 319 | Promotional notifications | ❌ | |
| 320 | SMS order updates | ❌ | |
| 321 | WhatsApp order updates | ❌ | |

---

## T. Help & Support

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 322 | FAQ / help center | ✅ | `HelpPage.js` |
| 323 | Searchable FAQ | ✅ | |
| 324 | Accurate Cravon-specific FAQ content | ⚠️ | **Swiggy copy-paste** in `constants.js` |
| 325 | Live chat support | ❌ | Referenced in FAQ — not wired |
| 326 | Report issue (general) | ⚠️ | Contact form only — no order-linked flow |
| 327 | Report missing item | ❌ | |
| 328 | Report wrong order | ❌ | |
| 329 | Report late delivery | ❌ | |
| 330 | Refund request flow | ❌ | |
| 331 | Contact support (in-app form) | ✅ | Formspree on `ContactPage.js` |
| 332 | Raise ticket / track complaint | ❌ | |
| 333 | Call customer care | ❌ | |
| 334 | Chat support for specific order | ❌ | |

---

## U. Advanced Group Ordering

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 335 | Create group order | ❌ | Marketing page says "Coming Soon" |
| 336 | Share invite link | ❌ | |
| 337 | Join group using link | ❌ | |
| 338 | Join group using QR code | ❌ | |
| 339 | Real-time member list | ❌ | |
| 340 | Real-time shared cart | ❌ | |
| 341 | Individual carts merged into group cart | ❌ | |
| 342 | Show who added each item | ❌ | |
| 343 | Item ownership per member | ❌ | |
| 344 | Individual notes per member | ❌ | |
| 345 | Individual customizations per member | ❌ | |
| 346 | Group chat | ❌ | |
| 347 | Vote on restaurant | ❌ | |
| 348 | Vote on dishes | ❌ | |
| 349 | Budget limit per member | ❌ | |
| 350 | Total group budget cap | ❌ | |
| 351 | Split payment equally | ❌ | |
| 352 | Split payment by items | ❌ | |
| 353 | UPI payment per member | ❌ | |
| 354 | Track pending payments | ❌ | |
| 355 | Host approval before ordering | ❌ | |
| 356 | Lock cart (no more edits) | ❌ | |
| 357 | Remove member from group | ❌ | |
| 358 | Transfer host role | ❌ | |
| 359 | Live cart synchronization (WebSocket) | ❌ | |
| 360 | Countdown before order placement | ❌ | |
| 361 | One-click reorder for group | ❌ | |
| 362 | Group order history | ❌ | |
| 363 | Event mode (Birthday, Office Lunch, Party) | ❌ | |

---

## V. AI Features (Cravon Differentiator)

**Example flow:** *"I'm hungry. Budget ₹350. I want spicy chicken. Deliver within 30 minutes."* → AI finds restaurants, selects dishes, applies coupons, creates cart, places order after confirmation.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 364 | AI Food Ordering Assistant (chat UI) | ❌ | Core differentiator — not started |
| 365 | Conversational AI | ❌ | |
| 366 | Natural language search | ❌ | |
| 367 | Recommend food / dishes | ❌ | |
| 368 | Recommend restaurants | ❌ | |
| 369 | Compare restaurants | ❌ | |
| 370 | Understand budget constraints | ❌ | |
| 371 | Understand dietary preferences | ❌ | |
| 372 | Understand allergies | ❌ | |
| 373 | Recommend healthy meals | ❌ | |
| 374 | Mood-based recommendations | ❌ | |
| 375 | Suggest combos | ❌ | |
| 376 | Build complete cart from chat | ❌ | |
| 377 | Apply best coupon automatically (AI) | ❌ | |
| 378 | Answer restaurant questions | ❌ | |
| 379 | Order directly from chat (with confirmation) | ❌ | |
| 380 | Modify cart from chat | ❌ | |
| 381 | Track order from chat | ❌ | |
| 382 | Cancel order from chat | ❌ | |
| 383 | Reorder previous meals from chat | ❌ | |
| 384 | Voice conversation | ❌ | Voice search exists — not conversational AI |
| 385 | Multi-language support (AI) | ❌ | |
| 386 | Explain recommendations (why this dish) | ❌ | |

---

## W. Nice-to-Have (UX & Platform)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 387 | Dark mode | ✅ | |
| 388 | Light mode | ✅ | |
| 389 | Responsive design (mobile / tablet / desktop) | ✅ | Tailwind responsive |
| 390 | Skeleton loaders / shimmer cards | ✅ | Home infinite scroll |
| 391 | Infinite scrolling | ✅ | Home restaurant list |
| 392 | Lazy loading (images / routes) | ⚠️ | Partial — no systematic lazy image loading |
| 393 | PWA support (installable app) | ❌ | |
| 394 | Offline cart | ⚠️ | Guest localStorage only — not full offline mode |
| 395 | Share restaurant | ❌ | |
| 396 | Share food item | ❌ | |
| 397 | QR code sharing (restaurant / group invite) | ❌ | |
| 398 | Multi-language UI (Hindi, etc.) | ❌ | |
| 399 | Accessibility support (a11y) | ⚠️ | Basic semantics — no audit |
| 400 | Keyboard shortcuts | ❌ | |
| 401 | SEO optimization | ⚠️ | CRA SPA — limited SSR/SEO |
| 402 | Error boundaries | ⚠️ | Partial coverage |
| 403 | Native iOS / Android app | ❌ | Web only |

---

## X. Additional Swiggy/Zomato Features (Out of Scope)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 404 | Instamart / grocery ordering | ❌ | Out of scope |
| 405 | Dineout / table booking | ❌ | Out of scope |
| 406 | Genie / pick & drop | ❌ | Out of scope |
| 407 | Alcohol delivery | ❌ | Out of scope |
| 408 | Corporate / bulk ordering | ❌ | |
| 409 | Gift cards | ❌ | |
| 410 | Food subscription / tiffin plan | ❌ | |
| 411 | Share app / refer via WhatsApp | ❌ | |
| 412 | 2FA / Apple Sign In | ❌ | Post-v1 |

---

## User Dashboard — Summary Count

| Status | Count |
|--------|-------|
| ✅ Done | **95** |
| ⚠️ Partial / Bug | **48** |
| ❌ Not implemented | **269** |
| **Total features listed** | **412** |
| **Effective completion** | **~52%** (done + half of partial) |

---

---

# PART 2 — RESTAURANT OWNER PORTAL

**Route base:** `/owner`, `/owner/onboard`  
**Overall completion:** ~48% (14 done · 6 partial · 62 not started)

---

## A. Authentication & Onboarding

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Owner signup (RESTAURANT_OWNER role) | ✅ | At signup or admin-created |
| 2 | Owner login + redirect to /owner | ✅ | |
| 3 | Owner onboarding — create first restaurant | ✅ | `/owner/onboard` |
| 4 | Multi-step onboarding (docs, FSSAI, bank) | ❌ | Single form only |
| 5 | Upload FSSAI certificate | ❌ | Text field only |
| 6 | Upload restaurant photos | ❌ | URL field only |
| 7 | Pending approval state after registration | ⚠️ | `isApproved` exists — auto-approved on create |
| 8 | Email notification when approved | ❌ | |

---

## B. Dashboard & Analytics

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 | Owner dashboard overview | ✅ | `OwnerDashboard.js` |
| 10 | Today's orders count | ✅ | |
| 11 | Revenue summary | ✅ | From delivered orders |
| 12 | Menu item count | ✅ | |
| 13 | Sales chart (daily / weekly) | ❌ | Planned Week 4 |
| 14 | Orders chart over time | ❌ | |
| 15 | Top selling items report | ❌ | |
| 16 | Average order value | ❌ | |
| 17 | Customer ratings summary | ⚠️ | Shows avgRating — no trend |
| 18 | Download sales report (CSV/PDF) | ❌ | |

---

## C. Restaurant Profile Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 19 | Edit restaurant name, description | ✅ | |
| 20 | Edit cuisines list | ✅ | |
| 21 | Edit address, city, lat/lng | ✅ | |
| 22 | Edit delivery time estimate | ✅ | |
| 23 | Edit cost for two | ✅ | |
| 24 | Edit opening / closing hours | ✅ | |
| 25 | Edit FSSAI number | ✅ | |
| 26 | Edit restaurant phone | ✅ | |
| 27 | Upload / change restaurant cover image | ⚠️ | URL field — no file upload |
| 28 | Toggle restaurant open / closed | ✅ | Instant effect |
| 29 | Multiple restaurants per owner | ✅ | Switch between owned restaurants |
| 30 | Multiple outlets / branches management | ⚠️ | Multiple records — no shared inventory |
| 31 | Delivery radius setting per restaurant | ❌ | |
| 32 | Minimum order value setting | ❌ | |
| 33 | Packaging charge setting | ❌ | |

---

## D. Menu Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 34 | View all menu items | ✅ | Menu tab |
| 35 | Add new menu item | ✅ | Modal form |
| 36 | Edit menu item (name, price, description) | ✅ | |
| 37 | Delete / remove menu item | ✅ | Soft delete |
| 38 | Set item category | ✅ | |
| 39 | Mark item veg / non-veg | ✅ | `isVeg` toggle |
| 40 | Mark item in stock / out of stock (`isAvailable`) | ⚠️ | Field exists — verify owner UI toggle |
| 41 | Item photo upload | ❌ | URL only |
| 42 | Item variants (size options) | ❌ | |
| 43 | Add-on groups management | ❌ | |
| 44 | Bulk import menu (CSV) | ❌ | |
| 45 | Duplicate item | ❌ | |
| 46 | Reorder categories | ❌ | |
| 47 | Schedule item availability (breakfast only) | ❌ | |
| 48 | Item-level discount / offer | ❌ | |

---

## E. Order Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 49 | View incoming orders list | ✅ | Orders tab |
| 50 | View order detail (items, qty, total) | ✅ | |
| 51 | View customer delivery address | ⚠️ | From notes text — not linked address |
| 52 | View cooking instructions | ⚠️ | Mixed in notes field |
| 53 | Accept order (PLACED → CONFIRMED) | ✅ | Status buttons |
| 54 | Mark preparing (CONFIRMED → PREPARING) | ✅ | |
| 55 | Mark out for delivery | ✅ | |
| 56 | Mark delivered | ✅ | |
| 57 | Reject / cancel order | ✅ | |
| 58 | New order sound / notification alert | ❌ | Planned Week 3 |
| 59 | Real-time new order push (WebSocket) | ❌ | |
| 60 | Print order receipt / KOT | ❌ | |
| 61 | Order preparation timer | ❌ | |
| 62 | Filter orders (active / completed / cancelled) | ❌ | |
| 63 | Search orders by ID or customer | ❌ | |

---

## F. Offers & Promotions (Owner)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 64 | Create restaurant-level discount | ❌ | |
| 65 | Set free delivery offer | ❌ | |
| 66 | Set minimum order for offer | ❌ | |
| 67 | Schedule offer (weekend special) | ❌ | |
| 68 | View active platform coupons affecting restaurant | ❌ | |

---

## G. Reviews & Feedback (Owner)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 69 | View customer reviews | ⚠️ | Via restaurant API — limited in owner UI |
| 70 | Reply to customer review | ❌ | |
| 71 | Report unfair review | ❌ | |
| 72 | View average rating trend | ❌ | |

---

## H. Payments & Settlements (Owner)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 73 | View payment status per order | ❌ | |
| 74 | View settlement / payout history | ❌ | |
| 75 | Bank account details for payouts | ❌ | |
| 76 | Commission breakdown per order | ❌ | |
| 77 | Download payout invoice | ❌ | |

---

## I. Staff & Operations (Owner)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 78 | Add sub-users / staff accounts | ❌ | |
| 79 | Role permissions for staff (manager, cashier) | ❌ | |
| 80 | Delivery partner assignment (manual) | ❌ | Will be simulated |
| 81 | Inventory / stock count management | ❌ | |
| 82 | Low stock alerts | ❌ | |

---

## Owner Portal — Summary Count

| Status | Count |
|--------|-------|
| ✅ Done | **14** |
| ⚠️ Partial / Bug | **6** |
| ❌ Not implemented | **62** |
| **Total** | **82** |
| **Effective completion** | **~48%** |

---

---

# PART 3 — SUPER ADMIN DASHBOARD

**Route base:** `/admin`  
**Overall completion:** ~42%

---

## A. Authentication & Access

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Admin login (ADMIN role) | ✅ | |
| 2 | Admin-only route protection | ✅ | `RoleProtectedRoute` |
| 3 | Super admin vs sub-admin roles | ❌ | Single ADMIN role only |
| 4 | Admin activity audit log | ❌ | |

---

## B. Platform Overview & Analytics

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5 | Dashboard home with key stats | ✅ | Users, restaurants, orders, revenue |
| 6 | Total registered users count | ✅ | |
| 7 | Total restaurants count | ✅ | |
| 8 | Total orders count | ✅ | |
| 9 | Total platform revenue | ✅ | Sum of order totals |
| 10 | Revenue chart (daily / weekly / monthly) | ❌ | Planned Week 4 |
| 11 | Orders chart over time | ❌ | |
| 12 | New user signups chart | ❌ | |
| 13 | Active users / DAU / MAU | ❌ | |
| 14 | Top cities by orders | ❌ | |
| 15 | Top restaurants by revenue | ❌ | |
| 16 | Export analytics report | ❌ | |

---

## C. User Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | List all users | ✅ | Name, email, role, date |
| 18 | Search / filter users by role | ⚠️ | List only — no search UI |
| 19 | View user detail (orders, addresses) | ❌ | |
| 20 | Change user role (USER → OWNER) | ❌ | |
| 21 | Deactivate / ban user | ❌ | |
| 22 | Delete user account | ❌ | |
| 23 | Reset user password (admin action) | ❌ | |
| 24 | View user order history | ❌ | |

---

## D. Restaurant Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 25 | List all restaurants | ✅ | |
| 26 | Approve / unapprove restaurant | ✅ | PATCH endpoint |
| 27 | Approval actually hides from customer app | ⚠️ | Filter exists — new restos auto-approved |
| 28 | View restaurant detail + menu | ❌ | List view only |
| 29 | Edit restaurant on behalf of owner | ❌ | |
| 30 | Force close restaurant | ❌ | |
| 31 | Delete restaurant | ❌ | |
| 32 | Feature / promote restaurant on homepage | ❌ | |
| 33 | Set commission rate per restaurant | ❌ | |
| 34 | View restaurant owner details | ⚠️ | Owner ID in data — limited UI |

---

## E. Order Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 35 | List all platform orders | ✅ | |
| 36 | Override order status (any transition) | ✅ | Admin can force status |
| 37 | View order detail | ⚠️ | Basic list — no detail modal |
| 38 | Cancel order as admin | ⚠️ | Via status override |
| 39 | Process refund for order | ❌ | |
| 40 | Filter orders by status / date / restaurant | ❌ | |
| 41 | Search order by ID | ❌ | |

---

## F. Coupon & Promotion Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 42 | Create platform-wide coupon | ❌ | Week 4 |
| 43 | Set coupon discount type (% / flat / free delivery) | ❌ | |
| 44 | Set coupon expiry date | ❌ | |
| 45 | Set coupon usage limit | ❌ | |
| 46 | Deactivate coupon | ❌ | |
| 47 | View coupon usage stats | ❌ | |

---

## G. Content & Platform Settings

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 48 | Manage FAQ content from admin | ❌ | Hardcoded in `constants.js` |
| 49 | Manage homepage banners | ❌ | |
| 50 | Set platform delivery fee default | ❌ | |
| 51 | Set platform GST rate | ❌ | |
| 52 | Manage food categories list | ❌ | |
| 53 | Manage supported cities list | ❌ | |
| 54 | Maintenance mode toggle | ❌ | |

---

## H. Delivery & Logistics (Admin)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 55 | View all delivery assignments | ❌ | Week 3 simulation |
| 56 | Manage simulated delivery partners | ❌ | |
| 57 | View live orders on map | ❌ | |
| 58 | Delivery zone management | ❌ | |

---

## I. Financial & Reports (Admin)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 59 | Platform revenue report | ⚠️ | Single stat — no breakdown |
| 60 | Payment transactions list | ❌ | No Payment model yet |
| 61 | Failed payments log | ❌ | |
| 62 | Restaurant payout management | ❌ | |
| 63 | Commission earned report | ❌ | |

---

## J. Support & Moderation (Admin)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 64 | View contact form submissions | ❌ | Formspree external |
| 65 | Manage customer complaints / tickets | ❌ | |
| 66 | Moderate reviews (hide/remove) | ❌ | |
| 67 | View flagged restaurants | ❌ | |

---

## Super Admin — Summary Count

| Status | Count |
|--------|-------|
| ✅ Done | **6** |
| ⚠️ Partial / Bug | **5** |
| ❌ Not implemented | **56** |
| **Total** | **67** |
| **Effective completion** | **~42%** |

---

---

# PART 4 — PORTFOLIO-WORTHY TECHNICAL FEATURES

**Purpose:** Engineering checklist for resume / demo — cross-cutting backend, infra, and frontend patterns.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Role-based authentication (USER / OWNER / ADMIN) | ✅ | `RoleProtectedRoute` + JWT claims |
| 2 | JWT + refresh token rotation | ✅ | |
| 3 | Google OAuth | ✅ | |
| 4 | Facebook OAuth | ✅ | |
| 5 | Phone OTP auth | ❌ | |
| 6 | Redis caching | ❌ | |
| 7 | WebSockets (real-time order / group cart) | ❌ | Polling only today |
| 8 | Background jobs (email / notification queue) | ❌ | |
| 9 | Image upload (Cloudinary / S3) | ❌ | URL fields only |
| 10 | Payment gateway integration (Razorpay / Stripe) | ❌ | Week 2 |
| 11 | Maps integration (geocoding / tracking) | ⚠️ | Geocoding proxy — simulated tracking map |
| 12 | AI API integration (Gemini / OpenAI) | ❌ | AI assistant not started |
| 13 | Rate limiting | ❌ | |
| 14 | Server-side validation | ✅ | Express validators on key routes |
| 15 | Client-side validation | ✅ | Forms + checkout checks |
| 16 | Pagination | ✅ | Orders, restaurant list pages |
| 17 | Infinite scroll | ✅ | Home feed |
| 18 | Optimistic UI updates | ⚠️ | Limited — favourites/cart mostly synchronous |
| 19 | Debounced search | ✅ | Top bar + search page |
| 20 | Error boundaries | ⚠️ | Partial |
| 21 | Logging (structured / request logs) | ⚠️ | Basic console — no centralized logging |
| 22 | API documentation (Swagger / OpenAPI) | ❌ | |
| 23 | Docker support | ❌ | |
| 24 | CI/CD pipeline | ❌ | |
| 25 | Unit testing | ❌ | |
| 26 | Integration testing | ❌ | |
| 27 | Responsive UI | ✅ | |
| 28 | Clean architecture / layered backend | ⚠️ | Routes + services — room to formalize |
| 29 | Feature-based folder structure | ⚠️ | Partial on client |
| 30 | Prisma ORM + migrations | ✅ | |
| 31 | Environment-based config | ✅ | `.env` dev / Render production |
| 32 | CORS + secure cookies (production) | ✅ | |

### Technical Features — Summary

| Status | Count |
|--------|-------|
| ✅ Done | **14** |
| ⚠️ Partial | **7** |
| ❌ Not implemented | **11** |
| **Total** | **32** |

---

# GRAND TOTAL — ALL PORTALS

| Portal | ✅ Done | ⚠️ Partial | ❌ Missing | Total | Completion |
|--------|---------|-----------|-----------|-------|------------|
| User Dashboard | 95 | 48 | 269 | 412 | ~52% |
| Owner Portal | 14 | 6 | 62 | 82 | ~48% |
| Super Admin | 6 | 5 | 56 | 67 | ~42% |
| Technical (portfolio) | 14 | 7 | 11 | 32 | ~55% |
| **Combined (unique scope)** | **129** | **66** | **398** | **593** | **~50%** |

*Technical rows overlap with user/owner features — use Part 4 as an engineering lens, not additive scope.*

---

# IMPLEMENTATION PRIORITY (Cross-Portal)

Use this order when building from the lists above:

## Phase 1 — User Dashboard fixes (Week 1)
Cart customizations (#155–157, #184), server cart sync (#179), coupon server validation (#207), block closed restaurant ordering (#142), favourites server sync (#168–170), review gate bug (#292), notification bell (#311), orders in sidebar (#279)

## Phase 2 — User payments + coupons (Week 2)
Payments (#225–231), server coupons (#201–208), packaging/platform fees (#189–190)

## Phase 3 — User tracking + notifications (Week 3)
WebSockets (#255, #359), real ETA (#250), delivery partner call (#253), push/email notifications (#308–321), owner order alerts (#58–59)

## Phase 4 — User + Owner + Admin polish (Week 4)
Home discovery gaps (#55–56, #63–66, #70), filters (#94–96, #101, #103), profile avatar (#21), admin analytics + coupons

## Phase 5 — AI Assistant (Differentiator)
AI chat UI + NL ordering (#364–386), Gemini/OpenAI integration (Technical #12)

## Phase 6 — Group Ordering
Full group flow (#335–363), WebSocket cart sync

## Phase 7 — Launch polish
PWA (#393), share links (#395–397), Docker + CI/CD (Technical #23–24), Swagger docs (#22)

## Post-v1
Phone OTP (#5), membership (#212), Instamart (#404), native apps (#403)

---

*This is the master checklist. Mark items ✅ as you ship them. Reference [WEEK1_DAILY_TASKS.md](./WEEK1_DAILY_TASKS.md) for current sprint.*
