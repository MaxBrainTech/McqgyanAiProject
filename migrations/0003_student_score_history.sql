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
