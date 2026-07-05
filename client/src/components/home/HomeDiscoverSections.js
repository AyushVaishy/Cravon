import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { searchLocations } from "../../services/locationService";
import { SERVED_CITIES, PLATFORM_CUISINES } from "../../data/platformCatalog";

const INITIAL_VISIBLE = 11;

const DiscoverGrid = ({ title, items, renderLabel, onSelect, expanded, onToggleExpand }) => {
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const showToggle = items.length > INITIAL_VISIBLE;

  return (
    <section className="py-10 md:py-12">
      <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {visible.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className="glass-card rounded-xl border border-border/80 px-4 py-3.5 text-left text-sm font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200 line-clamp-2"
          >
            {renderLabel(item)}
          </button>
        ))}
        {showToggle && !expanded && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-xl border border-border/80 px-4 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
          >
            Show More
            <FaChevronDown size={11} />
          </button>
        )}
        {showToggle && expanded && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-xl border border-dashed border-border px-4 py-3.5 text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-1.5 sm:col-span-2 lg:col-span-4"
          >
            Show Less
            <FaChevronUp size={11} />
          </button>
        )}
      </div>
    </section>
  );
};

const HomeDiscoverSections = ({ setLocation, extraCuisines = [] }) => {
  const navigate = useNavigate();
  const [citiesExpanded, setCitiesExpanded] = useState(false);
  const [cuisinesExpanded, setCuisinesExpanded] = useState(false);

  const cuisines = useMemo(() => {
    const merged = new Set([...PLATFORM_CUISINES, ...extraCuisines]);
    return Array.from(merged).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [extraCuisines]);

  const handleCitySelect = async (city) => {
    try {
      const res = await searchLocations(city === "Bangalore" ? "Bengaluru" : city);
      const pick = res.data.results?.[0];
      if (!pick) {
        toast.error(`Could not load ${city}. Try the location picker.`);
        return;
      }
      setLocation({ lat: pick.lat, lng: pick.lng, address: pick.displayName });
      toast.success(`Showing restaurants near ${city}`);
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Failed to switch city. Try again.");
    }
  };

  const handleCuisineSelect = (cuisine) => {
    navigate(`/home/search?q=${encodeURIComponent(`${cuisine} Restaurant`)}`);
  };

  return (
    <div className="border-t border-border/60 mt-4">
      <DiscoverGrid
        title="Best Places to Eat Across Cities"
        items={SERVED_CITIES}
        renderLabel={(city) => `Best Restaurants in ${city}`}
        onSelect={handleCitySelect}
        expanded={citiesExpanded}
        onToggleExpand={() => setCitiesExpanded((v) => !v)}
      />
      <DiscoverGrid
        title="Best Cuisines Near Me"
        items={cuisines}
        renderLabel={(c) => `${c} Restaurant Near Me`}
        onSelect={handleCuisineSelect}
        expanded={cuisinesExpanded}
        onToggleExpand={() => setCuisinesExpanded((v) => !v)}
      />
    </div>
  );
};

export default HomeDiscoverSections;
