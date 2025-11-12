import { type User, type InsertUser, type TestSession, type InsertTestSession } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
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
      language: insertSession.language,
      classLevel: insertSession.classLevel,
      difficulty: insertSession.difficulty,
      chapter: insertSession.chapter,
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
}

export const storage = new MemStorage();
