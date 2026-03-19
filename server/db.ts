// import { drizzle } from "drizzle-orm/node-postgres";
// import pg from "pg";
// import * as schema from "@shared/schema";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
// }

// const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle(pool, { schema });
// export default pool;


import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// OLD POOL (kept for reference)
// const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

const connectionString = process.env.DATABASE_URL;
const isLocal =
  (connectionString || "").includes("localhost") ||
  (connectionString || "").includes("127.0.0.1") ||
  process.env.DB_HOST === "localhost" ||
  process.env.DB_HOST === "127.0.0.1";

const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export default pool;
