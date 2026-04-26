import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth.types";
import prisma from "../config/prisma";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator";

export const createListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = createListingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const hostId = req.userId!;

    const listing = await prisma.listing.create({
      data: {
        ...result.data,
        hostId
      },
      include: { host: true }
    });

    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

//creating a listing function and updating a listing function
export const updateListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listingId = parseInt(req.params.id);
    if (isNaN(listingId)) {
      res.status(400).json({ error: "Invalid listing ID" });
      return;
    }

    const result = updateListingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    // use req.userId — never from request body
    const hostId = req.userId!;

    // Ensure the listing belongs to the host
    const existingListing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!existingListing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (existingListing.host  !== hostId) {
      res.status(403).json({ error: "You do not have permission to update this listing" });
      return;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: result.data
    });

    res.json(updatedListing);
  } catch (error) {
    next(error);
  }       
};

export const deleteListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listingId = parseInt(req.params.id);
    if (isNaN(listingId)) {
      res.status(400).json({ error: "Invalid listing ID" });
      return;
    }

    // use req.userId — never from request body
    const hostId = req.userId!;

    // Ensure the listing belongs to the host
    const existingListing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!existingListing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (existingListing.host !== hostId) {
      res.status(403).json({ error: "You do not have permission to delete this listing" });
      return;
    }

    await prisma.listing.delete({
      where: { id: listingId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};  
export const getAllListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { host: true }
    });
    res.json(listings);
  } catch (error) {
    next(error);
  }
};
export const getListingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listingId = parseInt(req.params.id);
    if (isNaN(listingId)) {
      res.status(400).json({ error: "Invalid listing ID" });
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { host: true }
    });

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    res.json(listing);
  } catch (error) {
    next(error);
  }
};
export const getUserListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hostId = req.userId!;

    const listings = await prisma.listing.findMany({
      where: { hostId },
      include: { host: true }
    });

    res.json(listings);
  } catch (error) {
    next(error);
  }
};
export const searchListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, checkIn, checkOut, guests } = req.query;

    const whereClause: any = {};

    if (location) {
      whereClause.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (checkIn || checkOut) {
      whereClause.reservations = {
        some: {
          checkIn: { lt: checkOut as string },
          checkOut: { gt: checkIn as string }
        }
      };
    }

    if (guests) {
      whereClause.guestLimit = {
        gte: parseInt(guests as string)
      };
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: { host: true }
    });

    res.json(listings);
  } catch (error) {
    next(error);
  }
};
