import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useGoogleMaps from "../../hooks/useGoogleMaps";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const LeafletClickPin = ({ lat, lng, onChange }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  if (!lat || !lng) return null;
  return <Marker position={[lat, lng]} />;
};

const LeafletRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 16, { animate: true });
  }, [lat, lng, map]);
  return null;
};

const GoogleMapPicker = ({ lat, lng, onChange, apiKey }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current) return;

    const center = lat && lng ? { lat, lng } : DEFAULT_CENTER;
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: lat && lng ? 16 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    let marker = null;
    if (lat && lng) {
      marker = new window.google.maps.Marker({ position: center, map, draggable: true });
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        onChange(pos.lat(), pos.lng());
      });
      markerRef.current = marker;
    }

    map.addListener("click", (e) => {
      const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      if (!marker) {
        marker = new window.google.maps.Marker({ position: next, map, draggable: true });
        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          onChange(pos.lat(), pos.lng());
        });
        markerRef.current = marker;
      } else {
        marker.setPosition(next);
      }
      onChange(next.lat, next.lng);
    });

    return () => {
      markerRef.current = null;
    };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!markerRef.current || !lat || !lng) return;
    markerRef.current.setPosition({ lat, lng });
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-48 rounded-xl border border-border overflow-hidden" />;
};

const MapLocationPicker = ({ lat, lng, onChange, className = "" }) => {
  const { ready, apiKey } = useGoogleMaps();
  const center = lat && lng ? [lat, lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  if (ready && apiKey) {
    return (
      <div className={className}>
        <p className="text-[11px] text-muted-foreground mb-2">
          Tap or drag the pin on the map to set your exact delivery location.
        </p>
        <GoogleMapPicker lat={lat} lng={lng} onChange={onChange} apiKey={apiKey} />
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-[11px] text-muted-foreground mb-2">
        Click on the map to drop a pin (OpenStreetMap). Add GOOGLE_MAPS_API_KEY for Google Maps.
      </p>
      <div className="w-full h-48 rounded-xl border border-border overflow-hidden z-0">
        <MapContainer center={center} zoom={lat && lng ? 16 : 12} className="w-full h-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LeafletRecenter lat={lat} lng={lng} />
          <LeafletClickPin lat={lat} lng={lng} onChange={onChange} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapLocationPicker;
