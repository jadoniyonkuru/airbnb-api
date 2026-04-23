import { Router } from "express";
import {
  getAllListings, getListingById, createListing,
  updateListing, deleteListing
} from "../controllers/listings.controller";
import { validate } from "../middleware/validate";
import { createListingSchema, updateListingSchema } from "../validators/listings.validator";

const router = Router();

router.get("/", getAllListings);
router.get("/:id", getListingById);
router.post("/", validate(createListingSchema), createListing);
router.put("/:id", validate(updateListingSchema), updateListing);
router.delete("/:id", deleteListing);

export default router;