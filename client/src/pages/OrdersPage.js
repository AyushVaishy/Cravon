import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getOrders, cancelOrder } from "../services/orderService";
import { addItem, clearCart } from "../store/cartSlice";
import { FaBoxOpen, FaUtensils } from "react-icons/fa";
import toast from "react-hot-toast";

const ORDERS_PER_PAGE = 5;

const STATUS_COLORS = {
  PLACED:           "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONFIRMED:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  PREPARING:        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  OUT_FOR_DELIVERY: "bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary",
  DELIVERED:        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS = {
  PLACED:           "Order Placed",
  CONFIRMED:        "Confirmed",
  PREPARING:        "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const handleReorder = (order) => {
    dispatch(clearCart());
    order.items.forEach((item) => {
      if (item.menuItem) {
        dispatch(addItem({
          id: item.menuItemId,
          name: item.menuItem.name,
          price: item.menuItem.price || item.priceAtTime,
          isVeg: item.menuItem.isVeg ?? true,
          restaurantId: order.restaurantId,
          restaurantName: order.restaurant?.name || '',
          imageUrl: item.menuItem.imageUrl || '',
          quantity: item.quantity,
        }));
      }
    });
    toast.success('Items added to cart!');
    navigate('/home/cart');
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    }
    setCancelling(null);
  };

  if (loading)
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-lg animate-pulse">Loading orders…</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <p className="text-red-500">{error}</p>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="min-h-screen bg-background pt-24 flex flex-col items-center justify-center px-4">
        <FaBoxOpen className="text-6xl text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">Place your first order and track it here.</p>
        <Link to="/home" className="bg-primary/50 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-hover transition flex items-center gap-2">
          <FaUtensils /> Browse Restaurants
        </Link>
      </div>
    );

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Your Orders</h1>

        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-xl shadow border border-border overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      order.restaurant?.imageUrl ||
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop"
                    }
                    alt={order.restaurant?.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {order.restaurant?.name || "Restaurant"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {/* Items */}
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground mb-2">
                  {order.items
                    .map((i) => `${i.menuItem?.name || "Item"} × ${i.quantity}`)
                    .join(", ")}
                </p>
                {order.notes && (
                  <p className="text-xs text-muted-foreground truncate">📍 {order.notes}</p>
                )}
                {(order.contactless || order.deliveryPhone) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.contactless && <span className="mr-2">🚪 Contactless</span>}
                    {order.deliveryPhone && <span>📞 {order.deliveryPhone}</span>}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                <span className="text-sm font-semibold text-foreground">
                  ₹{Math.round(order.totalAmount / 100)}
                </span>
                <div className="flex items-center gap-2">
                  {['PLACED', 'CONFIRMED'].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelling === order.id}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {cancelling === order.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                  <Link
                    to={`/home/orders/${order.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleReorder(order)}
                    className="text-xs bg-primary/50 hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg font-semibold transition"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {orders.length > ORDERS_PER_PAGE && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground bg-card hover:bg-muted disabled:opacity-40 transition"
            >
              ← Previous
            </button>
            <span className="text-sm text-muted-foreground font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground bg-card hover:bg-muted disabled:opacity-40 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
