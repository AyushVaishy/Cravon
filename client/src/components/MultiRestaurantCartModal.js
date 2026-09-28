import { FaStore, FaExchangeAlt, FaPlus, FaTimes } from "react-icons/fa";

/**
 * Shown when adding an item from a different restaurant while the cart already has items.
 * Options match Zomato-style multi-restaurant carts: keep both, or replace.
 */
const MultiRestaurantCartModal = ({
  open,
  onClose,
  existingRestaurantName,
  newRestaurantName,
  onAddKeepBoth,
  onReplaceCart,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="multi-restro-cart-title"
        className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 mx-0 sm:mx-4 animate-in fade-in"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <FaTimes size={14} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <FaStore size={18} />
          </div>
          <div>
            <h2 id="multi-restro-cart-title" className="font-bold text-lg text-foreground">
              Items from another restaurant
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your cart already has items from{" "}
              <span className="font-semibold text-foreground">{existingRestaurantName || "another restaurant"}</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          You can keep both and checkout together or separately later, or replace the cart with items from{" "}
          <span className="font-semibold text-foreground">{newRestaurantName || "this restaurant"}</span>.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onAddKeepBoth}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-sm transition"
          >
            <FaPlus size={12} />
            Add items (keep both)
          </button>
          <button
            type="button"
            onClick={onReplaceCart}
            className="w-full flex items-center justify-center gap-2 border-2 border-border hover:border-primary py-3 rounded-xl font-semibold text-sm transition"
          >
            <FaExchangeAlt size={12} />
            Replace cart
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiRestaurantCartModal;
