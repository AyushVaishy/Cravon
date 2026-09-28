const prisma = require("../config/prisma");
const { validateCoupon, findBestCoupon } = require("../utils/couponService");
const { buildOrderBill } = require("../utils/orderBilling");

const listCoupons = async (req, res, next) => {
  try {
    const { restaurantId, tag } = req.query;
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        ...(restaurantId ? { OR: [{ restaurantId: null }, { restaurantId }] } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
      },
      include: {
        restaurant: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
};

const validateCouponCode = async (req, res, next) => {
  try {
    const { code, restaurantId, itemSubtotal, orderType } = req.body;
    if (!code || !restaurantId) {
      return res.status(400).json({ message: "code and restaurantId are required" });
    }
    const result = await validateCoupon({
      code,
      userId: req.user.id,
      restaurantId,
      itemSubtotal: Number(itemSubtotal) || 0,
      orderType: orderType || "DELIVERY",
    });
    if (!result.valid) {
      return res.status(400).json({ valid: false, message: result.message });
    }
    res.json({ valid: true, coupon: result.coupon });
  } catch (err) {
    next(err);
  }
};

const autoApplyCoupon = async (req, res, next) => {
  try {
    const { restaurantId, itemSubtotal, orderType } = req.body;
    const best = await findBestCoupon({
      userId: req.user.id,
      restaurantId,
      itemSubtotal: Number(itemSubtotal) || 0,
      orderType: orderType || "DELIVERY",
    });
    res.json({ coupon: best });
  } catch (err) {
    next(err);
  }
};

const previewBill = async (req, res, next) => {
  try {
    const {
      restaurantId,
      items,
      couponCode,
      orderType = "DELIVERY",
      tipAmount = 0,
      useWallet = false,
      loyaltyPointsToRedeem = 0,
    } = req.body;

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId },
    });
    const menuMap = Object.fromEntries(menuItems.map((m) => [m.id, m]));

    const MAX_EXTRA = 15000;
    const lineItems = items.map((i) => {
      const menuItem = menuMap[i.menuItemId];
      const basePrice = menuItem?.price || 0;
      const clientPrice = i.unitPrice != null ? Number(i.unitPrice) : basePrice;
      const priceAtTime =
        clientPrice >= basePrice && clientPrice <= basePrice + MAX_EXTRA ? clientPrice : basePrice;
      return { menuItemId: i.menuItemId, quantity: i.quantity, priceAtTime };
    });

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

    const estimatedDeliveryMinutes = require("../utils/orderBilling").calcEstimatedMinutes(
      restaurant,
      lineItems,
      menuMap,
      orderType
    );

    res.json({ bill: { ...bill, estimatedDeliveryMinutes }, coupon });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCoupons,
  validateCouponCode,
  autoApplyCoupon,
  previewBill,
};
