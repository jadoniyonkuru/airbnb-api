import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/prisma";
import { setupSwagger } from "./config/swagger";
import { generalLimiter } from "./middleware/rateLimiter";
import authRoutes from "./routes/v1/auth.routes";
import usersRoutes from "./routes/v1/users.routes";
import listingsRoutes from "./routes/v1/listings.routes";
import bookingsRoutes from "./routes/v1/bookings.routes";
import uploadRoutes from "./routes/v1/upload.routes";
import reviewsRoutes from "./routes/v1/reviews.routes";
import aiRoutes from "./routes/v1/ai.routes";
import messagesRoutes from "./routes/v1/messages.routes";
import adminRoutes from "./routes/v1/admin.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

// request logging
app.use(
  process.env["NODE_ENV"] === "production"
    ? morgan("combined")
    : morgan("dev")
);

const ALLOWED_ORIGINS = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return callback(null, true);
    } catch (e) {
      // fallthrough
    }
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json());
app.use(generalLimiter);

// health check â€” must be FIRST before everything
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// swagger docs
setupSwagger(app);

// v1 router
const v1 = express.Router();

// v1 root info
v1.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Airbnb API v1",
    docs: `http://localhost:${PORT}/api-docs`,
    version: "1.0.0"
  });
});

v1.use("/auth", authRoutes);
v1.use("/users", usersRoutes);
// Mount upload routes at root so they register paths like
// /users/:id/avatar and /listings/:id/photos (not /users/listings/...)
v1.use("/", uploadRoutes);
v1.use("/listings", listingsRoutes);
v1.use("/bookings", bookingsRoutes);
v1.use("/ai", aiRoutes);
v1.use("/messages", messagesRoutes);
v1.use(reviewsRoutes);
v1.use("/admin", adminRoutes);

// mount v1
app.use("/api/v1", v1);

// Support legacy links that point directly to the backend host (no /api/v1 prefix)
const FRONTEND_URL = process.env["FRONTEND_URL"] || "http://localhost:5173";
app.get("/auth/reset-password/:token", (req, res) => {
  const { token } = req.params;
  res.redirect(`${FRONTEND_URL}/reset-password/${token}`);
});

// old URL redirects
app.use("/users", (req: Request, res: Response) => {
  res.status(301).json({ message: "API has moved. Please use /api/v1/users" });
});

app.use("/listings", (req: Request, res: Response) => {
  res.status(301).json({ message: "API has moved. Please use /api/v1/listings" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// global error handler â€” must be last
app.use(errorHandler);

const main = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/v1`);
    console.log(`Health check at http://localhost:${PORT}/health`);
  });
};

main();
