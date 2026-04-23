import { Request, Response } from "express";
import { listings, Listing } from "../models/listing.model";

export const getAllListings = (req: Request, res: Response) => {
  res.json(listings);
};

export const getListingById = (req: Request, res: Response) => {
  const listing = listings.find((l) => l.id === parseInt(req.params.id));
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  res.json(listing);
};

export const createListing = (req: Request, res: Response) => {
  const { title, description, location, pricePerNight, guests, type, amenities, host } = req.body;
  if (!title || !description || !location || !pricePerNight || !guests || !type || !amenities || !host)
    return res.status(400).json({ message: "Missing required fields: title, description, location, pricePerNight, guests, type, amenities, host" });

  const newListing: Listing = { id: listings.length + 1, title, description, location, pricePerNight, guests, type, amenities, host, rating: req.body.rating };
  listings.push(newListing);
  res.status(201).json(newListing);
};

export const updateListing = (req: Request, res: Response) => {
  const index = listings.findIndex((l) => l.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Listing not found" });

  listings[index] = { ...listings[index], ...req.body, id: listings[index].id };
  res.json(listings[index]);
};

export const deleteListing = (req: Request, res: Response) => {
  const index = listings.findIndex((l) => l.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Listing not found" });

  const deleted = listings.splice(index, 1)[0];
  res.json({ message: "Listing deleted", listing: deleted });
};
