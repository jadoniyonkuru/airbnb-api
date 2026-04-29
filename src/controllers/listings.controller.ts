import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator";
import { AuthRequest } from "../middleware/auth.middleware";
import { getCache, setCache, deleteCache } from "../config/cache";

// GET /listings
export const getAllListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //check cache first
    const cacheKey = "listings:all";
    const cached = getCache(cacheKey);
    if (cached) {
      console.log("Returning cached listings");
      res.json(cached);
      return;
    }

    const listings = await prisma.listing.findMany({
      include: {
        host: { select: { name: true, avatar: true } },
        _count: { select: { bookings: true, reviews: true } }
      }
    });

    //cache for 60 seconds
    setCache(cacheKey, listings, 60);

    res.json(listings);
  } catch (error) {
    next(error);
  }
};

// GET /listings/:id
export const getListingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //fix — use bracket notation and validate
    const id = parseInt(req.params["id"] as string);

    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid listing ID" });
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: true,
        bookings: {
          include: {
            guest: {
              select: { name: true, avatar: true }
            }
          }
        },
        reviews: {
          include: {
            user: { select: { name: true, avatar: true } }
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
export const createListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = createListingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    //use hostId from token — never from request body
    const hostId = req.userId!;

    const newListing = await prisma.listing.create({
      data: { ...result.data, hostId }
    });

    // clear cache when new listing is created
    deleteCache("listings:all");
    deleteCache("stats:listings");

    res.status(201).json(newListing);
  } catch (error) {
    next(error);
  }
};

// PUT /listings/:id
export const updateListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params["id"] as string);

    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid listing ID" });
      return;
    }

    const result = updateListingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    //ownership check — ADMIN bypasses
    if (existing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only edit your own listings" });
      return;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: result.data
    });

    // clear cache when listing is updated
    deleteCache("listings:all");
    deleteCache("stats:listings");

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /listings/:id
export const deleteListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params["id"] as string);

    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid listing ID" });
      return;
    }

    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    //ownership check — ADMIN bypasses
    if (existing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only delete your own listings" });
      return;
    }

    await prisma.listing.delete({ where: { id } });

    // clear cache when listing is deleted
    deleteCache("listings:all");
    deleteCache("stats:listings");

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /listings/search
export const searchListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // cast each param to string explicitly
    const location = req.query.location as string | undefined;
    const type = req.query.type as string | undefined;
    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    const guests = req.query.guests as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // build where clause dynamically
    const where: any = {};

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"  // case insensitive
      };
    }

    if (type) {
      where.type = type;
    }

    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) where.pricePerNight.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice);
    }

    if (guests) {
      where.guests = { gte: parseInt(guests) };
    }

    // Promise.all — parallel queries
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          host: { select: { name: true, avatar: true } },
          _count: { select: { bookings: true, reviews: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.listing.count({ where })
    ]);

    res.json({
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};