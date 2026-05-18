import { z } from "zod";

export const createBookingSchema = z
  .object({
    listingId: z.string(),
    checkIn: z.preprocess((val) => (typeof val === 'string' || val instanceof Date) ? new Date(val) : val, z.date()),
    checkOut: z.preprocess((val) => (typeof val === 'string' || val instanceof Date) ? new Date(val) : val, z.date()),
  })
  .refine(
    (data) => data.checkIn < data.checkOut,
    { message: "checkIn must be before checkOut", path: ["checkIn"] }
  )
  .refine(
    (data) => {
      // Allow same-day bookings. Compare using date-only (ignore time-of-day)
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = startOfDay(new Date());
      const checkInDay = startOfDay(data.checkIn);
      return checkInDay >= today;
    },
    { message: "checkIn must be today or in the future", path: ["checkIn"] }
  );