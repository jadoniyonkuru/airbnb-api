import type { Request, Response, NextFunction } from "express";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";
import prisma from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /users/:id/avatar
export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const { url, publicId } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars");

  await prisma.user.update({ where: { id }, data: { avatar: url, avatarPublicId: publicId } });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}

// DELETE /users/:id/avatar
export async function deleteAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.avatar || !user.avatarPublicId) return res.status(400).json({ error: "No avatar to delete" });

  try {
    await deleteFromCloudinary(user.avatarPublicId);
  } catch (error) {
    console.error("Failed to delete from cloudinary:", error);
  }

  await prisma.user.update({ where: { id }, data: { avatar: null, avatarPublicId: null } });
  res.json({ message: "Avatar deleted successfully" });
}

// POST /listings/:id/photos
export const uploadListingPhotos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: "No files uploaded" }); return;
    }

    const files = req.files as Express.Multer.File[];

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only upload photos to your own listings" }); return;
    }

    const existingPhotos = await prisma.listingPhoto.count({ where: { listingId: id } });
    if (existingPhotos + files.length > 5) {
      res.status(400).json({ message: `You can only have 5 photos per listing. You have ${existingPhotos} and are trying to add ${files.length}` }); return;
    }

    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const { url, publicId } = await uploadToCloudinary(file.buffer, "airbnb/listings");
        return prisma.listingPhoto.create({ data: { url, publicId, listingId: id } });
      })
    );

    res.status(201).json({ message: `${uploadedPhotos.length} photo(s) uploaded successfully`, photos: uploadedPhotos });
  } catch (error) {
    next(error);
  }
};

// DELETE /listings/:id/photos/:photoId
export const deleteListingPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const photoId = req.params.photoId as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }

    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res.status(403).json({ message: "You can only delete photos from your own listings" }); return;
    }

    const photo = await prisma.listingPhoto.findFirst({ where: { id: photoId, listingId: id } });
    if (!photo) { res.status(404).json({ message: "Photo not found" }); return; }

    try {
      await deleteFromCloudinary(photo.publicId);
    } catch (deleteError) {
      console.error("Failed to delete from cloudinary:", deleteError);
    }

    await prisma.listingPhoto.delete({ where: { id: photoId } });
    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    next(error);
  }
};
