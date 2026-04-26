import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createBookingSchema } from "../validators/bookings.validator";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /bookings
export const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        guest: { select: { name: true } },
        listing: { select: { title: true } }
      }
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// GET /bookings/:id
export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        listing: {
          include: {
            host: { select: { name: true } }
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// POST /bookings
export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const { listingId, checkIn, checkOut } = result.data;

    // use req.userId — never from request body
    const guestId = req.userId!;

    // parse dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // validate checkIn is before checkOut
    if (checkInDate >= checkOutDate) {
      res.status(400).json({ message: "checkIn must be before checkOut" });
      return;
    }

    // validate checkIn is in the future
    if (checkInDate <= new Date()) {
      res.status(400).json({ message: "checkIn must be in the future" });
      return;
    }

    // verify listing exists
    const listing = await prisma.listing.findFirst({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // check for booking conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: "CONFIRMED",
        AND: [
          { checkIn: { lt: checkOutDate } },   // existing starts before new ends
          { checkOut: { gt: checkInDate } }     // existing ends after new starts
        ]
      }
    });

    if (conflict) {
      res.status(409).json({ message: "Listing is already booked for these dates" });
      return;
    }

    // calculate total price server-side
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * listing.pricePerNight;

    const newBooking = await prisma.booking.create({
      data: {
        guestId,
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        status: "PENDING"
      }
    });

    res.status(201).json(newBooking);
  } catch (error) {
    next(error);
  }
};

// DELETE /bookings/:id — cancel booking
export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    const booking = await prisma.booking.findFirst({ where: { id } });
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // only the guest who made the booking can cancel
    if (booking.guestId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only cancel your own bookings" });
      return;
    }

    // check not already cancelled
    if (booking.status === "CANCELLED") {
      res.status(400).json({ message: "Booking is already cancelled" });
      return;
    }

    // update status — do NOT delete, keep for history
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    res.json({ message: "Booking cancelled successfully", booking: updated });
  } catch (error) {
    next(error);
  }
};

