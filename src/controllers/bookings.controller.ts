import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createBookingSchema } from "../validators/bookings.validator";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../emails";

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
    const id = req.params.id as string;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        listing: {
          include: { host: { select: { name: true } } }
        }
      }
    });

    if (!booking) { res.status(404).json({ message: "Booking not found" }); return; }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// POST /bookings
export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ errors: result.error.flatten().fieldErrors }); return; }

    const { listingId, checkIn, checkOut } = result.data;
    const guestId = req.userId!;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const listing = await prisma.listing.findFirst({ where: { id: listingId } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: "CONFIRMED",
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } }
        ]
      }
    });
    if (conflict) { res.status(409).json({ message: "Listing is already booked for these dates" }); return; }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.pricePerNight;

    const newBooking = await prisma.booking.create({
      data: { guestId, listingId, checkIn: checkInDate, checkOut: checkOutDate, totalPrice, status: "PENDING" }
    });

    try {
      const guest = await prisma.user.findUnique({ where: { id: guestId } });
      await sendEmail(
        guest!.email,
        "Booking Confirmed!",
        bookingConfirmationEmail(guest!.name, listing.title, listing.location, checkInDate.toDateString(), checkOutDate.toDateString(), totalPrice)
      );
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    res.status(201).json(newBooking);
  } catch (error) {
    next(error);
  }
};

// DELETE /bookings/:id
export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const booking = await prisma.booking.findFirst({ where: { id } });
    if (!booking) { res.status(404).json({ message: "Booking not found" }); return; }

    if (booking.guestId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only cancel your own bookings" }); return;
    }

    if (booking.status === "CANCELLED") {
      res.status(400).json({ message: "Booking is already cancelled" }); return;
    }

    const updated = await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });

    try {
      const guest = await prisma.user.findUnique({ where: { id: booking.guestId } });
      const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } });
      await sendEmail(
        guest!.email,
        "Booking Cancelled",
        bookingCancellationEmail(guest!.name, listing!.title, booking.checkIn.toDateString(), booking.checkOut.toDateString())
      );
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    res.json({ message: "Booking cancelled successfully", booking: updated });
  } catch (error) {
    next(error);
  }
};
