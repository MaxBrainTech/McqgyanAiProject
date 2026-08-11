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

export async function ensureBaseTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "student_score_history" (
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
    );

    CREATE TABLE IF NOT EXISTS "student_profiles" (
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
    );

    ALTER TABLE IF EXISTS "test_sessions"
      ADD COLUMN IF NOT EXISTS "subject_language" text;

    ALTER TABLE IF EXISTS "student_profiles"
      ADD COLUMN IF NOT EXISTS "full_name" text,
      ADD COLUMN IF NOT EXISTS "email_address" text,
      ADD COLUMN IF NOT EXISTS "medium" text,
      ADD COLUMN IF NOT EXISTS "board" text,
      ADD COLUMN IF NOT EXISTS "country" text,
      ADD COLUMN IF NOT EXISTS "state" text,
      ADD COLUMN IF NOT EXISTS "city" text;

    ALTER TABLE IF EXISTS "teachers"
      ADD COLUMN IF NOT EXISTS "is_approved" text DEFAULT 'false' NOT NULL;
  `);
}

export async function ensureStudentScoreHistoryTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "student_score_history" (
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
    );
  `);
}

export const databaseReady = ensureBaseTables();

