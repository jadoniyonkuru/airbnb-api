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
  console.log("Starting seed...");

  // 1. Clean existing data — children before parents
  await prisma.booking.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log(" Cleaned existing data");

  // 2. Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create users
  const host1 = await prisma.user.create({
    data: {
      name: "John Host",
      email: "john@mail.com",
      username: "johnhost",
      phone: "0788000111",
      role: "HOST",
      password: hashedPassword,
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
    }
  });

  console.log("👥 Created 2 hosts and 3 guests");

  // 4. Create listings — one of each type
  const listing1 = await prisma.listing.create({
    data: {
      title: "Modern Apartment in Kigali",
      description: "A beautiful modern apartment in the heart of Kigali city center",
      location: "Kigali, Rwanda",
      pricePerNight: 75,
      guests: 2,
      type: "APARTMENT",
      amenities: ["WiFi", "AC", "Kitchen"],
      hostId: host1.id,
    }
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Cozy House in Nyamirambo",
      description: "A warm and cozy house with a beautiful garden in Nyamirambo",
      location: "Nyamirambo, Kigali",
      pricePerNight: 120,
      guests: 5,
      type: "HOUSE",
      amenities: ["WiFi", "Kitchen", "Parking", "Garden"],
      hostId: host1.id,
    }
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Luxury Villa in Nyarutarama",
      description: "Stunning luxury villa with pool and panoramic views of Kigali",
      location: "Nyarutarama, Kigali",
      pricePerNight: 350,
      guests: 10,
      type: "VILLA",
      amenities: ["WiFi", "Pool", "AC", "Kitchen", "Parking", "Security"],
      hostId: host2.id,
    }
  });

  const listing4 = await prisma.listing.create({
    data: {
      title: "Mountain Cabin in Musanze",
      description: "Peaceful cabin with stunning views of the Virunga volcanoes",
      location: "Musanze, Rwanda",
      pricePerNight: 90,
      guests: 4,
      type: "CABIN",
      amenities: ["WiFi", "Fireplace", "Kitchen", "Hiking trails"],
      hostId: host2.id,
    }
  });

  console.log(" Created 4 listings");

  // 5. Create bookings with correct totalPrice
  // Booking 1 — Bob books apartment for 3 nights
  const checkIn1 = new Date("2026-06-01");
  const checkOut1 = new Date("2026-06-04");
  const nights1 = Math.ceil(
    (checkOut1.getTime() - checkIn1.getTime()) / (1000 * 60 * 60 * 24)
  );

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

  // Booking 2 — Jane books villa for 5 nights
  const checkIn2 = new Date("2026-07-10");
  const checkOut2 = new Date("2026-07-15");
  const nights2 = Math.ceil(
    (checkOut2.getTime() - checkIn2.getTime()) / (1000 * 60 * 60 * 24)
  );

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

  // Booking 3 — Mike books cabin for 2 nights
  const checkIn3 = new Date("2026-08-05");
  const checkOut3 = new Date("2026-08-07");
  const nights3 = Math.ceil(
    (checkOut3.getTime() - checkIn3.getTime()) / (1000 * 60 * 60 * 24)
  );

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

  console.log("Created 3 bookings");
  console.log(" Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
