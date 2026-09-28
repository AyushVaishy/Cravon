import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getHomeFeed } from "../../services/discoveryService";
import RestaurantCarousel from "./RestaurantCarousel";
import { ShimmerCarousel } from "../Shimmer";

/** Shared home-feed fetch (Order Again + Featured only). */
export const useHomeFeed = (lat, lng) => {
  const { user } = useSelector((s) => s.auth);
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHomeFeed(lat, lng)
      .then((res) => {
        if (!cancelled) setFeed(res.data);
      })
      .catch(() => {
        if (!cancelled) setFeed(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, user?.id]);

  return { feed, loading, user };
};

export const OrderAgainSection = ({ lat, lng, feed, loading }) => {
  const { user } = useSelector((s) => s.auth);
  if (!user) return null;
  if (loading) {
    return (
      <div className="dashboard-section px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <ShimmerCarousel />
      </div>
    );
  }
  if (!feed?.recentlyOrdered?.length) return null;
  return (
    <div className="dashboard-section px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      <RestaurantCarousel
        title="Order Again"
        subtitle="Your recent restaurants — reorder in a tap"
        restaurants={feed.recentlyOrdered}
      />
    </div>
  );
};

export const FeaturedSection = ({ feed, loading }) => {
  if (loading) return null;
  if (!feed?.featured?.length) return null;
  return (
    <div className="dashboard-section px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      <RestaurantCarousel
        title="Featured on Cravon"
        subtitle="Hand-picked restaurants for you"
        restaurants={feed.featured}
        badge="Featured"
      />
    </div>
  );
};

export default function HomeDiscoverFeed({ lat, lng }) {
  const { feed, loading } = useHomeFeed(lat, lng);
  return (
    <>
      <OrderAgainSection feed={feed} loading={loading} lat={lat} lng={lng} />
      <FeaturedSection feed={feed} loading={loading} />
    </>
  );
}
