# Cravon — Master Feature List (Swiggy / Zomato Parity)

**Purpose:** Single checklist for everything a full-stack food delivery platform should have.  
**Priority order:** 1) User Dashboard → 2) Restaurant Owner → 3) Super Admin  
**Legend:**

| Symbol | Meaning |
|--------|---------|
| ✅ | **Done** — works end-to-end |
| ⚠️ | **Partial / Bug** — started but broken, fake, or incomplete |
| ❌ | **Not implemented** |

**Last updated:** June 24, 2026 (email/password auth complete — forgot/reset, logout, prod cookies)

---

# PART 1 — USER DASHBOARD (Customer App)

**Route base:** `/home/*`  
**Overall completion:** ~60% (31 done · 6 partial · 21 not started)

---

## A. Authentication & Account Access

**Section completion:** ~87% (11 done · 2 partial · 2 not started) — email/password channel production-ready

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Email + password signup | ✅ | `SignInSidebar.js`, `POST /auth/signup`; UI + server password rules aligned (8+ chars, uppercase, number) |
| 2 | Email + password login | ✅ | JWT access token (15m) + httpOnly refresh cookie (7d) |
| 3 | Auto login on page refresh (session restore) | ✅ | `localStorage` access token + `GET /auth/me`; axios interceptor refreshes on 401 |
| 4 | Logout | ✅ | `performLogout()` calls `POST /auth/logout` + clears Redux; `Header.js`, `ProfilePage.js` |
| 5 | Role-based redirect after login (USER → /home) | ✅ | USER → `/home`, OWNER → `/owner` or `/owner/onboard`, ADMIN → `/admin` |
| 6 | Protected routes (must login to order) | ✅ | `ProtectedRoute.js`, `RoleProtectedRoute.js` |
| 7 | Phone number + OTP login | ❌ | No OTP model, SMS provider, routes, or UI tab |
| 8 | Google OAuth login / signup | ✅ | `GET /auth/google`, callback, `GoogleAuthCallbackPage.js`, account linking by email |
| 9 | Facebook / Apple social login | ❌ | Facebook button in UI only — no handler; no Apple button |
| 10 | Forgot password | ✅ | `SignInSidebar` forgot tab → `POST /auth/forgot-password`; rate-limited (5/15min) |
| 11 | Reset password via email link | ✅ | Professional HTML email via SMTP; `/auth/reset-password?token=` → `ResetPasswordPage.js` |
| 12 | Email verification on signup | ⚠️ | `emailVerified` in DB; auto-set for Google users only — local signup does not send verification email |
| 13 | Two-factor authentication (2FA) | ❌ | |
| 14 | Guest browse (view restaurants without login) | ⚠️ | Marketing pages public; entire `/home/*` requires login |
| 15 | Sign up as Customer vs Restaurant Owner | ✅ | Role toggle at signup; passed to email signup + Google OAuth `state` |

**Also implemented:** refresh token rotation (`POST /auth/refresh`), change password (`PUT /auth/password`), Google ↔ email account linking, production cookie settings (`sameSite: lax` dev / `none`+`secure` prod).

### Auth by method (what works today)

| Capability | Email + password | Phone + OTP | Google OAuth |
|------------|------------------|-------------|--------------|
| Signup | ✅ | ❌ | ✅ |
| Login | ✅ | ❌ | ✅ |
| Logout (full server invalidation) | ✅ | — | ✅ |
| Refresh token / stay logged in | ✅ | — | ✅ |
| Forgot / reset password | ✅ | — | N/A (can set password via reset email) |
| Email verification | ❌ | — | ✅ (via Google) |
| Owner vs Customer role at signup | ✅ | — | ✅ |

### Production deployment checklist (auth)

