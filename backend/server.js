import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import {
  authRoutes,
  userRoutes,
  adminRoutes,
  productRoutes,
  cartRoutes,
  orderRoutes,
  adminOrderRoutes,
  reviewRoutes,
  couponRoutes,
  categoryRoutes,
  brandRoutes,
  modelRoutes,
  settingsRoutes,
  heroSliderRoutes
} from './routes/index.js';
import birthdayRoutes from './routes/birthdayRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting Server...");
console.log("Environment:", process.env.NODE_ENV);

// ✅ PRODUCTION CORS (CLEAN & SAFE)
const allowedOrigins = [
  "https://srikrishnadigitalworld.in",
  "https://www.srikrishnadigitalworld.in",
  "https://admin.srikrishnadigitalworld.in",
  "https://www.admin.srikrishnadigitalworld.in"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/birthdays", birthdayRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/hero-slider", heroSliderRoutes);
app.use("/api", settingsRoutes);

// Health
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running",
    env: process.env.NODE_ENV
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  if (err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS not allowed"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// Start Server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Database synced");

    app.listen(PORT, () => {
      console.log("=================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log("=================================");
    });

  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
};

startServer();

export default app;
