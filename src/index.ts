import "dotenv/config";
import express from "express";
import compression from "compression";
import { connectDB } from "./config/prisma";
import { setupSwagger } from "./config/swagger";
import { generalLimiter } from "./middleware/rateLimiter";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";
import uploadRoutes from "./routes/upload.routes";
import reviewsRoutes from "./routes/reviews.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env["PORT"] || 3000;

// 👇 compression — before all routes
app.use(compression());

app.use(express.json());

// 👇 general rate limiter — all routes
app.use(generalLimiter);

// swagger docs
setupSwagger(app);

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/users", uploadRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookings", bookingsRoutes);

// 👇 reviews mounted with no prefix — routes handle full paths
app.use(reviewsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const main = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

main();