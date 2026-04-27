import "dotenv/config";
import express from "express";
import { connectDB } from "./config/prisma";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";
import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";  
import { errorHandler } from "./middleware/errorHandler";
import upload from "./config/multer";

const app = express();
const PORT = process.env["PORT"] || 3000;

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("", uploadRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookings", bookingsRoutes);

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