import { Router } from "express";
import {
  getListingReviews,
  createReview,
  deleteReview
} from "../../controllers/reviews.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { strictLimiter } from "../../middleware/rateLimiter";

const router = Router();

// GET /listings/:id/reviews — public
router.get("/listings/:id/reviews", getListingReviews);

// POST /listings/:id/reviews — protected + strict rate limit
router.post("/listings/:id/reviews", authenticate, strictLimiter, createReview);

// DELETE /reviews/:id — protected
router.delete("/reviews/:id", authenticate, deleteReview);

export default router;