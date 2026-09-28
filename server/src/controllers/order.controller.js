const prisma = require("../config/prisma");
const { haversineKm, DELIVERY_RADIUS_KM, isValidCoord } = require("../utils/geo");
const { geocodeAddressParts } = require("../services/geocodingService");
const { validateCoupon } = require("../utils/couponService");
const { buildOrderBill, calcEstimatedMinutes } = require("../utils/orderBilling");

const VALID_PAYMENT_METHODS = ["COD", "UPI", "CARD", "DEBIT_CARD", "NETBANKING", "WALLET"];
const VALID_ORDER_TYPES = ["DELIVERY", "PICKUP"];

const buildLineItems = (items, menuMap) => {
  const MAX_EXTRA = 15000;
  return items.map((i) => {
    const menuItem = menuMap[i.menuItemId];
    const basePrice = menuItem.price;
    const clientPrice = i.unitPrice != null ? Number(i.unitPrice) : basePrice;
    const priceAtTime =
      clientPrice >= basePrice && clientPrice <= basePrice + MAX_EXTRA ? clientPrice : basePrice;
    return {
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      priceAtTime,
      customizations: i.customizations || null,
      itemNotes: i.itemNotes?.trim() || null,
    };
  });
};

const previewOrder = async (req, res, next) => {
  try {
    const {
      items,
      restaurantId,
      couponCode,
      orderType = "DELIVERY",
      tipAmount = 0,
      useWallet = false,
      loyaltyPointsToRedeem = 0,
    } = req.body;

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) }, restaurantId },
    });
    const menuMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    const lineItems = buildLineItems(items, menuMap);
    const itemSubtotal = lineItems.reduce((s, l) => s + l.priceAtTime * l.quantity, 0);

    let coupon = null;
    if (couponCode) {
      const result = await validateCoupon({
        code: couponCode,
        userId: req.user.id,
        restaurantId,
        itemSubtotal,
        orderType,
      });
      if (!result.valid) return res.status(400).json({ message: result.message });
      coupon = result.coupon;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { walletBalance: true, loyaltyPoints: true },
    });

    const bill = buildOrderBill({
      restaurant,
      lineItems,
      orderType,
      coupon,
      tipAmount: Number(tipAmount) || 0,
      walletBalance: user?.walletBalance || 0,
      useWallet: Boolean(useWallet),
      loyaltyPointsToRedeem: Math.min(Number(loyaltyPointsToRedeem) || 0, user?.loyaltyPoints || 0),
    });

    const estimatedDeliveryMinutes = calcEstimatedMinutes(restaurant, lineItems, menuMap, orderType);

    res.json({ bill: { ...bill, estimatedDeliveryMinutes }, coupon });
  } catch (err) {
    next(err);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      restaurantId,
      addressId,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      notes,
      restaurantNotes,
      contactless,
      deliveryPhone,
      orderType = "DELIVERY",
      paymentMethod = "COD",
      scheduledFor,
      couponCode,
      tipAmount = 0,
      useWallet = false,
      loyaltyPointsToRedeem = 0,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }
    if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });
    if (!VALID_ORDER_TYPES.includes(orderType)) {
      return res.status(400).json({ message: "Invalid order type" });
    }
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!restaurant.isOpen || !restaurant.isApproved) {
      return res.status(400).json({ message: "This restaurant is not accepting orders right now." });
    }

    const maxQty = restaurant.maxItemQuantity ?? 10;
    for (const item of items) {
      if (item.quantity > maxQty) {
        return res.status(400).json({ message: `Maximum ${maxQty} per item allowed` });
      }
    }

    let resolvedAddressId = addressId || null;
    let orderNotes = notes || null;
    let destLat = deliveryLat;
    let destLng = deliveryLng;
    let resolvedDeliveryPhone = deliveryPhone?.trim() || null;

    if (orderType === "DELIVERY") {
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
    } else {
      orderNotes = notes ? `Pickup order | ${notes}` : "Pickup order";
      if (restaurantNotes) orderNotes += ` | Restaurant note: ${restaurantNotes}`;
    }

    if (restaurantNotes && orderType === "DELIVERY") {
      orderNotes = (orderNotes || "") + ` | Restaurant note: ${restaurantNotes}`;
    }

    let scheduledDate = null;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return res.status(400).json({ message: "Scheduled time must be in the future" });
      }
    }

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId },
    });
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ message: "One or more items are invalid for this restaurant" });
    }

    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      return res.status(400).json({
        message: `${unavailable.map((m) => m.name).join(", ")} is currently unavailable`,
      });
    }

    const menuMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));
    const lineItems = buildLineItems(items, menuMap);
    const itemSubtotal = lineItems.reduce((s, l) => s + l.priceAtTime * l.quantity, 0);

    if (itemSubtotal < restaurant.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order is ₹${Math.ceil(restaurant.minOrderAmount / 100)}`,
        minOrderAmount: restaurant.minOrderAmount,
      });
    }

    let coupon = null;
    if (couponCode) {
      const result = await validateCoupon({
        code: couponCode,
        userId: req.user.id,
        restaurantId,
        itemSubtotal,
        orderType,
      });
      if (!result.valid) return res.status(400).json({ message: result.message });
      coupon = result.coupon;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { walletBalance: true, loyaltyPoints: true },
    });

    const pointsToRedeem = Math.min(Number(loyaltyPointsToRedeem) || 0, user?.loyaltyPoints || 0);
    const bill = buildOrderBill({
      restaurant,
      lineItems,
      orderType,
      coupon,
      tipAmount: Number(tipAmount) || 0,
      walletBalance: user?.walletBalance || 0,
      useWallet: Boolean(useWallet),
      loyaltyPointsToRedeem: pointsToRedeem,
    });

    if (paymentMethod === "WALLET" && bill.totalAmount > 0) {
      return res.status(400).json({ message: "Insufficient wallet balance for full payment" });
    }

    const estimatedDeliveryMinutes = calcEstimatedMinutes(restaurant, lineItems, menuMap, orderType);

    const order = await prisma.$transaction(async (tx) => {
      if (bill.walletUsed > 0) {
        const fresh = await tx.user.findUnique({ where: { id: req.user.id } });
        if ((fresh?.walletBalance || 0) < bill.walletUsed) {
          throw new Error("Insufficient wallet balance");
        }
        await tx.user.update({
          where: { id: req.user.id },
          data: { walletBalance: { decrement: bill.walletUsed } },
        });
        await tx.walletTransaction.create({
          data: {
            userId: req.user.id,
            amount: -bill.walletUsed,
            type: "ORDER_PAYMENT",
            description: "Used wallet for order",
          },
        });
      }

      if (bill.loyaltyPointsRedeemed > 0) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { loyaltyPoints: { decrement: bill.loyaltyPointsRedeemed } },
        });
        await tx.loyaltyRedemption.create({
          data: {
            userId: req.user.id,
            points: bill.loyaltyPointsRedeemed,
            amount: bill.loyaltyDiscount,
          },
        });
      }

      const created = await tx.order.create({
        data: {
          userId: req.user.id,
          restaurantId,
          addressId: orderType === "DELIVERY" ? resolvedAddressId : null,
          totalAmount: bill.totalAmount,
          notes: orderNotes,
          restaurantNotes: restaurantNotes?.trim() || null,
          contactless: Boolean(contactless),
          deliveryPhone: resolvedDeliveryPhone,
          orderType,
          paymentMethod,
          scheduledFor: scheduledDate,
          tipAmount: bill.tipAmount,
          packagingFee: bill.packagingFee,
          platformFee: bill.platformFee,
          deliveryFeeAmount: bill.deliveryFeeAmount,
          gstAmount: bill.gstAmount,
          discountAmount: bill.discountAmount,
          walletUsed: bill.walletUsed,
          couponCode: coupon?.code || null,
          couponId: coupon?.id || null,
          cashbackAmount: bill.cashbackAmount,
          loyaltyPointsEarned: bill.loyaltyPointsEarned,
          estimatedDeliveryMinutes,
          items: {
            create: lineItems.map(({ menuItemId, quantity, priceAtTime, customizations, itemNotes }) => ({
              menuItemId,
              quantity,
              priceAtTime,
              customizations,
              itemNotes,
            })),
          },
        },
        include: {
          items: { include: { menuItem: { select: { name: true, price: true } } } },
          restaurant: { select: { name: true, imageUrl: true, address: true } },
          address: true,
        },
      });

      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: { userId: req.user.id, couponId: coupon.id, orderId: created.id },
        });
      }

      await tx.user.update({
        where: { id: req.user.id },
        data: { loyaltyPoints: { increment: bill.loyaltyPointsEarned } },
      });

      if (bill.cashbackAmount > 0) {
        await tx.user.update({
          where: { id: req.user.id },
          data: { walletBalance: { increment: bill.cashbackAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            userId: req.user.id,
            amount: bill.cashbackAmount,
            type: "CASHBACK",
            description: `Cashback from coupon ${coupon?.code}`,
            orderId: created.id,
          },
        });
      }

      // Multi-restaurant cart: only remove items belonging to this restaurant
      const cart = await tx.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: { include: { menuItem: { select: { restaurantId: true } } } } },
      });
      if (cart) {
        const toRemove = cart.items
          .filter((ci) => ci.menuItem?.restaurantId === restaurantId)
          .map((ci) => ci.id);
        if (toRemove.length > 0) {
          await tx.cartItem.deleteMany({ where: { id: { in: toRemove } } });
        }
        const remaining = await tx.cartItem.findMany({
          where: { cartId: cart.id },
          include: { menuItem: { select: { restaurantId: true } } },
        });
        const nextRestId = remaining[0]?.menuItem?.restaurantId || null;
        await tx.cart.update({ where: { id: cart.id }, data: { restaurantId: nextRestId } });
      }

      return created;
    });

    res.status(201).json({
      order,
      bill,
      estimatedDeliveryMinutes,
      distanceKm: orderType === "DELIVERY"
        ? Math.round(haversineKm(Number(destLat), Number(destLng), restaurant.lat, restaurant.lng) * 10) / 10
        : 0,
    });

    for (const line of lineItems) {
      await prisma.menuItem.update({
        where: { id: line.menuItemId },
        data: { orderCount: { increment: line.quantity } },
      }).catch(() => {});
    }

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
    if (err.message === "Insufficient wallet balance") {
      return res.status(400).json({ message: err.message });
    }
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
  previewOrder,
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getRestaurantOrders,
  cancelOrder,
};
