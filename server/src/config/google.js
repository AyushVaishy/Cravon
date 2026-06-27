const { OAuth2Client } = require("google-auth-library");

const getApiBaseUrl = () => {
  const raw = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
  return raw.replace(/\/api$/, "");
};

const getGoogleOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL ||
    `${getApiBaseUrl()}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }

  if (!redirectUri || !redirectUri.startsWith("http")) {
    throw new Error("Set GOOGLE_CALLBACK_URL (or API_URL) for Google OAuth redirect URI");
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
};

module.exports = { getGoogleOAuthClient, getApiBaseUrl };
