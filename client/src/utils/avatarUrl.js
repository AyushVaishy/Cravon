const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const resolveAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  const url = `${origin}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  // Bust cache when the same filename is overwritten on re-upload
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(avatar.split("/").pop() || "1")}`;
};

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
