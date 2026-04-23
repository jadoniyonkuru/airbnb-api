import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env["DATABASE_URL"] as string,  // 👈 add this block
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