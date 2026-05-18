import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator";
import { AuthRequest } from "../middleware/auth.middleware";
import { getCache, setCache, deleteCache } from "../config/cache";

// GET /listings  (supports ?hostId=xxx filter)
export const getAllListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostId = req.query.hostId as string | undefined;
    const cacheKey = hostId ? `listings:host:${hostId}` : "listings:all";

    const cached = getCache(cacheKey);
    if (cached) {
      console.log("📦 Returning cached listings");
      res.json(cached);
      return;
    }

    const where: any = {};
    if (hostId) where.hostId = hostId;

    const listings = await prisma.listing.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true, role: true }
        },
        photos: true,
        _count: { select: { bookings: true, reviews: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const response = { data: listings };
    setCache(cacheKey, response, 60);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// GET /listings/:id
export const getListingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true, name: true, email: true, username: true,
            phone: true, role: true, avatar: true, bio: true, createdAt: true
          }
        },
        photos: true,
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { checkIn: true, checkOut: true, status: true }
        },
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: "desc" }
        },
        _count: { select: { reviews: true, bookings: true } }
      }
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    res.json({ data: listing });
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

    // use hostId from token — never from request body
    const hostId = req.userId!;

    const newListing = await prisma.listing.create({
      data: { ...result.data, hostId },
      include: { photos: true, host: { select: { id: true, name: true, avatar: true } } }
    });

    deleteCache("listings:all");
    deleteCache(`listings:host:${hostId}`);
    deleteCache("stats:listings");

    res.status(201).json({ data: newListing });
  } catch (error) {
    next(error);
  }
};

// PUT /listings/:id
export const updateListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

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

    // ownership check — ADMIN bypasses
    if (existing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only edit your own listings" });
      return;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: result.data,
      include: { photos: true, host: { select: { id: true, name: true, avatar: true } } }
    });

    deleteCache("listings:all");
    deleteCache(`listings:host:${existing.hostId}`);
    deleteCache("stats:listings");

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /listings/:id
export const deleteListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;

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

    deleteCache("listings:all");
    deleteCache(`listings:host:${existing.hostId}`);
    deleteCache("stats:listings");

    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /listings/search
export const searchListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = req.query.location as string | undefined;
    const type = req.query.type as string | undefined;
    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    const guests = req.query.guests as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    //build where clause dynamically
    const where: any = {};

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"
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

    //Promise.all — parallel queries
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
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