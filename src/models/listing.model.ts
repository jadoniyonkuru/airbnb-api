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
  { id: 1, title: "Cozy Apartment in Downtown", description: "Modern apartment close to everything", location: "Kigali, Rwanda", pricePerNight: 80, guests: 2, type: "apartment", amenities: ["wifi", "air conditioning"], rating: 4.8, host: "John Doe" },
  { id: 2, title: "Quiet Cabin in the Hills", description: "Peaceful retreat surrounded by nature", location: "Musanze, Rwanda", pricePerNight: 60, guests: 4, type: "cabin", amenities: ["wifi", "fireplace", "parking"], rating: 4.5, host: "Alice Brown" },
  { id: 3, title: "Luxury Villa with Pool", description: "Spacious villa with private pool and garden", location: "Rubavu, Rwanda", pricePerNight: 200, guests: 8, type: "villa", amenities: ["wifi", "pool", "gym", "parking"], rating: 5.0, host: "John Doe" }
];
