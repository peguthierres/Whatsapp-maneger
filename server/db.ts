import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

if (!DATABASE_URL) {
  console.error("No database URL found. Please set DATABASE_URL environment variable.");
  console.log("For development, you can use Replit's built-in PostgreSQL database.");
  process.exit(1);
}

const connection = postgres(DATABASE_URL);
export const db = drizzle(connection);
