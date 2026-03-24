import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL!;
  // Use Neon serverless driver for Neon URLs, postgres.js for local
  if (url.includes("neon.tech") || url.includes("neon.") || process.env.USE_NEON === "true") {
    // Dynamic import workaround - use require for conditional loading
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    const sql = neon(url);
    return drizzle(sql, { schema });
  } else {
    const { drizzle } = require("drizzle-orm/postgres-js");
    const postgres = require("postgres");
    const sql = postgres(url);
    return drizzle(sql, { schema });
  }
}

export const db = createDb();
