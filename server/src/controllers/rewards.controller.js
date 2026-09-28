const prisma = require("../config/prisma");
const { generateReferralCode } = require("../utils/couponService");

const ensureReferralCode = async (user) => {
  if (user.referralCode) return user.referralCode;
  let code = generateReferralCode(user.name);
  let attempts = 0;
  while (attempts < 5) {
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) break;
    code = generateReferralCode(user.name);
    attempts += 1;
  }
  await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } });
  return code;
};

const getRewards = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        referralCode: true,
        loyaltyPoints: true,
        walletBalance: true,
        membershipActive: true,
        membershipExpiresAt: true,
        referrals: { select: { id: true, name: true, createdAt: true } },
      },
    });
    const referralCode = await ensureReferralCode(user);
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({
      referralCode,
      referralCount: user.referrals?.length || 0,
      referrals: user.referrals || [],
      loyaltyPoints: user.loyaltyPoints,
      walletBalance: user.walletBalance,
      membershipActive: user.membershipActive,
      membershipExpiresAt: user.membershipExpiresAt,
      walletTransactions,
      loyaltyRedeemRate: "100 points = ₹50 off",
    });
  } catch (err) {
    next(err);
  }
};

const applyReferralCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) return res.status(400).json({ message: "Referral code is required" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.referredById) {
      return res.status(400).json({ message: "You have already applied a referral code" });
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.trim().toUpperCase() },
    });
    if (!referrer || referrer.id === req.user.id) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { referredById: referrer.id },
      }),
      prisma.user.update({
        where: { id: referrer.id },
        data: { walletBalance: { increment: 5000 } },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: referrer.id,
          amount: 5000,
          type: "REFERRAL",
          description: `Referral bonus — ${user.name} joined`,
        },
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: { walletBalance: { increment: 5000 } },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          amount: 5000,
          type: "REFERRAL",
          description: "Welcome bonus for using a referral code",
        },
      }),
    ]);

    res.json({ message: "Referral applied! ₹50 credited to your wallet." });
  } catch (err) {
    next(err);
  }
};

const redeemLoyalty = async (req, res, next) => {
  try {
    const { points } = req.body;
    const pts = Number(points);
    if (!pts || pts < 100 || pts % 100 !== 0) {
      return res.status(400).json({ message: "Redeem in blocks of 100 points" });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.loyaltyPoints < pts) {
      return res.status(400).json({ message: "Insufficient loyalty points" });
    }
    const amount = (pts / 100) * 5000;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          loyaltyPoints: { decrement: pts },
          walletBalance: { increment: amount },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          amount,
          type: "LOYALTY",
          description: `Redeemed ${pts} loyalty points`,
        },
      }),
      prisma.loyaltyRedemption.create({
        data: { userId: req.user.id, points: pts, amount },
      }),
    ]);
    res.json({ message: `₹${amount / 100} added to wallet`, amount });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRewards, applyReferralCode, redeemLoyalty };
