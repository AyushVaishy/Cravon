import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClock, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { getBrowseHistory, clearBrowseHistory } from "../services/favoritesService";
import RestaurantCard from "../components/RestaurantCard";
import Shimmer from "../components/Shimmer";

const BrowseHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getBrowseHistory()
      .then((res) => setHistory(res.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    try {
      await clearBrowseHistory();
      setHistory([]);
      toast.success("Browsing history cleared");
    } catch {
      toast.error("Sign in to manage history");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-btn border flex items-center justify-center">
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Browsing History</h1>
              <p className="text-sm text-muted-foreground">Restaurants you recently viewed</p>
            </div>
          </div>
          {history.length > 0 && (
            <button type="button" onClick={handleClear} className="text-sm font-semibold text-red-600 flex items-center gap-1">
              <FaTrash size={11} /> Clear all
            </button>
          )}
        </div>
        {loading ? <Shimmer /> : history.length === 0 ? (
          <div className="glass-card rounded-3xl text-center py-16">
            <FaClock className="mx-auto mb-3 text-muted-foreground opacity-40" size={32} />
            <p className="font-semibold">No browsing history</p>
            <Link to="/home" className="text-primary text-sm mt-3 inline-block">Explore restaurants →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {history.map((r) => <RestaurantCard key={r.id} resData={r} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseHistoryPage;
