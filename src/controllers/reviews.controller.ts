import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { getCache, setCache, deleteCache } from "../config/cache";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /listings/:id/reviews
export const getListingReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listingId = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `reviews:listing:${listingId}:page:${page}:limit:${limit}`;
    const cached = getCache(cacheKey);
    if (cached) { res.json(cached); return; }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: { user: { select: { name: true, avatar: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.review.count({ where: { listingId } })
    ]);

    const result = { data: reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    setCache(cacheKey, result, 30);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /listings/:id/reviews
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listingId = req.params.id as string;
    const { rating, comment } = req.body;
    const userId = req.userId!;

    if (!rating || !comment) { res.status(400).json({ message: "Rating and comment are required" }); return; }
    if (rating < 1 || rating > 5) { res.status(400).json({ message: "Rating must be between 1 and 5" }); return; }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    const review = await prisma.review.create({
      data: { rating, comment, userId, listingId },
      include: { user: { select: { name: true, avatar: true } } }
    });

    deleteCache(`reviews:listing:${listingId}`);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// DELETE /reviews/:id
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const review = await prisma.review.findFirst({ where: { id } });
    if (!review) { res.status(404).json({ message: "Review not found" }); return; }

    if (review.userId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only delete your own reviews" }); return;
    }

    await prisma.review.delete({ where: { id } });
    deleteCache(`reviews:listing:${review.listingId}`);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};
