import "dotenv/config";
import express from "express";
import { connectDB } from "./config/prisma";
import { setupSwagger } from "./config/swager";  // check this import
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";
import uploadRoutes from "./routes/upload.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env["PORT"] || 3000;

app.use(express.json());

setupSwagger(app);  //  must be here

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/users", uploadRoutes);
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