| Item | Dev (current) | Production (change to) |
|------|---------------|------------------------|
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/auth/google/callback` | `https://YOUR-API-DOMAIN/api/auth/google/callback` |
| Frontend URL (auto) | `http://localhost:3000` via `NODE_ENV=development` | `https://cravon-frontend.onrender.com` via `NODE_ENV=production` |
| `CLIENT_URL` (optional) | Extra CORS origins only | Extra origins if needed |
| `NODE_ENV` | `development` | `production` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | dev placeholders | Strong random secrets (32+ chars) |
| `REACT_APP_API_URL` (client) | `http://localhost:5000/api` | `https://YOUR-API-DOMAIN/api` |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | unset → link logged to console | **Required** for reset emails (Gmail App Password, SendGrid SMTP, etc.) |
| `SMTP_FROM` | — | `"Cravon" <noreply@yourdomain.com>` |
| Google Cloud Console | localhost redirect URI | Add production redirect URI |
| Refresh cookies | `sameSite: lax` on localhost | `sameSite: none` + `secure: true` when API ≠ frontend domain (already in code) |

**Still to build:** #7 phone OTP, #12 email verification for local signup, #13 2FA, #14 guest browse routing.

---

## B. Location & Serviceability

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 16 | Set location via address search (geocoding) | ✅ | Nominatim in `DashboardLayout.js` |
| 17 | Use current GPS location | ✅ | Browser geolocation |
| 18 | Persist selected browse location | ✅ | `localStorage` `cravon_location` |
| 19 | Default location fallback (Bengaluru) | ✅ | |
| 20 | Location-based restaurant listing (radius) | ✅ | Haversine filter on backend |
| 21 | "No restaurants in your area" empty state | ✅ | `HomePage.js` |
| 22 | Recent location searches | ⚠️ | Session only — not persisted across devices |
| 23 | Saved addresses synced with location panel | ⚠️ | Hardcoded fake addresses in panel; not from API |
| 24 | Delivery zone / pincode serviceability check | ❌ | Radius only — no polygon zones |
| 25 | Detect wrong / unserviceable address at checkout | ❌ | |
| 26 | Multiple cities support | ✅ | Seed data has multiple cities |

---

## C. Saved Addresses (Delivery)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 27 | Add delivery address | ✅ | Profile + checkout |
| 28 | Delete delivery address | ✅ | Profile |
| 29 | Edit delivery address | ❌ | API exists — no UI |
| 30 | Set default address | ❌ | API exists — no UI |
| 31 | Address labels (Home / Work / Other) | ✅ | Label field on create |
| 32 | Map pin / drag to set location on address | ❌ | |
| 33 | Geocoded lat/lng on saved address | ⚠️ | Saves `lat: 0, lng: 0` from checkout |
| 34 | Address used in order (`addressId` in DB) | ⚠️ | Schema has field; always null in practice |
| 35 | Delivery instructions per order | ✅ | Appended to notes string |
| 36 | Contactless delivery option | ❌ | |
| 37 | Alternate phone number for delivery | ❌ | |

---

## D. Home Feed & Discovery

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 38 | Home page with restaurant list | ✅ | `HomePage.js` |
| 39 | Restaurant cards (image, rating, time, cost for two) | ✅ | `RestaurantCard.js` |
| 40 | Pagination / "Show more" restaurants | ✅ | Server-side page param |
| 41 | Top / best rated restaurants section | ✅ | Sorted by `avgRating` |
| 42 | Recently viewed restaurants | ✅ | Redux — local only |
| 43 | Food category shortcuts (Pizza, Biryani, etc.) | ✅ | Links to search |
| 44 | Promotional banners / hero offers | ❌ | |
| 45 | Curated collections ("Best under ₹200") | ❌ | |
| 46 | What's on your mind (dish carousel) | ❌ | |
| 47 | Restaurant offer badges on cards | ⚠️ | Fake hash-based rotating labels |
| 48 | Pure veg mode (platform-wide toggle) | ⚠️ | Filters cuisine name — not item-level |
| 49 | Offline detection banner | ✅ | `useOnlineStatus` hook |
| 50 | Closed restaurant badge on card | ✅ | Shows "Closed" overlay |
| 51 | "Closing soon" indicator | ✅ | If closing within 60 min |
| 52 | Dark / light theme | ✅ | Toggle in profile + layout |
| 53 | Responsive mobile layout | ✅ | Tailwind responsive |

---

