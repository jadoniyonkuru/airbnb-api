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
/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload a profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Avatar uploaded successfully
 *                 avatar:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *       400:
 *         description: No file uploaded or invalid file type
 *       403:
 *         description: You can only update your own avatar
 *       404:
 *         description: User not found
 *
 *   delete:
 *     summary: Remove profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       404:
 *         description: User not found
 */
router.post("/users/:id/avatar", authenticate, upload.single("image"), uploadAvatar);
router.delete("/users/:id/avatar", authenticate, deleteAvatar);

// listing photo routes
/**
 * @swagger
 * /listings/{id}/photos:
 *   post:
 *     summary: Upload photos for a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 2 photo(s) uploaded successfully
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       publicId:
 *                         type: string
 *                       listingId:
 *                         type: string
 *       400:
 *         description: No files uploaded or too many files
 *       403:
 *         description: You can only upload photos to your own listings
 *       404:
 *         description: Listing not found
 *
 *   delete:
 *     summary: Delete a listing photo
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *       403:
 *         description: You can only delete photos from your own listings
 *       404:
 *         description: Photo not found
 */
router.post("/listings/:id/photos", authenticate, upload.array("images", 5), uploadListingPhotos);
router.delete("/listings/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;
