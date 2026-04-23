import { Request, Response } from "express";
import prisma from "../config/prisma";

// GET /listings
export const getAllListings = async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        host: { select: { name: true, avatar: true } }
      }
    });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /listings/:id
export const getListingById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { host: true, bookings: true }
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /listings
export const createListing = async (req: Request, res: Response) => {
  try {
    const { title, description, location, pricePerNight, guests, type, amenities, hostId } = req.body;

    if (!title || !description || !location || !pricePerNight || !guests || !type || !amenities || !hostId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // verify host exists
    const host = await prisma.user.findFirst({ where: { id: hostId } });
    if (!host) {
      res.status(404).json({ message: "Host not found" });
      return;
    }

    const newListing = await prisma.listing.create({
      data: { title, description, location, pricePerNight, guests, type, amenities, hostId }
    });

    res.status(201).json(newListing);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// PUT /listings/:id
export const updateListing = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /listings/:id
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.listing.findFirst({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    await prisma.listing.delete({ where: { id } });
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};