## E. Search

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 54 | Search bar with live suggestions | ✅ | `DashboardTopBar.js` — home page only |
| 55 | Dedicated search results page | ✅ | `/home/search?q=` |
| 56 | Search by restaurant name | ✅ | |
| 57 | Search by cuisine type | ✅ | Backend supports |
| 58 | Search by city | ✅ | Backend supports |
| 59 | Search by dish / menu item name | ❌ | |
| 60 | Search sorted by distance | ❌ | API accepts lat/lng but ignores for sort |
| 61 | Search filters (rating 4+, fast delivery) | ✅ | Client-side on results page |
| 62 | Sort (relevance, rating, delivery time, cost) | ✅ | `SearchResultsPage.js` |
| 63 | Recent searches (persisted) | ❌ | |
| 64 | Voice search | ❌ | |
| 65 | Search available on all app pages | ❌ | Top bar only on `/home` |
| 66 | Trending searches | ❌ | |

---

## F. Filters & Sorting

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 67 | Advanced filter modal | ✅ | `FilterModal.js` |
| 68 | Filter by rating (4+, 4.5+) | ✅ | Client-side |
| 69 | Filter by delivery time (under 30/45 min) | ✅ | Client-side |
| 70 | Filter by cost for two | ✅ | Client-side |
| 71 | Filter by cuisine | ✅ | |
| 72 | Veg / Non-veg filter (restaurant level) | ⚠️ | Cuisine name hack — not accurate |
| 73 | Pure veg restaurants only toggle | ⚠️ | Same limitation |
| 74 | Offers / discounts filter | ❌ | |
| 75 | Free delivery filter | ❌ | |
| 76 | Accepts online payment filter | ❌ | |
| 77 | New restaurants filter | ❌ | |
| 78 | Server-side filtering (not just loaded page) | ❌ | Filters apply to fetched list only |
| 79 | Sort by distance | ❌ | |
| 80 | Sort by popularity / orders count | ❌ | |

---

## G. Favourites & Personalization

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 81 | Favourite / heart restaurant on card | ✅ | |
| 82 | Favourites list in profile | ✅ | |
| 83 | Favourites synced to account (server) | ❌ | localStorage only |
| 84 | Favourites persist across devices | ❌ | |
| 85 | Order again / reorder from history | ✅ | Rebuilds cart |
| 86 | Recommended for you (ML/personalized) | ❌ | |
| 87 | Browsing history | ⚠️ | Recently viewed only — local |

---

## H. Restaurant & Menu Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 88 | Restaurant detail page | ✅ | `/home/restaurants/:id` |
| 89 | Restaurant hero image + info | ✅ | |
| 90 | Cuisines, rating, delivery time, cost for two | ✅ | |
| 91 | Restaurant address / area shown | ✅ | |
| 92 | Opening hours display | ⚠️ | Data in DB — limited UI |
| 93 | FSSAI license number display | ⚠️ | Field exists — rarely shown |
| 94 | Restaurant phone number | ⚠️ | Field exists — limited display |
| 95 | Menu grouped by category (accordion) | ✅ | `RestaurantCategory.js` |
| 96 | Menu item image | ✅ | URL-based |
| 97 | Menu item description | ✅ | |
| 98 | Veg / Non-veg icon on each item | ✅ | `isVeg` field |
| 99 | Item-level veg filter on menu page | ✅ | Toggle on menu |
| 100 | Menu search within restaurant | ✅ | |
| 101 | Item in stock / out of stock (`isAvailable`) | ⚠️ | DB field exists; UI may still show add button |
| 102 | Block add-to-cart for out-of-stock item | ❌ | Not enforced on frontend |
| 103 | Bestseller / recommended badge on item | ⚠️ | Fake deterministic hash |
| 104 | Item customizations (size, spice level) | ⚠️ | Modal UI exists — **not applied to cart** |
| 105 | Add-ons / extras (cheese, toppings) | ⚠️ | Modal UI — **not applied to cart** |
| 106 | Item variants (Half / Full plate) | ⚠️ | Part of customization modal — broken |
| 107 | Combo meals / meal boxes | ❌ | |
| 108 | Item nutritional info / allergens | ❌ | |
| 109 | Share restaurant link | ❌ | |
| 110 | Report restaurant / issue | ❌ | |
| 111 | Block ordering when restaurant closed | ❌ | Badge shown but ordering not blocked |
| 112 | Reviews section on restaurant page | ✅ | If reviews loaded in API |
| 113 | Rating breakdown (5-star distribution) | ✅ | |
| 114 | Photos in reviews | ❌ | |

