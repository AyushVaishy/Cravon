import toast from "react-hot-toast";
import { FaMapMarkerAlt } from "react-icons/fa";
import { reverseGeocode } from "../services/locationService";
import MapLocationPicker from "./maps/MapLocationPicker";
import {
  HOME_LABEL,
  WORK_LABEL,
  OTHER_LABEL,
  isStandardLabelTaken,
} from "../utils/addressLabels";

export const EMPTY_ADDRESS_FORM = {
  labelType: HOME_LABEL,
  customLabel: "",
  contactName: "",
  contactPhone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  lat: null,
  lng: null,
};

const LABEL_OPTIONS = [HOME_LABEL, WORK_LABEL, OTHER_LABEL];

const AddressForm = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = "Save Address",
  saving = false,
  title = "Address details",
  existingAddresses = [],
  editingId = null,
}) => {
  const setField = (field, val) => onChange({ ...value, [field]: val });

  const homeTaken = isStandardLabelTaken(existingAddresses, HOME_LABEL, editingId);
  const workTaken = isStandardLabelTaken(existingAddresses, WORK_LABEL, editingId);

  const handleMapPin = async (latitude, longitude) => {
    try {
      const res = await reverseGeocode(latitude, longitude);
      const loc = res.data.location;
      const parts = loc?.displayName ? loc.displayName.split(",").map((s) => s.trim()) : [];
      const pinFromName = parts.find((p) => /^\d{6}$/.test(p)) || value.pincode;
      onChange({
        ...value,
        lat: latitude,
        lng: longitude,
        street: parts[0] || value.street,
        city: parts.find((p) => !/^\d{6}$/.test(p) && p !== parts[0]) || value.city,
        state: parts[parts.length - 2] || value.state,
        pincode: pinFromName || value.pincode,
      });
      toast.success("Location pinned on map");
    } catch {
      onChange({ ...value, lat: latitude, lng: longitude });
      toast.success("Pin set — fill address details if needed");
    }
  };

  const handleGpsPin = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device");
      return;
    }
    toast.loading("Pinning your location…", { id: "gps-pin" });
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await reverseGeocode(latitude, longitude);
          const loc = res.data.location;
          if (!loc?.displayName) {
            toast.error("Could not resolve address from GPS", { id: "gps-pin" });
            return;
          }
          const parts = loc.displayName.split(",").map((s) => s.trim());
          const pinFromName = parts.find((p) => /^\d{6}$/.test(p)) || value.pincode;
          onChange({
            ...value,
            lat: loc.lat,
            lng: loc.lng,
            street: parts[0] || value.street,
            city: parts.find((p) => !/^\d{6}$/.test(p) && p !== parts[0]) || value.city,
            state: parts[parts.length - 2] || value.state,
            pincode: pinFromName || value.pincode,
          });
          toast.success("Location pinned on map", { id: "gps-pin" });
        } catch {
          toast.error("Failed to pin location", { id: "gps-pin" });
        }
      },
      () => toast.error("Location access denied", { id: "gps-pin" }),
      { timeout: 12000 }
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-white/80 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3 shadow-sm"
    >
      <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Save as</p>
        <div className="flex gap-2 flex-wrap">
          {LABEL_OPTIONS.map((lbl) => {
            const disabled =
              (lbl === HOME_LABEL && homeTaken) || (lbl === WORK_LABEL && workTaken);
            return (
              <button
                key={lbl}
                type="button"
                disabled={disabled}
                onClick={() => setField("labelType", lbl)}
                title={
                  disabled
                    ? `You already have a ${lbl} address`
                    : undefined
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  value.labelType === lbl
                    ? "bg-primary text-white border-primary"
                    : disabled
                      ? "border-border text-muted-foreground/40 cursor-not-allowed"
                      : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </div>
        {(homeTaken || workTaken) && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Only one Home and one Work address allowed. Use Other for additional places.
          </p>
        )}
      </div>

      {value.labelType === OTHER_LABEL && (
        <input
          type="text"
          placeholder="Name this place (e.g. Friend's house, Club) *"
          value={value.customLabel || ""}
          onChange={(e) => setField("customLabel", e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Contact name *"
          value={value.contactName || ""}
          onChange={(e) => setField("contactName", e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        />
        <input
          type="tel"
          placeholder="Contact number *"
          value={value.contactPhone || ""}
          onChange={(e) => setField("contactPhone", e.target.value)}
          maxLength={14}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        />
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Delivery partner will call this person at this number.
      </p>

      <button
        type="button"
        onClick={handleGpsPin}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5 transition"
      >
        <FaMapMarkerAlt size={12} />
        Use my current GPS location
      </button>

      <MapLocationPicker
        lat={value.lat}
        lng={value.lng}
        onChange={handleMapPin}
        className="mt-2"
      />
      {value.lat && value.lng && (
        <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
          ✓ Location pinned ({Number(value.lat).toFixed(4)}, {Number(value.lng).toFixed(4)})
        </p>
      )}

      {[
        { field: "street", placeholder: "Street / Area *" },
        { field: "city", placeholder: "City *" },
        { field: "state", placeholder: "State *" },
        { field: "pincode", placeholder: "Pincode *" },
      ].map(({ field, placeholder }) => (
        <input
          key={field}
          type="text"
          placeholder={placeholder}
          value={value[field] || ""}
          onChange={(e) => setField(field, e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
        />
      ))}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white py-2 rounded-lg font-semibold text-sm transition"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
