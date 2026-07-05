const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorHandler");
const { getAllowedOrigins } = require("./config/urls");

const authRoutes = require("./routes/auth.routes");
const restaurantRoutes = require("./routes/restaurant.routes");
const menuRoutes = require("./routes/menu.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const addressRoutes = require("./routes/address.routes");
const adminRoutes = require("./routes/admin.routes");
const locationRoutes = require("./routes/location.routes");
const discoveryRoutes = require("./routes/discovery.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();

// Security headers — allow frontend (e.g. :3000) to load /uploads images from API (:5000)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
const normalizeOrigin = (origin) => origin.replace(/\/$/, "");
const ALLOWED_ORIGINS = getAllowedOrigins().map(normalizeOrigin);

if (process.env.NODE_ENV === "production") {
  console.log(`CORS origins: ${ALLOWED_ORIGINS.join(", ")}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);
    // In development, allow any localhost port
    if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(normalizedOrigin)) {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(normalizedOrigin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
// JSON body limit for API payloads (avatar uses multipart, not JSON)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

// Rate limiting — skipped in development to avoid blocks during testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later.",
  skip: () => process.env.NODE_ENV !== "production",
});
app.use("/api", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global error handler
app.use(errorHandler);

module.exports = app;
