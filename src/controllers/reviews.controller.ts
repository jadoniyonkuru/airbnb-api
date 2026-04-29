import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { getCache, setCache, deleteCache } from "../config/cache";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /listings/:id/reviews — paginated + cached
export const getListingReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listingId = parseInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // check cache first
    const cacheKey = `reviews:listing:${listingId}:page:${page}:limit:${limit}`;
    const cached = getCache(cacheKey);
    if (cached) {
      console.log("Returning cached reviews");
      res.json(cached);
      return;
    }

    // check listing exists
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // Promise.all — fetch reviews and count in parallel
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: {
          user: { select: { name: true, avatar: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.review.count({ where: { listingId } })
    ]);

    const result = {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    // cache for 30 seconds
    setCache(cacheKey, result, 30);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /listings/:id/reviews
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listingId = parseInt(req.params.id as string);
    const { rating, comment } = req.body;

    // use userId from token
    const userId = req.userId!;

    if (!rating || !comment) {
      res.status(400).json({ message: "Rating and comment are required" });
      return;
    }

    // validate rating range
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    const review = await prisma.review.create({
      data: { rating, comment, userId, listingId },
      include: {
        user: { select: { name: true, avatar: true } }
      }
    });

    // clear cache when new review is posted
    deleteCache(`reviews:listing:${listingId}`);

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// DELETE /reviews/:id
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const review = await prisma.review.findFirst({ where: { id } });
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    // only owner or admin can delete
    if (review.userId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only delete your own reviews" });
      return;
    }

    await prisma.review.delete({ where: { id } });

    // clear cache after deletion
    deleteCache(`reviews:listing:${review.listingId}`);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};