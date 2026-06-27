import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { performLogout } from "../utils/authHelpers";
import { setCredentials } from "../store/authSlice";
import { updateProfile, changePassword, getProfile, forgotPassword } from "../services/authService";
import { getOrders } from "../services/orderService";
import { Link } from "react-router-dom";
import {
  FaUserCircle, FaEnvelope, FaPhone, FaLock, FaStar,
  FaBoxOpen, FaMoon, FaSun, FaSignOutAlt, FaUser, FaHeart,
  FaMapMarkerAlt, FaHome, FaBriefcase, FaMapPin, FaTrash, FaPlus,
  FaCog, FaGoogle, FaFacebook, FaShieldAlt,
} from "react-icons/fa";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import { getAddresses, addAddress, deleteAddress } from "../services/addressService";
import { selectFavourites } from "../store/favoritesSlice";
import RestaurantCard from "../components/RestaurantCard";
import { validatePassword, PASSWORD_HINT } from "../utils/passwordValidation";
import api from "../services/api";

const CARD =
  "rounded-2xl border border-border/80 bg-white/90 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm";
const INPUT =
  "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition";

const TABS = [
  { id: "profile", label: "My Profile", Icon: FaUser },
  { id: "orders", label: "My Orders", Icon: FaBoxOpen },
  { id: "favourites", label: "Favourites", Icon: FaHeart },
  { id: "reviews", label: "My Reviews", Icon: FaStar },
  { id: "addresses", label: "Addresses", Icon: FaMapMarkerAlt },
  { id: "settings", label: "Settings", Icon: FaCog },
];

