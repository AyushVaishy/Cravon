const errorHandler = (err, req, res, next) => {
  const isPayloadTooLarge =
    err.type === "entity.too.large" ||
    err.status === 413 ||
    err.statusCode === 413 ||
    err.code === "LIMIT_FILE_SIZE" ||
    /entity too large|file too large/i.test(err.message || "");

  const status = isPayloadTooLarge ? 413 : err.status || 500;
  const message = isPayloadTooLarge
    ? "File too large. Maximum upload size is 10 MB."
    : err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  const err = new Error(`Not Found — ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

module.exports = { errorHandler, notFound };
