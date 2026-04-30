import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

let connected = false;

export const connectDB = async () => {
  if (connected) return;
  await prisma.$connect();
  connected = true;
  console.log("Database connected successfully");
};

export default prisma;
