import type { Request, Response, NextFunction } from "express";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /users/:id/avatar
// Uploads a profile picture for a user
// Multer middleware runs first and puts the file on req.file
// Then we upload the buffer to Cloudinary and save the URL to the database

export async function uploadAvatar(req: Request, res: Response) {
  const id = parseInt(req.params["id"] as string);

  // req.file is set by Multer — if it's missing, no file was sent
  if (!req.file) {
    console.log(`[Upload Debug] No file received in uploadAvatar`);
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log(`[Upload Debug] uploadAvatar - File received:`, {
    userId: id,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    "airbnb/avatars"
  );

  // Save the Cloudinary URL and publicId to the user's record in the database
  const updated = await prisma.user.update({
    where: { id },
    data: { avatar: url, avatarPublicId: publicId },
  });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}

// DELETE /users/:id/avatar
// Deletes a user's profile picture
export async function deleteAvatar(req: Request, res: Response) {
  const id = parseInt(req.params["id"] as string);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.avatar || !user.avatarPublicId) {
    return res.status(400).json({ error: "No avatar to delete" });
  }

  // Delete from Cloudinary
  try {
    await deleteFromCloudinary(user.avatarPublicId);
  } catch (error) {
    console.error("Failed to delete from cloudinary:", error);
  }

  // Clear the avatar fields from the database
  const cleared = await prisma.user.update({
    where: { id },
    data: { avatar: null, avatarPublicId: null },
  });

  res.json({ message: "Avatar deleted successfully" });
}

// POST /listings/:id/photos
export const uploadListingPhotos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      console.log(`[Upload Debug] No files received in uploadListingPhotos for listing ${id}`);
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    console.log(`[Upload Debug] uploadListingPhotos - Files received:`, {
      listingId: id,
      fileCount: files.length,
      files: files.map(f => ({
        name: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      }))
    });

    // check listing exists
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // check ownership
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only upload photos to your own listings" });
      return;
    }

    // check max 5 photos
    const existingPhotos = await prisma.listingPhoto.count({ where: { listingId: id } });

    if (existingPhotos + files.length > 5) {
      res.status(400).json({
        message: `You can only have 5 photos per listing. You have ${existingPhotos} and are trying to add ${files.length}`
      });
      return;
    }

    // upload all photos to cloudinary
    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const { url, publicId } = await uploadToCloudinary(file.buffer, "airbnb/listings");
        return prisma.listingPhoto.create({
          data: { url, publicId, listingId: id }
        });
      })
    );

    res.status(201).json({
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /listings/:id/photos/:photoId
export const deleteListingPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const photoId = parseInt(req.params.photoId as string);

    // check listing exists
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // check ownership
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only delete photos from your own listings" });
      return;
    }

    // check photo exists
    const photo = await prisma.listingPhoto.findFirst({
      where: { id: photoId, listingId: id }
    });
    if (!photo) {
    res.status(404).json({ message: "Photo not found" });
    return;
    }

    // delete from cloudinary
    try {
      await deleteFromCloudinary(photo.publicId);
    } catch (deleteError) {
      console.error("Failed to delete from cloudinary:", deleteError);
    }

    // delete from database
    await prisma.listingPhoto.delete({ where: { id: photoId } });

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    next(error);
  }
};



