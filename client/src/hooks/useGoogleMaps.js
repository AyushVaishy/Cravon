import { useState, useEffect } from "react";
import { getMapsConfig } from "../services/locationService";

let scriptPromise = null;

const loadGoogleMapsScript = (apiKey) => {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

const useGoogleMaps = () => {
  const [ready, setReady] = useState(Boolean(window.google?.maps));
  const [apiKey, setApiKey] = useState(null);
  const [placesEnabled, setPlacesEnabled] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMapsConfig()
      .then((res) => {
        if (cancelled) return;
        setPlacesEnabled(Boolean(res.data.googlePlacesEnabled));
        const key = res.data.googleMapsJsKey;
        if (!key) return;
        setApiKey(key);
        return loadGoogleMapsScript(key);
      })
      .then(() => {
        if (!cancelled) setReady(Boolean(window.google?.maps));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Maps unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, apiKey, placesEnabled, error };
};

export default useGoogleMaps;