const STATUS_COLORS = {
  PLACED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  PREPARING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  OUT_FOR_DELIVERY: "bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const STATUS_LABELS = {
  PLACED: "Order Placed", CONFIRMED: "Confirmed", PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

// ─── My Profile Tab ───────────────────────────────────────────────────────────
const ProfileTab = ({ user, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: user?.name || "", phone: user?.phone || "" });
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await updateProfile({ name: form.name.trim(), phone: form.phone });
      onUpdated(res.data.user);
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    }
    setSaving(false);
  };

  const FieldRow = ({ icon: Icon, label, children }) => (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 dark:bg-zinc-800/50 border border-border/60 rounded-xl">
        <Icon className="text-primary flex-shrink-0" size={15} />
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-lg space-y-6">
      <div className={`${CARD} p-6 flex items-center gap-5`}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-primary/20 flex-shrink-0">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-foreground truncate">{user?.name || "—"}</h2>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
              {user?.role === "USER" ? "Customer" : user?.role?.replace("_", " ")}
            </span>
            {user?.linkedGoogle && (
              <span className="text-xs inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-medium">
                <FaGoogle size={10} /> Google
              </span>
            )}
            {user?.linkedFacebook && (
              <span className="text-xs inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium">
                <FaFacebook size={10} /> Facebook
              </span>
            )}
            {user?.hasPassword && (
              <span className="text-xs inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium">
                <FaLock size={9} /> Password set
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`${CARD} p-6 space-y-4`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-foreground">Personal details</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition"
            >
              <FiEdit2 size={13} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className={INPUT}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition disabled:opacity-60"
              >
                <FiSave size={14} /> {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={() => { setEditing(false); setForm({ name: user?.name || "", phone: user?.phone || "" }); }}
                className="flex items-center gap-2 px-5 py-2.5 border border-border text-muted-foreground rounded-xl font-semibold text-sm hover:bg-muted/50 transition"
              >
                <FiX size={14} /> Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <FieldRow icon={FaUserCircle} label="Full name">
              <span className="text-sm text-foreground">{user?.name || "—"}</span>
            </FieldRow>
            <FieldRow icon={FaEnvelope} label="Email">
              <span className="text-sm text-foreground truncate">{user?.email}</span>
            </FieldRow>
            <FieldRow icon={FaPhone} label="Phone">
              <span className="text-sm text-foreground">{user?.phone || "Not set"}</span>
            </FieldRow>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground animate-pulse py-8">Loading orders…</div>;
  if (orders.length === 0)
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground">
        <FaBoxOpen size={48} className="mb-4 text-muted-foreground" />
        <p className="font-medium">No orders yet</p>
        <Link to="/home" className="mt-4 text-primary hover:underline text-sm">Browse restaurants →</Link>
      </div>
    );

  return (
    <div className="space-y-3 max-w-2xl">
      {orders.map((order) => (
        <Link to={`/home/orders/${order.id}`} key={order.id}
          className="block bg-white/90 dark:bg-zinc-900/70 rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={order.restaurant?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=60&h=60&fit=crop"}
                alt="" className="w-9 h-9 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-sm text-foreground">{order.restaurant?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <div className="px-4 py-2.5 flex justify-between items-center">
            <p className="text-xs text-muted-foreground line-clamp-1">
              {order.items.map((i) => i.menuItem?.name || "Item").join(", ")}
            </p>
            <span className="text-sm font-bold text-foreground flex-shrink-0 ml-3">
              ₹{Math.round(order.totalAmount / 100)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

// ─── Favourites Tab ───────────────────────────────────────────────────────────
const FavouritesTab = () => {
  const favs = useSelector(selectFavourites);

  if (favs.length === 0)
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground">
        <FaHeart size={48} className="mb-4 text-muted-foreground" />
        <p className="font-medium">No favourites yet</p>
        <p className="text-sm mt-1">Tap the ❤️ on any restaurant to save it here.</p>
        <Link to="/home" className="mt-4 text-primary hover:underline text-sm">Explore restaurants →</Link>
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {favs.map((r) => (
        <RestaurantCard key={r.id} resData={r} />
      ))}
    </div>
  );
};

// ─── Reviews Tab ──────────────────────────────────────────────────────────────
const ReviewsTab = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/restaurants/reviews/me")
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground animate-pulse py-8">Loading reviews…</div>;

  if (reviews.length === 0)
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground">
        <FaStar size={48} className="mb-4 text-muted-foreground" />
        <p className="font-medium">No reviews yet</p>
        <p className="text-sm mt-1">After ordering, you can rate restaurants from the Order Details page.</p>
        <Link to="/home/orders" className="mt-4 text-primary hover:underline text-sm">View my orders →</Link>
      </div>
    );

  return (
    <div className="space-y-4 max-w-2xl">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white/80 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            {review.restaurant?.imageUrl && (
              <img
                src={review.restaurant.imageUrl}
                alt={review.restaurant.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <Link
                  to={`/home/restaurants/${review.restaurant?.id}`}
                  className="font-semibold text-foreground hover:text-primary-hover transition-colors text-sm"
                >
                  {review.restaurant?.name || "Restaurant"}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    size={13}
                    className={star <= review.rating ? "text-yellow-400" : "text-muted-foreground"}
                  />
                ))}
                <span className="ml-1 text-xs font-semibold text-muted-foreground">{review.rating}/5</span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Addresses Tab ────────────────────────────────────────────────────────────
const LABEL_ICONS = { Home: <FaHome />, Work: <FaBriefcase />, Other: <FaMapPin /> };

const AddressesTab = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "Home", street: "", city: "", state: "", pincode: "" });

  const load = useCallback(() => {
    setLoading(true);
    getAddresses()
      .then((res) => setAddresses(res.data.addresses || []))
      .catch(() => toast.error("Failed to load addresses"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.street.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      toast.error("All fields are required"); return;
    }
    setSaving(true);
    try {
      await addAddress(form);
      toast.success("Address added!");
      setShowForm(false);
      setForm({ label: "Home", street: "", city: "", state: "", pincode: "" });
      load();
    } catch {
      toast.error("Failed to add address");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      toast.success("Address removed");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete address");
    }
  };

  if (loading) return <div className="text-muted-foreground animate-pulse py-8">Loading addresses…</div>;

  return (
    <div className="max-w-lg space-y-4">
      {/* Address cards */}
      {addresses.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <FaMapMarkerAlt size={40} className="mb-3 text-muted-foreground" />
          <p className="font-medium">No saved addresses</p>
        </div>
      )}
      {addresses.map((addr) => (
        <div key={addr.id} className="flex items-start justify-between bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              {LABEL_ICONS[addr.label] || <FaMapPin />}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{addr.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(addr.id)}
            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            aria-label="Delete address"
          >
            <FaTrash size={13} />
          </button>
        </div>
      ))}

      {/* Add Address Form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-2">Add New Address</h3>
          {/* Label selector */}
          <div className="flex gap-2">
            {["Home", "Work", "Other"].map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setForm((p) => ({ ...p, label: lbl }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${form.label === lbl
                    ? "bg-primary/50 text-white border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          {[
            { field: "street", placeholder: "Street / Area" },
            { field: "city", placeholder: "City" },
            { field: "state", placeholder: "State" },
            { field: "pincode", placeholder: "Pincode" },
          ].map(({ field, placeholder }) => (
            <input
              key={field}
              type="text"
              placeholder={placeholder}
              value={form[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary/50 hover:bg-primary-hover disabled:opacity-60 text-white py-2 rounded-lg font-semibold text-sm transition"
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/40 dark:border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/5 font-semibold text-sm transition"
        >
          <FaPlus size={12} /> Add New Address
        </button>
      )}
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab = ({ user, onUpdated, onLogout }) => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const hasPassword = Boolean(user?.hasPassword);
  const canResetByEmail = user?.email && !user.email.endsWith("@facebook.cravon.local");

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    const pwErr = validatePassword(form.newPassword);
    if (pwErr) { toast.error(pwErr); return; }
    if (hasPassword && !form.currentPassword.trim()) {
      toast.error("Current password is required");
      return;
    }

    setSaving(true);
    try {
      const payload = hasPassword
        ? { currentPassword: form.currentPassword, newPassword: form.newPassword }
        : { newPassword: form.newPassword };
      await changePassword(payload);
      toast.success(hasPassword ? "Password changed successfully!" : "Password added! You can now sign in with email too.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onUpdated({ hasPassword: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update password");
    }
    setSaving(false);
  };

  const handleForgotPassword = async () => {
    if (!canResetByEmail) {
      toast.error("Add a real email to your account before resetting password.");
      return;
    }
    setSendingReset(true);
    try {
      const res = await forgotPassword({ email: user.email });
      toast.success(res.data.message || "Check your email for reset instructions.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send reset email.");
    }
    setSendingReset(false);
  };

  return (
    <div className="max-w-lg space-y-5">
      {/* Connected accounts */}
      {(user?.linkedGoogle || user?.linkedFacebook) && (
        <div className={`${CARD} p-6`}>
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-primary" size={15} /> Connected accounts
          </h3>
          <div className="space-y-2">
            {user?.linkedGoogle && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 dark:bg-zinc-800/50 border border-border/60">
                <FaGoogle className="text-blue-500" size={16} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Google</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
            )}
            {user?.linkedFacebook && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 dark:bg-zinc-800/50 border border-border/60">
                <FaFacebook className="text-indigo-500" size={16} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Facebook</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password */}
      <div className={`${CARD} p-6`}>
        <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
          <FaLock className="text-primary" size={14} />
          {hasPassword ? "Change password" : "Add a password"}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {hasPassword
            ? "Update your password to keep your account secure."
            : "Set a password so you can also sign in with your email and password."}
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          {hasPassword && (
            <input
              type="password"
              placeholder="Current password"
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className={INPUT}
              autoComplete="current-password"
            />
          )}
          <input
            type="password"
            placeholder={hasPassword ? "New password" : "Choose a password"}
            value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            className={INPUT}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            className={INPUT}
            autoComplete="new-password"
          />
          {!hasPassword && (
            <p className="text-xs text-muted-foreground px-1">{PASSWORD_HINT}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition shadow-sm shadow-primary/20"
          >
            {saving ? "Saving…" : hasPassword ? "Update password" : "Add password"}
          </button>
        </form>

        {hasPassword && (
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={sendingReset || !canResetByEmail}
            className="mt-4 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {sendingReset ? "Sending reset link…" : "Forgot your current password?"}
          </button>
        )}
      </div>

      {/* Appearance */}
      <div className={`${CARD} p-6`}>
        <h3 className="font-bold text-foreground mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-indigo-500/20" : "bg-amber-500/20"}`}>
              {isDark ? <FaMoon className="text-indigo-400" size={16} /> : <FaSun className="text-amber-500" size={16} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{isDark ? "Dark mode" : "Light mode"}</p>
              <p className="text-xs text-muted-foreground">Toggle theme for the app</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${isDark ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className={`${CARD} p-6`}>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-red-200/80 dark:border-red-900/40"
        >
          <FaSignOutAlt size={14} /> Log out of this device
        </button>
      </div>
    </div>
  );
};

// ─── ProfilePage ──────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduxUser = useSelector((s) => s.auth.user);
  const [user, setUser] = useState(null);
  const activeTab = searchParams.get("tab") || "profile";

  const setTab = (id) => setSearchParams({ tab: id });

  useEffect(() => {
    getProfile()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Fallback to Redux/localStorage
        const stored = localStorage.getItem("userData");
        if (stored) setUser(JSON.parse(stored));
        else if (reduxUser) setUser(reduxUser);
      });
  }, []);

  const handleUpdated = useCallback((updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      dispatch(setCredentials({ user: merged, accessToken: localStorage.getItem("accessToken") }));
      const stored = localStorage.getItem("userData");
      if (stored) localStorage.setItem("userData", JSON.stringify({ ...JSON.parse(stored), ...merged }));
      return merged;
    });
  }, [dispatch]);

  const handleLogout = async () => {
    await performLogout(dispatch);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 dark:to-zinc-950/50">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8">

        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className={`${CARD} overflow-hidden`}>
            <div className="bg-gradient-to-br from-primary via-primary to-primary-hover px-5 py-7 text-center">
              <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-3 ring-2 ring-white/30 shadow-lg">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <p className="text-white font-bold text-sm truncate">{user?.name || "Loading…"}</p>
              <p className="text-white/75 text-xs truncate mt-0.5">{user?.email}</p>
            </div>

            <nav className="p-2.5">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                    activeTab === id
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon size={15} className={activeTab === id ? "text-white" : "text-primary"} />
                  {label}
                </button>
              ))}
              <div className="border-t border-border/60 mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                >
                  <FaSignOutAlt size={14} /> Logout
                </button>
              </div>
            </nav>
          </div>
        </aside>

        <main className={`flex-1 ${CARD} p-6 md:p-8 min-h-[520px]`}>
          <h1 className="text-2xl font-extrabold text-foreground mb-6 md:mb-8">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>

          {activeTab === "profile" && <ProfileTab user={user} onUpdated={handleUpdated} />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "favourites" && <FavouritesTab />}
          {activeTab === "reviews" && <ReviewsTab />}
          {activeTab === "addresses" && <AddressesTab />}
          {activeTab === "settings" && <SettingsTab user={user} onUpdated={handleUpdated} onLogout={handleLogout} />}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;