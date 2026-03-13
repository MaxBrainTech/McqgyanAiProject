// import { 
//   type User, type InsertUser, 
//   type TestSession, type InsertTestSession,
//   type Teacher, type InsertTeacher,
//   type CustomTest, type InsertCustomTest,
//   type CustomQuestion, type InsertCustomQuestion,
//   type AnswerSheetEvaluation, type InsertAnswerSheetEvaluation
// } from "@shared/schema";
// import { randomUUID } from "crypto";
// import pool from "./db";

// export interface IStorage {
//   getUser(id: string): Promise<User | undefined>;
//   getUserByUsername(username: string): Promise<User | undefined>;
//   createUser(user: InsertUser): Promise<User>;

//   // Test session methods
//   createTestSession(session: InsertTestSession): Promise<TestSession>;
//   getTestSession(id: string): Promise<TestSession | undefined>;
//   updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined>;
//   deleteTestSession(id: string): Promise<void>;

//   // Teacher methods
//   getTeacher(id: string): Promise<Teacher | undefined>;
//   getTeacherByUsername(username: string): Promise<Teacher | undefined>;
//   getTeacherByEmail(email: string): Promise<Teacher | undefined>;
//   createTeacher(teacher: InsertTeacher): Promise<Teacher>;

//   // Custom test methods
//   createCustomTest(test: InsertCustomTest): Promise<CustomTest>;
//   getCustomTest(id: string): Promise<CustomTest | undefined>;
//   getCustomTestByShareCode(shareCode: string): Promise<CustomTest | undefined>;
//   getCustomTestsByTeacher(teacherId: string): Promise<CustomTest[]>;
//   updateCustomTest(id: string, updates: Partial<CustomTest>): Promise<CustomTest | undefined>;
//   deleteCustomTest(id: string): Promise<void>;

//   // Custom question methods
//   createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion>;
//   getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined>;
//   getCustomQuestions(testId: string): Promise<CustomQuestion[]>;
//   updateCustomQuestion(questionId: string, updates: Partial<CustomQuestion>): Promise<CustomQuestion | undefined>;
//   deleteCustomQuestions(testId: string): Promise<void>;

//   // Answer sheet evaluation methods
//   saveAnswerSheetEvaluation(evaluation: InsertAnswerSheetEvaluation): Promise<AnswerSheetEvaluation>;
//   getRecentEvaluations(limit: number): Promise<AnswerSheetEvaluation[]>;
// }

// export class MemStorage implements IStorage {
//   private users: Map<string, User>;
//   private testSessions: Map<string, TestSession>;
//   private teachers: Map<string, Teacher>;
//   private customTests: Map<string, CustomTest>;
//   private customQuestions: Map<string, CustomQuestion>;
//   private answerSheetEvaluations: Map<string, AnswerSheetEvaluation>;

//   constructor() {
//     this.users = new Map();
//     this.testSessions = new Map();
//     this.teachers = new Map();
//     this.customTests = new Map();
//     this.customQuestions = new Map();
//     this.answerSheetEvaluations = new Map();

//     // Create demo teacher account
//     const demoTeacher: Teacher = {
//       id: "demo-teacher-id",
//       username: "demo",
//       password: "demo123",
//       fullName: "Demo Teacher",
//       email: "demo@teacher.com",
//       school: "Demo School",
//       createdAt: new Date(),
//     };
//     this.teachers.set(demoTeacher.id, demoTeacher);
//   }

//   async getUser(id: string): Promise<User | undefined> {
//     return this.users.get(id);
//   }

//   async getUserByUsername(username: string): Promise<User | undefined> {
//     return Array.from(this.users.values()).find(
//       (user) => user.username === username,
//     );
//   }

//   async createUser(insertUser: InsertUser): Promise<User> {
//     const id = randomUUID();
//     const user: User = { ...insertUser, id };
//     this.users.set(id, user);
//     return user;
//   }

//   async createTestSession(insertSession: InsertTestSession): Promise<TestSession> {
//     const id = randomUUID();
//     const session: TestSession = {
//       mode: insertSession.mode ?? "language",
//       language: insertSession.language ?? null,
//       scienceCategory: insertSession.scienceCategory ?? null,
//       classLevel: insertSession.classLevel,
//       difficulty: insertSession.difficulty,
//       testType: insertSession.testType ?? "mixed",
//       chapter: insertSession.chapter,
//       testLength: insertSession.testLength ?? 10,
//       currentQuestion: insertSession.currentQuestion ?? 0,
//       totalScore: insertSession.totalScore ?? 0,
//       correctAnswers: insertSession.correctAnswers ?? 0,
//       conversationHistory: insertSession.conversationHistory ?? "[]",
//       id,
//       createdAt: new Date(),
//     };
//     this.testSessions.set(id, session);
//     return session;
//   }

