import { 
  type User, type InsertUser, 
  type TestSession, type InsertTestSession,
  type Teacher, type InsertTeacher,
  type CustomTest, type InsertCustomTest,
  type CustomQuestion, type InsertCustomQuestion,
  type AnswerSheetEvaluation, type InsertAnswerSheetEvaluation,
  teachers, customTests, customQuestions, answerSheetEvaluations
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  getTestSession(id: string): Promise<TestSession | undefined>;
  updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined>;
  deleteTestSession(id: string): Promise<void>;
  
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByUsername(username: string): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  
  createCustomTest(test: InsertCustomTest): Promise<CustomTest>;
  getCustomTest(id: string): Promise<CustomTest | undefined>;
  getCustomTestByShareCode(shareCode: string): Promise<CustomTest | undefined>;
  getCustomTestsByTeacher(teacherId: string): Promise<CustomTest[]>;
  updateCustomTest(id: string, updates: Partial<CustomTest>): Promise<CustomTest | undefined>;
  deleteCustomTest(id: string): Promise<void>;
  
  createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion>;
  getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined>;
  getCustomQuestions(testId: string): Promise<CustomQuestion[]>;
  updateCustomQuestion(questionId: string, updates: Partial<CustomQuestion>): Promise<CustomQuestion | undefined>;
  deleteCustomQuestions(testId: string): Promise<void>;
  
  saveAnswerSheetEvaluation(evaluation: InsertAnswerSheetEvaluation): Promise<AnswerSheetEvaluation>;
  getRecentEvaluations(limit: number): Promise<AnswerSheetEvaluation[]>;
}

export class DatabaseStorage implements IStorage {
  private users: Map<string, User>;
  private testSessions: Map<string, TestSession>;

  constructor() {
    this.users = new Map();
    this.testSessions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTestSession(insertSession: InsertTestSession): Promise<TestSession> {
    const id = randomUUID();
    const session: TestSession = {
      mode: insertSession.mode ?? "language",
      language: insertSession.language ?? null,
      scienceCategory: insertSession.scienceCategory ?? null,
      classLevel: insertSession.classLevel,
      difficulty: insertSession.difficulty,
      testType: insertSession.testType ?? "mixed",
      chapter: insertSession.chapter,
      testLength: insertSession.testLength ?? 10,
      currentQuestion: insertSession.currentQuestion ?? 0,
      totalScore: insertSession.totalScore ?? 0,
      correctAnswers: insertSession.correctAnswers ?? 0,
      conversationHistory: insertSession.conversationHistory ?? "[]",
      id,
      createdAt: new Date(),
    };
    this.testSessions.set(id, session);
    return session;
  }

  async getTestSession(id: string): Promise<TestSession | undefined> {
    return this.testSessions.get(id);
  }

  async updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined> {
    const session = this.testSessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.testSessions.set(id, updated);
    return updated;
  }

  async deleteTestSession(id: string): Promise<void> {
    this.testSessions.delete(id);
  }

  // Teacher methods - stored in PostgreSQL database
  async getTeacher(id: string): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.id, id));
    return result[0] || undefined;
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.username, username));
    return result[0] || undefined;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.email, email));
    return result[0] || undefined;
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const result = await db.insert(teachers).values({
      ...insertTeacher,
      school: insertTeacher.school ?? null,
    }).returning();
    return result[0];
  }

  // Custom test methods - stored in PostgreSQL database
  async createCustomTest(insertTest: InsertCustomTest): Promise<CustomTest> {
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await db.insert(customTests).values({
      ...insertTest,
      shareCode,
      testType: insertTest.testType ?? "mcq",
      gptModel: insertTest.gptModel ?? "gpt-4o-mini",
      status: insertTest.status ?? "draft",
      instructions: insertTest.instructions ?? null,
    }).returning();
    return result[0];
  }

  async getCustomTest(id: string): Promise<CustomTest | undefined> {
    const result = await db.select().from(customTests).where(eq(customTests.id, id));
    return result[0] || undefined;
  }

  async getCustomTestByShareCode(shareCode: string): Promise<CustomTest | undefined> {
    const result = await db.select().from(customTests).where(eq(customTests.shareCode, shareCode));
    return result[0] || undefined;
  }

  async getCustomTestsByTeacher(teacherId: string): Promise<CustomTest[]> {
    return db.select().from(customTests).where(eq(customTests.teacherId, teacherId)).orderBy(desc(customTests.createdAt));
  }

  async updateCustomTest(id: string, updates: Partial<CustomTest>): Promise<CustomTest | undefined> {
    const result = await db.update(customTests).set(updates).where(eq(customTests.id, id)).returning();
    return result[0] || undefined;
  }

  async deleteCustomTest(id: string): Promise<void> {
    await db.delete(customTests).where(eq(customTests.id, id));
  }

  // Custom question methods - stored in PostgreSQL database
  async createCustomQuestion(insertQuestion: InsertCustomQuestion): Promise<CustomQuestion> {
    const result = await db.insert(customQuestions).values({
      ...insertQuestion,
      options: insertQuestion.options ?? null,
      correctOption: insertQuestion.correctOption ?? null,
    }).returning();
    return result[0];
  }

  async getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined> {
    const result = await db.select().from(customQuestions).where(eq(customQuestions.id, questionId));
    return result[0] || undefined;
  }

  async getCustomQuestions(testId: string): Promise<CustomQuestion[]> {
    return db.select().from(customQuestions)
      .where(eq(customQuestions.testId, testId))
      .orderBy(customQuestions.questionNumber);
  }

  async updateCustomQuestion(questionId: string, updates: Partial<CustomQuestion>): Promise<CustomQuestion | undefined> {
    const result = await db.update(customQuestions).set(updates).where(eq(customQuestions.id, questionId)).returning();
    return result[0] || undefined;
  }

  async deleteCustomQuestions(testId: string): Promise<void> {
    await db.delete(customQuestions).where(eq(customQuestions.testId, testId));
  }

  // Answer sheet evaluation methods - stored in PostgreSQL database
  async saveAnswerSheetEvaluation(insertEvaluation: InsertAnswerSheetEvaluation): Promise<AnswerSheetEvaluation> {
    const result = await db.insert(answerSheetEvaluations).values({
      ...insertEvaluation,
      studentName: insertEvaluation.studentName ?? null,
      classLevel: insertEvaluation.classLevel ?? null,
      subject: insertEvaluation.subject ?? null,
      gptModel: insertEvaluation.gptModel || "gpt-4o",
    }).returning();
    return result[0];
  }

  async getRecentEvaluations(limit: number): Promise<AnswerSheetEvaluation[]> {
    return db.select().from(answerSheetEvaluations)
      .orderBy(desc(answerSheetEvaluations.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
