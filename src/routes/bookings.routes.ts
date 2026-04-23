import { Router } from "express";
import {
  getAllBookings, getBookingById,
  createBooking, deleteBooking
} from "../controllers/bookings.controller";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../validators/bookings.validator";

const router = Router();

router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.post("/", validate(createBookingSchema), createBooking);
router.delete("/:id", deleteBooking);

export default router;