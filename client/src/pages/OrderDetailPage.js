import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { getOrder, cancelOrder, createReview as createReviewService, rateMenuItems } from "../services/orderService";
import { addItem, clearCart } from "../store/cartSlice";
import { addNotification } from "../store/notificationsSlice";
import { FaArrowLeft, FaStar, FaMapMarkerAlt, FaBoxOpen, FaMotorcycle, FaPhoneAlt } from "react-icons/fa";
import { MdDeliveryDining } from "react-icons/md";
import DeliveryMap from "../components/DeliveryMap";

const STEPS = [
  { key: "PLACED",           label: "Order Placed",  icon: "📋" },
  { key: "CONFIRMED",        label: "Confirmed",      icon: "✅" },
  { key: "PREPARING",        label: "Preparing",      icon: "👨‍🍳" },
  { key: "OUT_FOR_DELIVERY", label: "On the Way",     icon: "🛵" },
  { key: "DELIVERED",        label: "Delivered",      icon: "🎉" },
];

const STATUS_COLORS = {
  PLACED:           "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONFIRMED:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  PREPARING:        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  OUT_FOR_DELIVERY: "bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary",
  DELIVERED:        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const STATUS_LABELS = {
  PLACED: "Order Placed", CONFIRMED: "Confirmed", PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

const STATUS_MESSAGES = {
  PLACED:           "Waiting for restaurant to confirm your order…",
  CONFIRMED:        "Great! Restaurant accepted your order 🎉",
  PREPARING:        "Your food is being freshly prepared 👨‍🍳",
  OUT_FOR_DELIVERY: "Your delivery partner is on the way! 🛵",
  DELIVERED:        "Enjoy your meal! 😋",
};

const DELIVERY_DURATION_MS = 120000; // 2 minutes

// ─── Star Rating Picker ───────────────────────────────────────────────────────
const StarPicker = ({ value, onChange, size = 24 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} className="focus:outline-none">
        <FaStar
          size={size}
          className={`transition-colors ${n <= value ? "text-yellow-400" : "text-muted-foreground"}`}
        />
      </button>
    ))}
  </div>
);