---

## I. Cart

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 115 | Add item to cart | ✅ | Redux `cartSlice` |
| 116 | Increase / decrease quantity | ✅ | |
| 117 | Remove item from cart | ✅ | |
| 118 | Single-restaurant cart (lock) | ✅ | Clears on restaurant switch |
| 119 | Floating cart bar on menu page | ✅ | |
| 120 | Cart page with item list | ✅ | `/home/cart` |
| 121 | Cart item customization summary shown | ❌ | Customizations not stored |
| 122 | Cart persists on page refresh | ❌ | Redux only — lost on reload |
| 123 | Server-side cart sync (`/api/cart`) | ❌ | API exists — client not wired |
| 124 | Cart count badge in sidebar | ✅ | |
| 125 | Cross-restaurant warning before switch | ✅ | Toast on switch |
| 126 | Minimum order value enforcement | ❌ | |
| 127 | Maximum item quantity limit | ❌ | |
| 128 | Save cart for later | ❌ | |

---

## J. Group Ordering

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 129 | Create group order / share link | ❌ | Marketing page says "Coming Soon" |
| 130 | Join group order via link | ❌ | |
| 131 | Multiple users add to same cart | ❌ | |
| 132 | Group order host pays or split bill | ❌ | |
| 133 | Real-time sync of group cart | ❌ | |

---

## K. Checkout & Bill

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 134 | Checkout / cart summary page | ✅ | `CartPage.js` |
| 135 | Item total calculation | ✅ | |
| 136 | Delivery fee line item | ✅ | Flat fee logic |
| 137 | GST / taxes line item | ✅ | Client calculated |
| 138 | Packaging fee | ❌ | |
| 139 | Platform fee / surge fee | ❌ | |
| 140 | Tip for delivery partner | ❌ | |
| 141 | Bill breakdown transparent total | ✅ | |
| 142 | Apply coupon / promo code | ⚠️ | **Client-only — server ignores discount** |
| 143 | Auto-applied offers | ❌ | |
| 144 | Free delivery coupon | ⚠️ | `FREEDEL` client-only |
| 145 | Bank / card offer at checkout | ❌ | |
| 146 | Select delivery address at checkout | ✅ | |
| 147 | Add new address at checkout | ✅ | |
| 148 | Cooking / delivery instructions field | ✅ | |
| 149 | Schedule order for later (date + time slot) | ❌ | |
| 150 | Pickup / takeaway mode (no delivery) | ❌ | |
| 151 | Contactless delivery toggle | ❌ | |
| 152 | Order summary review before pay | ✅ | |
| 153 | Place order button | ✅ | |

---

## L. Payments

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 154 | Cash on Delivery (COD) | ⚠️ | Label only — no payment method field |
| 155 | UPI (GPay, PhonePe, Paytm) | ❌ | |
| 156 | Credit / debit card | ❌ | |
| 157 | Net banking | ❌ | |
| 158 | Wallets (Paytm, Amazon Pay) | ❌ | |
| 159 | Razorpay / Stripe integration | ❌ | Planned Week 2 |
| 160 | Pay on delivery vs pay now toggle | ❌ | |
| 161 | Saved payment methods | ❌ | |
| 162 | Cravon Wallet / platform balance | ❌ | FAQ text only |
| 163 | Sodexo / meal card | ❌ | |
| 164 | Payment failure handling + retry | ❌ | |
| 165 | Payment receipt / invoice | ❌ | |
| 166 | Refund to original payment method | ❌ | |
| 167 | Refund to wallet | ❌ | |
| 168 | Partial payment (wallet + card) | ❌ | |

---

