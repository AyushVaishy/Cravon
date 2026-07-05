export const HOME_LABEL = "Home";
export const WORK_LABEL = "Work";
export const OTHER_LABEL = "Other";

export const resolveLabelType = (label) => {
  if (label === HOME_LABEL) return HOME_LABEL;
  if (label === WORK_LABEL) return WORK_LABEL;
  return OTHER_LABEL;
};

export const buildLabelFromForm = (form) => {
  if (form.labelType === HOME_LABEL || form.labelType === WORK_LABEL) return form.labelType;
  return form.customLabel?.trim() || "";
};

export const isStandardLabelTaken = (addresses, standardLabel, editingId = null) =>
  (addresses || []).some((a) => a.label === standardLabel && a.id !== editingId);

export const defaultLabelTypeForNew = (addresses) => {
  if (!isStandardLabelTaken(addresses, HOME_LABEL)) return HOME_LABEL;
  if (!isStandardLabelTaken(addresses, WORK_LABEL)) return WORK_LABEL;
  return OTHER_LABEL;
};

export const addressToForm = (addr) => ({
  labelType: resolveLabelType(addr.label),
  customLabel: resolveLabelType(addr.label) === OTHER_LABEL ? addr.label : "",
  contactName: addr.contactName || "",
  contactPhone: addr.contactPhone || "",
  street: addr.street || "",
  city: addr.city || "",
  state: addr.state || "",
  pincode: addr.pincode || "",
  lat: addr.lat ?? null,
  lng: addr.lng ?? null,
});

export const validateAddressForm = (form, existingAddresses = [], editingId = null) => {
  if (form.labelType === OTHER_LABEL) {
    const custom = form.customLabel?.trim() || "";
    if (custom.length < 2) {
      return "Enter a name for this address (e.g. Friend's house, Club)";
    }
    if ([HOME_LABEL.toLowerCase(), WORK_LABEL.toLowerCase()].includes(custom.toLowerCase())) {
      return "Use the Home or Work label instead of a custom name";
    }
  }

  if (form.labelType === HOME_LABEL && isStandardLabelTaken(existingAddresses, HOME_LABEL, editingId)) {
    return "You already have a Home address. Edit the existing one or pick another label.";
  }
  if (form.labelType === WORK_LABEL && isStandardLabelTaken(existingAddresses, WORK_LABEL, editingId)) {
    return "You already have a Work address. Edit the existing one or pick another label.";
  }

  if (!form.contactName?.trim()) return "Contact name is required for delivery";
  const phone = String(form.contactPhone || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(phone)) return "Enter a valid 10-digit contact number";

  if (!form.street?.trim() || !form.city?.trim() || !form.state?.trim() || !form.pincode?.trim()) {
    return "Street, city, state, and pincode are required";
  }
  if (!/^\d{6}$/.test(String(form.pincode).trim())) return "Enter a valid 6-digit pincode";

  return null;
};

export const formToPayload = (form) => ({
  label: buildLabelFromForm(form),
  contactName: form.contactName.trim(),
  contactPhone: String(form.contactPhone).replace(/\D/g, "").slice(-10),
  street: form.street.trim(),
  city: form.city.trim(),
  state: form.state.trim(),
  pincode: form.pincode.trim(),
  ...(form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : {}),
});
