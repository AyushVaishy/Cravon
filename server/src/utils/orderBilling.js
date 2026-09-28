const GST_RATE = 0.05;
const PLATFORM_FEE_PAISE = 500;

const roundPaise = (n) => Math.max(0, Math.round(n));

const calcItemSubtotal = (lineItems) =>
  lineItems.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);

const calcDeliveryFee = (restaurant, orderType, coupon) => {
  if (orderType === "PICKUP") return 0;
  if (coupon?.type === "FREE_DELIVERY") return 0;
  return restaurant.deliveryFee ?? 2900;
};

const calcPackagingFee = (restaurant) => restaurant.packagingFee ?? 1000;

const calcGst = (taxablePaise) => roundPaise(taxablePaise * GST_RATE);

const calcCouponDiscount = (coupon, itemSubtotal, deliveryFee) => {
  if (!coupon) return { discount: 0, deliveryWaived: false, cashback: 0 };

  switch (coupon.type) {
    case "PERCENT": {
      let discount = roundPaise((itemSubtotal * coupon.value) / 100);
      if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
      return { discount, deliveryWaived: false, cashback: 0 };
    }
    case "FIXED":
      return { discount: Math.min(coupon.value, itemSubtotal), deliveryWaived: false, cashback: 0 };
    case "FREE_DELIVERY":
      return { discount: 0, deliveryWaived: true, cashback: 0 };
    case "CASHBACK":
    case "BANK_CASHBACK":
      return { discount: 0, deliveryWaived: false, cashback: coupon.value };
    default:
      return { discount: 0, deliveryWaived: false, cashback: 0 };
  }
};

const calcLoyaltyDiscount = (pointsToRedeem) => {
  // 100 points = ₹50 off (5000 paise)
  const blocks = Math.floor(pointsToRedeem / 100);
  return blocks * 5000;
};

const calcLoyaltyEarned = (paidAmountPaise) => Math.floor(paidAmountPaise / 10000);

const calcEstimatedMinutes = (restaurant, lineItems, menuMap, orderType) => {
  if (orderType === "PICKUP") {
    const prep = lineItems.reduce((max, line) => {
      const prepTime = menuMap[line.menuItemId]?.prepTime || 15;
      return Math.max(max, prepTime);
    }, 15);
    return prep + 5;
  }
  const base = restaurant.deliveryTime || 30;
  const prep = lineItems.reduce((max, line) => {
    const prepTime = menuMap[line.menuItemId]?.prepTime || 0;
    return Math.max(max, prepTime);
  }, 0);
  return base + Math.min(prep, 15);
};

const buildOrderBill = ({
  restaurant,
  lineItems,
  orderType = "DELIVERY",
  coupon = null,
  tipAmount = 0,
  walletBalance = 0,
  useWallet = false,
  loyaltyPointsToRedeem = 0,
}) => {
  const itemSubtotal = calcItemSubtotal(lineItems);
  const packagingFee = calcPackagingFee(restaurant);
  const platformFee = PLATFORM_FEE_PAISE;
  let deliveryFee = calcDeliveryFee(restaurant, orderType, coupon);
  const { discount, deliveryWaived, cashback } = calcCouponDiscount(coupon, itemSubtotal, deliveryFee);
  if (deliveryWaived) deliveryFee = 0;

  const loyaltyDiscount = calcLoyaltyDiscount(loyaltyPointsToRedeem);
  const taxable = Math.max(0, itemSubtotal - discount - loyaltyDiscount);
  const gstAmount = calcGst(taxable);
  const tip = roundPaise(tipAmount);

  let subtotalBeforeWallet =
    itemSubtotal + packagingFee + platformFee + deliveryFee + gstAmount + tip - discount - loyaltyDiscount;

  const walletUsed = useWallet ? Math.min(walletBalance, Math.max(0, subtotalBeforeWallet)) : 0;
  const totalAmount = Math.max(0, subtotalBeforeWallet - walletUsed);
  const loyaltyPointsEarned = calcLoyaltyEarned(totalAmount + walletUsed);

  return {
    itemSubtotal,
    packagingFee,
    platformFee,
    deliveryFeeAmount: deliveryFee,
    gstAmount,
    discountAmount: discount + loyaltyDiscount,
    couponDiscount: discount,
    loyaltyDiscount,
    tipAmount: tip,
    walletUsed,
    totalAmount,
    cashbackAmount: cashback,
    loyaltyPointsEarned,
    loyaltyPointsRedeemed: loyaltyDiscount > 0 ? Math.floor(loyaltyPointsToRedeem / 100) * 100 : 0,
    minOrderAmount: restaurant.minOrderAmount ?? 9900,
    maxItemQuantity: restaurant.maxItemQuantity ?? 10,
  };
};

module.exports = {
  GST_RATE,
  PLATFORM_FEE_PAISE,
  buildOrderBill,
  calcEstimatedMinutes,
  calcItemSubtotal,
};