//   async getTestSession(id: string): Promise<TestSession | undefined> {
//     return this.testSessions.get(id);
//   }

//   async updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined> {
//     const session = this.testSessions.get(id);
//     if (!session) return undefined;

//     const updated = { ...session, ...updates };
//     this.testSessions.set(id, updated);
//     return updated;
//   }

//   async deleteTestSession(id: string): Promise<void> {
//     this.testSessions.delete(id);
//   }

//   // Teacher methods
//   async getTeacher(id: string): Promise<Teacher | undefined> {
//     return this.teachers.get(id);
//   }

//   // async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
//   //   return Array.from(this.teachers.values()).find(
//   //     (teacher) => teacher.username === username,
//   //   );
//   // }

//   async getTeacherByUsername(username: string) {
//     const result = await pool.query(
//       "SELECT * FROM teachers WHERE username=$1",
//       [username]
//     );

//     return result.rows[0];
//   }

//   async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
//     return Array.from(this.teachers.values()).find(
//       (teacher) => teacher.email === email,
//     );
//   }

//   // async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
//   //   const id = randomUUID();
//   //   const teacher: Teacher = {
//   //     ...insertTeacher,
//   //     id,
//   //     school: insertTeacher.school ?? null,
//   //     createdAt: new Date(),
//   //   };
//   //   this.teachers.set(id, teacher);
//   //   return teacher;
//   // }

//   async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {

//     const result = await pool.query(
//       `INSERT INTO teachers (username,password,fullname,email,school)
//        VALUES ($1,$2,$3,$4,$5)
//        RETURNING *`,
//       [
//         insertTeacher.username,
//         insertTeacher.password,
//         insertTeacher.fullName,
//         insertTeacher.email,
//         insertTeacher.school
//       ]
//     );

//     return result.rows[0];
//   }

//   // Custom test methods
//   async createCustomTest(insertTest: InsertCustomTest): Promise<CustomTest> {
//     const id = randomUUID();
//     const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
//     const test: CustomTest = {
//       ...insertTest,
//       id,
//       shareCode,
//       testType: insertTest.testType ?? "mcq",
//       gptModel: insertTest.gptModel ?? "gpt-4o-mini",
//       status: insertTest.status ?? "draft",
//       instructions: insertTest.instructions ?? null,
//       createdAt: new Date(),
//     };
//     this.customTests.set(id, test);
//     return test;
//   }

//   async getCustomTest(id: string): Promise<CustomTest | undefined> {
//     return this.customTests.get(id);
//   }

//   async getCustomTestByShareCode(shareCode: string): Promise<CustomTest | undefined> {
//     return Array.from(this.customTests.values()).find(
//       (test) => test.shareCode === shareCode,
//     );
//   }

//   async getCustomTestsByTeacher(teacherId: string): Promise<CustomTest[]> {
//     return Array.from(this.customTests.values()).filter(
//       (test) => test.teacherId === teacherId,
//     );
//   }

//   async updateCustomTest(id: string, updates: Partial<CustomTest>): Promise<CustomTest | undefined> {
//     const test = this.customTests.get(id);
//     if (!test) return undefined;

//     const updated = { ...test, ...updates };
//     this.customTests.set(id, updated);
//     return updated;
//   }

//   async deleteCustomTest(id: string): Promise<void> {
//     this.customTests.delete(id);
//   }

//   // Custom question methods
//   async createCustomQuestion(insertQuestion: InsertCustomQuestion): Promise<CustomQuestion> {
//     const id = randomUUID();
//     const question: CustomQuestion = {
//       ...insertQuestion,
//       id,
//       options: insertQuestion.options ?? null,
//       correctOption: insertQuestion.correctOption ?? null,
//       createdAt: new Date(),
//     };
//     this.customQuestions.set(id, question);
//     return question;
//   }

//   async getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined> {
//     return this.customQuestions.get(questionId);
//   }

