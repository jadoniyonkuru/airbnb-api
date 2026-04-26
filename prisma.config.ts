import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",  // seed goes here in Prisma 7
  },
  datasource: {
    url: process.env["DATABASE_URL"] as string,
  },
  migrate: {
    async adapter() {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env["DATABASE_URL"],
      });
      return new PrismaPg(pool);
    },
    url: process.env["DATABASE_URL"] as string,
  },
});