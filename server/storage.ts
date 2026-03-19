import {
  type User, type InsertUser,
  type TestSession, type InsertTestSession,
  type Teacher, type InsertTeacher,
  type CustomTest, type InsertCustomTest,
  type CustomQuestion, type InsertCustomQuestion,
  type AnswerSheetEvaluation, type InsertAnswerSheetEvaluation
} from "@shared/schema";
import pool from "./db";

// Normalize DB snake_case -> app camelCase for test_sessions
const normalizeTestSession = (row: any) => {
  if (!row) return row;
  return {
    id: row.id,
    mode: row.mode,
    language: row.language,
    scienceCategory: row.science_category ?? row.scienceCategory ?? null,
    classLevel: row.class_level ?? row.classLevel,
    difficulty: row.difficulty,
    testType: row.test_type ?? row.testType,
    chapter: row.chapter,
    testLength: row.test_length ?? row.testLength,
    currentQuestion: row.current_question ?? row.currentQuestion,
    totalScore: row.total_score ?? row.totalScore,
    correctAnswers: row.correct_answers ?? row.correctAnswers,
    conversationHistory: row.conversation_history ?? row.conversationHistory,
    createdAt: row.created_at ?? row.createdAt,
    mcqTestId: row.mcq_test_id ?? row.mcqTestId ?? null,
  };
};

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

    // OLD INSERT (kept for reference)
    // const result = await pool.query(
    //   `INSERT INTO test_sessions
    //   (mode,language,science_category,class_level,difficulty,test_type,chapter,
    //    test_length,current_question,total_score,correct_answers,conversation_history,mcq_test_id)
    //    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    //    RETURNING *`,
    //   [
    //     session.mode,
    //     session.language,
    //     session.scienceCategory,
    //     session.classLevel,
    //     session.difficulty,
    //     session.testType,
    //     session.chapter,
    //     session.testLength,
    //     session.currentQuestion,
    //     session.totalScore,
    //     session.correctAnswers,
    //     session.conversationHistory,
    //     session.mcqTestId
    //   ]
    // );
    // return result.rows[0];

    try {
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

        // return result.rows[0];
        return normalizeTestSession(result.rows[0]);
      } catch (error: any) {
      const message = String(error?.message || "");

      // Fallback: allow start even if mcq_test_id column is missing
      if (message.includes("mcq_test_id")) {
        const fallback = await pool.query(
          `INSERT INTO test_sessions
          (mode,language,science_category,class_level,difficulty,test_type,chapter,
           test_length,current_question,total_score,correct_answers,conversation_history)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
            session.conversationHistory
          ]
        );

        // return fallback.rows[0];
        return normalizeTestSession(fallback.rows[0]);
      }

      throw error;
    }
  }

  async getTestSession(id: string): Promise<TestSession | undefined> {
    const result = await pool.query(
      "SELECT * FROM test_sessions WHERE id=$1",
      [id]
    );
    // return result.rows[0];
    return normalizeTestSession(result.rows[0]);
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
    // Sanitize NaN values early
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => {
        if (value === "NaN") return [key, 0];
        if (typeof value === "number" && Number.isNaN(value)) return [key, 0];
        return [key, value];
      })
    );

    // OLD (kept for reference)
    // const fields = Object.keys(updates);
    // const values = Object.values(updates);
    // const setQuery = fields
    //   .map((f, i) => `${f}=$${i + 1}`)
    //   .join(",");

    const fieldMap: Record<string, string> = {
      scienceCategory: "science_category",
      classLevel: "class_level",
      testType: "test_type",
      testLength: "test_length",
      currentQuestion: "current_question",
      totalScore: "total_score",
      correctAnswers: "correct_answers",
      conversationHistory: "conversation_history",
      mcqTestId: "mcq_test_id",
    };

    const entries = Object.entries(sanitizedUpdates).filter(([, v]) => v !== undefined);
    const fields = entries.map(([key]) => fieldMap[key] ?? key);

    const numericFields = new Set([
      "class_level",
      "chapter",
      "test_length",
      "current_question",
      "total_score",
      "correct_answers",
      "mcq_test_id",
    ]);

    const nullableNumericFields = new Set(["mcq_test_id"]);

    const values = entries.map(([key, value], idx) => {
      const fieldName = fields[idx];
      if (numericFields.has(fieldName)) {
        if (value === null || value === undefined || value === "") {
          return nullableNumericFields.has(fieldName) ? null : 0;
        }
        const num = Number(value);
        if (Number.isFinite(num)) return num;
        return nullableNumericFields.has(fieldName) ? null : 0;
      }
      return value;
    });

    if (fields.length === 0) {
      const current = await pool.query(
        "SELECT * FROM test_sessions WHERE id=$1",
        [id]
      );
      return current.rows[0];
    }

    const setQuery = fields
      .map((f, i) => `${f}=$${i + 1}`)
      .join(",");

    const result = await pool.query(
      `UPDATE test_sessions SET ${setQuery} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    // return result.rows[0];
    return normalizeTestSession(result.rows[0]);
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

