import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClock, FaSearch, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  clearRecentSearches,
  loadSearchHistory,
  removeRecentSearch,
} from "../utils/searchStorage";

const SearchHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(loadSearchHistory);

  useEffect(() => {
    setHistory(loadSearchHistory());
  }, []);

  const handleSelect = (term) => {
    navigate(`/home/search?q=${encodeURIComponent(term)}`);
  };

  const handleRemove = (term) => {
    setHistory(removeRecentSearch(term));
    toast.success("Removed from history");
  };

  const handleClearAll = () => {
    setHistory(clearRecentSearches());
    toast.success("Search history cleared");
  };

  return (
    <div className="min-h-screen bg-background pt-6 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full glass-btn border border-border flex items-center justify-center"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Search History</h1>
            <p className="text-sm text-muted-foreground">Your recent searches on Cravon</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden">
          {history.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <FaClock size={12} /> {history.length} search{history.length !== 1 ? "es" : ""}
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
                >
                  <FaTrash size={11} /> Clear all
                </button>
              </div>
              <ul className="divide-y divide-border">
                {history.map((term) => (
                  <li key={term} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                    <FaSearch className="text-muted-foreground shrink-0" size={14} />
                    <button
                      type="button"
                      onClick={() => handleSelect(term)}
                      className="flex-1 text-left text-sm font-medium text-foreground hover:text-primary truncate"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(term)}
                      className="text-muted-foreground hover:text-foreground text-lg leading-none px-2"
                      aria-label={`Remove ${term}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-center py-16 px-6">
              <FaSearch className="mx-auto mb-3 text-muted-foreground opacity-40" size={32} />
              <p className="text-lg font-semibold text-foreground mb-1">No search history yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Searches you make will appear here for quick access.
              </p>
              <Link to="/home/search" className="btn-primary rounded-full px-6 inline-block">
                Start searching
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryPage;
