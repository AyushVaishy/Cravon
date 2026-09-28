const prisma = require("../config/prisma");
const { buildOrderBill } = require("./orderBilling");

const isCouponValidWindow = (coupon) => {
  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) return false;
  if (coupon.validUntil && coupon.validUntil < now) return false;
  return true;
};

const validateCoupon = async ({
  code,
  userId,
  restaurantId,
  itemSubtotal,
  orderType = "DELIVERY",
}) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: { restaurant: { select: { id: true, name: true } } },
  });

  if (!coupon || !coupon.isActive) {
    return { valid: false, message: "Invalid coupon code" };
  }
  if (!isCouponValidWindow(coupon)) {
    return { valid: false, message: "This coupon has expired" };
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }
  if (coupon.restaurantId && coupon.restaurantId !== restaurantId) {
    return { valid: false, message: "This coupon is not valid for this restaurant" };
  }
  if (itemSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order of ₹${Math.ceil(coupon.minOrderAmount / 100)} required for this coupon`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membershipActive: true,
      membershipExpiresAt: true,
      orders: { select: { id: true }, take: 1 },
    },
  });

  if (coupon.isMembershipOnly) {
    const memberOk =
      user?.membershipActive &&
      (!user.membershipExpiresAt || user.membershipExpiresAt > new Date());
    if (!memberOk) {
      return { valid: false, message: "This coupon is for Cravon One members only" };
    }
  }

  if (coupon.isFirstOrderOnly) {
    const orderCount = await prisma.order.count({
      where: { userId, status: { not: "CANCELLED" } },
    });
    if (orderCount > 0) {
      return { valid: false, message: "This coupon is valid only on your first order" };
    }
  }

  const priorUse = await prisma.couponUsage.findFirst({
    where: { userId, couponId: coupon.id },
  });
  if (priorUse && ["PERCENT", "FIXED", "FREE_DELIVERY"].includes(coupon.type)) {
    return { valid: false, message: "You have already used this coupon" };
  }

  return { valid: true, coupon };
};

const findBestCoupon = async ({ userId, restaurantId, itemSubtotal, orderType = "DELIVERY" }) => {
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ restaurantId: null }, { restaurantId }],
      type: { in: ["PERCENT", "FIXED", "FREE_DELIVERY"] },
    },
  });

  let best = null;
  let bestSaving = 0;

  for (const coupon of coupons) {
    const result = await validateCoupon({
      code: coupon.code,
      userId,
      restaurantId,
      itemSubtotal,
      orderType,
    });
    if (!result.valid) continue;

    const bill = buildOrderBill({
      restaurant: { deliveryFee: 2900, packagingFee: 1000, minOrderAmount: 0 },
      lineItems: [{ priceAtTime: itemSubtotal, quantity: 1 }],
      orderType,
      coupon: result.coupon,
    });
    const saving = bill.couponDiscount + (bill.deliveryFeeAmount === 0 && coupon.type === "FREE_DELIVERY" ? 2900 : 0);
    if (saving > bestSaving) {
      bestSaving = saving;
      best = result.coupon;
    }
  }

  return best;
};

const generateReferralCode = (name) => {
  const base = (name || "CRAVON").replace(/\s+/g, "").slice(0, 6).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
};

module.exports = {
  validateCoupon,
  findBestCoupon,
  generateReferralCode,
  isCouponValidWindow,
};
