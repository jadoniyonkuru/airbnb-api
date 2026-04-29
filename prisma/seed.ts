import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"] as string,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Clean existing data — children before parents
  await prisma.booking.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleaned existing data");

  // 2. Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create users — 2 hosts, 3 guests
  const host1 = await prisma.user.create({
    data: {
      name: "John Host",
      email: "john@mail.com",
      username: "johnhost",
      phone: "0788000111",
      role: "HOST",
      password: hashedPassword,
      bio: "Experienced host with 5 years of experience",
    }
  });

  const host2 = await prisma.user.create({
    data: {
      name: "Alice Host",
      email: "alice@mail.com",
      username: "alicehost",
      phone: "0788000222",
      role: "HOST",
      password: hashedPassword,
      bio: "Passionate about creating memorable stays",
    }
  });

  const guest1 = await prisma.user.create({
    data: {
      name: "Bob Guest",
      email: "bob@mail.com",
      username: "bobguest",
      phone: "0788000333",
      role: "GUEST",
      password: hashedPassword,
      bio: "Love exploring new places",
    }
  });

  const guest2 = await prisma.user.create({
    data: {
      name: "Jane Guest",
      email: "jane@mail.com",
      username: "janeguest",
      phone: "0788000444",
      role: "GUEST",
      password: hashedPassword,
      bio: "Traveler and food lover",
    }
  });

  const guest3 = await prisma.user.create({
    data: {
      name: "Mike Guest",
      email: "mike@mail.com",
      username: "mikeguest",
      phone: "0788000555",
      role: "GUEST",
      password: hashedPassword,
      bio: "Adventure seeker",
    }
  });

  const guest4 = await prisma.user.create({
    data: {
      name: "Sarah Guest",
      email: "sarah@mail.com",
      username: "sarahguest",
      phone: "0788000666",
      role: "GUEST",
      password: hashedPassword,
      bio: "Digital nomad working remotely",
    }
  });

  const guest5 = await prisma.user.create({
    data: {
      name: "David Guest",
      email: "david@mail.com",
      username: "davidguest",
      phone: "0788000777",
      role: "GUEST",
      password: hashedPassword,
      bio: "Business traveler",
    }
  });

  console.log("👥 Created 2 hosts and 5 guests");

  // 4. Create profiles
  await prisma.profile.create({
    data: {
      userId: host1.id,
      bio: "Experienced host with 5 years of experience",
      website: "https://johnhost.com",
      country: "Rwanda"
    }
  });

  await prisma.profile.create({
    data: {
      userId: host2.id,
      bio: "Passionate about creating memorable stays",
      website: "https://alicehost.com",
      country: "Rwanda"
    }
  });

  console.log("👤 Created profiles");

  // 5. Create listings — one of each type
  const listing1 = await prisma.listing.create({
    data: {
      title: "Modern Apartment in Kigali",
      description: "A beautiful modern apartment in the heart of Kigali city center with stunning views",
      location: "Kigali, Rwanda",
      pricePerNight: 75,
      guests: 2,
      type: "APARTMENT",
      amenities: ["WiFi", "AC", "Kitchen", "TV"],
      rating: 4.8,
      hostId: host1.id,
    }
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Cozy House in Nyamirambo",
      description: "A warm and cozy house with a beautiful garden in the vibrant Nyamirambo neighborhood",
      location: "Nyamirambo, Kigali",
      pricePerNight: 120,
      guests: 5,
      type: "HOUSE",
      amenities: ["WiFi", "Kitchen", "Parking", "Garden", "BBQ"],
      rating: 4.5,
      hostId: host1.id,
    }
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Luxury Villa in Nyarutarama",
      description: "Stunning luxury villa with pool and panoramic views of Kigali — perfect for special occasions",
      location: "Nyarutarama, Kigali",
      pricePerNight: 350,
      guests: 10,
      type: "VILLA",
      amenities: ["WiFi", "Pool", "AC", "Kitchen", "Parking", "Security", "Gym"],
      rating: 4.9,
      hostId: host2.id,
    }
  });

  const listing4 = await prisma.listing.create({
    data: {
      title: "Mountain Cabin in Musanze",
      description: "Peaceful cabin with stunning views of the Virunga volcanoes — great for nature lovers",
      location: "Musanze, Rwanda",
      pricePerNight: 90,
      guests: 4,
      type: "CABIN",
      amenities: ["WiFi", "Fireplace", "Kitchen", "Hiking trails", "Mountain view"],
      rating: 4.7,
      hostId: host2.id,
    }
  });

  const listing5 = await prisma.listing.create({
    data: {
      title: "Studio Apartment in Kimihurura",
      description: "A stylish studio apartment in the upscale Kimihurura neighborhood close to restaurants",
      location: "Kimihurura, Kigali",
      pricePerNight: 60,
      guests: 2,
      type: "APARTMENT",
      amenities: ["WiFi", "AC", "Kitchen", "Gym access"],
      rating: 4.3,
      hostId: host1.id,
    }
  });

  const listing6 = await prisma.listing.create({
    data: {
      title: "Family House in Remera",
      description: "Spacious family house with large yard in the quiet Remera neighborhood",
      location: "Remera, Kigali",
      pricePerNight: 150,
      guests: 8,
      type: "HOUSE",
      amenities: ["WiFi", "Kitchen", "Parking", "Garden", "Children play area"],
      rating: 4.6,
      hostId: host2.id,
    }
  });

  console.log(" Created 6 listings");

  // 6. Create bookings with correct totalPrice
  // Booking 1 — Bob books apartment for 3 nights — CONFIRMED
  const checkIn1 = new Date("2026-06-01");
  const checkOut1 = new Date("2026-06-04");
  const nights1 = Math.ceil((checkOut1.getTime() - checkIn1.getTime()) / (1000 * 60 * 60 * 24));
  await prisma.booking.create({
    data: {
      guestId: guest1.id,
      listingId: listing1.id,
      checkIn: checkIn1,
      checkOut: checkOut1,
      totalPrice: nights1 * listing1.pricePerNight,
      status: "CONFIRMED",
    }
  });

  // Booking 2 — Jane books villa for 5 nights — PENDING
  const checkIn2 = new Date("2026-07-10");
  const checkOut2 = new Date("2026-07-15");
  const nights2 = Math.ceil((checkOut2.getTime() - checkIn2.getTime()) / (1000 * 60 * 60 * 24));
  await prisma.booking.create({
    data: {
      guestId: guest2.id,
      listingId: listing3.id,
      checkIn: checkIn2,
      checkOut: checkOut2,
      totalPrice: nights2 * listing3.pricePerNight,
      status: "PENDING",
    }
  });

  // Booking 3 — Mike books cabin for 2 nights — CONFIRMED
  const checkIn3 = new Date("2026-08-05");
  const checkOut3 = new Date("2026-08-07");
  const nights3 = Math.ceil((checkOut3.getTime() - checkIn3.getTime()) / (1000 * 60 * 60 * 24));
  await prisma.booking.create({
    data: {
      guestId: guest3.id,
      listingId: listing4.id,
      checkIn: checkIn3,
      checkOut: checkOut3,
      totalPrice: nights3 * listing4.pricePerNight,
      status: "CONFIRMED",
    }
  });

  // Booking 4 — Sarah books house for 4 nights — CONFIRMED
  const checkIn4 = new Date("2026-09-01");
  const checkOut4 = new Date("2026-09-05");
  const nights4 = Math.ceil((checkOut4.getTime() - checkIn4.getTime()) / (1000 * 60 * 60 * 24));
  await prisma.booking.create({
    data: {
      guestId: guest4.id,
      listingId: listing2.id,
      checkIn: checkIn4,
      checkOut: checkOut4,
      totalPrice: nights4 * listing2.pricePerNight,
      status: "CONFIRMED",
    }
  });

  // Booking 5 — David books studio for 7 nights — PENDING
  const checkIn5 = new Date("2026-10-10");
  const checkOut5 = new Date("2026-10-17");
  const nights5 = Math.ceil((checkOut5.getTime() - checkIn5.getTime()) / (1000 * 60 * 60 * 24));
  await prisma.booking.create({
    data: {
      guestId: guest5.id,
      listingId: listing5.id,
      checkIn: checkIn5,
      checkOut: checkOut5,
      totalPrice: nights5 * listing5.pricePerNight,
      status: "PENDING",
    }
  });

  // Booking 6 — Bob books family house for 3 nights — CANCELLED
  const checkIn6 = new Date("2026-11-01");
  const checkOut6 = new Date("2026-11-04");
  const nights6 = Math.ceil((checkOut6.getTime() - checkIn6.getTime()) / (1000 * 60 * 60 * 24));
  await prisma.booking.create({
    data: {
      guestId: guest1.id,
      listingId: listing6.id,
      checkIn: checkIn6,
      checkOut: checkOut6,
      totalPrice: nights6 * listing6.pricePerNight,
      status: "CANCELLED",
    }
  });

  console.log(" Created 6 bookings");
  console.log(" Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());