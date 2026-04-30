import "dotenv/config";
import express from "express";
import compression from "compression";
import { connectDB } from "../../config/prisma";
import { setupSwagger } from "../../config/swagger";
import { generalLimiter } from "../../middleware/rateLimiter";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import listingsRoutes from "./listings.routes";
import bookingsRoutes from "./bookings.routes";
import uploadRoutes from "./upload.routes";
import reviewsRoutes from "./reviews.routes";
import { errorHandler } from "../../middleware/errorHandler";

const app = express();
const PORT = process.env["PORT"] || 3000;

// compression middleware
app.use(compression());
app.use(express.json());

// general rate limiter
app.use(generalLimiter);

// swagger docs
setupSwagger(app);

// 👇 API versioning — all routes under /api/v1
const v1 = express.Router();

v1.use("/auth", authRoutes);
v1.use("/users", usersRoutes);
v1.use("/listings", listingsRoutes);
v1.use("/bookings", bookingsRoutes);
v1.use(reviewsRoutes);
v1.use(uploadRoutes);

// mount v1 router
app.use("/api/v1", v1);
//health check
app.get("/api/v1", (req, res) => {
  res.json({
    message: "Airbnb API v1",
    docs: "http://localhost:3000/api-docs",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      listings: "/api/v1/listings",
      bookings: "/api/v1/bookings",
      reviews: "/api/v1/listings/:id/reviews"
    }
  });
});

// catch-all 404 — must be last
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
// helpful message for old routes
app.use("/users", (req, res) => {
  res.status(301).json({
    message: "API has moved. Please use /api/v1/users"
  });
});

app.use("/listings", (req, res) => {
  res.status(301).json({
    message: "API has moved. Please use /api/v1/listings"
  });
});

// catch-all 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const main = async () => {
  await connectDB();
};
app.get("/api/v1", (req, res) => {
  res.json({
    message: "Airbnb API v1",
    docs: "http://localhost:3000/api-docs",
    version: "1.0.0"
  });
});

main();

export default app;