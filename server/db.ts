import { Pool, type PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as schema from "@shared/schema";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
export default pool;

let baseTablesPromise: Promise<void> | null = null;

async function safeCreateTable(tableName: string, createSql: string) {
  try {
    const regCheck = await pool.query(
      `SELECT to_regclass($1) as rel;`,
      [`public."${tableName}"`]
    );
    if (regCheck.rows[0]?.rel) {
      return;
    }
  } catch {
    // Ignore to_regclass errors and proceed to fallback
  }

  try {
    await pool.query(createSql);
  } catch (err: any) {
    if (
      err.code === "23505" ||
      err.code === "42P07" ||
      err.message?.includes("already exists") ||
      err.message?.includes("pg_type_typname_nsp_index") ||
      err.message?.includes("duplicate key value")
    ) {
      return;
    }
    console.warn(`[db] Table initialization notice for ${tableName}:`, err.message || err);
  }
}

async function safeAddColumn(tableName: string, columnDdl: string) {
  try {
    await pool.query(`ALTER TABLE IF EXISTS "${tableName}" ADD COLUMN IF NOT EXISTS ${columnDdl};`);
  } catch {
    // Ignore if table is missing or column exists
  }
}

export async function ensureBaseTables() {
  if (baseTablesPromise) return baseTablesPromise;

  baseTablesPromise = (async () => {
    await safeCreateTable(
      "student_score_history",
      `CREATE TABLE IF NOT EXISTS "student_score_history" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "user_email" text,
        "subject" text NOT NULL,
        "mode" text,
        "difficulty" text,
        "language" text DEFAULT 'english' NOT NULL,
        "score" integer DEFAULT 0 NOT NULL,
        "max_score" integer DEFAULT 0 NOT NULL,
        "percentage" integer DEFAULT 0 NOT NULL,
        "total_questions" integer DEFAULT 0 NOT NULL,
        "correct_answers" integer DEFAULT 0 NOT NULL,
        "insights" json DEFAULT '{}' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );`
    );

    await safeCreateTable(
      "student_profiles",
      `CREATE TABLE IF NOT EXISTS "student_profiles" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL UNIQUE,
        "full_name" text,
        "display_name" text,
        "email_address" text,
        "class_level" integer,
        "school" text,
        "medium" text,
        "board" text,
        "country" text,
        "state" text,
        "city" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );`
    );

    await safeAddColumn("test_sessions", '"subject_language" text');
    await safeAddColumn("student_profiles", '"full_name" text');
    await safeAddColumn("student_profiles", '"email_address" text');
    await safeAddColumn("student_profiles", '"medium" text');
    await safeAddColumn("student_profiles", '"board" text');
    await safeAddColumn("student_profiles", '"country" text');
    await safeAddColumn("student_profiles", '"state" text');
    await safeAddColumn("student_profiles", '"city" text');
    await safeAddColumn("teachers", '"is_approved" text DEFAULT \'false\' NOT NULL');
  })();

  return baseTablesPromise;
}

export async function ensureStudentScoreHistoryTable() {
  return ensureBaseTables();
}

export const databaseReady = ensureBaseTables().catch((err) => {
  console.warn("[db] databaseReady notice:", err.message || err);
});


