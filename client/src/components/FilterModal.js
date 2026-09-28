import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaSearch, FaLeaf } from 'react-icons/fa';
import { SORT_OPTIONS, RATING_OPTIONS, COST_OPTIONS, DELIVERY_TIME_OPTIONS, DISTANCE_OPTIONS } from '../store/filtersSlice';

const LEFT_PANELS = [
  { id: 'sort',         label: 'Sort by' },
  { id: 'cuisines',     label: 'Cuisines' },
  { id: 'rating',       label: 'Rating' },
  { id: 'cost',         label: 'Cost for two' },
  { id: 'deliveryTime', label: 'Delivery Time' },
  { id: 'distance',     label: 'Distance' },
];

const panelHasValue = (id, pending) => {
  if (id === 'sort')         return pending.sortBy !== 'popularity';
  if (id === 'cuisines')     return pending.cuisines.length > 0;
  if (id === 'rating')       return pending.rating !== null;
  if (id === 'cost')         return pending.costRange !== null;
  if (id === 'deliveryTime') return pending.deliveryTimeMax !== null;
  if (id === 'distance')     return pending.maxDistance !== null;
  return false;
};

const countActive = (pending) =>
  LEFT_PANELS.filter((p) => panelHasValue(p.id, pending)).length;

/**
 * FilterModal
 * Props:
 *  isOpen      — boolean
 *  onClose     — () => void
 *  onApply     — (pendingFilters) => void   dispatches applyFilters
 *  current     — current Redux filter state
 *  allCuisines — string[] derived from loaded restaurants
 */
const FilterModal = ({ isOpen, onClose, onApply, current, allCuisines }) => {
  const [activePanel, setActivePanel] = useState('sort');
  const [pending, setPending]         = useState({ ...current });
  const [cuisineSearch, setCuisineSearch] = useState('');

  // Sync pending from Redux each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setPending({ ...current });
      setActivePanel('sort');
      setCuisineSearch('');
    }
  }, [isOpen]); // deliberately exclude `current` — only sync on open

  const handleClear = useCallback(() => {
    setPending({
      sortBy: 'popularity', cuisines: [], rating: null, costRange: null,
      vegOnly: false, nonVegOnly: false, pureVeg: false, openNowOnly: false,
      hasOffers: false, freeDelivery: false, maxDistance: null,
      acceptsOnlinePayment: false, newRestaurants: false, deliveryTimeMax: null,
    });
  }, []);

  const handleApply = useCallback(() => {
    onApply(pending);
    onClose();
  }, [onApply, onClose, pending]);

  const toggleCuisine = useCallback((cuisine) => {
    setPending((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter((c) => c !== cuisine)
        : [...prev.cuisines, cuisine],
    }));
  }, []);

  if (!isOpen) return null;

  const filteredCuisines = allCuisines.filter((c) =>
    c.toLowerCase().includes(cuisineSearch.toLowerCase().trim())
  );

  const activeCount = countActive(pending);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl flex flex-col max-h-[92vh] sm:max-h-[82vh]">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Filters</h2>
            {activeCount > 0 && (
              <span className="bg-primary/50 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition"
            aria-label="Close filters"
          >
            <FaTimes className="text-muted-foreground" size={14} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left nav panel */}
          <div className="w-36 sm:w-44 border-r border-border flex flex-col overflow-y-auto flex-shrink-0">
            {LEFT_PANELS.map((panel) => {
              const isActive  = activePanel === panel.id;
              const hasValue  = panelHasValue(panel.id, pending);
              return (
                <button
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  className={`relative px-4 py-4 text-left text-sm font-medium border-l-[3px] transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                      : 'border-transparent text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {panel.label}
                  {hasValue && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary/50 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right content panel */}
          <div className="flex-1 p-5 overflow-y-auto">

            {/* ── Sort ── */}
            {activePanel === 'sort' && (
              <div className="space-y-4">
                {SORT_OPTIONS.map((opt) => {
                  const selected = pending.sortBy === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setPending((p) => ({ ...p, sortBy: opt.value }))}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected
                            ? 'border-primary bg-primary/50'
                            : 'border-border group-hover:border-primary/40'
                        }`}
                      >
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* ── Cuisines ── */}
            {activePanel === 'cuisines' && (
              <div>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                  <input
                    type="text"
                    placeholder="Search cuisines…"
                    value={cuisineSearch}
                    onChange={(e) => setCuisineSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {pending.cuisines.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pending.cuisines.map((c) => (
                      <button
                        key={c}
                        onClick={() => toggleCuisine(c)}
                        className="flex items-center gap-1 text-xs bg-primary/10 text-primary dark:text-primary px-2 py-1 rounded-full font-medium"
                      >
                        {c} <FaTimes size={9} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredCuisines.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">No cuisines found</p>
                  ) : (
                    filteredCuisines.map((c) => {
                      const checked = pending.cuisines.includes(c);
                      return (
                        <label
                          key={c}
                          className="flex items-center gap-3 cursor-pointer group py-0.5"
                          onClick={() => toggleCuisine(c)}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              checked
                                ? 'border-primary bg-primary/50'
                                : 'border-border group-hover:border-primary/40'
                            }`}
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${checked ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {c}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── Rating ── */}
            {activePanel === 'rating' && (
              <div className="flex flex-wrap gap-3">
                {RATING_OPTIONS.map((opt) => {
                  const selected = pending.rating === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => setPending((p) => ({ ...p, rating: opt.value }))}
                      className={`px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
                        selected
                          ? 'border-primary bg-primary/50 text-white shadow-md'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {opt.label !== 'Any' && '⭐ '}{opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Cost ── */}
            {activePanel === 'cost' && (
              <div className="space-y-3">
                {COST_OPTIONS.map((opt) => {
                  const selected = pending.costRange === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => setPending((p) => ({ ...p, costRange: opt.value }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                        selected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30 dark:hover:border-primary/30'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selected && (
                        <div className="w-5 h-5 rounded-full bg-primary/50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Delivery Time ── */}
            {activePanel === 'deliveryTime' && (
              <div className="space-y-4">
                {DELIVERY_TIME_OPTIONS.map((opt) => {
                  const selected = pending.deliveryTimeMax === opt.value;
                  return (
                    <label
                      key={String(opt.value)}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setPending((p) => ({ ...p, deliveryTimeMax: opt.value }))}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-primary bg-primary/50' : 'border-border group-hover:border-primary/40'}`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {activePanel === 'distance' && (
              <div className="space-y-4">
                {DISTANCE_OPTIONS.map((opt) => {
                  const selected = pending.maxDistance === opt.value;
                  return (
                    <label
                      key={String(opt.value)}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setPending((p) => ({ ...p, maxDistance: opt.value }))}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-primary bg-primary/50' : 'border-border group-hover:border-primary/40'}`}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-card/60">
          <button
            onClick={handleClear}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition underline-offset-2 hover:underline"
          >
            Clear all
          </button>
          <button
            onClick={handleApply}
            className="px-8 py-2.5 bg-primary/50 hover:bg-primary-hover active:bg-primary-hover text-white font-bold rounded-full transition shadow-md text-sm"
          >
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FilterModal;
