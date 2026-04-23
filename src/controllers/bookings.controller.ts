import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createBookingSchema } from "../validators/bookings.validator";

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
    const id = parseInt(req.params.id);
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
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const { listingId, checkIn, checkOut } = result.data;
    const guestId = req.body.guestId;

    if (!guestId) {
      res.status(400).json({ message: "guestId is required" });
      return;
    }

    const guest = await prisma.user.findFirst({ where: { id: guestId } });
    if (!guest) {
      res.status(404).json({ message: "Guest not found" });
      return;
    }

    const listing = await prisma.listing.findFirst({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // calculate total price server-side
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
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
        totalPrice
      }
    });

    res.status(201).json(newBooking);
  } catch (error) {
    next(error);
  }
};

// DELETE /bookings/:id
export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.booking.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    next(error);
  }
};