//   async getCustomQuestions(testId: string): Promise<CustomQuestion[]> {
//     return Array.from(this.customQuestions.values())
//       .filter((q) => q.testId === testId)
//       .sort((a, b) => a.questionNumber - b.questionNumber);
//   }

//   async updateCustomQuestion(questionId: string, updates: Partial<CustomQuestion>): Promise<CustomQuestion | undefined> {
//     const question = this.customQuestions.get(questionId);
//     if (!question) return undefined;

//     const updated = { ...question, ...updates };
//     this.customQuestions.set(questionId, updated);
//     return updated;
//   }

//   async deleteCustomQuestions(testId: string): Promise<void> {
//     const questions = Array.from(this.customQuestions.entries())
//       .filter(([_, q]) => q.testId === testId);
//     questions.forEach(([id, _]) => this.customQuestions.delete(id));
//   }

//   // Answer sheet evaluation methods
//   async saveAnswerSheetEvaluation(insertEvaluation: InsertAnswerSheetEvaluation): Promise<AnswerSheetEvaluation> {
//     const id = randomUUID();
//     const evaluation: AnswerSheetEvaluation = {
//       ...insertEvaluation,
//       id,
//       studentName: insertEvaluation.studentName ?? null,
//       classLevel: insertEvaluation.classLevel ?? null,
//       subject: insertEvaluation.subject ?? null,
//       gptModel: insertEvaluation.gptModel || "gpt-4o",
//       createdAt: new Date(),
//     };
//     this.answerSheetEvaluations.set(id, evaluation);
//     return evaluation;
//   }

//   async getRecentEvaluations(limit: number): Promise<AnswerSheetEvaluation[]> {
//     return Array.from(this.answerSheetEvaluations.values())
//       .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
//       .slice(0, limit);
//   }
// }

// export const storage = new MemStorage();
import {
  type User, type InsertUser,
  type TestSession, type InsertTestSession,
  type Teacher, type InsertTeacher,
  type CustomTest, type InsertCustomTest,
  type CustomQuestion, type InsertCustomQuestion,
  type AnswerSheetEvaluation, type InsertAnswerSheetEvaluation
} from "@shared/schema";
import pool from "./db";

export class Storage {

  // ---------------- USERS ----------------

  async getUser(id: string): Promise<User | undefined> {
    const result = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [id]
    );
    return result.rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
    return result.rows[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (username,password)
       VALUES ($1,$2)
       RETURNING *`,
      [user.username, user.password]
    );

    return result.rows[0];
  }

  // ---------------- TEST SESSION ----------------

  async createTestSession(session: InsertTestSession): Promise<TestSession> {

    const result = await pool.query(
      `INSERT INTO test_sessions
      (mode,language,science_category,class_level,difficulty,test_type,chapter,
       test_length,current_question,total_score,correct_answers,conversation_history,mcq_test_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        session.mode,
        session.language,
        session.scienceCategory,
        session.classLevel,
        session.difficulty,
        session.testType,
        session.chapter,
        session.testLength,
        session.currentQuestion,
        session.totalScore,
        session.correctAnswers,
        session.conversationHistory,
        session.mcqTestId
      ]
    );

