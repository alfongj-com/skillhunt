import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DB_DATABASE_URL || process.env.DB_URL || process.env.DATABASE_URL!;
  // Use Neon serverless driver for Neon URLs, postgres.js for local
  if (url.includes("neon.tech") || url.includes("neon.") || process.env.USE_NEON === "true") {
    const sql = neon(url);
    return drizzleNeon(sql, { schema });
  } else {
    const sql = postgres(url);
    return drizzlePg(sql, { schema });
  }
}

const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> | undefined };
export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
