import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaHeart, FaRegHeart, FaShareAlt, FaStar } from "react-icons/fa";
import { addItem, removeItem, updateQuantity, clearCart } from "../store/cartSlice";
import { toggleFavouriteMenuItem, selectIsFavouriteItem } from "../store/favoritesSlice";
import { cartLineKey, formatCustomizationLabel } from "../utils/cartUtils";
import ItemCustomizationModal from "./ItemCustomizationModal";
import MultiRestaurantCartModal from "./MultiRestaurantCartModal";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop";

const ItemRowContainer = (props) => {
  const isFav = useSelector(selectIsFavouriteItem(props.item.id));
  return <ItemRow {...props} isFav={isFav} />;
};

const ItemList = ({ items, restaurantName, restaurantId, orderingDisabled = false }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((s) => s.cart.items);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);

  const getCartLines = (menuItemId) =>
    cartItems.filter((i) => (i.menuItemId || i.id) === menuItemId);

  const getCartQty = (menuItemId) =>
    getCartLines(menuItemId).reduce((sum, i) => sum + i.quantity, 0);

  const otherRestaurantItems = cartItems.filter(
    (i) => i.restaurantId && i.restaurantId !== restaurantId
  );
  const existingOtherName = otherRestaurantItems[0]?.restaurantName;

  const commitAdd = (item, qty, extras = {}, { replace = false } = {}) => {
    if (replace) dispatch(clearCart());

    const unitPrice = extras.unitPrice ?? item.offerPrice ?? item.price;
    const payload = {
      menuItemId: item.id,
      id: item.id,
      name: item.name,
      price: unitPrice,
      basePrice: item.price,
      isVeg: item.isVeg,
      restaurantId: item.restaurantId || restaurantId,
      restaurantName: restaurantName || "",
      imageUrl: item.imageUrl,
      customizations: extras.customizations || null,
      customizationLabels: extras.customizationLabels || null,
      customizationLabel: formatCustomizationLabel(extras.customizationLabels || extras.customizations),
      itemNotes: extras.itemNotes || null,
      quantity: qty,
    };

    const lineKey = cartLineKey(payload);
    const existing = !replace
      ? cartItems.find((i) => cartLineKey(i) === lineKey)
      : null;

    if (existing) {
      dispatch(updateQuantity({ lineKey, quantity: existing.quantity + qty }));
    } else {
      dispatch(addItem(payload));
      if (qty > 1) {
        setTimeout(() => dispatch(updateQuantity({ lineKey, quantity: qty })), 0);
      }
    }

    if (replace) {
      toast.success(`Cart replaced · ${item.name} added`, { duration: 1800 });
    } else {
      toast.success(`${item.name}${qty > 1 ? ` × ${qty}` : ""} added to cart 🛒`, { duration: 1500 });
    }
  };

  const addToCart = (item, qty, extras = {}) => {
    const targetRestId = item.restaurantId || restaurantId;
    const hasOtherRestaurant = cartItems.some(
      (i) => i.restaurantId && i.restaurantId !== targetRestId
    );
    const alreadyHasThisRestaurant = cartItems.some(
      (i) => i.restaurantId === targetRestId
    );

    // Prompt only when introducing a *new* restaurant into a non-empty cart
    if (hasOtherRestaurant && !alreadyHasThisRestaurant) {
      setPendingAdd({ item, qty, extras });
      return;
    }
    commitAdd(item, qty, extras);
  };

  const handleDecrement = (line) => {
    if (line.quantity <= 1) {
      dispatch(removeItem(cartLineKey(line)));
    } else {
      dispatch(updateQuantity({ lineKey: cartLineKey(line), quantity: line.quantity - 1 }));
    }
  };

  const shareItem = async (item) => {
    const url = `${window.location.origin}/home/restaurants/${restaurantId}?item=${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Item link copied!");
      }
    } catch {
      toast.error("Could not share");
    }
  };

  return (
    <>
      <div className="divide-y divide-border">
        {items.map((item) => {
          const lines = getCartLines(item.id);
          const qty = getCartQty(item.id);
          const displayPrice = item.offerPrice ?? item.price;
          const hasDiscount = item.offerPrice && item.offerPrice < item.price;

          return (
            <ItemRowContainer
              key={item.id}
              item={item}
              lines={lines}
              qty={qty}
              displayPrice={displayPrice}
              hasDiscount={hasDiscount}
              orderingDisabled={orderingDisabled}
              onCustomize={() => setCustomizingItem(item)}
              onIncrement={() => {
                if (lines.length === 1) addToCart(item, 1, { unitPrice: lines[0].price, customizations: lines[0].customizations, customizationLabels: lines[0].customizationLabels, itemNotes: lines[0].itemNotes });
                else setCustomizingItem(item);
              }}
              onDecrement={handleDecrement}
              onShare={() => shareItem(item)}
              onToggleFav={() => dispatch(toggleFavouriteMenuItem({ ...item, restaurantId }))}
            />
          );
        })}
      </div>
      {customizingItem && (
        <ItemCustomizationModal
          item={customizingItem}
          restaurantName={restaurantName}
          onClose={() => setCustomizingItem(null)}
          onConfirm={(item, qty, extras) => {
            addToCart(item, qty, extras);
            setCustomizingItem(null);
          }}
        />
      )}
      <MultiRestaurantCartModal
        open={Boolean(pendingAdd)}
        onClose={() => setPendingAdd(null)}
        existingRestaurantName={existingOtherName}
        newRestaurantName={restaurantName}
        onAddKeepBoth={() => {
          if (!pendingAdd) return;
          commitAdd(pendingAdd.item, pendingAdd.qty, pendingAdd.extras, { replace: false });
          setPendingAdd(null);
        }}
        onReplaceCart={() => {
          if (!pendingAdd) return;
          commitAdd(pendingAdd.item, pendingAdd.qty, pendingAdd.extras, { replace: true });
          setPendingAdd(null);
        }}
      />
    </>
  );
};

const ItemRow = ({
  item, lines, qty, displayPrice, hasDiscount, orderingDisabled,
  onCustomize, onIncrement, onDecrement, onShare, onToggleFav, isFav,
}) => (
  <div className={`flex items-center justify-between gap-4 py-4 ${!item.isAvailable ? "opacity-60" : ""}`}>
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap gap-1 mb-1">
        {item.isBestseller && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">🔥 Bestseller</span>
        )}
        {item.isCombo && (
          <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">📦 Combo</span>
        )}
        {!item.isAvailable && (
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of stock</span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${item.isVeg ? "border-green-600" : "border-red-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-500"}`} />
        </span>
        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">{item.name}</h3>
        {item.ratingCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
            <FaStar size={9} className="text-yellow-500" />
            {Number(item.avgRating).toFixed(1)}
            <span className="font-normal text-muted-foreground">({item.ratingCount})</span>
          </span>
        )}
        <button type="button" onClick={onToggleFav} className="text-muted-foreground hover:text-red-500 ml-1">
          {isFav ? <FaHeart size={12} className="text-red-500" /> : <FaRegHeart size={12} />}
        </button>
        <button type="button" onClick={onShare} className="text-muted-foreground hover:text-primary">
          <FaShareAlt size={11} />
        </button>
      </div>
      <p className="text-primary font-bold text-sm mb-1">
        {hasDiscount && <span className="text-muted-foreground line-through mr-2 font-normal">₹{(item.price / 100).toFixed(0)}</span>}
        ₹{(displayPrice / 100).toFixed(0)}
      </p>
      {item.description && <p className="text-muted-foreground text-xs line-clamp-2 mb-1">{item.description}</p>}
      {item.prepTime && <p className="text-[10px] text-muted-foreground">⏱ {item.prepTime} min prep</p>}
      {item.calories && <p className="text-[10px] text-muted-foreground">🔥 {item.calories} kcal</p>}
      {item.nutritionInfo && <p className="text-[10px] text-muted-foreground">{item.nutritionInfo}</p>}
      {item.ingredients?.length > 0 && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">Ingredients: {item.ingredients.join(", ")}</p>
      )}
      {item.allergens?.length > 0 && (
        <p className="text-[10px] text-amber-700">⚠️ Contains: {item.allergens.join(", ")}</p>
      )}
      {lines.map((line) => line.customizationLabel && (
        <p key={cartLineKey(line)} className="text-[10px] text-primary mt-0.5">{line.customizationLabel}</p>
      ))}
    </div>
    <div className="flex flex-col items-center flex-shrink-0 relative">
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-md bg-muted">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER_IMG; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
      </div>
      {orderingDisabled || !item.isAvailable ? (
        <span className="absolute -bottom-3 text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded-lg">UNAVAILABLE</span>
      ) : qty === 0 ? (
        <button type="button" onClick={onCustomize} className="absolute -bottom-3 bg-card border border-border text-green-600 font-bold text-sm px-5 py-1 rounded-lg shadow hover:bg-green-50 transition">
          ADD
        </button>
      ) : (
        <div className="absolute -bottom-3 flex items-center bg-green-600 text-white rounded-lg shadow overflow-hidden text-sm font-bold">
          <button type="button" onClick={() => lines[0] && onDecrement(lines[0])} className="px-2.5 py-1 hover:bg-green-700">−</button>
          <span className="px-2 py-1 bg-white text-green-700 min-w-[24px] text-center">{qty}</span>
          <button type="button" onClick={onIncrement} className="px-2.5 py-1 hover:bg-green-700">+</button>
        </div>
      )}
    </div>
  </div>
);

export default ItemList;
