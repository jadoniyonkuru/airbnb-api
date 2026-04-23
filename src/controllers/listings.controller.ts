import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator";

// GET /listings
export const getAllListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        host: { select: { name: true, avatar: true } },
        _count: { select: { bookings: true } }  // 👈 booking count
      }
    });
    res.json(listings);
  } catch (error) {
    next(error);
  }
};

// GET /listings/:id
export const getListingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: true,
        bookings: {
          include: {
            guest: {
              select: { name: true, avatar: true }  // 👈 guest name and avatar per booking
            }
          }
        }
      }
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    res.json(listing);
  } catch (error) {
    next(error);
  }
};

// POST /listings
export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = createListingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    const hostId = req.body.hostId;
    if (!hostId) {
      res.status(400).json({ message: "hostId is required" });
      return;
    }

    const host = await prisma.user.findFirst({ where: { id: hostId } });
    if (!host) {
      res.status(404).json({ message: "Host not found" });
      return;
    }

    const newListing = await prisma.listing.create({
      data: { ...result.data, hostId }
    });

    res.status(201).json(newListing);
  } catch (error) {
    next(error);
  }
};

// PUT /listings/:id
export const updateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);

    const result = updateListingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }

    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: result.data
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /listings/:id
export const deleteListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    await prisma.listing.delete({ where: { id } });
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    next(error);
  }
};