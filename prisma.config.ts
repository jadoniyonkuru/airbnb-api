import { config } from "dotenv";
config();

import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env["DATABASE_URL"] as string;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    url: DATABASE_URL,
    async adapter() {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: DATABASE_URL });
      return new PrismaPg(pool);
    },
  },
});
