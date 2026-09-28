import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getCoupons } from "../services/couponService";
import { getRewards, applyReferralCode, redeemLoyaltyPoints } from "../services/rewardsService";
import { FaTag, FaGift, FaWallet, FaStar, FaCrown, FaCopy, FaUniversity } from "react-icons/fa";

const TYPE_LABELS = {
  PERCENT: "Discount",
  FIXED: "Flat off",
  FREE_DELIVERY: "Free delivery",
  CASHBACK: "Cashback",
  BANK_CASHBACK: "Bank offer",
};

const OffersPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralInput, setReferralInput] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      getCoupons().then((r) => setCoupons(r.data.coupons || [])),
      getRewards().then((r) => setRewards(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  };

  const handleReferral = async () => {
    if (!referralInput.trim()) return;
    try {
      const res = await applyReferralCode(referralInput.trim());
      toast.success(res.data.message);
      setReferralInput("");
      const r = await getRewards();
      setRewards(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid referral code");
    }
  };

  const handleRedeemLoyalty = async (points) => {
    try {
      const res = await redeemLoyaltyPoints(points);
      toast.success(res.data.message);
      const r = await getRewards();
      setRewards(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not redeem points");
    }
  };

  const filtered = coupons.filter((c) => {
    if (filter === "all") return true;
    if (filter === "restaurant") return c.restaurantId;
    if (filter === "bank") return c.type === "BANK_CASHBACK";
    if (filter === "cashback") return c.type === "CASHBACK";
    return c.tags?.includes(filter);
  });

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading offers…</div>;
  }

  return (
    <div className="min-h-screen px-6 md:px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Offers & Rewards</h1>
        <p className="text-muted-foreground text-sm">Browse coupons, earn loyalty points, and invite friends.</p>
      </div>

      {rewards && (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-white/80 dark:bg-zinc-900/70 p-5">
            <FaWallet className="text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Wallet balance</p>
            <p className="text-2xl font-bold">₹{(rewards.walletBalance / 100).toFixed(0)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white/80 dark:bg-zinc-900/70 p-5">
            <FaStar className="text-yellow-500 mb-2" />
            <p className="text-xs text-muted-foreground">Loyalty points</p>
            <p className="text-2xl font-bold">{rewards.loyaltyPoints}</p>
            {rewards.loyaltyPoints >= 100 && (
              <button onClick={() => handleRedeemLoyalty(100)} className="mt-2 text-xs text-primary font-semibold">
                Redeem 100 pts → ₹50 wallet
              </button>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-white/80 dark:bg-zinc-900/70 p-5">
            <FaCrown className="text-amber-500 mb-2" />
            <p className="text-xs text-muted-foreground">Cravon One</p>
            <p className="text-lg font-bold">{rewards.membershipActive ? "Active member" : "Not a member"}</p>
          </div>
        </div>
      )}

      {rewards?.referralCode && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 mb-8">
          <h2 className="font-bold flex items-center gap-2 mb-2"><FaGift /> Referral program</h2>
          <p className="text-sm text-muted-foreground mb-3">Share your code — you and your friend each get ₹50 wallet credit.</p>
          <div className="flex gap-2 mb-4">
            <code className="flex-1 bg-background border rounded-lg px-4 py-2 font-mono font-bold">{rewards.referralCode}</code>
            <button onClick={() => copyCode(rewards.referralCode)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
              <FaCopy className="inline mr-1" /> Copy
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter friend's referral code"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase"
            />
            <button onClick={handleReferral} className="px-4 py-2 border-2 border-primary text-primary rounded-lg text-sm font-semibold">
              Apply
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{rewards.referralCount || 0} friends referred</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { id: "all", label: "All" },
          { id: "platform", label: "Platform" },
          { id: "restaurant", label: "Restaurant" },
          { id: "cashback", label: "Cashback" },
          { id: "bank", label: "Bank" },
          { id: "membership", label: "Members" },
          { id: "first-order", label: "First order" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              filter === f.id ? "bg-primary text-white border-primary" : "border-border hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No offers in this category</p>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-white/80 dark:bg-zinc-900/70 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FaTag className="text-primary text-sm" />
                  <span className="text-xs font-bold uppercase text-primary">{TYPE_LABELS[c.type] || c.type}</span>
                  {c.bankName && <span className="text-xs flex items-center gap-1 text-muted-foreground"><FaUniversity /> {c.bankName}</span>}
                </div>
                <h3 className="font-bold text-foreground">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                {c.restaurant && <p className="text-xs text-muted-foreground mt-1">@ {c.restaurant.name}</p>}
                {c.minOrderAmount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Min order ₹{Math.ceil(c.minOrderAmount / 100)}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-muted rounded-lg font-mono font-bold text-sm">{c.code}</code>
                <button onClick={() => copyCode(c.code)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold whitespace-nowrap">
                  Copy code
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/home/cart" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
          Go to cart to apply a coupon →
        </Link>
      </div>
    </div>
  );
};

export default OffersPage;
