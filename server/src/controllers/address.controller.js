const prisma = require("../config/prisma");
const { geocodeAddressParts, searchLocations } = require("../services/geocodingService");
const { isValidCoord } = require("../utils/geo");

const HOME_LABEL = "Home";
const WORK_LABEL = "Work";

const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(-10);

const normalizeLabel = (label) => {
  const trimmed = String(label || "").trim();
  if (trimmed === HOME_LABEL || trimmed === WORK_LABEL) return trimmed;
  if (trimmed.length < 2) return null;
  if ([HOME_LABEL.toLowerCase(), WORK_LABEL.toLowerCase()].includes(trimmed.toLowerCase())) return null;
  return trimmed;
};

const assertUniqueStandardLabel = async (userId, label, excludeId) => {
  if (label !== HOME_LABEL && label !== WORK_LABEL) return null;
  const existing = await prisma.address.findFirst({
    where: {
      userId,
      label,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (existing) {
    return `You already have a ${label} address. Edit the existing one or choose another label.`;
  }
  return null;
};

const validateAddressBody = async (body, userId, excludeId = null) => {
  const label = normalizeLabel(body.label);
  if (!label) {
    return "Label is required. Use Home, Work, or a custom name (e.g. Friend's house).";
  }

  const labelError = await assertUniqueStandardLabel(userId, label, excludeId);
  if (labelError) return labelError;

  const contactName = String(body.contactName || "").trim();
  if (!contactName) return "Contact name is required for delivery";

  const contactPhone = normalizePhone(body.contactPhone);
  if (!/^\d{10}$/.test(contactPhone)) return "Enter a valid 10-digit contact number";

  if (!body.street?.trim() || !body.city?.trim() || !body.state?.trim() || !body.pincode?.trim()) {
    return "Street, city, state, and pincode are required";
  }
  if (!/^\d{6}$/.test(String(body.pincode).trim())) return "Enter a valid 6-digit pincode";

  return null;
};

const resolveCoords = async ({ street, city, state, pincode, lat, lng }) => {
  if (isValidCoord(lat, lng)) {
    return { lat: Number(lat), lng: Number(lng) };
  }

  const pin = String(pincode || "").trim();
  if (/^\d{6}$/.test(pin)) {
    const pinResults = await searchLocations(pin);
    if (pinResults.length > 0) {
      return { lat: pinResults[0].lat, lng: pinResults[0].lng };
    }
  }

  const geocoded = await geocodeAddressParts({ street, city, state, pincode });
  if (geocoded) return geocoded;
  return { lat: 0, lng: 0 };
};

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json({ addresses });
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const validationError = await validateAddressBody(req.body, req.user.id);
    if (validationError) return res.status(400).json({ message: validationError });

    const { street, city, state, pincode, lat, lng, isDefault } = req.body;
    const label = normalizeLabel(req.body.label);
    const contactName = String(req.body.contactName).trim();
    const contactPhone = normalizePhone(req.body.contactPhone);

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }

    const coords = await resolveCoords({ street, city, state, pincode, lat, lng });

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        label,
        contactName,
        contactPhone,
        street,
        city,
        state,
        pincode,
        lat: coords.lat,
        lng: coords.lng,
        isDefault: isDefault || false,
      },
    });
    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: "Address not found" });

    const merged = {
      label: req.body.label ?? existing.label,
      contactName: req.body.contactName ?? existing.contactName,
      contactPhone: req.body.contactPhone ?? existing.contactPhone,
      street: req.body.street ?? existing.street,
      city: req.body.city ?? existing.city,
      state: req.body.state ?? existing.state,
      pincode: req.body.pincode ?? existing.pincode,
      lat: req.body.lat ?? existing.lat,
      lng: req.body.lng ?? existing.lng,
    };

    const validationError = await validateAddressBody(merged, req.user.id, req.params.id);
    if (validationError) return res.status(400).json({ message: validationError });

    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }

    const data = { ...req.body };
    delete data.userId;

    if (data.label != null) data.label = normalizeLabel(data.label);
    if (data.contactName != null) data.contactName = String(data.contactName).trim();
    if (data.contactPhone != null) data.contactPhone = normalizePhone(data.contactPhone);

    const needsGeocode =
      (data.street || data.city || data.pincode) &&
      (!isValidCoord(data.lat, data.lng) || data.lat === 0);

    if (needsGeocode) {
      const coords = await resolveCoords({
        street: data.street ?? existing.street,
        city: data.city ?? existing.city,
        state: data.state ?? existing.state,
        pincode: data.pincode ?? existing.pincode,
        lat: data.lat,
        lng: data.lng,
      });
      data.lat = coords.lat;
      data.lng = coords.lng;
    }

    const address = await prisma.address.update({ where: { id: req.params.id }, data });
    res.json({ address });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: "Address not found" });
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
};

const setDefault = async (req, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: "Address not found" });
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    const address = await prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } });
    res.json({ address });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress, setDefault };
