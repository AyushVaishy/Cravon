# Cravon — Feature Audit & Build Guide

**Audit date:** June 23, 2026  
**Project goal:** Full-stack MERN portfolio product + deployable demo (career switch)  
**Data:** Dummy/seed restaurants — no real food, no real riders, no real delivery ops  
**Excluded:** AI agent / chat assistant feature  
**Reference:** Swiggy & Zomato (feature parity target, not operational parity)

---

## How to Read This Document

There are **two different "launches"** — do not mix them up:

| Launch type | What it means for Cravon |
|-------------|--------------------------|
| **Portfolio / demo launch** ✅ Your goal | Live deployed app, seed data, Razorpay **test mode**, **simulated** delivery tracking, 3-role platform. This is what gets you interviews. |
| **Real business launch** ❌ Not your goal now | Real restaurants, real riders, real OTP SMS, real logistics. Requires partnerships, ops team, legal, capital. |

**You do NOT need real delivery to build real-looking delivery.** Every serious product team prototypes logistics with simulation first. Your `setTimeout` auto-delivery is the *right idea* — it just needs to be **designed properly** (see [Simulated Delivery Strategy](#simulated-delivery-strategy-no-real-riders-needed) below).

---

## Are You Thinking in the Right Direction?

**Yes — your mental model is correct.** A food platform like Swiggy is really **three apps in one**:

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Customer App   │     │  Restaurant Owner   │     │  Super Admin     │
│  (order food)   │     │  Portal (manage     │     │  (you — platform │
│                 │     │   menu & orders)    │     │   oversight)     │
└────────┬────────┘     └──────────┬──────────┘     └────────┬─────────┘
         │                         │                          │
         └─────────────────────────┴──────────────────────────┘
                                   │
                          Express API + PostgreSQL
                          Role-based access (USER / RESTAURANT_OWNER / ADMIN)
```

This is exactly what interviewers want to see: **RBAC, multi-tenant flows, order lifecycle across roles.**

### What you already have (don't rebuild from scratch)

| Portal | Route | Status | What works today |
|--------|-------|--------|------------------|
| **Customer** | `/home/*` | ~70% done | Browse, search, cart, checkout (COD label), orders, reviews, profile |
| **Restaurant Owner** | `/owner`, `/owner/onboard` | ~60% done | Overview, edit restaurant, menu CRUD, toggle open/closed, view orders, update order status |
| **Super Admin** | `/admin` | ~55% done | Stats (users, restaurants, orders, revenue), list users, approve restaurants, list/manage orders |

Backend APIs for all three roles already exist. Your job is **polish + fix broken flows + add payments + improve simulation** — not start over.

### One correction to your thinking

**"Different carts based on location per restaurant"** — simplify this for v1:

- Swiggy handles multi-outlet chains as **separate restaurant listings per area**, not one cart spanning locations.
- For your portfolio: let one owner have **multiple restaurant records** (one per outlet/area), each with its own menu and orders. That demonstrates the concept without a complex `Outlet` / `LocationCart` schema.
- Add true multi-outlet inventory sync later only if you have time — it's not required to impress interviewers.

### What to tell recruiters (honest positioning)

> "Cravon is a full-stack food delivery platform demo with customer, restaurant owner, and admin portals. It uses seed data and simulated delivery tracking. Payments run in Razorpay test mode. The architecture mirrors production apps — JWT auth, Prisma, order state machine, role-based dashboards."

That is **stronger** than claiming you're competing with Swiggy operationally.

---

## Executive Summary (Portfolio Lens)

Cravon has a **solid MERN foundation** across all three roles. For a **portfolio launch**, you are closer than the Swiggy parity numbers suggest — because you can skip real logistics, real SMS, and real restaurant partnerships.

| Area | For portfolio demo | For real Swiggy competitor |
|------|-------------------|---------------------------|
| Customer ordering flow | ⚠️ Fix bugs, then ✅ | Same |
| Owner portal | ⚠️ Polish existing | Same |
| Admin dashboard | ⚠️ Polish existing | Same |
| Payments (Razorpay test + COD) | 🔨 Build next | Need live mode + settlements |
| Live tracking | 🔨 Simulate properly | Need real riders + GPS |
| Phone OTP | ⏭️ Skip or mock | Required |
| Dummy seed restaurants | ✅ Fine | Need real partners |

**Portfolio completeness today:** ~55–60% (including owner + admin)  
**Customer-only completeness:** ~35–40% (vs Swiggy feature list)

**Your launch target:** Deployed demo URL + GitHub + README with architecture diagram + 3 test accounts (customer, owner, admin).

---

## Simulated Delivery Strategy (No Real Riders Needed)

You asked: *"Can we implement everything like a real product but not actually deliver?"*

**Answer: Yes — and you should.** This is the standard approach for portfolio and even internal Swiggy/Zomato engineering demos.

### How it works

| Layer | Real product | Your demo (correct approach) |
|-------|--------------|------------------------------|
| Order status | Restaurant confirms → kitchen → rider picks up → delivers | Same status enum — owner clicks buttons OR auto-advance on timer |
| Rider | Real person with GPS app | **Simulated rider** record in DB (name, phone, vehicle) assigned when status → `OUT_FOR_DELIVERY` |
| Live map | Rider's phone sends lat/lng every 3s | Backend **interpolates** a path from restaurant → customer address over 3–5 min; frontend polls or uses WebSocket |
| ETA | Calculated from rider distance | Calculated from simulation progress — still looks real |
| Payment | Money moves | Razorpay **test keys** — UI + webhook flow identical, no real charge |

### What to improve (your current code)

Today `order.controller.js` uses bare `setTimeout` to jump statuses. Upgrade to:

1. Add `DeliveryAssignment` model: `orderId`, `riderName`, `currentLat`, `currentLng`, `routeProgress` (0–100).
2. When status → `OUT_FOR_DELIVERY`, create assignment and start a **route interpolation job** (setInterval or cron).
3. `DeliveryMap.js` reads real coordinates from API instead of hardcoded offsets.
4. Owner can still manually advance status from `/owner` — good for live demos in interviews.
5. Label it in README: *"Delivery simulation for demo purposes."*

**Interview talking point:** "I implemented the same order state machine and tracking API contract a real logistics service would use; rider GPS is simulated via interpolated coordinates."

---

## What to Build Next (Priority Order for Career Switch)

Focus on **depth over breadth**. These items maximize resume + interview impact:

### Tier 1 — Do these first (2–3 weeks)

| # | Task | Why it matters |
|---|------|----------------|
| 1 | **Fix cart → order bugs** (customizations, server-side coupons, cart persistence) | Shows you don't ship broken core flows |
| 2 | **Razorpay test integration** (UPI + card UI + webhook → mark order paid) | Payment integration is a top interview topic |
| 3 | **COD + prepaid toggle** at checkout | Simple but completes checkout story |
| 4 | **Polish owner portal** — order notifications sound/toast when new order arrives | Demonstrates multi-role real-time feel |
| 5 | **Polish admin** — charts (revenue over time), restaurant approval flow that actually gates listing | Shows platform thinking |
| 6 | **Deploy** — frontend (Netlify/Vercel) + backend (Railway/Render) + PostgreSQL | Recruiters click the link |

### Tier 2 — Strong differentiators (2–3 weeks)

| # | Task | Why it matters |
|---|------|----------------|
| 7 | **Simulated live tracking v2** (DB rider + interpolated map path) | Answers "how would you build tracking?" in interviews |
| 8 | **WebSocket or SSE** for order status push to customer UI | Real-time skills |
| 9 | **Server-validated coupon system** | Backend business logic |
| 10 | **Link orders to `addressId`** + geocoding | Data modeling |
| 11 | **README + ARCHITECTURE.md** with ER diagram, API list, demo credentials | Gets past resume screen |

### Tier 3 — Nice to have (only if Tier 1–2 done)

| # | Task | Skip for now? |
|---|------|---------------|
| Phone OTP (Twilio) | Costs money; mock OTP with `123456` in dev is fine | ✅ Skip |
| Push notifications (FCM) | Heavy setup | ✅ Skip |
| Native mobile app | Web responsive is enough | ✅ Skip |
| Instamart / Dineout verticals | Scope creep | ✅ Skip |
| Google OAuth | Good but not critical | ⏭️ Optional |
| Multi-outlet inventory per owner | Complex; use multiple restaurant records instead | ⏭️ Later |

---

## Three-Portal Status (Customer + Owner + Admin)

### Restaurant Owner Portal (`/owner`)

| Feature | Status | Notes |
|---------|--------|-------|
| Owner onboarding (create restaurant) | ✅ Done | `/owner/onboard` |
| Dashboard overview (orders, revenue) | ✅ Done | `OwnerDashboard.js` |
| Edit restaurant details | ✅ Done | Name, cuisines, hours, etc. |
| Toggle open / closed | ✅ Done | Affects customer listing |
| Menu CRUD (add, edit, delete dishes) | ✅ Done | Categories, veg flag, price |
| View incoming orders | ✅ Done | Per restaurant |
| Update order status | ✅ Done | PLACED → … → DELIVERED |
| Multiple restaurants per owner | ✅ Done | Switch between owned restaurants |
| New order alerts (sound/push) | ❌ Missing | Add for demo wow-factor |
| Analytics charts (sales by day) | ❌ Missing | Good admin/owner polish |
| Manage multiple outlets / location menus | ❌ Missing | Use separate restaurant records for v1 |
| Coupon management for their restaurant | ❌ Missing | Tier 2 |
| Image upload for dishes | ❌ Missing | URL field works for demo |

### Super Admin Dashboard (`/admin`)

| Feature | Status | Notes |
|---------|--------|-------|
| Platform stats (users, restaurants, orders, revenue) | ✅ Done | `AdminPanel.js` |
| List all users + roles | ✅ Done | |
| List all restaurants | ✅ Done | |
| Approve / unapprove restaurant | ✅ Done | Wire to actually hide unapproved on customer app |
| List all orders + override status | ✅ Done | |
| Charts / graphs over time | ❌ Missing | Add recharts for visual impact |
| Ban / deactivate user | ❌ Missing | Optional |
| Platform-wide coupon creation | ❌ Missing | Tier 2 |
| Audit logs (who changed what) | ❌ Missing | Optional senior-level feature |

---

## Platform Architecture (Current State)

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React, React Router, Redux Toolkit, Tailwind | ✅ Working |
| Backend API | Express, JWT auth, Prisma ORM | ✅ Working |
| Database | PostgreSQL | ✅ Schema for core entities |
| Restaurant data | Own DB (seeded from Zomato-style data) | ✅ Migrated off Swiggy public API |
| Deployment | Netlify (client) — README references old demo URL | ⚠️ Needs production setup |
| Mobile | None | ❌ |

**Note:** `client/src/utils/constants.js` still contains legacy Swiggy CDN/API URLs and Swiggy-copied FAQ text. Active restaurant flows use the **own backend** via `restaurantService.js`.

---

## Feature Comparison Matrix

Legend: ✅ Done | ⚠️ Partial / broken | ❌ Not implemented

### 1. Account & Authentication

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Email + password signup | ✅ | ✅ | **Done** | `SignInSidebar.js`, `auth.controller.js` |
| Email + password login | ✅ | ✅ | **Done** | JWT access (15m) + refresh cookie (7d) |
| Session restore on reload | ✅ | ✅ | **Done** | Token in `localStorage` + `/auth/me` |
| Logout | ⚠️ | ✅ | **Partial** | Clears local state; does not always call `/auth/logout` |
| Phone / OTP login | ❌ | ✅ Primary | **Missing** | No backend OTP model or SMS provider |
| Google / Facebook login | ❌ UI only | ✅ | **Missing** | Buttons exist with no handlers |
| Forgot / reset password | ❌ UI stub | ✅ | **Missing** | "Forget Password?" has no action |
| Email verification | ❌ | ✅ | **Missing** | — |
| Role-based routing | ✅ | N/A | **Done** | USER → `/home`, OWNER → `/owner`, ADMIN → `/admin` |
| Guest browsing | ⚠️ | ✅ | **Partial** | Marketing pages public; ordering requires login |

**Fix needed:**
- Wire forgot-password flow (email OTP or reset link).
- Either implement phone OTP or remove misleading UI.
- Remove or implement social login buttons.
- Call `authService.logout()` on logout to invalidate refresh token.

---

### 2. Location & Address

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Set location via search | ✅ | ✅ | **Done** | Nominatim/OSM geocoding in `DashboardLayout.js` |
| GPS "use current location" | ✅ | ✅ | **Done** | Browser geolocation API |
| Persist browse location | ✅ | ✅ | **Done** | `localStorage` key `cravon_location` |
| Location-based restaurant list | ✅ | ✅ | **Done** | Haversine radius filter on backend |
| Serviceability / "no restaurants" state | ✅ | ✅ | **Done** | Empty state on `HomePage.js` |
| Saved delivery addresses (profile) | ⚠️ | ✅ | **Partial** | Add + delete only; no edit/default in UI |
| Address at checkout | ✅ | ✅ | **Done** | Select or add new address on `CartPage.js` |
| Map pin for saved address | ❌ | ✅ | **Missing** | Cart saves `lat: 0, lng: 0` for new addresses |
| Home / work / other labels | ⚠️ | ✅ | **Partial** | Label field exists; limited UX |
| Multiple address types | ❌ | ✅ | **Missing** | — |
| Link order to saved address (DB) | ❌ | ✅ | **Missing** | `addressId` always `null`; text in `notes` only |
| Location panel "saved addresses" | ⚠️ | ✅ | **Broken** | Hardcoded `DEFAULT_ADDRESSES` — not synced with API |
| Delivery zone polygons | ❌ | ✅ | **Missing** | Radius-only; no city/zone boundaries |

**Fix needed:**
- Unify browse location and delivery addresses into one system.
- Connect location panel to `/api/addresses`.
- Pass `addressId` in order creation; geocode addresses on save.
- Add edit address + set default address in profile UI (API exists).

---

### 3. Restaurant Discovery & Home Feed

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Home feed with restaurants | ✅ | ✅ | **Done** | `HomePage.js` |
| Pagination ("Show more") | ✅ | ✅ | **Done** | Server-side page param |
| Top / best restaurants section | ✅ | ✅ | **Done** | Sorted by `avgRating` |
| Recently viewed restaurants | ✅ | ✅ | **Done** | Redux `recentlyViewedSlice` (local) |
| Food category shortcuts | ✅ | ✅ | **Done** | Links to search |
| Pure veg filter | ⚠️ | ✅ | **Partial** | Filters cuisine name, not item-level veg |
| Advanced filters modal | ✅ | ✅ | **Done** | Rating, delivery time, cost — client-side on loaded list |
| Restaurant cards (rating, time, cost) | ✅ | ✅ | **Done** | `RestaurantCard.js` |
| Favourite / heart on cards | ⚠️ | ✅ | **Partial** | `localStorage` only — not synced to account |
| Offer badges on cards | ⚠️ | ✅ | **Fake** | Hash-based rotating labels, not real promos |
| Promotional banners / collections | ❌ | ✅ | **Missing** | — |
| "What's on your mind" dish carousel | ❌ | ✅ | **Missing** | — |
| Offline detection | ✅ | ✅ | **Done** | `useOnlineStatus` hook |
| Closed restaurant indicator | ⚠️ | ✅ | **Partial** | Shown on card; menu may still allow ordering |

**Fix needed:**
- Server-side filtering instead of client-only on paginated data.
- Real offers from backend when coupon system is built.
- Sync favourites to user account on server.
- Block ordering from closed restaurants (frontend + backend).

---

### 4. Search

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Search bar with suggestions | ✅ | ✅ | **Done** | `DashboardTopBar.js` — home page only |
| Search results page | ✅ | ✅ | **Done** | `SearchResultsPage.js` |
| Search by restaurant name | ✅ | ✅ | **Done** | `/restaurants/search?q=` |
| Search by cuisine | ✅ | ✅ | **Done** | Backend supports cuisine tag |
| Search by city | ✅ | ✅ | **Done** | Backend supports city |
| Search by dish / menu item | ❌ | ✅ | **Missing** | README claims dish search; not implemented |
| Search sorted by distance | ❌ | ✅ | **Missing** | Search API accepts lat/lng but ignores them |
| Search available on all pages | ❌ | ✅ | **Missing** | Top bar only on `/home` |
| Voice search | ❌ | ⚠️ Some | **Missing** | — |
| Recent searches (persisted) | ⚠️ | ✅ | **Partial** | Session-only in location panel |

**Fix needed:**
- Add menu item search (join `MenuItem` in search query).
- Use lat/lng for distance sorting in search results.
- Show search bar globally in dashboard layout.

---

### 5. Restaurant Menu Page

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Menu by category (accordion) | ✅ | ✅ | **Done** | `RestaurantCategory.js` |
| Item images | ✅ | ✅ | **Done** | URL-based |
| Veg / non-veg indicators | ✅ | ✅ | **Done** | `ItemList.js` |
| Menu search | ✅ | ✅ | **Done** | Filter within restaurant |
| Veg-only toggle on menu | ✅ | ✅ | **Done** | — |
| Add to cart (+ / −) | ✅ | ✅ | **Done** | Redux `cartSlice` |
| Single-restaurant cart lock | ✅ | ✅ | **Done** | Clears cart on restaurant switch |
| Item customizations (size, spice, add-ons) | ⚠️ | ✅ | **Broken** | Modal UI exists; selections ignored in cart |
| Bestseller badge | ⚠️ | ✅ | **Fake** | Deterministic hash, not real data |
| Restaurant info (hours, FSSAI, phone) | ⚠️ | ✅ | **Partial** | Fields in DB; limited display |
| Reviews on restaurant page | ✅ | ✅ | **Done** | If `reviews` included in API response |
| Rating breakdown | ✅ | ✅ | **Done** | Star distribution UI |
| Share restaurant | ❌ | ✅ | **Missing** | — |
| Report issue | ❌ | ✅ | **Missing** | — |

**Fix needed:**
- Apply customization price and payload to cart items and order line items.
- Persist customization choices in order (`OrderItem` may need `options` JSON field).

---

### 6. Cart & Checkout

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Cart page with item list | ✅ | ✅ | **Done** | `CartPage.js` |
| Bill breakdown (items, delivery, GST) | ✅ | ✅ | **Done** | Client-calculated |
| Cooking / delivery instructions | ✅ | ✅ | **Done** | Appended to address string |
| Coupon code input | ⚠️ | ✅ | **Broken** | Client-only: `WELCOME50`, `CRAVON20`, `FREEDEL` |
| Coupon sent to server | ❌ | ✅ | **Missing** | Not in `createOrder` payload |
| Server cart persistence | ❌ | ✅ | **Missing** | Backend `/api/cart` exists; client uses Redux only |
| Cart survives page refresh | ❌ | ✅ | **Missing** | Redux lost on reload |
| Packaging fee | ❌ | ✅ | **Missing** | — |
| Tip for delivery partner | ❌ | ✅ | **Missing** | — |
| Contactless delivery option | ❌ | ✅ | **Missing** | — |
| Schedule order (later slot) | ❌ | ✅ | **Missing** | FAQ mentions it; not built |
| Minimum order value enforcement | ❌ | ✅ | **Missing** | — |
| Multi-restaurant cart | ❌ | ❌ | **N/A** | Both platforms use single-restaurant carts |

**Fix needed:**
- Integrate server-side cart OR persist Redux cart to `localStorage`/API.
- Build real coupon system; discounts must affect `Order.totalAmount` on server.
- Add `packagingFee`, `tip`, `scheduledAt` to order schema when needed.

---

### 7. Payments

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Cash on Delivery (COD) | ⚠️ | ✅ | **Label only** | No `paymentMethod` field; order placed without payment step |
| UPI (GPay, PhonePe, etc.) | ❌ | ✅ | **Missing** | — |
| Credit / debit cards | ❌ | ✅ | **Missing** | — |
| Net banking | ❌ | ✅ | **Missing** | — |
| Wallets (Paytm, Amazon Pay) | ❌ | ✅ | **Missing** | — |
| Cravon Money / platform wallet | ❌ | ✅ | **Missing** | FAQ text only (copied from Swiggy) |
| Saved payment methods | ❌ | ✅ | **Missing** | — |
| Pay at delivery vs prepaid | ❌ | ✅ | **Missing** | — |
| Payment failure / retry | ❌ | ✅ | **Missing** | — |
| Refunds | ❌ | ✅ | **Missing** | — |
| Razorpay / Stripe integration | ❌ | ✅ | **Missing** | Not in server dependencies |

**This is a launch blocker.** Swiggy/Zomato are prepaid-first; COD is secondary. Cravon cannot launch publicly without a payment gateway.

**Implement:**
1. Razorpay (India) or Stripe integration.
2. `Payment` model linked to `Order`.
3. Webhook for payment confirmation before order moves to `CONFIRMED`.
4. Refund flow on cancellation.

---

### 8. Orders — Placement, History & Cancellation

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Place order API | ✅ | ✅ | **Done** | `POST /api/orders` |
| Price snapshot at order time | ✅ | ✅ | **Done** | `OrderItem.priceAtTime` |
| Order history list | ✅ | ✅ | **Done** | `OrdersPage.js` + profile tab |
| Order detail page | ✅ | ✅ | **Done** | `OrderDetailPage.js` |
| Pagination on history | ✅ | ✅ | **Done** | 5 per page |
| Cancel order (early status) | ✅ | ✅ | **Done** | PLACED / CONFIRMED only |
| Reorder | ✅ | ✅ | **Done** | Rebuilds cart from past order |
| Active vs past order tabs | ❌ | ✅ | **Missing** | Single list |
| Order invoice / receipt download | ❌ | ✅ | **Missing** | — |
| Order in sidebar nav | ❌ | ✅ | **Missing** | Only via profile or direct URL |
| Auto demo delivery progression | ⚠️ | ❌ | **Demo only** | `setTimeout` advances status every ~30s → DELIVERED in 2 min |

**Fix needed:**
- Remove or gate auto-delivery simulation for production.
- Add "Orders" to `DashboardSidebar.js`.
- Filter tabs: Active | Delivered | Cancelled.

---

### 9. Live Order Tracking & Delivery

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Status stepper UI | ✅ | ✅ | **Done** | PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED |
| Live status polling | ✅ | ✅ | **Done** | 8s interval on active orders |
| ETA countdown | ⚠️ | ✅ | **Fake** | Fixed 2 min from `createdAt` |
| Live map with rider | ⚠️ | ✅ | **Simulated** | `DeliveryMap.js` — animated fake partner |
| Delivery partner name / photo | ⚠️ | ✅ | **Hardcoded** | "Raju Kumar" dummy data |
| Call delivery partner | ❌ | ✅ | **Missing** | Button non-functional |
| Call restaurant | ❌ | ✅ | **Missing** | — |
| Real rider assignment | ❌ | ✅ | **Missing** | No `Rider` model |
| Real-time GPS tracking | ❌ | ✅ | **Missing** | — |
| Delivery partner rating | ❌ | ✅ | **Missing** | — |

**This is a launch blocker** for a delivery platform. Users expect real tracking.

**Implement:**
1. `DeliveryPartner` / `Rider` model with assignment logic.
2. WebSocket or polling for rider location.
3. Integrate Google Maps / Mapbox for real routes.
4. Partner mobile app or third-party fleet API (shadowfax, dunzo, etc.) for scale.

---

### 10. Reviews & Ratings

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| View restaurant reviews | ✅ | ✅ | **Done** | On menu page |
| Submit review after order | ✅ | ✅ | **Done** | `OrderDetailPage.js` after DELIVERED |
| View my reviews (profile) | ✅ | ✅ | **Done** | `GET /restaurants/reviews/me` |
| One review per user per restaurant | ⚠️ | ✅ | **Partial** | DB unique constraint; upsert works |
| Require delivered order to review | ⚠️ | ✅ | **Bug** | Stricter handler exists but route uses weaker one |
| Edit / delete review (UI) | ❌ | ✅ | **Missing** | Delete API exists; no UI |
| Rate individual food items | ❌ | ⚠️ Zomato | **Missing** | — |
| Rate delivery partner | ❌ | ✅ | **Missing** | — |
| Review photos | ❌ | ✅ | **Missing** | — |
| Helpful votes on reviews | ❌ | ✅ | **Missing** | — |

**Fix needed:**
- Wire `POST /:id/reviews` to `review.controller.js` (requires DELIVERED order).
- Add edit/delete review in profile.

---

### 11. Offers, Coupons & Loyalty

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Restaurant-level offers | ❌ | ✅ | **Missing** | Fake badges only |
| Platform coupons | ❌ | ✅ | **Missing** | Client-side codes don't affect server total |
| Bank / card offers | ❌ | ✅ | **Missing** | — |
| Free delivery promos | ⚠️ | ✅ | **Fake** | `FREEDEL` client-only |
| Referral program | ❌ | ✅ | **Missing** | FAQ text only |
| Membership (Swiggy One / Zomato Gold) | ❌ | ✅ | **Missing** | FAQ text only |
| Cashback / rewards | ❌ | ✅ | **Missing** | — |
| First-order discount | ⚠️ | ✅ | **Fake** | `WELCOME50` not enforced server-side |

**Implement:** `Coupon`, `UserCoupon`, `Promotion` models + validation service in order creation.

---

### 12. Profile & Settings

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| View / edit name & phone | ✅ | ✅ | **Done** | Profile tab |
| Email (read-only) | ✅ | ⚠️ | **Done** | — |
| Change password | ✅ | ✅ | **Done** | Settings tab |
| Dark / light theme | ✅ | ⚠️ | **Done** | Better than Swiggy (they're mostly light) |
| Order history tab | ✅ | ✅ | **Done** | Duplicate of `/home/orders` |
| Favourites tab | ⚠️ | ✅ | **Partial** | Local storage only |
| Addresses tab | ⚠️ | ✅ | **Partial** | Add/delete; no edit/default |
| My reviews tab | ✅ | ✅ | **Done** | — |
| Avatar upload | ❌ | ✅ | **Missing** | UI may support URL; no upload |
| Notification preferences | ❌ | ✅ | **Missing** | — |
| Language selection | ❌ | ✅ | **Missing** | — |
| Delete account | ❌ | ✅ | **Missing** | — |

---

### 13. Notifications

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| In-app notification store | ⚠️ | ✅ | **Partial** | Redux slice; events added on order |
| Notification bell UI | ❌ | ✅ | **Missing** | Bell in top bar is decorative |
| Unread count | ❌ | ✅ | **Missing** | Full UI exists in unused `Header.js` |
| Persist notifications | ❌ | ✅ | **Missing** | Lost on refresh |
| Push notifications (web/mobile) | ❌ | ✅ | **Missing** | — |
| SMS order updates | ❌ | ✅ | **Missing** | — |
| Email order confirmation | ❌ | ✅ | **Missing** | — |

**Fix needed:** Mount notification dropdown from `Header.js` into `DashboardTopBar.js` or build new component; add FCM/web push for production.

---

### 14. Customer Support

| Feature | Cravon | Swiggy / Zomato | Status | Notes |
|---------|--------|-----------------|--------|-------|
| Help / FAQ page | ✅ | ✅ | **Done** | `HelpPage.js` — searchable |
| FAQ content | ⚠️ | ✅ | **Copied** | Swiggy-style placeholder text in `constants.js` |
| In-app contact form | ✅ | ✅ | **Done** | Formspree on `ContactPage.js` |
| Live chat support | ❌ | ✅ | **Missing** | FAQ references chatengine; not wired |
| Call support | ❌ | ✅ | **Missing** | — |
| Order-specific help ("help with this order") | ❌ | ✅ | **Missing** | — |
| Ticket tracking | ❌ | ✅ | **Missing** | — |

**Fix needed:** Replace copied Swiggy FAQ with Cravon-specific, accurate content.

---

### 15. Additional Swiggy / Zomato Verticals (Not in Cravon)

These are major parts of Swiggy/Zomato's "bigger" ecosystem. None are implemented in Cravon:

| Vertical | Swiggy | Zomato | Cravon |
|----------|--------|--------|--------|
| Food delivery (core) | ✅ | ✅ | ⚠️ MVP |
| Quick commerce / grocery (Instamart / Blinkit) | ✅ | ⚠️ | ❌ |
| Dine-out / table booking | ✅ Dineout | ✅ | ❌ |
| Pickup / takeaway mode | ✅ | ✅ | ❌ |
| Alcohol delivery | ❌ | ⚠️ Select cities | ❌ |
| Meat / specialty stores | ✅ | ❌ | ❌ |
| Corporate / bulk ordering | ✅ | ✅ | ❌ |
| Gift cards | ✅ | ✅ | ❌ |

---

### 16. Platform & Non-Functional (User-Impacting)

| Feature | Cravon | Swiggy / Zomato | Status |
|---------|--------|-----------------|--------|
| Mobile responsive web | ✅ | ✅ | **Done** |
| Native iOS / Android app | ❌ | ✅ | **Missing** |
| PWA (installable, offline) | ❌ | ⚠️ | **Missing** |
| Performance (lazy load, CDN images) | ⚠️ | ✅ | **Partial** |
| Accessibility (screen readers, ARIA) | ⚠️ | ✅ | **Not audited** |
| SEO for public pages | ⚠️ | ✅ | **Partial** |
| Error boundaries | ✅ | ✅ | **Done** |
| Rate limiting (API abuse) | ✅ | ✅ | **Done** (prod) |
| HTTPS / secure cookies | ⚠️ | ✅ | Depends on deployment |

---

## Bugs & Technical Debt (User-Visible)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | Coupons change displayed total but **server charges full amount** | 🔴 Critical | `CartPage.js` vs `order.controller.js` |
| 2 | Item customizations (size, add-ons) **not applied** to cart or order | 🔴 Critical | `ItemCustomizationModal.js`, `ItemList.js` |
| 3 | Cart **lost on page refresh** | 🟠 High | `cartSlice.js` — server cart unused |
| 4 | Two disconnected address systems (browse vs profile vs hardcoded panel) | 🟠 High | `DashboardLayout.js`, `CartPage.js` |
| 5 | Orders **auto-deliver in ~2 minutes** via `setTimeout` | 🟠 High | `order.controller.js` |
| 6 | Reviews can be submitted **without delivered order** | 🟡 Medium | `restaurant.routes.js` wiring |
| 7 | Notification bell **does nothing** | 🟡 Medium | `DashboardTopBar.js` |
| 8 | Social login, forgot password, OTP buttons **misleading** | 🟡 Medium | `SignInSidebar.js` |
| 9 | FAQ content is **Swiggy copy-paste** (mentions Instamart, Cravon One, etc.) | 🟡 Medium | `constants.js` |
| 10 | README outdated (Swiggy API, no backend mention) | 🟡 Medium | `README.md` |
| 11 | Address/cart PATCH/DELETE **lack ownership checks** | 🔴 Security | `address.controller.js`, `cart.controller.js` |
| 12 | `createRestaurant` **auto-approves** — skips admin workflow | 🟡 Medium | `restaurant.controller.js` |
| 13 | Search API **ignores lat/lng** for distance sort | 🟡 Medium | `restaurant.controller.js` |
| 14 | New addresses saved with **lat/lng = 0** | 🟡 Medium | `CartPage.js` |
| 15 | Favourites **not synced** across devices | 🟡 Medium | `favoritesSlice.js` |

---

## What Is Completed (Working End-to-End)

These flows work today for a logged-in user in a dev/demo environment:

1. **Sign up / sign in** with email and password  
2. **Set delivery location** (search or GPS) and see nearby restaurants  
3. **Browse home feed** with filters, categories, favourites (local), recently viewed  
4. **Search restaurants** by name/cuisine/city  
5. **Open restaurant menu**, filter veg, add items to cart  
6. **Checkout with COD label**, select/add address, place order  
7. **View order history** and order detail with status stepper  
8. **Cancel** early-stage orders  
9. **Reorder** from past orders  
10. **Submit restaurant review** after delivery (status reaches DELIVERED)  
11. **Manage profile** (name, phone, password, dark mode)  
12. **Add/delete saved addresses** in profile  
13. **Help FAQ** and **contact form**  
14. **Marketing landing pages** (home, features, about, partner, contact)

---

## What Must Be Fixed Before Portfolio Launch

### P0 — Demo launch blockers (fix these)

| Priority | Item | Portfolio note |
|----------|------|----------------|
| P0 | **Fix customization → cart → order** | Broken core flow — interviewers will click through |
| P0 | **Server-side coupon/pricing** | Client/server price mismatch looks like a bug |
| P0 | **Razorpay test mode + COD option** | Shows payment integration skills |
| P0 | **Cart persistence** (Redux + localStorage or use `/api/cart`) | Basic UX expectation |
| P0 | **Deploy live** with seed data + demo accounts | No deployment = project doesn't count |
| P0 | **Honest README** — say "simulated delivery, seed data" | Integrity matters |

### P1 — Makes the demo impressive

| Priority | Item |
|----------|------|
| P1 | Simulated tracking v2 (rider model + map interpolation API) |
| P1 | Owner portal: new-order alert when customer places order |
| P1 | Admin: approval actually hides restaurants until approved |
| P1 | Orders link in customer sidebar |
| P1 | Unified address system (browse location ↔ saved addresses) |
| P1 | WebSocket/SSE for live order status on customer page |
| P1 | Replace Swiggy-copied FAQ with accurate Cravon content |
| P1 | Fix auth gaps (logout API, remove fake social login buttons) |

### P2 — Only if P0 + P1 are done

| Priority | Item | Real business only? |
|----------|------|---------------------|
| P2 | Forgot password | No — good polish |
| P2 | Favourites synced to server | No |
| P2 | Dish-level search | No |
| P2 | Admin charts | No |
| P2 | Phone OTP (real SMS) | **Yes — skip for portfolio** |
| P2 | Real rider fleet / GPS hardware | **Yes — skip** |
| P2 | Push notifications / SMS | **Yes — skip** |
| P2 | Instamart / Dineout | **Yes — skip** |

---

## What to Implement to Be "Bigger & More Unique"

Swiggy and Zomato win on **scale, logistics, and ecosystem**. To differentiate Cravon, consider features they do poorly or don't emphasize:

### Differentiation Ideas (Post-MVP)

| Idea | Why it could stand out |
|------|------------------------|
| **Hyperlocal cloud kitchens** | Focus on one city deeply before national expansion |
| **Transparent pricing** | Show full fee breakdown upfront (no hidden surge) |
| **Zero-commission period for restaurants** | Attract partners away from 25–30% platform fees |
| **Diet & allergy filters** | Item-level allergens, macros, Jain-friendly, keto — beyond "pure veg" |
| **Group ordering (split bill)** | Already on marketing page as "coming soon" — high social value |
| **Subscription tiffin / meal plans** | Recurring orders Swiggy doesn't focus on |
| **Local-only brands** | Curate hidden gems vs chain restaurants |
| **Carbon / sustainability score** | Eco packaging, local sourcing badges |
| **Community reviews** | Follow food bloggers, friend recommendations |
| **Transparent rider earnings tip** | "100% of tip goes to delivery partner" |
| **Regional language UX** | Hindi + regional languages from day one |
| **College / corporate micro-zones** | Campus-specific deals and delivery points |

### Ecosystem Expansion (Long-Term, Like Swiggy)

| Phase | Vertical |
|-------|----------|
| Phase 1 | Food delivery (current focus) |
| Phase 2 | Pickup / takeaway mode |
| Phase 3 | Grocery / quick commerce |
| Phase 4 | Dine-out reservations |
| Phase 5 | B2B corporate meals |

---

## Suggested Roadmap (Portfolio Launch — 6 to 8 Weeks)

```
Week 1–2   Fix bugs (cart, coupons, customizations, addresses)
           + Razorpay test mode + COD
           + Deploy v1 (even if rough)

Week 3–4   Simulated delivery v2 (rider model, map API, WebSocket status)
           + Owner new-order alerts
           + Admin charts + approval gating

Week 5–6   Polish UI, README, ARCHITECTURE.md, demo video (2 min screen recording)
           + Optional: forgot password, dish search, favourites API

Week 7–8   Apply to jobs / add to resume / practice explaining architecture in interviews
```

### If you later want a REAL business (not needed for career switch now)

Only then consider: real restaurant partnerships, Razorpay live mode, FSSAI compliance, delivery fleet or third-party logistics API, customer support team, legal terms, OTP auth at scale.

---

## File Reference (Key Implementation Locations)

| Domain | Client | Server |
|--------|--------|--------|
| Routing | `client/src/App.js` | `server/src/app.js` |
| Auth | `client/src/components/SignInSidebar.js` | `server/src/controllers/auth.controller.js` |
| Location | `client/src/layouts/DashboardLayout.js` | `server/src/controllers/restaurant.controller.js` |
| Discovery | `client/src/pages/HomePage.js` | `server/src/controllers/restaurant.controller.js` |
| Search | `client/src/pages/SearchResultsPage.js` | `GET /restaurants/search` |
| Menu / Cart | `client/src/pages/RestaurantMenuPage.js`, `CartPage.js` | `server/src/controllers/menu.controller.js`, `cart.controller.js` |
| Orders | `client/src/pages/OrdersPage.js`, `OrderDetailPage.js` | `server/src/controllers/order.controller.js` |
| Tracking | `client/src/components/DeliveryMap.js` | Auto `setTimeout` in order controller |
| Reviews | `client/src/pages/OrderDetailPage.js` | `server/src/controllers/review.controller.js` |
| Addresses | `client/src/pages/ProfilePage.js` | `server/src/controllers/address.controller.js` |
| Database | — | `server/prisma/schema.prisma` |

---

## Bottom Line

**You are thinking in the right direction.** Customer app + restaurant owner portal + super admin dashboard is the correct architecture — and you already have all three started. You do **not** need real restaurants or real delivery riders to build a project that gets you hired.

**Do this:**
1. Treat Cravon as a **production-quality demo** with **simulated logistics** (not a fake broken app).
2. Fix the broken ordering bugs, add **Razorpay test payments + COD**, improve **simulated tracking**, polish **owner + admin** portals.
3. **Deploy it** and document it honestly.

**Don't do this:**
1. Try to compete with Swiggy operationally on your own.
2. Block yourself because you can't deliver real biryani.
3. Add Instamart, OTP SMS, and native apps before the core 3-portal flow is solid.

**For interviews, "bigger than Swiggy" means:** cleaner architecture, transparent code, full role-based platform, working payment flow, believable tracking simulation — not actually beating their market share.

Use the feature matrices below as a **reference checklist**. For your next 6 weeks, follow **[What to Build Next](#what-to-build-next-priority-order-for-career-switch)** and ignore real-business-only items.

---

*Generated from full codebase audit of client (`client/src`) and server (`server/src`). AI agent feature intentionally excluded. Updated for portfolio / career-switch goals.*
