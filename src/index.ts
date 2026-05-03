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
import aiRoutes from "./routes/ai.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

// request logging
app.use(
  process.env["NODE_ENV"] === "production"
    ? morgan("combined")
    : morgan("dev")
);

// CORS configuration - allow Swagger UI and development origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json());
app.use(generalLimiter);

// health check — must be FIRST before everything
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
v1.use("/users", uploadRoutes);
v1.use("/listings", listingsRoutes);
v1.use("/bookings", bookingsRoutes);
v1.use(reviewsRoutes);

// mount v1
app.use("/api/v1", v1);

// AI routes (separate from v1 for now)
app.use("/ai", aiRoutes);

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

// global error handler — must be last
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