ALTER TABLE "custom_tests"
ADD COLUMN IF NOT EXISTS "duration_minutes" integer DEFAULT 30 NOT NULL;

CREATE TABLE IF NOT EXISTS "custom_test_submissions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "test_id" varchar NOT NULL,
  "student_name" text NOT NULL,
  "score" integer DEFAULT 0 NOT NULL,
  "total_questions" integer DEFAULT 0 NOT NULL,
  "time_taken_seconds" integer DEFAULT 0 NOT NULL,
  "submission_type" text,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "answers" text DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_test_submissions" ADD CONSTRAINT "custom_test_submissions_test_id_custom_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."custom_tests"("id") ON DELETE no action ON UPDATE no action;