// ─── Review Form ─────────────────────────────────────────────────────────────
const ReviewForm = ({ restaurantId, restaurantName, items = [], onReviewed }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [itemRatings, setItemRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dishes = [];
  const seen = new Set();
  items.forEach((line) => {
    const id = line.menuItemId || line.menuItem?.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    dishes.push({ id, name: line.menuItem?.name || "Item" });
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      await createReviewService(restaurantId, { rating, comment });
      const dishRatings = dishes
        .filter((dish) => itemRatings[dish.id] > 0)
        .map((dish) => ({ menuItemId: dish.id, rating: itemRatings[dish.id] }));
      if (dishRatings.length > 0) await rateMenuItems(dishRatings);
      toast.success("Review submitted! Thank you 🙏");
      setSubmitted(true);
      if (onReviewed) onReviewed({ rating, comment });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    }
    setSubmitting(false);
  };

  if (submitted)
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Review submitted!</p>
          <p className="text-xs text-green-600 dark:text-green-500">You rated {restaurantName} {rating}★</p>
        </div>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold text-foreground">Rate your experience at {restaurantName}</h3>
      <StarPicker value={rating} onChange={setRating} />
      {dishes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Rate the dishes</p>
          {dishes.map((dish) => (
            <div key={dish.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground truncate">{dish.name}</span>
              <StarPicker
                size={16}
                value={itemRatings[dish.id] || 0}
                onChange={(n) => setItemRatings((prev) => ({ ...prev, [dish.id]: n }))}
              />
            </div>
          ))}
        </div>
      )}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share what you loved (optional)…"
        rows={3}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
      />
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="px-5 py-2 bg-primary/50 hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg font-semibold text-sm transition"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
};

// ─── Progress Tracker ─────────────────────────────────────────────────────────
const ProgressTracker = ({ status }) => {
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="relative px-2">
      {/* Connecting line background */}
      <div className="absolute top-5 left-7 right-7 h-0.5 bg-muted" />
      {/* Connecting line fill */}
      <div
        className="absolute top-5 left-7 h-0.5 bg-primary/50 transition-all duration-700"
        style={{ width: currentIdx >= 0 ? `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 14px)` : "0%" }}
      />
      <div className="relative flex justify-between">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 z-10 transition-all ${
                done
                  ? "bg-primary/50 border-primary shadow-md shadow-primary/20 dark:shadow-primary/30"
                  : "bg-card border-border"
              } ${active ? "scale-110 ring-4 ring-primary/20 dark:ring-primary/10" : ""}`}
              >
                {step.icon}
              </div>
              <span className={`text-[10px] text-center font-medium leading-tight ${
                done ? "text-primary" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Live Tracking Card ───────────────────────────────────────────────────────
const LiveTrackingCard = ({ order }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!order || ["DELIVERED", "CANCELLED"].includes(order.status)) return;
    const createdAt = new Date(order.createdAt).getTime();
    const eta = createdAt + DELIVERY_DURATION_MS;
    const tick = () => setTimeLeft(Math.max(0, eta - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order]);

  if (!order || order.status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <span className="text-2xl">❌</span>
        <div>
          <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
          <p className="text-xs text-red-500">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  if (order.status === "DELIVERED") {
    return (
      <div className="text-center py-6 px-4">
        <div className="text-5xl mb-3">🎉</div>
        <p className="text-xl font-bold text-green-600 dark:text-green-400">Order Delivered!</p>
        <p className="text-sm text-muted-foreground mt-1">Hope you enjoyed your meal 😋</p>
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const isArriving = order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="space-y-5">
      {/* Delivery Map */}
      {['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status) && (
        <DeliveryMap order={order} status={order.status} />
      )}
      {/* ETA Banner */}
      <div className={`rounded-xl p-4 text-center ${isArriving ? "bg-primary/5 dark:bg-primary/10" : "bg-blue-50 dark:bg-blue-900/20"}`}>
        {timeLeft > 0 ? (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {isArriving ? "Arriving in" : "Estimated Delivery"}
            </p>
            <p className={`text-4xl font-extrabold tabular-nums ${isArriving ? "text-primary" : "text-blue-600 dark:text-blue-400"}`}>
              {mins}:{secs.toString().padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">minutes</p>
          </>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">Delivery imminent…</p>
        )}
      </div>

      {/* Status message */}
      <p className="text-center text-sm text-muted-foreground font-medium">
        {STATUS_MESSAGES[order.status]}
      </p>

      {/* Progress steps */}
      <ProgressTracker status={order.status} />

      {/* Dummy delivery partner (only when out for delivery) */}
      {order.status === "OUT_FOR_DELIVERY" && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MdDeliveryDining size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Raju Kumar</p>
            <p className="text-xs text-muted-foreground">Delivery Partner · ⭐ 4.8</p>
          </div>
          <button className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition">
            <FaPhoneAlt size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Notification messages for status changes ─────────────────────────────────
const STATUS_NOTIF_MESSAGES = {
  CONFIRMED:        { title: "Order Confirmed! 🎉", message: "The restaurant has confirmed your order." },
  PREPARING:        { title: "Being Prepared 🍳",   message: "Your food is being freshly prepared." },
  OUT_FOR_DELIVERY: { title: "Out for Delivery! 🚚", message: "Your order is on the way." },
  DELIVERED:        { title: "Order Delivered! 🎉",  message: "Enjoy your meal! Don't forget to rate." },
  CANCELLED:        { title: "Order Cancelled",      message: "Your order has been cancelled." },
};

// ─── OrderDetailPage ─────────────────────────────────────────────────────────
const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const prevStatusRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(() => {
    return getOrder(orderId)
      .then((res) => {
        const newOrder = res.data.order;
        setOrder(newOrder);
        if (prevStatusRef.current && newOrder.status !== prevStatusRef.current) {
          const msg = STATUS_NOTIF_MESSAGES[newOrder.status];
          if (msg) {
            dispatch(addNotification({
              ...msg,
              type: newOrder.status,
              orderId: newOrder.id,
            }));
          }
        }
        prevStatusRef.current = newOrder.status;
      })
      .catch(() => toast.error("Failed to load order"));
  }, [orderId, dispatch]);

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  // Poll every 8s while order is active
  useEffect(() => {
    if (!order || ["DELIVERED", "CANCELLED"].includes(order.status)) return;
    const interval = setInterval(() => {
      getOrder(orderId)
        .then((res) => setOrder(res.data.order))
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [orderId, order?.status]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      setOrder((o) => ({ ...o, status: "CANCELLED" }));
      toast.success("Order cancelled successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot cancel this order");
    }
    setCancelling(false);
  };

  const handleReorder = () => {
    if (!order) return;
    dispatch(clearCart());
    order.items.forEach((item) => {
      if (item.menuItem) {
        dispatch(addItem({
          id: item.menuItemId,
          name: item.menuItem.name,
          price: item.menuItem.price || item.priceAtTime,
          isVeg: item.menuItem.isVeg ?? true,
          restaurantId: order.restaurantId,
          restaurantName: order.restaurant?.name || "",
          imageUrl: item.menuItem.imageUrl || "",
          quantity: item.quantity,
        }));
      }
    });
    toast.success("Items added to cart!");
    navigate("/home/cart");
  };

  if (loading)
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading order…</div>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <FaBoxOpen size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/home/orders" className="text-primary hover:underline text-sm">← Back to Orders</Link>
      </div>
    );

  const itemTotal = order.items.reduce((s, i) => s + (i.priceAtTime || 0) * (i.quantity || 1), 0) / 100;
  const deliveryFee = 29;
  const gst = Math.round(itemTotal * 0.05);
  const deliveryAddress = order.notes || order.deliveryAddress || "";

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition">
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-foreground">Order Details</h1>
            <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {/* Restaurant */}
        <div className="bg-card rounded-xl shadow border border-border p-4">
          <Link to={`/home/restaurants/${order.restaurantId}`} className="flex items-center gap-3 hover:opacity-80 transition">
            <img
              src={order.restaurant?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop"}
              alt="" className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <p className="font-bold text-foreground">{order.restaurant?.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </Link>
        </div>

        {/* Live Tracking Card */}
        <div className="bg-card rounded-xl shadow border border-border p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <FaMotorcycle className="text-primary" /> Live Tracking
          </h2>
          <LiveTrackingCard order={order} />
        </div>

        {/* Delivery Address */}
        {deliveryAddress && (
          <div className="bg-card rounded-xl shadow border border-border p-4">
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-primary flex-shrink-0 mt-0.5" size={14} />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Delivery Address</p>
                <p className="text-sm text-foreground">{deliveryAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-card rounded-xl shadow border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-bold text-foreground">Order Items</h2>
          </div>
          <div className="divide-y divide-border">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.menuItem?.imageUrl && (
                    <img src={item.menuItem.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.menuItem?.name || "Item"}
                    </p>
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-4">
                  ₹{Math.round((item.priceAtTime * item.quantity) / 100)}
                </span>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div className="border-t border-border px-4 py-3 bg-card/60 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Item total</span><span>₹{itemTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fee</span><span>₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST (5%)</span><span>₹{gst}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
              <span>Total Paid</span><span>₹{Math.round(order.totalAmount / 100)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {["PLACED", "CONFIRMED"].includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-2.5 border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-semibold text-sm transition disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          )}
          {["DELIVERED", "CANCELLED"].includes(order.status) && (
            <button
              onClick={handleReorder}
              className="flex-1 py-2.5 bg-primary/50 hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition shadow"
            >
              🔄 Reorder
            </button>
          )}
        </div>

        {/* Review (only after delivery) */}
        {order.status === "DELIVERED" && (
          <div className="bg-card rounded-xl shadow border border-border p-5">
            <ReviewForm
              restaurantId={order.restaurantId}
              restaurantName={order.restaurant?.name}
              items={order.items}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
