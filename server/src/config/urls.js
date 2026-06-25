/**
 * Canonical frontend URLs — used for OAuth redirects, password-reset links, etc.
 * Development:  http://localhost:3000
 * Production:   https://cravon-frontend.onrender.com
 *
 * Override only if needed: FRONTEND_URL env var (optional).
 */

const DEV_FRONTEND_URL = "http://localhost:3000";
const PROD_FRONTEND_URL = "https://cravon-frontend.onrender.com";

const isProduction = () => process.env.NODE_ENV === "production";

const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }
  return (isProduction() ? PROD_FRONTEND_URL : DEV_FRONTEND_URL).replace(/\/$/, "");
};

/** CORS allowlist — defaults to both dev + prod frontends; extend via CLIENT_URL. */
const getAllowedOrigins = () => {
  const defaults = [DEV_FRONTEND_URL, PROD_FRONTEND_URL];
  if (!process.env.CLIENT_URL) return defaults;

  const extra = process.env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
  return [...new Set([...defaults, ...extra])];
};

module.exports = {
  DEV_FRONTEND_URL,
  PROD_FRONTEND_URL,
  getFrontendUrl,
  getAllowedOrigins,
};
