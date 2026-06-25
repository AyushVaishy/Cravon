const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions());
};

module.exports = { setRefreshCookie, clearRefreshCookie, refreshCookieOptions };
