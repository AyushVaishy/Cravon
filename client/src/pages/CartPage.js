import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { cartLineKey, groupCartByRestaurant, uniqueRestaurantCount } from "../utils/cartUtils";
import { clearCart, clearRestaurantItems, updateQuantity, removeItem, setCart } from "../store/cartSlice";
import { createOrder, previewOrder } from "../services/orderService";
import { validateCoupon, autoApplyCoupon } from "../services/couponService";
import { getRewards } from "../services/rewardsService";
import { saveCartForLater, getSavedCarts, restoreSavedCart, clearCartApi } from "../services/cartService";
import { getRestaurant } from "../services/restaurantService";
import { addNotification } from "../store/notificationsSlice";
import { getAddresses, addAddress as addAddressAPI } from "../services/addressService";
import { checkServiceability } from "../services/locationService";
import AddressForm, { EMPTY_ADDRESS_FORM } from "../components/AddressForm";
import { validateAddressForm, formToPayload } from "../utils/addressLabels";
import { debouncedSyncCart, mapServerCartToRedux } from "../utils/cartSync";
import {
  FaShoppingCart, FaUtensils, FaMapMarkerAlt, FaCheckCircle, FaPlus, FaTag,
  FaLock, FaClock, FaStore, FaBookmark, FaWallet, FaLayerGroup, FaExchangeAlt,
} from "react-icons/fa";

const PAYMENT_METHODS = [
  { id: "COD", label: "Cash on Delivery" },
  { id: "UPI", label: "UPI (GPay, PhonePe, Paytm)" },
  { id: "CARD", label: "Credit Card" },
  { id: "DEBIT_CARD", label: "Debit Card" },
  { id: "NETBANKING", label: "Net Banking" },
  { id: "WALLET", label: "Cravon Wallet (full pay)" },
];

const TIP_OPTIONS = [0, 20, 50, 100];

