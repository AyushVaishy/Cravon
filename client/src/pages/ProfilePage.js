import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { performLogout } from "../utils/authHelpers";
import { setCredentials } from "../store/authSlice";
import {
  updateProfile,
  changePassword,
  getProfile,
  forgotPassword,
  uploadAvatar,
  updateNotificationSettings,
  requestEmailChange,
  confirmEmailChange,
  deleteAccount,
  logoutAllDevices,
} from "../services/authService";
import { getOrders } from "../services/orderService";
import { Link } from "react-router-dom";
import {
  FaUserCircle, FaEnvelope, FaPhone, FaLock, FaStar,
  FaBoxOpen, FaMoon, FaSun, FaSignOutAlt, FaUser, FaHeart,
  FaMapMarkerAlt, FaHome, FaBriefcase, FaMapPin, FaTrash, FaPlus,
  FaCog, FaGoogle, FaFacebook, FaShieldAlt,
} from "react-icons/fa";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from "../services/addressService";
import AddressForm, { EMPTY_ADDRESS_FORM } from "../components/AddressForm";
import {
  addressToForm,
  validateAddressForm,
  formToPayload,
  defaultLabelTypeForNew,
} from "../utils/addressLabels";
import { selectFavourites } from "../store/favoritesSlice";
import RestaurantCard from "../components/RestaurantCard";
import { validatePassword, PASSWORD_HINT } from "../utils/passwordValidation";
import { resolveAvatarUrl } from "../utils/avatarUrl";
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [emailStep, setEmailStep] = useState("idle"); // idle | request | confirm
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const avatarUrl = resolveAvatarUrl(user?.avatar);

  useEffect(() => {
    setForm({ name: user?.name || "", phone: user?.phone || "" });
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      onUpdated(res.data.user);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload photo");
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.error("Enter a new email address");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await requestEmailChange(newEmail.trim());
      toast.success(res.data.message || "Code sent to new email");
      setEmailStep("confirm");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send verification code");
    }
    setEmailSaving(false);
  };

  const handleConfirmEmailChange = async () => {
    if (!/^\d{6}$/.test(emailCode.trim())) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await confirmEmailChange(emailCode.trim());
      onUpdated(res.data.user);
      setEmailStep("idle");
      setNewEmail("");
      setEmailCode("");
      toast.success("Email updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired code");
    }
    setEmailSaving(false);
  };

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
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Profile"}
              className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-primary/20">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-primary-hover transition">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            <FiEdit2 size={12} />
          </label>
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-foreground truncate">{user?.name || "—"}</h2>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          {uploadingAvatar && <p className="text-xs text-primary mt-1">Uploading photo…</p>}
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

      <div className={`${CARD} p-6 space-y-4`}>
        <h3 className="font-bold text-foreground">Change email</h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a 6-digit code to your new email to confirm the change.
        </p>
        {emailStep === "idle" && (
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email address"
              className={INPUT}
            />
            <button
              type="button"
              onClick={handleRequestEmailChange}
              disabled={emailSaving}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-60"
            >
              {emailSaving ? "Sending…" : "Send code"}
            </button>
          </div>
        )}
        {emailStep === "confirm" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Code sent to <strong>{newEmail}</strong></p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className={INPUT}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmEmailChange}
                disabled={emailSaving}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {emailSaving ? "Verifying…" : "Confirm new email"}
              </button>
              <button
                type="button"
                onClick={() => { setEmailStep("idle"); setEmailCode(""); }}
                className="px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
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
  const user = useSelector((s) => s.auth.user);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | "add" | addressId (edit)
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS_FORM);

  const load = useCallback(() => {
    setLoading(true);
    getAddresses()
      .then((res) => setAddresses(res.data.addresses || []))
      .catch(() => toast.error("Failed to load addresses"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setMode(null);
    setForm(EMPTY_ADDRESS_FORM);
  };

  const validateForm = () => {
    const err = validateAddressForm(form, addresses, mode === "add" ? null : mode);
    if (err) {
      toast.error(err);
      return false;
    }
    return true;
  };

  const payloadFromForm = () => formToPayload(form);

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (mode === "add") {
        await addAddress({
          ...payloadFromForm(),
          isDefault: addresses.length === 0,
        });
        toast.success("Address added!");
      } else if (mode) {
        await updateAddress(mode, payloadFromForm());
        toast.success("Address updated!");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save address");
    }
    setSaving(false);
  };

  const handleEdit = (addr) => {
    setMode(addr.id);
    setForm(addressToForm(addr));
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      toast.success("Default address updated");
      load();
    } catch {
      toast.error("Failed to set default address");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await deleteAddress(id);
      toast.success("Address removed");
      if (mode === id) resetForm();
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete address");
    }
  };

  if (loading) return <div className="text-muted-foreground animate-pulse py-8">Loading addresses…</div>;

  return (
    <div className="max-w-lg space-y-4">
      {addresses.length === 0 && mode !== "add" && (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <FaMapMarkerAlt size={40} className="mb-3 text-muted-foreground" />
          <p className="font-medium">No saved addresses</p>
        </div>
      )}

      {addresses.map((addr) =>
        mode === addr.id ? null : (
          <div
            key={addr.id}
            className={`flex items-start justify-between rounded-2xl p-5 shadow-sm border ${
              addr.isDefault
                ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                : "border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/20"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {LABEL_ICONS[addr.label] || <FaMapPin />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground">{addr.label}</p>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                </p>
                {(addr.contactName || addr.contactPhone) && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    📞 {addr.contactName || "—"}
                    {addr.contactPhone ? ` · ${addr.contactPhone}` : ""}
                  </p>
                )}
                {addr.lat && addr.lng && !(addr.lat === 0 && addr.lng === 0) && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1">📍 Location pinned</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
              {!addr.isDefault && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  Make default
                </button>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(addr)}
                  className="text-muted-foreground hover:text-primary p-1.5 hover:bg-primary/10 rounded-lg transition"
                  aria-label="Edit address"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  aria-label="Delete address"
                >
                  <FaTrash size={13} />
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {mode ? (
        <AddressForm
          title={mode === "add" ? "Add New Address" : "Edit Address"}
          value={form}
          onChange={setForm}
          onSubmit={handleSave}
          onCancel={resetForm}
          submitLabel={mode === "add" ? "Save Address" : "Update Address"}
          saving={saving}
          existingAddresses={addresses}
          editingId={mode === "add" ? null : mode}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setMode("add");
            setForm({
              ...EMPTY_ADDRESS_FORM,
              labelType: defaultLabelTypeForNew(addresses),
              contactName: user?.name || "",
              contactPhone: user?.phone || "",
            });
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/40 dark:border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/5 font-semibold text-sm transition"
        >
          <FaPlus size={12} /> Add New Address
        </button>
      )}
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const NotificationToggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0">
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const SettingsTab = ({ user, onUpdated, onLogout }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [notif, setNotif] = useState({
    notifyEmailOrders: user?.notifyEmailOrders ?? true,
    notifyEmailOffers: user?.notifyEmailOffers ?? true,
    notifyPushOrders: user?.notifyPushOrders ?? true,
    notifyPushOffers: user?.notifyPushOffers ?? false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const hasPassword = Boolean(user?.hasPassword);
  const canResetByEmail = user?.email && !user.email.endsWith("@facebook.cravon.local");

  useEffect(() => {
    setNotif({
      notifyEmailOrders: user?.notifyEmailOrders ?? true,
      notifyEmailOffers: user?.notifyEmailOffers ?? true,
      notifyPushOrders: user?.notifyPushOrders ?? true,
      notifyPushOffers: user?.notifyPushOffers ?? false,
    });
  }, [user]);

  const saveNotifications = async (next) => {
    setNotif(next);
    setNotifSaving(true);
    try {
      const res = await updateNotificationSettings(next);
      onUpdated(res.data.user);
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save preferences");
      setNotif({
        notifyEmailOrders: user?.notifyEmailOrders ?? true,
        notifyEmailOffers: user?.notifyEmailOffers ?? true,
        notifyPushOrders: user?.notifyPushOrders ?? true,
        notifyPushOffers: user?.notifyPushOffers ?? false,
      });
    }
    setNotifSaving(false);
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Log out from all devices? You'll need to sign in again everywhere.")) return;
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
      await performLogout(dispatch);
      toast.success("Logged out from all devices");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log out from all devices");
    }
    setLoggingOutAll(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This permanently deletes your account, orders, and saved data. Continue?")) return;
    setDeleting(true);
    try {
      const payload = hasPassword
        ? { password: deletePassword }
        : { confirmPhrase: deletePhrase };
      await deleteAccount(payload);
      await performLogout(dispatch);
      toast.success("Account deleted");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete account");
    }
    setDeleting(false);
  };

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

      {/* Notifications */}
      <div className={`${CARD} p-6`}>
        <h3 className="font-bold text-foreground mb-1">Notification settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how you want to hear from Cravon.{notifSaving ? " Saving…" : ""}
        </p>
        <NotificationToggle
          label="Email — order updates"
          description="Confirmations, delivery status, receipts"
          checked={notif.notifyEmailOrders}
          onChange={(v) => saveNotifications({ ...notif, notifyEmailOrders: v })}
        />
        <NotificationToggle
          label="Email — offers & coupons"
          description="Deals, promos, and seasonal offers"
          checked={notif.notifyEmailOffers}
          onChange={(v) => saveNotifications({ ...notif, notifyEmailOffers: v })}
        />
        <NotificationToggle
          label="Push — order updates"
          description="Live order status in the browser"
          checked={notif.notifyPushOrders}
          onChange={(v) => saveNotifications({ ...notif, notifyPushOrders: v })}
        />
        <NotificationToggle
          label="Push — offers & coupons"
          description="Promotional alerts and flash sales"
          checked={notif.notifyPushOffers}
          onChange={(v) => saveNotifications({ ...notif, notifyPushOffers: v })}
        />
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

      {/* Session */}
      <div className={`${CARD} p-6 space-y-3`}>
        <h3 className="font-bold text-foreground mb-2">Sessions</h3>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-red-200/80 dark:border-red-900/40"
        >
          <FaSignOutAlt size={14} /> Log out of this device
        </button>
        <button
          type="button"
          onClick={handleLogoutAll}
          disabled={loggingOutAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/60 transition border border-border disabled:opacity-60"
        >
          {loggingOutAll ? "Signing out everywhere…" : "Log out from all devices"}
        </button>
      </div>

      {/* Delete account */}
      <div className={`${CARD} p-6 border-red-200/60 dark:border-red-900/40`}>
        <h3 className="font-bold text-red-600 dark:text-red-400 mb-1">Delete account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently remove your account and all associated data. This cannot be undone.
        </p>
        {hasPassword ? (
          <input
            type="password"
            placeholder="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className={`${INPUT} mb-3`}
          />
        ) : (
          <input
            type="text"
            placeholder='Type DELETE MY ACCOUNT to confirm'
            value={deletePhrase}
            onChange={(e) => setDeletePhrase(e.target.value)}
            className={`${INPUT} mb-3`}
          />
        )}
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
        >
          {deleting ? "Deleting…" : "Delete my account permanently"}
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
              {resolveAvatarUrl(user?.avatar) ? (
                <img
                  src={resolveAvatarUrl(user?.avatar)}
                  alt={user?.name || "Profile"}
                  className="w-[4.5rem] h-[4.5rem] rounded-2xl object-cover mx-auto mb-3 ring-2 ring-white/30 shadow-lg"
                />
              ) : (
                <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-3 ring-2 ring-white/30 shadow-lg">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
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