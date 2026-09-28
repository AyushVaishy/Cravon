const jwt = require("jsonwebtoken");

/** Attaches req.user when a valid Bearer token is present; otherwise continues without user. */
const optionalAuthenticate = (req, _res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
};

module.exports = { optionalAuthenticate };