const CartPage = () => {
  const cartItems = useSelector((store) => store.cart.items);
  const isAuthenticated = useSelector((store) => store.auth.isAuthenticated) || !!localStorage.getItem("accessToken");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const restaurantGroups = useMemo(() => groupCartByRestaurant(cartItems), [cartItems]);
  const multiRestaurant = uniqueRestaurantCount(cartItems) > 1;

  const [checkoutMode, setCheckoutMode] = useState("together"); // together | separate
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS_FORM);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [restaurantNotes, setRestaurantNotes] = useState("");
  const [contactless, setContactless] = useState(false);
  const [useAltPhone, setUseAltPhone] = useState(false);
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [serviceabilityMsg, setServiceabilityMsg] = useState("");
  const [orderType, setOrderType] = useState("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [scheduledFor, setScheduledFor] = useState("");
  const [tipAmount, setTipAmount] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [billsByRestaurant, setBillsByRestaurant] = useState({});
  const [restaurantMetaById, setRestaurantMetaById] = useState({});
  const [rewards, setRewards] = useState(null);
  const [savedCarts, setSavedCarts] = useState([]);
  const [loadingBill, setLoadingBill] = useState(false);

  // Default active restaurant when groups change
  useEffect(() => {
    if (restaurantGroups.length === 0) {
      setActiveRestaurantId(null);
      return;
    }
    if (!activeRestaurantId || !restaurantGroups.some((g) => g.restaurantId === activeRestaurantId)) {
      setActiveRestaurantId(restaurantGroups[0].restaurantId);
    }
  }, [restaurantGroups, activeRestaurantId]);

  // When only one restaurant, mode doesn't matter; prefer together
  useEffect(() => {
    if (!multiRestaurant) setCheckoutMode("together");
  }, [multiRestaurant]);

  const checkoutGroups = useMemo(() => {
    if (!multiRestaurant || checkoutMode === "together") return restaurantGroups;
    return restaurantGroups.filter((g) => g.restaurantId === activeRestaurantId);
  }, [multiRestaurant, checkoutMode, restaurantGroups, activeRestaurantId]);

  const checkoutItems = useMemo(
    () => checkoutGroups.flatMap((g) => g.items),
    [checkoutGroups]
  );

  const primaryRestaurantId = checkoutGroups[0]?.restaurantId;

  const buildOrderItems = useCallback((items) =>
    items.map((i) => ({
      menuItemId: i.menuItemId || i.id,
      quantity: i.quantity,
      unitPrice: i.price,
      customizations: i.customizations || null,
      itemNotes: i.itemNotes || null,
    })), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    getAddresses()
      .then((res) => {
        const addrs = res.data.addresses || [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) setSelectedAddressId(def.id);
        else setShowNewForm(true);
      })
      .catch(() => setShowNewForm(true));
    getRewards().then((r) => setRewards(r.data)).catch(() => {});
    getSavedCarts().then((r) => setSavedCarts(r.data.savedCarts || [])).catch(() => {});
  }, [isAuthenticated]);

  const restaurantIdsKey = useMemo(
    () => restaurantGroups.map((g) => g.restaurantId).filter(Boolean).join(","),
    [restaurantGroups]
  );

  // Load meta for every restaurant in cart
  useEffect(() => {
    if (!restaurantIdsKey) return;
    let cancelled = false;
    restaurantIdsKey.split(",").forEach((id) => {
      getRestaurant(id)
        .then((r) => {
          if (cancelled) return;
          const meta = r.data.restaurant || r.data;
          setRestaurantMetaById((prev) => (prev[id] ? prev : { ...prev, [id]: meta }));
        })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [restaurantIdsKey]);

  // Bill preview per checkout restaurant
  useEffect(() => {
    if (!isAuthenticated || checkoutGroups.length === 0) {
      setBillsByRestaurant({});
      return;
    }
    let cancelled = false;
    setLoadingBill(true);

    Promise.all(
      checkoutGroups.map(async (group, index) => {
        try {
          const res = await previewOrder({
            items: buildOrderItems(group.items),
            restaurantId: group.restaurantId,
            couponCode: index === 0 ? appliedCoupon || undefined : undefined,
            orderType,
            tipAmount: index === 0 ? tipAmount * 100 : 0,
            useWallet: index === 0 ? useWallet : false,
            loyaltyPointsToRedeem: index === 0 ? loyaltyPointsToRedeem : 0,
          });
          return [group.restaurantId, res.data.bill];
        } catch (err) {
          if (err?.response?.data?.message?.includes("Minimum")) {
            toast.error(`${group.restaurantName}: ${err.response.data.message}`);
          }
          return [group.restaurantId, null];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setBillsByRestaurant(Object.fromEntries(entries));
    }).finally(() => {
      if (!cancelled) setLoadingBill(false);
    });

    return () => { cancelled = true; };
  }, [
    isAuthenticated, checkoutGroups, appliedCoupon, orderType, tipAmount,
    useWallet, loyaltyPointsToRedeem, buildOrderItems,
  ]);

  useEffect(() => {
    if (isAuthenticated && cartItems.length > 0) {
      debouncedSyncCart(cartItems, cartItems[0]?.restaurantId);
    }
  }, [cartItems, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || orderType !== "DELIVERY" || !selectedAddressId || checkoutItems.length === 0) {
      setServiceabilityMsg("");
      return;
    }
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr?.lat || !addr?.lng || (addr.lat === 0 && addr.lng === 0)) return;

    // Check serviceability for all restaurants being checked out
    Promise.all(
      checkoutGroups.map((g) =>
        checkServiceability({ restaurantId: g.restaurantId, lat: addr.lat, lng: addr.lng })
          .then((res) => ({ name: g.restaurantName, ...res.data }))
          .catch(() => ({ name: g.restaurantName, serviceable: true }))
      )
    ).then((results) => {
      const bad = results.filter((r) => !r.serviceable);
      if (bad.length === 0) setServiceabilityMsg("");
      else setServiceabilityMsg(bad.map((r) => `${r.name}: ${r.message || "Not serviceable"}`).join(" · "));
    });
  }, [isAuthenticated, selectedAddressId, savedAddresses, checkoutGroups, checkoutItems.length, orderType]);

  const promptSignIn = () => {
    sessionStorage.setItem("auth_return_to", "/home/cart");
    window.dispatchEvent(new Event("openSignIn"));
    toast("Sign in to continue checkout", { icon: "🔐" });
  };

  const handleSaveNewAddress = async () => {
    const err = validateAddressForm(newAddress, savedAddresses);
    if (err) { toast.error(err); return; }
    setSavingAddress(true);
    try {
      const res = await addAddressAPI({ ...formToPayload(newAddress), isDefault: savedAddresses.length === 0 });
      const added = res.data.address;
      setSavedAddresses((prev) => [...prev, added]);
      setSelectedAddressId(added.id);
      setShowNewForm(false);
      setNewAddress(EMPTY_ADDRESS_FORM);
      toast.success("Address saved!");
    } catch {
      toast.error("Failed to save address");
    }
    setSavingAddress(false);
  };

  const getDeliveryAddress = () => {
    if (selectedAddressId) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) return `${addr.street}, ${addr.city}, ${addr.state} ${addr.pincode}`.trim();
    }
    return "";
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code || !isAuthenticated || !primaryRestaurantId) return;
    try {
      const itemSubtotal = checkoutItems.reduce((a, i) => a + i.price * i.quantity, 0);
      await validateCoupon({ code, restaurantId: primaryRestaurantId, itemSubtotal, orderType });
      setAppliedCoupon(code);
      setCouponError("");
      setCouponInput("");
      toast.success("Coupon applied!");
    } catch (err) {
      setCouponError(err?.response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
    }
  };

  const handleAutoApply = async () => {
    if (!isAuthenticated || !primaryRestaurantId) return;
    try {
      const itemSubtotal = checkoutItems.reduce((a, i) => a + i.price * i.quantity, 0);
      const res = await autoApplyCoupon({ restaurantId: primaryRestaurantId, itemSubtotal, orderType });
      if (res.data.coupon) {
        setAppliedCoupon(res.data.coupon.code);
        setCouponError("");
        toast.success(`Best coupon applied: ${res.data.coupon.code}`);
      } else {
        toast("No applicable coupons found");
      }
    } catch {
      toast.error("Could not auto-apply coupon");
    }
  };

  const handleSaveForLater = async () => {
    if (!isAuthenticated) { promptSignIn(); return; }
    try {
      await saveCartForLater();
      dispatch(clearCart());
      toast.success("Cart saved for later!");
      const res = await getSavedCarts();
      setSavedCarts(res.data.savedCarts || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save cart");
    }
  };

  const handleRestoreSaved = async (id) => {
    try {
      const res = await restoreSavedCart(id);
      dispatch(setCart(mapServerCartToRedux(res.data.cart)));
      toast.success("Cart restored!");
    } catch {
      toast.error("Failed to restore cart");
    }
  };

  const handleClearCart = async () => {
    dispatch(clearCart());
    if (isAuthenticated) clearCartApi().catch(() => {});
  };

  const placeOneOrder = async (group, extras = {}) => {
    const items = buildOrderItems(group.items);
    const payload = {
      items,
      restaurantId: group.restaurantId,
      notes: suggestion.trim() || undefined,
      restaurantNotes: restaurantNotes.trim() || undefined,
      contactless,
      orderType,
      paymentMethod,
      scheduledFor: scheduledFor || undefined,
      couponCode: extras.couponCode,
      tipAmount: extras.tipAmount ?? 0,
      useWallet: extras.useWallet ?? false,
      loyaltyPointsToRedeem: extras.loyaltyPointsToRedeem ?? 0,
    };

    if (orderType === "DELIVERY" && selectedAddressId) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      payload.addressId = selectedAddressId;
      payload.deliveryLat = addr?.lat;
      payload.deliveryLng = addr?.lng;
      payload.deliveryAddress = getDeliveryAddress();
      if (useAltPhone && deliveryPhone.trim()) {
        payload.deliveryPhone = deliveryPhone.trim();
      } else if (addr?.contactPhone) {
        payload.deliveryPhone = addr.contactPhone;
      }
    }

    return createOrder(payload);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) { promptSignIn(); return; }
    if (orderType === "DELIVERY" && !getDeliveryAddress()) {
      toast.error("Please select a delivery address");
      return;
    }
    if (useAltPhone && !/^\d{10}$/.test(deliveryPhone.trim())) {
      toast.error("Enter a valid 10-digit alternate phone");
      return;
    }

    for (const group of checkoutGroups) {
      const bill = billsByRestaurant[group.restaurantId];
      const meta = restaurantMetaById[group.restaurantId];
      const groupMin = meta?.minOrderAmount ?? 9900;
      const subtotal = bill?.itemSubtotal ?? group.items.reduce((a, i) => a + i.price * i.quantity, 0);
      if (subtotal < groupMin) {
        toast.error(`${group.restaurantName}: minimum order is ₹${Math.ceil(groupMin / 100)}`);
        return;
      }
    }

    const combinedTotal = Object.values(billsByRestaurant).reduce(
      (sum, b) => sum + (b?.totalAmount || 0),
      0
    );
    if (paymentMethod === "WALLET" && combinedTotal > 0) {
      toast.error("Insufficient wallet balance for full payment");
      return;
    }

    setPlacing(true);
    try {
      const orderIds = [];
      for (let i = 0; i < checkoutGroups.length; i++) {
        const group = checkoutGroups[i];
        const isFirst = i === 0;
        const res = await placeOneOrder(group, {
          couponCode: isFirst ? appliedCoupon || undefined : undefined,
          tipAmount: isFirst ? tipAmount * 100 : 0,
          useWallet: isFirst ? useWallet : false,
          loyaltyPointsToRedeem: isFirst ? loyaltyPointsToRedeem : 0,
        });
        orderIds.push(res.data.order.id);
        dispatch(clearRestaurantItems(group.restaurantId));
      }

      const remaining = cartItems.filter(
        (i) => !checkoutGroups.some((g) => g.restaurantId === i.restaurantId)
      );
      if (remaining.length === 0 && isAuthenticated) {
        clearCartApi().catch(() => {});
      }

      const multi = orderIds.length > 1;
      dispatch(addNotification({
        title: multi ? "Orders Placed! 🎉" : "Order Placed! 🎉",
        message: multi
          ? `${orderIds.length} orders placed from different restaurants.`
          : orderType === "PICKUP"
            ? "Your pickup order is confirmed."
            : remaining.length > 0
              ? "Order placed. Other restaurants are still in your cart."
              : "Your order has been placed successfully.",
        type: "PLACED",
        orderId: orderIds[0],
      }));

      if (remaining.length > 0) {
        toast.success("🎉 Order placed! Other restaurants remain in your cart.");
        setAppliedCoupon(null);
        setTipAmount(0);
        setUseWallet(false);
        setLoyaltyPointsToRedeem(0);
      } else {
        toast.success(
          multi
            ? `🎉 ${orderIds.length} orders placed successfully!`
            : "🎉 Order placed successfully!"
        );
        navigate("/home/orders");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    }
    setPlacing(false);
  };

  const updateQty = (item, delta) => {
    const key = cartLineKey(item);
    const meta = restaurantMetaById[item.restaurantId];
    const itemMax = meta?.maxItemQuantity ?? 10;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      dispatch(removeItem(key));
      return;
    }
    if (newQty > itemMax) {
      toast.error(`Maximum ${itemMax} per item`);
      return;
    }
    dispatch(updateQuantity({ lineKey: key, quantity: newQty, maxQty: itemMax }));
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="w-full px-6 md:px-8 py-10 md:py-16 text-center">
          <div className="w-28 h-28 bg-[#FF5A5F]/10 rounded-full mx-auto flex items-center justify-center mb-6">
            <FaShoppingCart className="text-5xl text-[#FF5A5F]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Your Cart is Empty</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">Add some delicious food to get started!</p>
          {savedCarts.length > 0 && (
            <div className="max-w-md mx-auto mb-8 text-left">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><FaBookmark /> Saved carts</h3>
              {savedCarts.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleRestoreSaved(sc.id)}
                  className="w-full text-left p-3 mb-2 rounded-xl border border-border hover:border-primary transition text-sm"
                >
                  {(Array.isArray(sc.items) ? sc.items : []).length} items · {new Date(sc.savedAt).toLocaleDateString()}
                </button>
              ))}
            </div>
          )}
          <Link to="/home" className="inline-flex items-center gap-2 bg-[#FF5A5F] hover:bg-[#E0484D] text-white px-8 py-3 rounded-full font-bold transition-all">
            <FaUtensils /> Explore Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const combinedBill = Object.values(billsByRestaurant).filter(Boolean);
  const itemTotal = combinedBill.length
    ? combinedBill.reduce((s, b) => s + b.itemSubtotal, 0) / 100
    : checkoutItems.reduce((a, i) => a + i.price * i.quantity, 0) / 100;
  const toPay = combinedBill.length
    ? combinedBill.reduce((s, b) => s + b.totalAmount, 0) / 100
    : itemTotal;

  const belowMin = checkoutGroups.some((g) => {
    const bill = billsByRestaurant[g.restaurantId];
    const meta = restaurantMetaById[g.restaurantId];
    const groupMin = meta?.minOrderAmount ?? 9900;
    const sub = bill?.itemSubtotal ?? g.items.reduce((a, i) => a + i.price * i.quantity, 0);
    return sub < groupMin;
  });

  const placeLabel =
    multiRestaurant && checkoutMode === "together"
      ? `Place ${checkoutGroups.length} Orders · ₹${Math.round(toPay)}`
      : `Place Order · ₹${Math.round(toPay)}`;

  return (
    <div className="min-h-screen">
      <div className="w-full px-6 md:px-8 py-6 md:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 space-y-6">
          {!isAuthenticated ? (
            <div className="bg-white/90 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-sm border border-border/80 p-8 text-center">
              <FaLock className="text-primary text-2xl mx-auto mb-4" />
              <h2 className="text-xl font-extrabold mb-2">Sign in to checkout</h2>
              <p className="text-sm text-muted-foreground mb-6">Your cart is saved locally.</p>
              <button onClick={promptSignIn} className="bg-primary text-white px-6 py-3 rounded-xl font-bold">Sign in</button>
            </div>
          ) : (
            <>
              {multiRestaurant && (
                <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/5 p-6">
                  <h2 className="font-bold text-lg mb-2">Checkout options</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    You have items from {restaurantGroups.length} restaurants. Choose how to place orders.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutMode("together")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                        checkoutMode === "together" ? "border-primary bg-primary/5 text-primary" : "border-border"
                      }`}
                    >
                      <FaLayerGroup size={14} /> Checkout together
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutMode("separate")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                        checkoutMode === "separate" ? "border-primary bg-primary/5 text-primary" : "border-border"
                      }`}
                    >
                      <FaExchangeAlt size={14} /> Checkout separately
                    </button>
                  </div>
                  {checkoutMode === "together" && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Places one order per restaurant in a single step. Tip, wallet & coupon apply to the first restaurant.
                    </p>
                  )}
                  {checkoutMode === "separate" && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">Select which restaurant to checkout now:</p>
                      {restaurantGroups.map((g) => (
                        <label
                          key={g.restaurantId}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${
                            activeRestaurantId === g.restaurantId ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <input
                            type="radio"
                            name="activeRest"
                            checked={activeRestaurantId === g.restaurantId}
                            onChange={() => setActiveRestaurantId(g.restaurantId)}
                            className="accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{g.restaurantName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {g.items.reduce((s, i) => s + i.quantity, 0)} items · ₹
                              {Math.round(g.items.reduce((s, i) => s + i.price * i.quantity, 0) / 100)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/5 p-6">
                <h2 className="font-bold text-lg mb-4">Order type</h2>
                <div className="flex gap-3">
                  {[
                    { id: "DELIVERY", label: "Delivery", Icon: FaMapMarkerAlt },
                    { id: "PICKUP", label: "Pickup", Icon: FaStore },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOrderType(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                        orderType === id ? "border-primary bg-primary/5 text-primary" : "border-border"
                      }`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/5 p-6">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><FaClock /> Schedule for later (optional)</h3>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-section"
                />
              </div>

              {orderType === "DELIVERY" && (
                <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/5 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg flex items-center gap-2"><FaMapMarkerAlt className="text-primary" /> Delivery Address</h2>
                    <button onClick={() => setShowNewForm((v) => !v)} className="text-xs text-primary font-semibold flex items-center gap-1">
                      <FaPlus size={10} /> Add New
                    </button>
                  </div>
                  {savedAddresses.map((addr) => (
                    <label key={addr.id} className={`flex items-start gap-3 p-3 mb-2 rounded-lg border-2 cursor-pointer ${selectedAddressId === addr.id ? "border-primary bg-muted" : "border-border"}`}>
                      <input type="radio" checked={selectedAddressId === addr.id} onChange={() => { setSelectedAddressId(addr.id); setShowNewForm(false); }} className="mt-1 accent-primary" />
                      <div>
                        <p className="font-semibold text-sm">{addr.label}</p>
                        <p className="text-xs text-muted-foreground">{addr.street}, {addr.city}</p>
                      </div>
                    </label>
                  ))}
                  {showNewForm && (
                    <AddressForm title="New address" value={newAddress} onChange={setNewAddress} onSubmit={handleSaveNewAddress}
                      onCancel={() => setShowNewForm(false)} submitLabel="Save" saving={savingAddress} existingAddresses={savedAddresses} />
                  )}
                </div>
              )}

              {orderType === "PICKUP" && checkoutGroups.map((g) => {
                const meta = restaurantMetaById[g.restaurantId];
                if (!meta) return null;
                return (
                  <div key={g.restaurantId} className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6 text-sm">
                    <p className="font-semibold mb-1">Pickup from</p>
                    <p className="text-muted-foreground">{meta.name}</p>
                    <p className="text-muted-foreground">{meta.address}, {meta.city}</p>
                  </div>
                );
              })}

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6 space-y-3">
                <h3 className="font-semibold text-sm">Delivery options</h3>
                {orderType === "DELIVERY" && (
                  <label className="flex items-center gap-3 cursor-pointer text-sm">
                    <input type="checkbox" checked={contactless} onChange={(e) => setContactless(e.target.checked)} className="accent-primary" />
                    Contactless delivery
                  </label>
                )}
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input type="checkbox" checked={useAltPhone} onChange={(e) => setUseAltPhone(e.target.checked)} className="accent-primary" />
                  Alternate phone for delivery
                </label>
                {useAltPhone && (
                  <input type="tel" placeholder="10-digit mobile" value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                )}
              </div>

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6 space-y-3">
                <input type="text" placeholder="Cooking instructions (e.g. less spicy)" value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input type="text" placeholder="Restaurant instructions (e.g. extra napkins)" value={restaurantNotes}
                  onChange={(e) => setRestaurantNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6">
                <h3 className="font-semibold text-sm mb-3">Tip delivery partner</h3>
                <div className="flex gap-2 flex-wrap">
                  {TIP_OPTIONS.map((t) => (
                    <button key={t} type="button" onClick={() => setTipAmount(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tipAmount === t ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                      {t === 0 ? "No tip" : `₹${t}`}
                    </button>
                  ))}
                </div>
                {multiRestaurant && checkoutMode === "together" && tipAmount > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">Tip is applied to the first restaurant order.</p>
                )}
              </div>

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><FaTag className="text-primary" /> Coupons</h3>
                  <div className="flex gap-2">
                    <button onClick={handleAutoApply} className="text-xs text-primary font-semibold">Auto-apply best</button>
                    <Link to="/home/offers" className="text-xs text-primary font-semibold">Browse offers</Link>
                  </div>
                </div>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Coupon code" value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase" />
                    <button onClick={handleApplyCoupon} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">Apply</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-300 rounded-lg px-3 py-2">
                    <span className="text-green-700 text-sm font-semibold flex items-center gap-2"><FaCheckCircle /> {appliedCoupon} applied</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-muted-foreground hover:text-red-500">×</button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                {multiRestaurant && checkoutMode === "together" && (
                  <p className="text-[11px] text-muted-foreground mt-2">Coupon applies to the first restaurant in checkout.</p>
                )}
              </div>

              {rewards && (
                <div className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><FaWallet /> Wallet & Loyalty</h3>
                  <p className="text-xs text-muted-foreground">Wallet: ₹{(rewards.walletBalance / 100).toFixed(0)} · Points: {rewards.loyaltyPoints}</p>
                  {rewards.walletBalance > 0 && paymentMethod !== "WALLET" && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="accent-primary" />
                      Use wallet balance
                    </label>
                  )}
                  {rewards.loyaltyPoints >= 100 && (
                    <div className="flex items-center gap-2">
                      <select value={loyaltyPointsToRedeem} onChange={(e) => setLoyaltyPointsToRedeem(Number(e.target.value))}
                        className="border rounded-lg px-2 py-1 text-sm flex-1">
                        <option value={0}>No loyalty redemption</option>
                        {[100, 200, 300].filter((p) => p <= rewards.loyaltyPoints).map((p) => (
                          <option key={p} value={p}>{p} pts = ₹{p / 2} off</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white/60 dark:bg-[#1A1A1A]/60 rounded-3xl border p-6">
                <h2 className="font-bold text-lg mb-4">Payment method</h2>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <label key={pm.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${paymentMethod === pm.id ? "border-primary bg-muted" : "border-border"}`}>
                      <input type="radio" name="payment" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className="accent-primary" />
                      <span className="text-sm font-medium">{pm.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="mt-4 w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white py-3 rounded-xl font-bold"
                  onClick={handlePlaceOrder}
                  disabled={placing || belowMin || (orderType === "DELIVERY" && (!selectedAddressId || Boolean(serviceabilityMsg))) || loadingBill}
                >
                  {placing ? "Placing…" : placeLabel}
                </button>
                {belowMin && <p className="text-red-500 text-xs mt-2">One or more restaurants are below their minimum order amount</p>}
                {serviceabilityMsg && <p className="text-red-500 text-sm mt-2">{serviceabilityMsg}</p>}
                {multiRestaurant && checkoutMode === "separate" && restaurantGroups.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Other restaurants stay in your cart after this order.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl rounded-3xl border p-6 sticky top-6 space-y-5">
            {restaurantGroups.map((group) => {
              const meta = restaurantMetaById[group.restaurantId];
              const bill = billsByRestaurant[group.restaurantId];
              const isCheckoutTarget =
                !multiRestaurant ||
                checkoutMode === "together" ||
                group.restaurantId === activeRestaurantId;
              const groupMax = meta?.maxItemQuantity ?? 10;
              const groupMin = meta?.minOrderAmount ?? 9900;

              return (
                <div
                  key={group.restaurantId}
                  className={`rounded-2xl border p-4 ${
                    isCheckoutTarget ? "border-primary/40 bg-primary/5" : "border-border opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
                    <img
                      src={group.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80"}
                      alt=""
                      className="w-11 h-11 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate">{group.restaurantName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Max {groupMax}/item · Min ₹{Math.ceil(groupMin / 100)}
                        {!isCheckoutTarget && " · Not in this checkout"}
                      </div>
                    </div>
                    <Link
                      to={`/home/restaurants/${group.restaurantId}`}
                      className="text-[10px] text-primary font-semibold whitespace-nowrap"
                    >
                      Menu
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {group.items.map((item) => (
                      <div key={cartLineKey(item)} className="flex justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm line-clamp-1 block">{item.name}</span>
                          {item.customizationLabel && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1">{item.customizationLabel}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(item, -1)} className="w-6 h-6 rounded-full bg-muted text-sm">−</button>
                          <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQty(item, 1)} className="w-6 h-6 rounded-full bg-primary text-white text-sm">+</button>
                          <span className="text-sm font-semibold w-14 text-right">₹{Math.round((item.price * item.quantity) / 100)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {bill && isCheckoutTarget && (
                    <div className="border-t border-border/60 mt-3 pt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Items</span><span>₹{(bill.itemSubtotal / 100).toFixed(0)}</span></div>
                      {bill.deliveryFeeAmount > 0 && orderType === "DELIVERY" && (
                        <div className="flex justify-between"><span>Delivery</span><span>₹{(bill.deliveryFeeAmount / 100).toFixed(0)}</span></div>
                      )}
                      {bill.discountAmount > 0 && (
                        <div className="flex justify-between text-red-500"><span>Discount</span><span>-₹{(bill.discountAmount / 100).toFixed(0)}</span></div>
                      )}
                      <div className="flex justify-between font-semibold text-foreground pt-1">
                        <span>Subtotal</span><span>₹{Math.round(bill.totalAmount / 100)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {combinedBill.length > 0 && (
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Item total</span><span>₹{itemTotal.toFixed(0)}</span></div>
                {combinedBill.reduce((s, b) => s + (b.packagingFee || 0), 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Packaging</span>
                    <span>₹{(combinedBill.reduce((s, b) => s + b.packagingFee, 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                {combinedBill.reduce((s, b) => s + (b.platformFee || 0), 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform fee</span>
                    <span>₹{(combinedBill.reduce((s, b) => s + b.platformFee, 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                {orderType === "DELIVERY" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery fee</span>
                    <span>₹{(combinedBill.reduce((s, b) => s + (b.deliveryFeeAmount || 0), 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST</span>
                  <span>₹{(combinedBill.reduce((s, b) => s + (b.gstAmount || 0), 0) / 100).toFixed(0)}</span>
                </div>
                {combinedBill.reduce((s, b) => s + (b.tipAmount || 0), 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tip</span>
                    <span>₹{(combinedBill.reduce((s, b) => s + b.tipAmount, 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                {combinedBill.reduce((s, b) => s + (b.discountAmount || 0), 0) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
                    <span>-₹{(combinedBill.reduce((s, b) => s + b.discountAmount, 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                {combinedBill.reduce((s, b) => s + (b.walletUsed || 0), 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Wallet used</span>
                    <span>-₹{(combinedBill.reduce((s, b) => s + b.walletUsed, 0) / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>To Pay{multiRestaurant && checkoutMode === "together" ? " (all)" : ""}</span>
                  <span>₹{Math.round(toPay)}</span>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground">Sign in to see full bill breakdown</p>
            )}

            <div className="flex gap-2">
              <button onClick={handleSaveForLater} className="flex-1 text-xs py-2 border border-border rounded-lg hover:border-primary transition">
                <FaBookmark className="inline mr-1" /> Save for later
              </button>
              <button onClick={handleClearCart} className="flex-1 text-xs py-2 text-red-400 hover:text-red-600">Clear cart</button>
            </div>
            {!isAuthenticated && (
              <button onClick={promptSignIn} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm">
                Sign in · ₹{Math.round(toPay)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
