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
    // 1. users
    await safeCreateTable(
      "users",
      `CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" text NOT NULL UNIQUE,
        "password" text NOT NULL
      );`
    );

    // 2. tests
    await safeCreateTable(
      "tests",
      `CREATE TABLE IF NOT EXISTS "tests" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "title" text NOT NULL,
        "mcqs" json NOT NULL,
        "created_at" timestamp DEFAULT now()
      );`
    );

    // 3. mcq_tests
    await safeCreateTable(
      "mcq_tests",
      `CREATE TABLE IF NOT EXISTS "mcq_tests" (
        "id" serial PRIMARY KEY NOT NULL,
        "class_level" integer,
        "subject" text,
        "total_questions" integer,
        "difficulty" text,
        "medium" varchar(20),
        "generated_by" text,
        "created_at" timestamp DEFAULT now()
      );`
    );

    // 4. mcqs
    await safeCreateTable(
      "mcqs",
      `CREATE TABLE IF NOT EXISTS "mcqs" (
        "id" serial PRIMARY KEY NOT NULL,
        "question" text NOT NULL,
        "options" json,
        "correct_answer" text NOT NULL,
        "test_id" integer REFERENCES "mcq_tests"("id") ON DELETE SET NULL,
        "created_at" timestamp DEFAULT now()
      );`
    );
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS "mcq_test_idx" ON "mcqs" ("test_id");`);
    } catch {}

    // 5. test_sessions
    await safeCreateTable(
      "test_sessions",
      `CREATE TABLE IF NOT EXISTS "test_sessions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "mode" text DEFAULT 'language' NOT NULL,
        "language" text,
        "subject_language" text,
        "science_category" text,
        "class_level" integer NOT NULL,
        "difficulty" text NOT NULL,
        "test_type" text DEFAULT 'mixed' NOT NULL,
        "chapter" integer NOT NULL,
        "test_length" integer DEFAULT 10 NOT NULL,
        "current_question" integer DEFAULT 0 NOT NULL,
        "total_score" integer DEFAULT 0 NOT NULL,
        "correct_answers" integer DEFAULT 0 NOT NULL,
        "conversation_history" text DEFAULT '[]' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "mcq_test_id" integer
      );`
    );

    // 6. teachers
    await safeCreateTable(
      "teachers",
      `CREATE TABLE IF NOT EXISTS "teachers" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "full_name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "school" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "is_verified" text DEFAULT 'false' NOT NULL,
        "is_approved" text DEFAULT 'false' NOT NULL,
        "verified_at" timestamp,
        "verification_token" text
      );`
    );

    // 7. custom_tests
    await safeCreateTable(
      "custom_tests",
      `CREATE TABLE IF NOT EXISTS "custom_tests" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "teacher_id" varchar NOT NULL,
        "title" text NOT NULL,
        "subject" text NOT NULL,
        "class_level" integer NOT NULL,
        "difficulty" text NOT NULL,
        "duration_minutes" integer DEFAULT 30 NOT NULL,
        "syllabus" text NOT NULL,
        "num_questions" integer NOT NULL,
        "language" text DEFAULT 'english',
        "test_type" text DEFAULT 'mcq' NOT NULL,
        "gpt_model" text DEFAULT 'gpt-4o-mini' NOT NULL,
        "share_code" text NOT NULL UNIQUE,
        "instructions" text,
        "status" text DEFAULT 'draft' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );`
    );

    // 8. custom_questions
    await safeCreateTable(
      "custom_questions",
      `CREATE TABLE IF NOT EXISTS "custom_questions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "test_id" varchar NOT NULL,
        "question_number" integer NOT NULL,
        "question" text NOT NULL,
        "question_type" text NOT NULL,
        "options" text,
        "correct_option" text,
        "correct_answer" text NOT NULL,
        "explanation" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );`
    );

    // 9. custom_test_submissions
    await safeCreateTable(
      "custom_test_submissions",
      `CREATE TABLE IF NOT EXISTS "custom_test_submissions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "test_id" varchar NOT NULL,
        "student_name" text NOT NULL,
        "student_id" text,
        "score" integer DEFAULT 0 NOT NULL,
        "total_questions" integer DEFAULT 0,
        "time_taken_seconds" integer DEFAULT 0 NOT NULL,
        "submission_type" text,
        "start_time" timestamp NOT NULL,
        "end_time" timestamp,
        "answers" text DEFAULT '{}' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );`
    );

    // 10. answer_sheet_evaluations
    await safeCreateTable(
      "answer_sheet_evaluations",
      `CREATE TABLE IF NOT EXISTS "answer_sheet_evaluations" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_name" text,
        "class_level" integer,
        "subject" text,
        "total_images" integer NOT NULL,
        "evaluation_summary" text NOT NULL,
        "gpt_model" text DEFAULT 'gpt-4o' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );`
    );

    // 11. student_profiles
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

    // 12. student_score_history
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
        "class_level" integer,
        "score" integer DEFAULT 0 NOT NULL,
        "max_score" integer DEFAULT 0 NOT NULL,
        "percentage" integer DEFAULT 0 NOT NULL,
        "total_questions" integer DEFAULT 0 NOT NULL,
        "correct_answers" integer DEFAULT 0 NOT NULL,
        "insights" json DEFAULT '{}' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
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
    await safeAddColumn("student_score_history", '"class_level" integer');
  })();

  return baseTablesPromise;
}

export async function ensureStudentScoreHistoryTable() {
  return ensureBaseTables();
}

export const databaseReady = ensureBaseTables().catch((err) => {
  console.warn("[db] databaseReady notice:", err.message || err);
});


