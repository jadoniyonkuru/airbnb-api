import { Router } from "express";
import {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
} from "../controllers/listings.controller";
import { validate } from "../middleware/validate";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator";
import { authenticate, requireHost } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getAllListings);
router.get("/:id", getListingById);
router.post("/", authenticate, requireHost, validate(createListingSchema), createListing);
router.put("/:id", authenticate, requireHost, validate(updateListingSchema), updateListing);
router.delete("/:id", authenticate, requireHost, deleteListing);

export default router;