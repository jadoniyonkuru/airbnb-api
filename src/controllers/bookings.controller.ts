import { Request, Response } from "express";
import prisma from "../config/prisma";

// GET /bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        guest: { select: { name: true } },
        listing: { select: { title: true } }
      }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /bookings/:id
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { guest: true, listing: true }
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /bookings
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { guestId, listingId, checkIn, checkOut } = req.body;

    if (!guestId || !listingId || !checkIn || !checkOut) {
      res.status(400).json({ message: "Missing required fields: guestId, listingId, checkIn, checkOut" });
      return;
    }

    // verify guest exists
    const guest = await prisma.user.findFirst({ where: { id: guestId } });
    if (!guest) {
      res.status(404).json({ message: "Guest not found" });
      return;
    }

    // verify listing exists
    const listing = await prisma.listing.findFirst({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // calculate total price server-side
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.pricePerNight;

    const newBooking = await prisma.booking.create({
      data: { guestId, listingId, checkIn: checkInDate, checkOut: checkOutDate, totalPrice }
    });

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /bookings/:id
export const deleteBooking = async (req: Request, res: Response) => {
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
    res.status(500).json({ message: "Something went wrong" });
  }
};