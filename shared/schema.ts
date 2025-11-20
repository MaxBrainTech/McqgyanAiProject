import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  language: text("language"), // For language mode
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
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

// Custom tests created by teachers
export const customTests = pgTable("custom_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(), // Physics, Chemistry, Biology, Hindi, etc.
  classLevel: integer("class_level").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  syllabus: text("syllabus").notNull(), // CBSE topic/chapter
  numQuestions: integer("num_questions").notNull(),
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

export type InsertAnswerSheetEvaluation = z.infer<typeof insertAnswerSheetEvaluationSchema>;
export type AnswerSheetEvaluation = typeof answerSheetEvaluations.$inferSelect;
