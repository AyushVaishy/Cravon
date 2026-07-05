const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/avatars");
const MAX_BYTES = 10 * 1024 * 1024;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const extForMime = (mime) => {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = extForMime(file.mimetype) || "jpg";
    cb(null, `${req.user.id}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (extForMime(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  },
});

const removeLegacyAvatarFiles = (userId, keepExt) => {
  ["jpg", "jpeg", "png", "webp"].forEach((ext) => {
    if (ext === keepExt) return;
    const filePath = path.join(UPLOAD_DIR, `${userId}.${ext}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

module.exports = {
  uploadAvatarMiddleware: upload.single("avatar"),
  removeLegacyAvatarFiles,
  UPLOAD_DIR,
};
