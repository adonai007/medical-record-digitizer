import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";
import pg from "pg";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

const pool = isNeon
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new pg.Pool({ connectionString: process.env.DATABASE_URL });

// @ts-ignore - Drizzle type mismatch between Neon Pool and pg.Pool
export const db = drizzle(pool as any, { schema });
export { pool };
