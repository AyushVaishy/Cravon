import { useState } from "react";
import ItemList from "./ItemList";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const RestaurantCategory = ({ title, items, restaurantName, restaurantId, orderingDisabled }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted transition"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-bold text-base sm:text-lg text-foreground">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({items.length})</span>
        </span>
        {open ? (
          <FaChevronUp className="text-muted-foreground flex-shrink-0" size={14} />
        ) : (
          <FaChevronDown className="text-muted-foreground flex-shrink-0" size={14} />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-2">
          <ItemList items={items} restaurantName={restaurantName} restaurantId={restaurantId} orderingDisabled={orderingDisabled} />
        </div>
      )}
    </div>
  );
};

export default RestaurantCategory;
