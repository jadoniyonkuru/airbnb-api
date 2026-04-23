import "dotenv/config";  // 👈 must be first line
import express from "express";
import { connectDB } from "./config/prisma";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";

const app = express();
const PORT = process.env["PORT"] || 3000;

app.use(express.json());

app.use("/users", usersRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookings", bookingsRoutes);

// catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const main = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

main();