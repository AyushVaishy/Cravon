import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { clearCart, updateQuantity, removeItem } from "../store/cartSlice";
import { createOrder } from "../services/orderService";
import { addNotification } from "../store/notificationsSlice";
import { getAddresses, addAddress as addAddressAPI } from "../services/addressService";
import { FaShoppingCart, FaUtensils, FaMapMarkerAlt, FaCheckCircle, FaPlus, FaTag, FaLock, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

const COUPONS = {
  WELCOME50: { type: "percent", label: "50% OFF", compute: (total) => Math.min(Math.round(total * 0.5), 100) },
  CRAVON20: { type: "percent", label: "20% OFF", compute: (total) => Math.round(total * 0.2) },
  FREEDEL: { type: "delivery", label: "Free Delivery", compute: () => 0 },
};

const CartPage = () => {
  const cartItems = useSelector((store) => store.cart.items);
  const isAuthenticated = useSelector((store) => store.auth.isAuthenticated) || !!localStorage.getItem("accessToken");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", street: "", city: "", state: "", pincode: "" });
  const [savingAddress, setSavingAddress] = useState(false);
  const [address, setAddress] = useState(""); // fallback plain text
  const [placing, setPlacing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // coupon code string
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setShowNewForm(false);
      return;
    }
    getAddresses()
      .then((res) => {
        const addrs = res.data.addresses || [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) setSelectedAddressId(def.id);
        else setShowNewForm(true);
      })
      .catch(() => setShowNewForm(true));
  }, [isAuthenticated]);

  const promptSignIn = (intent = "checkout") => {
    sessionStorage.setItem("auth_return_to", "/home/cart");
    sessionStorage.setItem("auth_intent", intent);
    window.dispatchEvent(new Event("openSignIn"));
    toast("Sign in or create an account to continue", { icon: "🔐" });
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.street.trim() || !newAddress.city.trim()) {
      toast.error("Street and city are required");
      return;
    }
    setSavingAddress(true);
    try {
      const res = await addAddressAPI({
        label: newAddress.label || "Home",
        street: newAddress.street.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim() || "India",
        pincode: newAddress.pincode.trim() || "000000",
        lat: 0,
        lng: 0,
        isDefault: savedAddresses.length === 0,
      });
      const added = res.data.address;
      setSavedAddresses((prev) => [...prev, added]);
      setSelectedAddressId(added.id);
      setShowNewForm(false);
      setNewAddress({ label: "Home", street: "", city: "", state: "", pincode: "" });
      toast.success("Address saved!");
    } catch {
      toast.error("Failed to save address");
    }
    setSavingAddress(false);
  };

  // Prices are stored in paise → divide by 100
  const itemTotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0) / 100;
  const baseDeliveryFee = 29;
  const effectiveDeliveryFee = appliedCoupon === "FREEDEL" ? 0 : baseDeliveryFee;
  const gstRate = 0.05;
  const gst = Math.round(itemTotal * gstRate);
  const couponDiscount = appliedCoupon && appliedCoupon !== "FREEDEL"
    ? COUPONS[appliedCoupon].compute(itemTotal)
    : 0;
  const toPay = Math.max(0, itemTotal + effectiveDeliveryFee + gst - couponDiscount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setAppliedCoupon(code);
      setCouponError("");
      setCouponInput("");
    } else {
      setCouponError("Invalid coupon code");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponInput("");
  };

  const getDeliveryAddress = () => {
    if (selectedAddressId) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) return `${addr.street}, ${addr.city}, ${addr.state} ${addr.pincode}`.trim();
    }
    return address.trim();
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      promptSignIn("checkout");
      return;
    }
    const deliveryAddr = getDeliveryAddress();
    if (!deliveryAddr) {
      toast.error("Please select or enter a delivery address");
      return;
    }
    if (cartItems.length === 0) return;

    setPlacing(true);
    try {
      const restaurantId = cartItems[0].restaurantId;
      const items = cartItems.map((i) => ({ menuItemId: i.id, quantity: i.quantity }));
      const res = await createOrder({
        items,
        restaurantId,
        deliveryAddress: deliveryAddr + (suggestion.trim() ? ` | Note: ${suggestion.trim()}` : ""),
      });
      dispatch(clearCart());
      dispatch(addNotification({
        title: "Order Placed! 🎉",
        message: "Your order has been placed successfully.",
        type: "PLACED",
        orderId: res.data.order.id,
      }));
      toast.success("🎉 Order placed successfully!");
      navigate("/home/orders");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to place order. Please try again.");
    }
    setPlacing(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="w-full px-6 md:px-8 py-10 md:py-16 text-center">
          <div className="w-28 h-28 bg-[#FF5A5F]/10 rounded-full mx-auto flex items-center justify-center mb-6">
            <FaShoppingCart className="text-5xl text-[#FF5A5F]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Your Cart is Empty</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Add some delicious food to get started!</p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 bg-[#FF5A5F] hover:bg-[#E0484D] text-white px-8 py-3 rounded-full font-bold transition-all shadow-md shadow-[#FF5A5F]/20 hover:-translate-y-0.5"
          >
            <FaUtensils /> Explore Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-6 md:px-8 py-6 md:py-10 flex flex-col md:flex-row gap-6 lg:gap-8">

        {/* ── Left: Address + Payment ─────────────────────────── */}
        <div className="flex-1 space-y-6">

          {!isAuthenticated ? (
            <div className="bg-white/90 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-sm border border-border/80 p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <FaLock className="text-primary text-2xl" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground mb-2">Almost there!</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Your cart is saved. Sign in or create a free account to enter your delivery address and place your order.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => promptSignIn("checkout")}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-6 rounded-xl font-bold text-sm transition shadow-md shadow-primary/20"
                >
                  <FaUser size={14} /> Sign in to checkout
                </button>
                <button
                  type="button"
                  onClick={() => { sessionStorage.setItem("auth_return_to", "/home/cart"); window.dispatchEvent(new CustomEvent("openSignIn", { detail: { tab: "signup" } })); }}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-sm border-2 border-primary text-primary hover:bg-primary/5 transition"
                >
                  Create account
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Delivery Address */}
          <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 dark:border-white/5 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="text-primary" size={14} />
                </span>
                <h2 className="font-bold text-lg text-foreground">Delivery Address</h2>
              </div>
              <button
                onClick={() => setShowNewForm((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary font-semibold"
              >
                <FaPlus size={10} /> Add New
              </button>
            </div>

            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2 mb-3">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? "border-primary bg-muted"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery-address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => { setSelectedAddressId(addr.id); setShowNewForm(false); }}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{addr.label}</p>
                      <p className="text-xs text-muted-foreground">{addr.street}, {addr.city}, {addr.state} {addr.pincode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Add new address form */}
            {showNewForm && (
              <div className="border border-dashed border-primary rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setNewAddress((p) => ({ ...p, label: l }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        newAddress.label === l
                          ? "bg-primary text-white border-primary"
                          : "bg-section border-border text-muted-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Street / Area *"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="City *"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))}
                    className="w-28 border border-border rounded-lg px-3 py-2 text-sm bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleSaveNewAddress}
                  disabled={savingAddress}
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                  {savingAddress ? "Saving…" : "Save Address"}
                </button>
              </div>
            )}

            {/* Fallback: no saved addresses and form hidden */}
            {savedAddresses.length === 0 && !showNewForm && (
              <p className="text-sm text-muted-foreground">
                No saved addresses.{" "}
                <button onClick={() => setShowNewForm(true)} className="text-primary hover:underline">Add one</button>
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 dark:border-white/5 p-6 md:p-8">
            <h3 className="font-semibold text-foreground mb-2 text-sm">Cooking instructions (optional)</h3>
            <input
              type="text"
              placeholder="e.g. Less spicy, no onion…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
            />
          </div>

          {/* Coupon */}
          <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 dark:border-white/5 p-6 md:p-8">
            <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
              <FaTag className="text-primary" size={13} /> Apply Coupon
            </h3>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  className="flex-1 min-w-0 border border-border rounded-lg px-3 py-2 text-sm bg-section text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-semibold">
                  <FaCheckCircle size={14} />
                  {appliedCoupon === "FREEDEL"
                    ? "✓ Coupon applied! Free delivery"
                    : `✓ Coupon applied! You save ₹${couponDiscount}`}
                </div>
                <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-red-500 text-lg leading-none transition">×</button>
              </div>
            )}
            {couponError && (
              <p className="mt-2 text-red-500 text-xs font-medium">{couponError}</p>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 dark:border-white/5 p-6 md:p-8">
            <h2 className="font-bold text-lg text-foreground mb-4">Payment</h2>
            <div className="flex items-center gap-3 p-3 border-2 border-primary rounded-lg bg-muted">
              <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <span className="font-medium text-foreground">Cash on Delivery</span>
            </div>
            <button
              className="mt-4 w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white py-3 rounded-xl font-bold text-base transition shadow"
              onClick={handlePlaceOrder}
              disabled={placing || (!selectedAddressId && !address.trim())}
            >
              {placing ? "Placing Order…" : `Place Order · ₹${Math.round(toPay)}`}
            </button>
          </div>
          </>
          )}
        </div>

        {/* ── Right: Cart Summary ──────────────────────────────── */}
        <div className="w-full md:w-[380px] flex-shrink-0">
          <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 dark:border-white/5 p-6 sticky top-6">
            {/* Restaurant name */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <img
                src={cartItems[0]?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop"}
                alt="Restaurant"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <div className="font-bold text-foreground">{cartItems[0]?.restaurantName || "Restaurant"}</div>
                <div className="text-xs text-muted-foreground">Your order</div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground flex-1 line-clamp-1">{item.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) dispatch(removeItem(item.id));
                        else dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
                      }}
                      className="w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold hover:bg-muted/80 transition flex items-center justify-center text-sm"
                    >−</button>
                    <span className="w-5 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                      className="w-6 h-6 rounded-full bg-primary text-white font-bold hover:bg-primary-hover transition flex items-center justify-center text-sm"
                    >+</button>
                    <span className="text-sm font-semibold text-foreground w-14 text-right">
                      ₹{Math.round((item.price * item.quantity) / 100)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill */}
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Item total</span><span>₹{itemTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span><span>₹{effectiveDeliveryFee}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST (5%)</span><span>₹{gst}</span>
              </div>
              {appliedCoupon && appliedCoupon !== "FREEDEL" && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Discount ({appliedCoupon})</span><span>-₹{couponDiscount}</span>
                </div>
              )}
              {appliedCoupon === "FREEDEL" && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Discount (FREEDEL)</span><span>-₹{baseDeliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-foreground pt-2 border-t border-border">
                <span>To Pay</span><span>₹{Math.round(toPay)}</span>
              </div>
            </div>

            <button
              onClick={() => dispatch(clearCart())}
              className="mt-4 w-full text-xs text-red-400 hover:text-red-600 transition"
            >
              🗑 Clear cart
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => promptSignIn("checkout")}
                className="mt-4 w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-sm transition shadow-md shadow-primary/20"
              >
                Sign in to checkout · ₹{Math.round(toPay)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
