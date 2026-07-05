import { FaClock, FaFire, FaMicrophone, FaSearch } from "react-icons/fa";

const SearchAssistPanel = ({
  recent = [],
  trending = [],
  onSelect,
  onRemoveRecent,
  onClearRecent,
  voiceSupported = false,
  onVoiceStart,
  listening = false,
  showVoiceHint = true,
}) => (
  <div className="py-2">
    {showVoiceHint && voiceSupported && (
      <button
        type="button"
        onClick={onVoiceStart}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          listening ? "bg-primary/10 text-primary" : "hover:bg-white/40 dark:hover:bg-white/10"
        }`}
      >
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${listening ? "bg-primary text-white animate-pulse" : "bg-primary/10 text-primary"}`}>
          <FaMicrophone size={14} />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">{listening ? "Listening…" : "Search by voice"}</p>
          <p className="text-xs text-muted-foreground">Say a dish, restaurant, or cuisine</p>
        </div>
      </button>
    )}

    {recent.length > 0 && (
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <FaClock size={10} /> Recent
          </p>
          <button type="button" onClick={onClearRecent} className="text-[11px] text-primary font-semibold hover:underline">
            Clear
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {recent.map((term) => (
            <span key={term} className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(term)}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition"
              >
                {term}
              </button>
              {onRemoveRecent && (
                <button
                  type="button"
                  onClick={() => onRemoveRecent(term)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                  aria-label={`Remove ${term}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>
    )}

    {trending.length > 0 && (
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
          <FaFire size={10} className="text-orange-500" /> Trending
        </p>
        <div className="flex flex-wrap gap-2">
          {trending.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSelect(term)}
              className="px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    )}

    {recent.length === 0 && trending.length === 0 && (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        <FaSearch className="mx-auto mb-2 opacity-40" />
        Search restaurants, cuisines, or dishes
      </div>
    )}
  </div>
);

export default SearchAssistPanel;
