import { Router } from "express";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  deleteBooking
} from "../controllers/bookings.controller";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../validators/bookings.validator";
import { authenticate, requireGuest } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getAllBookings);
router.get("/:id", authenticate, getBookingById);
router.post("/", authenticate, requireGuest, validate(createBookingSchema), createBooking); // 👈 guests only
router.delete("/:id", authenticate, deleteBooking);

export default router;