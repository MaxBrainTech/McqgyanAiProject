import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { index } from "drizzle-orm/pg-core";

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  mcqs: json("mcqs").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Test session schema for tracking current tests
export const testSessions = pgTable("test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mode: text("mode").notNull().default("language"), // 'language' or 'science'
  language: text("language"), // Selected test language for output/evaluation
  subjectLanguage: text("subject_language"), // Language subject for language mode
  scienceCategory: text("science_category"), // For science mode: physics, chemistry, biology, general
  classLevel: integer("class_level").notNull(),
  difficulty: text("difficulty").notNull(),
  testType: text("test_type").notNull().default("mixed"),
  chapter: integer("chapter").notNull(),
  testLength: integer("test_length").notNull().default(10),
  currentQuestion: integer("current_question").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  conversationHistory: text("conversation_history").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),

   mcqTestId: integer("mcq_test_id"),
});

export const insertTestSessionSchema = createInsertSchema(testSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;
export type TestSession = typeof testSessions.$inferSelect;

// Teachers table for custom MCQ creation
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  school: text("school"),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  isVerified: text("is_verified").default("false").notNull(),
  isApproved: text("is_approved").default("false").notNull(),
  verifiedAt: timestamp("verified_at"),
  verificationToken: text("verification_token"),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

export const studentProfiles = pgTable("student_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  fullName: text("full_name"),
  displayName: text("display_name"),
  emailAddress: text("email_address"),
  classLevel: integer("class_level"),
  school: text("school"),
  medium: text("medium"),
  board: text("board"),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;

// Custom tests created by teachers
export const customTests = pgTable("custom_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(), // Physics, Chemistry, Biology, Hindi, etc.
  classLevel: integer("class_level").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  durationMinutes: integer("duration_minutes").notNull().default(30),
  syllabus: text("syllabus").notNull(), // CBSE topic/chapter
  numQuestions: integer("num_questions").notNull(),
  language: text("language").default("english"),
  testType: text("test_type").notNull().default("mcq"), // mcq, open-ended, mixed
  gptModel: text("gpt_model").notNull().default("gpt-4o-mini"), // GPT model selection
  shareCode: text("share_code").notNull().unique(), // For students to access
  instructions: text("instructions"),
  status: text("status").notNull().default("draft"), // draft, published
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomTestSchema = createInsertSchema(customTests).omit({
  id: true,
  createdAt: true,
  shareCode: true,
});

export type InsertCustomTest = z.infer<typeof insertCustomTestSchema>;
export type CustomTest = typeof customTests.$inferSelect;

export const customTestSubmissions = pgTable("custom_test_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => customTests.id),
  studentName: text("student_name").notNull(),
  studentId: text("student_id"),
  score: integer("score").notNull().default(0),
  totalQuestions: integer("total_questions").default(0),
  timeTakenSeconds: integer("time_taken_seconds").notNull().default(0),
  submissionType: text("submission_type"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  answers: text("answers").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomTestSubmissionSchema = createInsertSchema(customTestSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomTestSubmission = z.infer<typeof insertCustomTestSubmissionSchema>;
export type CustomTestSubmission = typeof customTestSubmissions.$inferSelect;

// Custom questions generated for each test
export const customQuestions = pgTable("custom_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => customTests.id),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").notNull(), // mcq, open-ended
  options: text("options"), // JSON array for MCQ options
  correctOption: text("correct_option"), // A, B, C, or D for MCQ
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomQuestionSchema = createInsertSchema(customQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomQuestion = z.infer<typeof insertCustomQuestionSchema>;
export type CustomQuestion = typeof customQuestions.$inferSelect;

// Answer sheet evaluations - for students/teachers/parents to upload answer sheets
export const answerSheetEvaluations = pgTable("answer_sheet_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentName: text("student_name"),
  classLevel: integer("class_level"),
  subject: text("subject"),
  totalImages: integer("total_images").notNull(),
  evaluationSummary: text("evaluation_summary").notNull(), // JSON with overall feedback
  gptModel: text("gpt_model").notNull().default("gpt-4o"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnswerSheetEvaluationSchema = createInsertSchema(answerSheetEvaluations).omit({
  id: true,
  createdAt: true,
});

export const studentScoreHistory = pgTable("student_score_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  userId: text("user_id").notNull(),

  userEmail: text("user_email"),
  subject: text("subject").notNull(),
  mode: text("mode"),
  difficulty: text("difficulty"),
  language: text("language").notNull().default("english"),
  classLevel: integer("class_level"),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  percentage: integer("percentage").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  insights: json("insights").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudentScoreHistorySchema = createInsertSchema(studentScoreHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertStudentScoreHistory = z.infer<typeof insertStudentScoreHistorySchema>;
export type StudentScoreHistory = typeof studentScoreHistory.$inferSelect;

export const mcqTests = pgTable("mcq_tests", {
  id: serial("id").primaryKey(),
  classLevel: integer("class_level"),
  subject: text("subject"),
  totalQuestions: integer("total_questions"),
  difficulty: text("difficulty"),
  medium: varchar("medium", { length: 20 }),
  generatedBy: text("generated_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// export const mcqs = pgTable("mcqs", {
//   id: serial("id").primaryKey(),
//   question: text("question").notNull(),
//   options: json("options").notNull(),
//   correctAnswer: text("correct_answer").notNull(),
//   testId: integer("test_id"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

export const mcqs = pgTable(
  "mcqs",
  {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    options: json("options").$type<string[] | null>(),
    correctAnswer: text("correct_answer").notNull(),
    testId: integer("test_id").references(() => mcqTests.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    testIndex: index("mcq_test_idx").on(table.testId),
  })
);

export type InsertAnswerSheetEvaluation = z.infer<typeof insertAnswerSheetEvaluationSchema>;
export type AnswerSheetEvaluation = typeof answerSheetEvaluations.$inferSelect;

// Centralized Admin Generated Tests schema
export const generatedTests = pgTable(
  "generated_tests",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: text("student_id").notNull(),
    studentName: text("student_name"),
    studentEmail: text("student_email"),
    classLevel: integer("class_level"),
    subject: text("subject").notNull(),
    chapterTopic: text("chapter_topic"),
    medium: text("medium"),
    board: text("board"),
    difficulty: text("difficulty"),
    testType: text("test_type"),
    testMode: text("test_mode"),
    questionCount: integer("question_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    studentIdx: index("idx_generated_tests_student_id").on(table.studentId),
    classIdx: index("idx_generated_tests_class_level").on(table.classLevel),
    subjectIdx: index("idx_generated_tests_subject").on(table.subject),
    createdAtIdx: index("idx_generated_tests_created_at").on(table.createdAt),
  })
);

export const insertGeneratedTestSchema = createInsertSchema(generatedTests).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedTest = z.infer<typeof insertGeneratedTestSchema>;
export type GeneratedTest = typeof generatedTests.$inferSelect;

export const generatedTestQuestions = pgTable(
  "generated_test_questions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    generatedTestId: varchar("generated_test_id")
      .notNull()
      .references(() => generatedTests.id, { onDelete: "cascade" }),
    questionNumber: integer("question_number").notNull(),
    question: text("question").notNull(),
    optionA: text("option_a"),
    optionB: text("option_b"),
    optionC: text("option_c"),
    optionD: text("option_d"),
    correctOption: text("correct_option"),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    testIdx: index("idx_generated_test_questions_test_id").on(table.generatedTestId),
  })
);

export const insertGeneratedTestQuestionSchema = createInsertSchema(generatedTestQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedTestQuestion = z.infer<typeof insertGeneratedTestQuestionSchema>;
export type GeneratedTestQuestion = typeof generatedTestQuestions.$inferSelect;

