CREATE TABLE "answer_sheet_evaluations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_name" text,
	"class_level" integer,
	"subject" text,
	"total_images" integer NOT NULL,
	"evaluation_summary" text NOT NULL,
	"gpt_model" text DEFAULT 'gpt-4o' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_questions" (
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
);
--> statement-breakpoint
CREATE TABLE "custom_tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"class_level" integer NOT NULL,
	"difficulty" text NOT NULL,
	"syllabus" text NOT NULL,
	"num_questions" integer NOT NULL,
	"test_type" text DEFAULT 'mcq' NOT NULL,
	"gpt_model" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"share_code" text NOT NULL,
	"instructions" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_tests_share_code_unique" UNIQUE("share_code")
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"school" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teachers_username_unique" UNIQUE("username"),
	CONSTRAINT "teachers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "test_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" text DEFAULT 'language' NOT NULL,
	"language" text,
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"mcqs" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "custom_questions" ADD CONSTRAINT "custom_questions_test_id_custom_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."custom_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_tests" ADD CONSTRAINT "custom_tests_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;