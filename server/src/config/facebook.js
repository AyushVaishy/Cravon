const { getApiBaseUrl } = require("./google");

const FB_GRAPH_VERSION = "v21.0";
const FB_GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
const FB_DIALOG = `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth`;

const getFacebookConfig = () => {
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  const redirectUri =
    process.env.FACEBOOK_CALLBACK_URL?.trim() ||
    `${getApiBaseUrl()}/api/auth/facebook/callback`;

  if (!appId || !appSecret) {
    throw new Error("FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set");
  }

  if (!redirectUri.startsWith("http")) {
    throw new Error("Set FACEBOOK_CALLBACK_URL (or API_URL) for Facebook OAuth redirect URI");
  }

  return { appId, appSecret, redirectUri };
};

const getFacebookAuthUrl = (state) => {
  const { appId, redirectUri } = getFacebookConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: "email,public_profile",
    response_type: "code",
  });
  return `${FB_DIALOG}?${params.toString()}`;
};

const exchangeFacebookCode = async (code) => {
  const { appId, appSecret, redirectUri } = getFacebookConfig();
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(`${FB_GRAPH}/oauth/access_token?${params.toString()}`);
  const body = await response.json();

  if (!response.ok || !body.access_token) {
    const err = new Error(body.error?.message || "Failed to exchange Facebook authorization code");
    err.status = 401;
    throw err;
  }

  return body.access_token;
};

const fetchFacebookProfile = async (accessToken) => {
  const params = new URLSearchParams({
    fields: "id,name,email,picture.type(large)",
    access_token: accessToken,
  });

  const response = await fetch(`${FB_GRAPH}/me?${params.toString()}`);
  const body = await response.json();

  if (!response.ok || !body.id) {
    const err = new Error(body.error?.message || "Failed to fetch Facebook profile");
    err.status = 401;
    throw err;
  }

  return body;
};

module.exports = {
  getFacebookAuthUrl,
  exchangeFacebookCode,
  fetchFacebookProfile,
};
