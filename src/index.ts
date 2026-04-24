import "dotenv/config";
import express from "express";
import { connectDB } from "./config/prisma";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";

const app = express();
const PORT = process.env["PORT"] || 3000;

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookings", bookingsRoutes);

// catch-all 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// global error handler — must be last 
app.use(errorHandler);

const main = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

main();