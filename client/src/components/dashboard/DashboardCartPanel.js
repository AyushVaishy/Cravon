import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaMapMarkerAlt,
  FaPlus,
  FaMinus,
  FaTag,
  FaShoppingBag,
  FaChevronRight,
} from "react-icons/fa";
import { updateQuantity, removeItem } from "../../store/cartSlice";
import { cartLineKey } from "../../utils/cartUtils";
import { resolveAvatarUrl } from "../../utils/avatarUrl";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&h=120&fit=crop";

const formatPrice = (paise) => `₹${(Number(paise || 0) / 100).toFixed(0)}`;

const DashboardCartPanel = ({ location }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.auth.user);
  const [couponDraft, setCouponDraft] = useState("");

  const avatarUrl = resolveAvatarUrl(user?.avatar);
  const addressLabel =
    location?.savedLabel ||
    (location?.address ? location.address.split(",")[0] : "Set your location");
  const addressDetail = location?.address || "Choose where we should deliver";

  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0),
    [cartItems]
  );
  const itemCount = useMemo(
    () => cartItems.reduce((a, i) => a + (i.quantity || 1), 0),
    [cartItems]
  );
  const serviceFee = cartItems.length > 0 ? 1000 : 0;
  const total = subtotal + serviceFee;

  const bumpQty = (item, delta) => {
    const key = item.lineKey || cartLineKey(item);
    const next = (item.quantity || 1) + delta;
    if (next <= 0) {
      dispatch(removeItem(key));
      return;
    }
    dispatch(updateQuantity({ lineKey: key, quantity: next, maxQty: item.maxQty || 10 }));
  };

  const openLocation = () => window.dispatchEvent(new Event("openLocationSidebar"));

  return (
    <aside className="dashboard-cart-panel hidden xl:flex flex-col w-[308px] shrink-0 sticky top-0 h-screen py-4 pr-4 pl-1">
      <div className="elevated-panel flex flex-col h-full overflow-hidden border border-white/80 dark:border-white/5">
        {/* Profile strip */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {user ? "Welcome back" : "Guest"}
            </p>
            <p className="text-[15px] font-extrabold text-foreground truncate mt-0.5">
              {user?.name?.split(" ")[0] || "Foodie"}
            </p>
          </div>
          <Link
            to={user ? "/home/profile" : "/home"}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                window.dispatchEvent(new Event("openSignIn"));
              }
            }}
            className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-[0_4px_14px_rgba(0,0,0,0.08)] shrink-0 hover:ring-primary/55 hover:scale-105 transition-all"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {(user?.name || "C").charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>

        {/* Your Address */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-bold text-foreground">Your Address</h3>
            <button
              type="button"
              onClick={openLocation}
              className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Change
            </button>
          </div>
          <button
            type="button"
            onClick={openLocation}
            className="w-full elevated-inset rounded-2xl p-3.5 text-left hover:bg-primary/[0.04] transition-colors group"
          >
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <FaMapMarkerAlt size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{addressLabel}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                  {addressDetail}
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mx-5 h-px bg-border/80" />

        {/* Order Menu */}
        <div className="flex-1 flex flex-col min-h-0 px-5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Order Menu</h3>
            {itemCount > 0 && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-soft">
                <FaShoppingBag size={20} />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">Your cart is empty</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add dishes from a restaurant and they&apos;ll show up here.
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-0.5">
              {cartItems.map((item) => {
                const key = item.lineKey || cartLineKey(item);
                const lineTotal = (item.price || 0) * (item.quantity || 1);
                return (
                  <li key={key} className="flex items-center gap-3 p-2 -mx-1 rounded-2xl hover:bg-primary/[0.03] transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-2 ring-white dark:ring-white/10">
                      <img
                        src={item.imageUrl || PLACEHOLDER}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-foreground truncate leading-tight">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => bumpQty(item, -1)}
                          className="w-5 h-5 rounded-md bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                        >
                          <FaMinus size={8} />
                        </button>
                        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                          x{item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => bumpQty(item, 1)}
                          className="w-5 h-5 rounded-md bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                        >
                          <FaPlus size={8} />
                        </button>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-primary tabular-nums shrink-0">
                      +{formatPrice(lineTotal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Totals + checkout */}
        <div className="px-5 pb-5 pt-3 mt-auto border-t border-border/60">
          {cartItems.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Service</span>
                <span className="font-semibold tabular-nums">{formatPrice(serviceFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-lg font-extrabold tabular-nums">
                  <span className="text-primary">₹</span>
                  <span className="text-foreground">{(total / 100).toFixed(0)}</span>
                </span>
              </div>
            </div>
          )}

          <div className="w-full elevated-inset rounded-2xl h-11 px-3 flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <FaTag size={12} />
            </span>
            <input
              type="text"
              value={couponDraft}
              onChange={(e) => setCouponDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  navigate(
                    couponDraft.trim()
                      ? `/home/cart?coupon=${encodeURIComponent(couponDraft.trim())}`
                      : "/home/cart"
                  );
                }
              }}
              placeholder="Have a coupon code?"
              className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-foreground placeholder:text-muted-foreground min-w-0"
            />
            <button
              type="button"
              aria-label="Apply coupon at checkout"
              onClick={() =>
                navigate(
                  couponDraft.trim()
                    ? `/home/cart?coupon=${encodeURIComponent(couponDraft.trim())}`
                    : "/home/cart"
                )
              }
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
            >
              <FaChevronRight size={10} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/home/cart")}
            disabled={cartItems.length === 0}
            className="w-full h-[52px] rounded-2xl bg-primary text-white font-bold text-[15px] shadow-[0_10px_28px_-6px_var(--shadow-soft)] hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            Checkout
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardCartPanel;
