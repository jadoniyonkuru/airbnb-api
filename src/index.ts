import express from "express";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";

const app = express();

app.use(express.json());

app.use("/users", usersRoutes);
app.use("/listings", listingsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
