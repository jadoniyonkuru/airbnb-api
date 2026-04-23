export type ListingType = "apartment" | "house" | "villa" | "cabin";

export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: ListingType;
  amenities: string[];
  rating?: number;
  host: string;
}

export let listings: Listing[] = [
  {
    id: 1,
    title: "Nice House",
    description: "Clean and quiet",
    location: "Kigali",
    pricePerNight: 50,
    guests: 2,
    type: "house",
    amenities: ["wifi"],
    host: "John"
  }
];
