import { useEffect, useState } from 'react';
import { getRestaurant, getRestaurantMenu } from '../services/restaurantService';

const markMenuMeta = (menu, { bestsellerIds, recommendedIds }) => {
  if (!menu) return menu;
  const next = {};
  Object.entries(menu).forEach(([cat, items]) => {
    next[cat] = items.map((item) => ({
      ...item,
      isBestseller: bestsellerIds.has(item.id),
      isRecommended: recommendedIds.has(item.id),
      isAvailable: item.isAvailable !== false,
    }));
  });
  return next;
};

const useRestaurantMenu = (resId) => {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [bestsellers, setBestsellers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resRes, menuRes] = await Promise.all([
          getRestaurant(resId),
          getRestaurantMenu(resId),
        ]);
        const bestsellerIds = new Set((menuRes.data.bestsellers || []).map((i) => i.id));
        const recommendedIds = new Set((menuRes.data.recommended || []).map((i) => i.id));
        setRestaurant(resRes.data.restaurant || resRes.data);
        setMenu(markMenuMeta(menuRes.data.menu, { bestsellerIds, recommendedIds }));
        setBestsellers(menuRes.data.bestsellers || []);
        setRecommended(menuRes.data.recommended || []);
        setCombos(menuRes.data.combos || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resId]);

  return { restaurant, menu, bestsellers, recommended, combos, loading, error };
};

export default useRestaurantMenu;
