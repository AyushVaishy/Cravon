const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = (maxAge = DEFAULT_REFRESH_MS) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge,
  path: "/",
});

const setRefreshCookie = (res, token, rememberMe = false) => {
  const maxAge = rememberMe ? REMEMBER_ME_REFRESH_MS : DEFAULT_REFRESH_MS;
  res.cookie("refreshToken", token, refreshCookieOptions(maxAge));
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions(DEFAULT_REFRESH_MS));
  res.clearCookie("refreshToken", refreshCookieOptions(REMEMBER_ME_REFRESH_MS));
};

module.exports = { setRefreshCookie, clearRefreshCookie, refreshCookieOptions };