    return result.rows[0];
  }

  async getTestSession(id: string): Promise<TestSession | undefined> {
    const result = await pool.query(
      "SELECT * FROM test_sessions WHERE id=$1",
      [id]
    );
    return result.rows[0];
  }

  // async updateCustomQuestion(
  //   questionId: string,
  //   updates: Partial<CustomQuestion>
  // ): Promise<CustomQuestion | undefined> {

  //   const fields = Object.keys(updates);
  //   const values = Object.values(updates);

  //   const setQuery = fields
  //     .map((field, index) => `${field}=$${index + 1}`)
  //     .join(",");

  //   const result = await pool.query(
  //     `UPDATE custom_questions 
  //      SET ${setQuery}
  //      WHERE id=$${fields.length + 1}
  //      RETURNING *`,
  //     [...values, questionId]
  //   );

  //   return result.rows[0];
  // }

  async updateTestSession(id: string, updates: Partial<TestSession>) {

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setQuery = fields
      .map((f, i) => `${f}=$${i + 1}`)
      .join(",");

    const result = await pool.query(
      `UPDATE test_sessions SET ${setQuery} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  async deleteTestSession(id: string) {
    await pool.query(
      "DELETE FROM test_sessions WHERE id=$1",
      [id]
    );
  }

  // ---------------- TEACHERS ----------------

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const result = await pool.query(
      "SELECT * FROM teachers WHERE id=$1",
      [id]
    );
    return result.rows[0];
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    const result = await pool.query(
      "SELECT * FROM teachers WHERE username=$1",
      [username]
    );
    return result.rows[0];
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const result = await pool.query(
      "SELECT * FROM teachers WHERE email=$1",
      [email]
    );
    return result.rows[0];
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {

    const result = await pool.query(
      `INSERT INTO teachers (username,password,full_name,email,school)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        teacher.username,
        teacher.password,
        teacher.fullName,
        teacher.email,
        teacher.school
      ]
    );

    return result.rows[0];
  }

  // ---------------- CUSTOM TEST ----------------

  async createCustomTest(test: InsertCustomTest): Promise<CustomTest> {

    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await pool.query(
      `INSERT INTO custom_tests
      (teacher_id,title,subject,class_level,difficulty,syllabus,num_questions,
       language,test_type,gpt_model,share_code,instructions,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        test.teacherId,
        test.title,
        test.subject,
        test.classLevel,
        test.difficulty,
        test.syllabus,
        test.numQuestions,
        test.language,
        test.testType,
        test.gptModel,
        shareCode,
        test.instructions,
        test.status
      ]
    );

    return result.rows[0];
  }

  async getCustomTest(id: string): Promise<CustomTest | undefined> {
    const result = await pool.query(
      "SELECT * FROM custom_tests WHERE id=$1",
      [id]
    );
    return result.rows[0];
  }

  async getCustomTestByShareCode(shareCode: string) {
    const result = await pool.query(
      "SELECT * FROM custom_tests WHERE share_code=$1",
      [shareCode]
    );
    return result.rows[0];
  }

  async getCustomTestsByTeacher(teacherId: string) {
    const result = await pool.query(
      "SELECT * FROM custom_tests WHERE teacher_id=$1",
      [teacherId]
    );

    return result.rows;
  }

  async updateCustomTest(id: string, updates: Partial<CustomTest>) {

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(",");

    const result = await pool.query(
      `UPDATE custom_tests SET ${setQuery}
       WHERE id=$${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  async deleteCustomTest(id: string) {
    await pool.query(
      "DELETE FROM custom_tests WHERE id=$1",
      [id]
    );
  }

  // ---------------- QUESTIONS ----------------

  async createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion> {

    const result = await pool.query(
      `INSERT INTO custom_questions
      (test_id,question_number,question,question_type,options,
       correct_option,correct_answer,explanation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        question.testId,
        question.questionNumber,
        question.question,
        question.questionType,
        question.options,
        question.correctOption,
        question.correctAnswer,
        question.explanation
      ]
    );

    return result.rows[0];
  }

  async getCustomQuestions(testId: string) {

    const result = await pool.query(
      "SELECT * FROM custom_questions WHERE test_id=$1 ORDER BY question_number",
      [testId]
    );

    return result.rows;
  }

  async getCustomQuestion(questionId: string): Promise<CustomQuestion | undefined> {

    const result = await pool.query(
      "SELECT * FROM custom_questions WHERE id=$1",
      [questionId]
    );

    return result.rows[0];
  }

  async updateCustomQuestion(
    questionId: string,
    updates: Partial<CustomQuestion>
  ): Promise<CustomQuestion | undefined> {

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(",");

    const result = await pool.query(
      `UPDATE custom_questions SET ${setQuery}
       WHERE id=$${fields.length + 1}
       RETURNING *`,
      [...values, questionId]
    );

    return result.rows[0];
  }

  // ---------------- ANSWER SHEET ----------------

  async saveAnswerSheetEvaluation(evaluation: InsertAnswerSheetEvaluation): Promise<AnswerSheetEvaluation> {

    const result = await pool.query(
      `INSERT INTO answer_sheet_evaluations
      (student_name,class_level,subject,total_images,evaluation_summary,gpt_model)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        evaluation.studentName,
        evaluation.classLevel,
        evaluation.subject,
        evaluation.totalImages,
        evaluation.evaluationSummary,
        evaluation.gptModel
      ]
    );

    return result.rows[0];
  }

  async getRecentEvaluations(limit: number) {

    const result = await pool.query(
      "SELECT * FROM answer_sheet_evaluations ORDER BY created_at DESC LIMIT $1",
      [limit]
    );

    return result.rows;
  }
}

export const storage = new Storage();