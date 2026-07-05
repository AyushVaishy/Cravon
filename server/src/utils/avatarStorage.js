const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/avatars");
const MAX_BYTES = 10 * 1024 * 1024;

const saveAvatarFromDataUrl = (userId, dataUrl) => {
  const match = String(dataUrl || "").match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!match) {
    const err = new Error("Invalid image. Use JPEG, PNG, or WebP under 10 MB.");
    err.status = 400;
    throw err;
  }

  const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) {
    const err = new Error("Image too large. Maximum size is 10 MB.");
    err.status = 400;
    throw err;
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const filePath = path.join(UPLOAD_DIR, `${userId}.${ext}`);
  const legacyExts = ["jpg", "jpeg", "png", "webp"].filter((e) => e !== ext);
  legacyExts.forEach((e) => {
    const legacy = path.join(UPLOAD_DIR, `${userId}.${e}`);
    if (fs.existsSync(legacy)) fs.unlinkSync(legacy);
  });

  fs.writeFileSync(filePath, buffer);
  return `/uploads/avatars/${userId}.${ext}`;
};

const removeAvatarFiles = (userId) => {
  ["jpg", "jpeg", "png", "webp"].forEach((ext) => {
    const filePath = path.join(UPLOAD_DIR, `${userId}.${ext}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

module.exports = { saveAvatarFromDataUrl, removeAvatarFiles };
