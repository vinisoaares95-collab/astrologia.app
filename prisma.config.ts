import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Carrega o .env local quando existir. Nesta fase o banco é opcional:
// `prisma generate` e `prisma validate` funcionam sem DATABASE_URL.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