## M. Orders — Placement & History

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 169 | Place order API | ✅ | `POST /api/orders` |
| 170 | Price snapshot at order time | ✅ | `OrderItem.priceAtTime` |
| 171 | Order confirmation screen / toast | ✅ | |
| 172 | Order history list | ✅ | `/home/orders` + profile tab |
| 173 | Order detail page | ✅ | `/home/orders/:id` |
| 174 | Order ID / order number shown | ✅ | |
| 175 | Order items list on detail | ✅ | |
| 176 | Order status shown (PLACED → DELIVERED) | ✅ | |
| 177 | Active orders vs past orders tabs | ❌ | Single list |
| 178 | Pagination on order history | ✅ | 5 per page |
| 179 | Cancel order (early status) | ✅ | PLACED / CONFIRMED |
| 180 | Cancellation reason selection | ❌ | |
| 181 | Cancellation fee logic | ❌ | |
| 182 | Reorder (repeat past order) | ✅ | |
| 183 | Download invoice / receipt PDF | ❌ | |
| 184 | Order help / "issue with this order" | ❌ | |
| 185 | Orders link in main sidebar | ❌ | Only via profile or URL |
| 186 | Email / SMS order confirmation | ❌ | |

---

## N. Live Order Tracking & Delivery

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 187 | Order status stepper UI | ✅ | Visual pipeline |
| 188 | Live status polling | ✅ | 8-second interval |
| 189 | Real-time push (WebSocket / SSE) | ❌ | Planned Week 3 |
| 190 | ETA countdown timer | ⚠️ | Fixed 2 min from order time — fake |
| 191 | Live map with delivery route | ⚠️ | `DeliveryMap.js` — simulated offset |
| 192 | Delivery partner name + photo | ⚠️ | Hardcoded "Raju Kumar" |
| 193 | Delivery partner phone / call button | ❌ | Button non-functional |
| 194 | Call restaurant button | ❌ | |
| 195 | Real rider GPS tracking | ❌ | Will be simulated in v0.4 |
| 196 | Order auto-progresses via timer | ⚠️ | `setTimeout` in backend — demo only |
| 197 | Share live tracking link | ❌ | |
| 198 | Delivery partner rating after delivery | ❌ | |

---

## O. Reviews & Ratings

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 199 | View restaurant reviews | ✅ | On menu page |
| 200 | Submit review after delivery | ✅ | From order detail page |
| 201 | Star rating 1–5 | ✅ | |
| 202 | Written review comment | ✅ | |
| 203 | View my reviews in profile | ✅ | |
| 204 | One review per restaurant per user | ✅ | DB unique constraint |
| 205 | Require delivered order before review | ⚠️ | **Bug — weaker route wired** |
| 206 | Edit my review | ❌ | |
| 207 | Delete my review | ❌ | API exists — no UI |
| 208 | Rate individual food items | ❌ | |
| 209 | Upload photo with review | ❌ | |
| 210 | Helpful votes on reviews | ❌ | |
| 211 | Report inappropriate review | ❌ | |

---

## P. Profile & Settings

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 212 | View profile (name, email, phone) | ✅ | |
| 213 | Edit name and phone | ✅ | |
| 214 | Email change | ❌ | Read-only |
| 215 | Change password | ✅ | Settings tab |
| 216 | Profile avatar / photo upload | ❌ | |
| 217 | Dark / light mode toggle | ✅ | |
| 218 | Notification preferences (email/push) | ❌ | |
| 219 | Language selection (Hindi, etc.) | ❌ | |
| 220 | Delete my account | ❌ | |
| 221 | Profile tabs (orders, favourites, addresses, reviews, settings) | ✅ | |
| 222 | Logout | ⚠️ | Does not invalidate refresh token on server |

---

## Q. Notifications

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 223 | In-app notification store (Redux) | ✅ | Events added on order |
| 224 | Notification bell icon in header | ⚠️ | Visible — **click does nothing** |
| 225 | Notification dropdown list | ❌ | Exists in unused `Header.js` |
| 226 | Unread notification count | ❌ | |
| 227 | Mark notification as read | ❌ | |
| 228 | Notifications persist after refresh | ❌ | In-memory only |
| 229 | Push notifications (browser / mobile) | ❌ | |
| 230 | SMS order updates | ❌ | |
| 231 | Email notifications | ❌ | |
| 232 | WhatsApp order updates | ❌ | |

---

