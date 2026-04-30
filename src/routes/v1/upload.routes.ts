import { Router } from "express";
import upload from "../../config/multer";
import {
  uploadAvatar,
  deleteAvatar,
  uploadListingPhotos,
  deleteListingPhoto
} from "../../controllers/upload.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// avatar routes
router.post("/users/:id/avatar", authenticate, upload.single("image"), uploadAvatar);
router.delete("/users/:id/avatar", authenticate, deleteAvatar);

// listing photo routes
router.post("/listings/:id/photos", authenticate, upload.array("images", 5), uploadListingPhotos);
router.delete("/listings/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;