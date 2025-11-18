import { 
  type User, type InsertUser, 
  type TestSession, type InsertTestSession,
  type Teacher, type InsertTeacher,
  type CustomTest, type InsertCustomTest,
  type CustomQuestion, type InsertCustomQuestion
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Test session methods
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  getTestSession(id: string): Promise<TestSession | undefined>;
  updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined>;
  deleteTestSession(id: string): Promise<void>;
  
  // Teacher methods
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByUsername(username: string): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  
  // Custom test methods
  createCustomTest(test: InsertCustomTest): Promise<CustomTest>;
  getCustomTest(id: string): Promise<CustomTest | undefined>;
  getCustomTestByShareCode(shareCode: string): Promise<CustomTest | undefined>;
  getCustomTestsByTeacher(teacherId: string): Promise<CustomTest[]>;
  updateCustomTest(id: string, updates: Partial<CustomTest>): Promise<CustomTest | undefined>;
  deleteCustomTest(id: string): Promise<void>;
  
  // Custom question methods
  createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion>;
  getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined>;
  getCustomQuestions(testId: string): Promise<CustomQuestion[]>;
  updateCustomQuestion(questionId: string, updates: Partial<CustomQuestion>): Promise<CustomQuestion | undefined>;
  deleteCustomQuestions(testId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private testSessions: Map<string, TestSession>;
  private teachers: Map<string, Teacher>;
  private customTests: Map<string, CustomTest>;
  private customQuestions: Map<string, CustomQuestion>;

  constructor() {
    this.users = new Map();
    this.testSessions = new Map();
    this.teachers = new Map();
    this.customTests = new Map();
    this.customQuestions = new Map();
    
    // Create demo teacher account
    const demoTeacher: Teacher = {
      id: "demo-teacher-id",
      username: "demo",
      password: "demo123",
      fullName: "Demo Teacher",
      email: "demo@teacher.com",
      school: "Demo School",
      createdAt: new Date(),
    };
    this.teachers.set(demoTeacher.id, demoTeacher);
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

  // Teacher methods
  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(
      (teacher) => teacher.username === username,
    );
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(
      (teacher) => teacher.email === email,
    );
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const teacher: Teacher = {
      ...insertTeacher,
      id,
      school: insertTeacher.school ?? null,
      createdAt: new Date(),
    };
    this.teachers.set(id, teacher);
    return teacher;
  }

  // Custom test methods
  async createCustomTest(insertTest: InsertCustomTest): Promise<CustomTest> {
    const id = randomUUID();
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const test: CustomTest = {
      ...insertTest,
      id,
      shareCode,
      testType: insertTest.testType ?? "mcq",
      gptModel: insertTest.gptModel ?? "gpt-4o-mini",
      status: insertTest.status ?? "draft",
      instructions: insertTest.instructions ?? null,
      createdAt: new Date(),
    };
    this.customTests.set(id, test);
    return test;
  }

  async getCustomTest(id: string): Promise<CustomTest | undefined> {
    return this.customTests.get(id);
  }

  async getCustomTestByShareCode(shareCode: string): Promise<CustomTest | undefined> {
    return Array.from(this.customTests.values()).find(
      (test) => test.shareCode === shareCode,
    );
  }

  async getCustomTestsByTeacher(teacherId: string): Promise<CustomTest[]> {
    return Array.from(this.customTests.values()).filter(
      (test) => test.teacherId === teacherId,
    );
  }

  async updateCustomTest(id: string, updates: Partial<CustomTest>): Promise<CustomTest | undefined> {
    const test = this.customTests.get(id);
    if (!test) return undefined;
    
    const updated = { ...test, ...updates };
    this.customTests.set(id, updated);
    return updated;
  }

  async deleteCustomTest(id: string): Promise<void> {
    this.customTests.delete(id);
  }

  // Custom question methods
  async createCustomQuestion(insertQuestion: InsertCustomQuestion): Promise<CustomQuestion> {
    const id = randomUUID();
    const question: CustomQuestion = {
      ...insertQuestion,
      id,
      options: insertQuestion.options ?? null,
      correctOption: insertQuestion.correctOption ?? null,
      createdAt: new Date(),
    };
    this.customQuestions.set(id, question);
    return question;
  }

  async getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined> {
    return this.customQuestions.get(questionId);
  }

  async getCustomQuestions(testId: string): Promise<CustomQuestion[]> {
    return Array.from(this.customQuestions.values())
      .filter((q) => q.testId === testId)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }

  async updateCustomQuestion(questionId: string, updates: Partial<CustomQuestion>): Promise<CustomQuestion | undefined> {
    const question = this.customQuestions.get(questionId);
    if (!question) return undefined;
    
    const updated = { ...question, ...updates };
    this.customQuestions.set(questionId, updated);
    return updated;
  }

  async deleteCustomQuestions(testId: string): Promise<void> {
    const questions = Array.from(this.customQuestions.entries())
      .filter(([_, q]) => q.testId === testId);
    questions.forEach(([id, _]) => this.customQuestions.delete(id));
  }
}

export const storage = new MemStorage();
