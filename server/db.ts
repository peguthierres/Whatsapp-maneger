import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure for Supabase connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 20,
  idle_timeout: 20,
  connect_timeout: 60,
});

export const db = drizzle(sql, { schema });
