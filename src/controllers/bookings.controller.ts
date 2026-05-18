import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createBookingSchema } from "../validators/bookings.validator";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../emails";

// GET /bookings
export const getAllBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let where: any = {};
    // Admin sees all bookings
    if (req.role === "ADMIN") {
      where = {};
    } else if (req.role === "HOST") {
      // Hosts see bookings for their listings
      where = { listing: { is: { hostId: req.userId } } };
    } else {
      // Guests see only their own bookings
      where = { guestId: req.userId };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        guest: { select: { id: true, name: true, email: true, avatar: true } },
        listing: {
          select: {
            id: true, title: true, location: true, pricePerNight: true,
            photos: { take: 1 }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};

// GET /bookings/user/:id
export const getBookingsByUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string;
    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: {
        guest: { select: { id: true, name: true, email: true, avatar: true } },
        listing: { select: { id: true, title: true, location: true, pricePerNight: true, photos: { take: 1 } , host: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: bookings });
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
    res.json({ data: booking });
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

    res.status(201).json({ data: newBooking });
  } catch (error) {
    next(error);
  }
};

// PUT /bookings/:id  (host accepts or declines)
export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      res.status(400).json({ message: "Invalid status. Must be CONFIRMED, CANCELLED, or COMPLETED" });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: { select: { name: true, email: true } },
      },
    });

    if (!booking) { res.status(404).json({ message: "Booking not found" }); return; }

    // Verify the caller is the host of this listing, or admin
    const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "Only the host can accept or decline bookings" });
      return;
    }

    const updated = await prisma.booking.update({ where: { id }, data: { status } });

    // Notify the guest by email
    try {
      if (status === "CONFIRMED") {
        await sendEmail(
          booking.guest.email,
          "Your Booking Has Been Accepted!",
          bookingConfirmationEmail(
            booking.guest.name, listing.title, listing.location,
            booking.checkIn.toDateString(), booking.checkOut.toDateString(), booking.totalPrice
          )
        );
      } else if (status === "CANCELLED") {
        await sendEmail(
          booking.guest.email,
          "Your Booking Was Declined",
          bookingCancellationEmail(
            booking.guest.name, listing.title,
            booking.checkIn.toDateString(), booking.checkOut.toDateString()
          )
        );
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    res.json({ data: updated });
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
