import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import RestaurantCard from "../RestaurantCard";
import RestaurantCategory from "../RestaurantCategory";
import { getSimilarRestaurants, reportRestaurant } from "../../services/favoritesService";

export const MenuOffersBanner = ({ offerTag }) => {
  if (!offerTag?.trim()) return null;
  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <p className="text-xs font-bold uppercase tracking-wide opacity-90">Live offer</p>
      <p className="text-lg font-extrabold mt-1">{offerTag}</p>
    </div>
  );
};

export const MenuGallery = ({ images = [], name }) => {
  const gallery = images.filter(Boolean);
  if (gallery.length <= 1) return null;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-foreground mb-2">Gallery</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {gallery.map((url, i) => (
          <img key={i} src={url} alt={`${name} ${i + 1}`} className="w-28 h-28 rounded-xl object-cover shrink-0" />
        ))}
      </div>
    </div>
  );
};

export const MenuItemSections = ({ title, items, restaurant, orderingDisabled }) => {
  if (!items?.length) return null;
  return (
    <div className="mb-6">
      <RestaurantCategory
        title={title}
        items={items}
        restaurantName={restaurant.name}
        restaurantId={restaurant.id}
        orderingDisabled={orderingDisabled}
      />
    </div>
  );
};

export const SimilarRestaurants = ({ restaurantId, lat, lng }) => {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (!restaurantId) return;
    getSimilarRestaurants(restaurantId, lat, lng)
      .then((res) => setSimilar(res.data.restaurants || []))
      .catch(() => setSimilar([]));
  }, [restaurantId, lat, lng]);

  if (!similar.length) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Similar Restaurants</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {similar.map((r) => <RestaurantCard key={r.id} resData={r} />)}
      </div>
    </div>
  );
};

export const RestaurantActions = ({ restaurant, onReport }) => {
  const share = async () => {
    const url = `${window.location.origin}/home/restaurants/${restaurant.id}`;
    try {
      if (navigator.share) await navigator.share({ title: restaurant.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {
      toast.error("Could not share");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button type="button" onClick={share} className="px-4 py-2 rounded-full border border-border text-sm font-semibold hover:border-primary">
        Share
      </button>
      <button type="button" onClick={onReport} className="px-4 py-2 rounded-full border border-border text-sm font-semibold text-red-600 hover:border-red-300">
        Report issue
      </button>
    </div>
  );
};

export const ReportRestaurantModal = ({ open, onClose, restaurantId }) => {
  const [reason, setReason] = useState("Food quality");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      await reportRestaurant(restaurantId, { reason, details });
      toast.success("Report submitted");
      onClose();
    } catch {
      toast.error("Sign in to report or try again");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Report Restaurant</h3>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded-xl text-sm">
          <option>Food quality</option>
          <option>Hygiene concern</option>
          <option>Wrong information</option>
          <option>Other</option>
        </select>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details (optional)" className="w-full mb-4 px-3 py-2 border rounded-xl text-sm h-24" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