## R. Offers, Coupons & Loyalty

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 233 | Apply coupon at checkout | ⚠️ | Client-side codes only |
| 234 | Server-validated coupons | ❌ | Week 2 |
| 235 | First order discount | ⚠️ | `WELCOME50` — client fake |
| 236 | Percentage off coupon | ⚠️ | `CRAVON20` — client fake |
| 237 | Free delivery coupon | ⚠️ | `FREEDEL` — client fake |
| 238 | Restaurant-specific offers | ❌ | |
| 239 | Bank / card cashback offers | ❌ | |
| 240 | Referral program (invite friend) | ❌ | FAQ text only |
| 241 | Referral reward coupon | ❌ | |
| 242 | Cravon One / membership subscription | ❌ | FAQ text only |
| 243 | Loyalty points / rewards | ❌ | |
| 244 | Cashback to wallet | ❌ | |

---

## S. Help & Support

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 245 | Help / FAQ page | ✅ | `HelpPage.js` |
| 246 | Searchable FAQ | ✅ | |
| 247 | Accurate FAQ content (Cravon-specific) | ⚠️ | **Swiggy copy-paste** in `constants.js` |
| 248 | In-app contact form | ✅ | Formspree on `ContactPage.js` |
| 249 | Live chat support | ❌ | Referenced in FAQ — not wired |
| 250 | Call customer care | ❌ | |
| 251 | Chat support for specific order | ❌ | |
| 252 | Raise ticket / track complaint | ❌ | |

---

## T. Additional Swiggy/Zomato Features (User)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 253 | Instamart / grocery ordering | ❌ | Out of scope |
| 254 | Dineout / table booking | ❌ | Out of scope |
| 255 | Genie / pick & drop | ❌ | Out of scope |
| 256 | Alcohol delivery | ❌ | Out of scope |
| 257 | Corporate / bulk ordering | ❌ | |
| 258 | Gift cards | ❌ | |
| 259 | Food subscription / tiffin plan | ❌ | |
| 260 | PWA (installable app) | ❌ | |
| 261 | Native iOS / Android app | ❌ | |
| 262 | Share app / refer via WhatsApp | ❌ | |

---

## User Dashboard — Summary Count

| Status | Count |
|--------|-------|
| ✅ Done | **58** |
| ⚠️ Partial / Bug | **32** |
| ❌ Not implemented | **172** |
| **Total features listed** | **262** |
| **Effective completion** | **~56%** (done + half of partial) |

---

---

# PART 2 — RESTAURANT OWNER PORTAL

**Route base:** `/owner`, `/owner/onboard`  
**Overall completion:** ~48% (14 done · 6 partial · 15 not started)

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
**Overall completion:** ~42% (6 done · 2 partial · 8 not started for core; many advanced features not started)

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

# GRAND TOTAL — ALL 3 PORTALS

| Portal | ✅ Done | ⚠️ Partial | ❌ Missing | Total | Completion |
|--------|---------|-----------|-----------|-------|------------|
| User Dashboard | 58 | 32 | 172 | 262 | ~56% |
| Owner Portal | 14 | 6 | 62 | 82 | ~48% |
| Super Admin | 6 | 5 | 56 | 67 | ~42% |
| **Combined** | **78** | **43** | **290** | **411** | **~52%** |

---

# IMPLEMENTATION PRIORITY (Cross-Portal)

Use this order when building from the lists above:

## Phase 1 — User Dashboard fixes (Week 1)
Items: #104–107, #121–123, #142–144, #33–34, #111, #185, #4, #9–10, #205, #224

## Phase 2 — User payments + coupons (Week 2)
Items: #154–160, #142–144, #233–237

## Phase 3 — User tracking + notifications (Week 3)
Items: #189–196, #223–228, owner #58–59

## Phase 4 — User + Owner + Admin polish (Week 4)
Items: #29–30, #59, #178, #81–83, #247, admin #10–12, #42–47, owner #13–14

## Phase 5 — Launch (Week 5)
Deploy + docs + remaining P1 items

## Post-July (v1.1+)
Group ordering (#129–133), OTP (#7), email verification (#12), membership (#242), Instamart (#253)

---

*This is the master checklist. Mark items ✅ as you ship them. Reference [WEEK1_DAILY_TASKS.md](./WEEK1_DAILY_TASKS.md) for current sprint.*
