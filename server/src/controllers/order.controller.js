const prisma = require("../config/prisma");
const { haversineKm, DELIVERY_RADIUS_KM, isValidCoord } = require("../utils/geo");
const { geocodeAddressParts } = require("../services/geocodingService");

const createOrder = async (req, res, next) => {
  try {
    const { items, restaurantId, addressId, deliveryAddress, deliveryLat, deliveryLng, notes, contactless, deliveryPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }
    if (!restaurantId) {
      return res.status(400).json({ message: "restaurantId is required" });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!restaurant.isOpen || !restaurant.isApproved) {
      return res.status(400).json({ message: "This restaurant is not accepting orders right now." });
    }

    let resolvedAddressId = addressId || null;
    let orderNotes = notes || null;
    let destLat = deliveryLat;
    let destLng = deliveryLng;
    let resolvedDeliveryPhone = deliveryPhone?.trim() || null;

    if (addressId) {
      const saved = await prisma.address.findFirst({
        where: { id: addressId, userId: req.user.id },
      });
      if (!saved) return res.status(400).json({ message: "Invalid delivery address" });
      destLat = saved.lat;
      destLng = saved.lng;
      const addrLine = `${saved.street}, ${saved.city}, ${saved.state} ${saved.pincode}`.trim();
      orderNotes = deliveryAddress || addrLine;
      if (saved.contactName) {
        orderNotes = `Contact: ${saved.contactName}${saved.contactPhone ? ` (${saved.contactPhone})` : ""} | ${orderNotes}`;
      }
      if (notes) orderNotes += ` | Note: ${notes}`;
      if (!resolvedDeliveryPhone && saved.contactPhone) {
        resolvedDeliveryPhone = saved.contactPhone;
      }
    } else if (deliveryAddress) {
      orderNotes = deliveryAddress + (notes ? ` | Note: ${notes}` : "");
      if (!isValidCoord(destLat, destLng)) {
        const parts = deliveryAddress.split(",").map((s) => s.trim());
        const geocoded = await geocodeAddressParts({
          street: parts[0] || deliveryAddress,
          city: parts[1] || "",
          state: parts[2] || "",
          pincode: (parts.find((p) => /^\d{6}$/.test(p)) || "").slice(0, 6),
        });
        if (geocoded) {
          destLat = geocoded.lat;
          destLng = geocoded.lng;
        }
      }
    } else {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    if (!isValidCoord(destLat, destLng)) {
      return res.status(400).json({
        message: "Could not verify your delivery location. Please pick a saved address or enter a complete address with pincode.",
      });
    }

    const distanceKm = haversineKm(Number(destLat), Number(destLng), restaurant.lat, restaurant.lng);
    if (distanceKm > DELIVERY_RADIUS_KM) {
      return res.status(400).json({
        message: `${restaurant.name} doesn't deliver to this address (${Math.round(distanceKm * 10) / 10} km away). Maximum delivery range is ${DELIVERY_RADIUS_KM} km.`,
        distanceKm: Math.round(distanceKm * 10) / 10,
        maxDeliveryKm: DELIVERY_RADIUS_KM,
      });
    }

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId },
    });
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ message: "One or more items are invalid for this restaurant" });
    }

    const menuMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    const totalAmount = items.reduce(
      (sum, i) => sum + (menuMap[i.menuItemId]?.price ?? 0) * i.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        restaurantId,
        addressId: resolvedAddressId,
        totalAmount,
        notes: orderNotes,
        contactless: Boolean(contactless),
        deliveryPhone: resolvedDeliveryPhone,
        items: {
          create: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            priceAtTime: menuMap[i.menuItemId].price,
          })),
        },
      },
      include: {
        items: { include: { menuItem: { select: { name: true, price: true } } } },
        restaurant: { select: { name: true, imageUrl: true } },
        address: true,
      },
    });

    res.status(201).json({ order, distanceKm: Math.round(distanceKm * 10) / 10 });

    const AUTO_TIMELINE = [
      { status: "CONFIRMED", delay: 20000 },
      { status: "PREPARING", delay: 50000 },
      { status: "OUT_FOR_DELIVERY", delay: 80000 },
      { status: "DELIVERED", delay: 120000 },
    ];
    AUTO_TIMELINE.forEach(({ status, delay }) => {
      setTimeout(async () => {
        try {
          const current = await prisma.order.findUnique({ where: { id: order.id } });
          if (current && current.status !== "CANCELLED") {
            await prisma.order.update({ where: { id: order.id }, data: { status } });
          }
        } catch (_) { /* ignore */ }
      }, delay);
    });
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        restaurant: { select: { name: true, imageUrl: true } },
        items: { include: { menuItem: { select: { name: true, price: true, isVeg: true, imageUrl: true, restaurantId: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        address: true,
      },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.user.id && req.user.role === "USER") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_TRANSITIONS = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
        allowedTransitions: allowed,
      });
    }
    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
};

const getRestaurantOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!["PLACED", "CONFIRMED"].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel order in ${order.status} status` });
    }
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getRestaurantOrders,
  cancelOrder,
};
