import {
  type User, type InsertUser,
  type TestSession, type InsertTestSession,
  type Teacher, type InsertTeacher,
  type StudentProfile, type InsertStudentProfile,
  type CustomTest, type InsertCustomTest,
  type CustomTestSubmission, type InsertCustomTestSubmission,
  type CustomQuestion, type InsertCustomQuestion,
  type AnswerSheetEvaluation, type InsertAnswerSheetEvaluation,
  type StudentScoreHistory, type InsertStudentScoreHistory,
  type GeneratedTest, type InsertGeneratedTest,
  type GeneratedTestQuestion, type InsertGeneratedTestQuestion
} from "@shared/schema";

import pool, { databaseReady, ensureBaseTables, ensureStudentScoreHistoryTable } from "./db";

// Normalize DB snake_case -> app camelCase for test_sessions
const normalizeTestSession = (row: any) => {
  if (!row) return row;
  return {
    id: row.id,
    mode: row.mode,
    language: row.language,
    subjectLanguage: row.subject_language ?? row.subjectLanguage ?? null,
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

const normalizeCustomTest = (row: any) => {
  if (!row) return row;
  return {
    ...row,
    teacherId: row.teacherId ?? row.teacher_id ?? row.teacherID ?? null,
    classLevel: row.classLevel ?? row.class_level ?? null,
    durationMinutes: row.durationMinutes ?? row.duration_minutes ?? null,
    numQuestions: row.numQuestions ?? row.num_questions ?? null,
    testType: row.testType ?? row.test_type ?? null,
    gptModel: row.gptModel ?? row.gpt_model ?? null,
    shareCode: row.shareCode ?? row.share_code ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
};

const normalizeStudentScoreHistory = (row: any): StudentScoreHistory | undefined => {
  if (!row) return row;
  let parsedInsights = row.insights;
  if (typeof parsedInsights === "string") {
    try {
      parsedInsights = JSON.parse(parsedInsights);
      if (typeof parsedInsights === "string") {
        parsedInsights = JSON.parse(parsedInsights);
      }
    } catch {
      parsedInsights = {};
    }
  }

  const rawClass =
    row.class_level ??
    row.classLevel ??
    parsedInsights?.classLevel ??
    parsedInsights?.questionPaper?.classLevel ??
    null;

  const classLevel =
    rawClass != null && !Number.isNaN(Number(rawClass)) && Number(rawClass) > 0
      ? Number(rawClass)
      : null;

  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    userEmail: row.user_email ?? row.userEmail ?? null,
    subject: row.subject,
    mode: row.mode ?? null,
    difficulty: row.difficulty ?? null,
    language: row.language ?? "english",
    classLevel,
    score: row.score ?? 0,
    maxScore: row.max_score ?? row.maxScore ?? 0,
    percentage: row.percentage ?? 0,
    totalQuestions: row.total_questions ?? row.totalQuestions ?? 0,
    correctAnswers: row.correct_answers ?? row.correctAnswers ?? 0,
    insights: parsedInsights ?? {},
    createdAt: row.created_at ?? row.createdAt,
  } as any;
};

const normalizeStudentProfile = (row: any): StudentProfile | undefined => {
  if (!row) return row;
  const fullName = row.full_name ?? row.fullName ?? row.display_name ?? row.displayName ?? null;
  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    fullName,
    displayName: row.display_name ?? row.displayName ?? fullName,
    emailAddress: row.email_address ?? row.emailAddress ?? null,
    classLevel: row.class_level ?? row.classLevel ?? null,
    school: row.school ?? null,
    medium: row.medium ?? null,
    board: row.board ?? null,
    country: row.country ?? null,
    state: row.state ?? null,
    city: row.city ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
};

const normalizeTeacher = (row: any): Teacher | undefined => {
  if (!row) return row;

  return {
    id: row.id,
    username: row.username,
    password: row.password,
    fullName: row.full_name ?? row.fullName ?? row.name ?? "",
    email: row.email,
    school: row.school ?? null,
    createdAt: row.created_at ?? row.createdAt,
    isVerified: row.is_verified ?? row.isVerified ?? "false",
    isApproved: row.is_approved ?? row.isApproved ?? "false",
    verifiedAt: row.verified_at ?? row.verifiedAt ?? null,
    verificationToken: row.verification_token ?? row.verificationToken ?? null,
  } as Teacher;
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

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    try {
      await databaseReady;
      const result = await pool.query(
        "SELECT * FROM student_profiles WHERE user_id=$1",
        [userId]
      );
      return normalizeStudentProfile(result.rows[0]);
    } catch (error: any) {
      if (error?.code === "42P01") {
        await ensureBaseTables();
        const result = await pool.query(
          "SELECT * FROM student_profiles WHERE user_id=$1",
          [userId]
        );
        return normalizeStudentProfile(result.rows[0]);
      }
      throw error;
    }
  }

  async upsertStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    try {
      await databaseReady;
      const fullName = (profile as any).fullName ?? profile.displayName ?? null;
      const result = await pool.query(
        `INSERT INTO student_profiles
         (user_id, full_name, display_name, email_address, class_level, school, medium, board, country, state, city, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
         ON CONFLICT (user_id) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             display_name = EXCLUDED.display_name,
             email_address = EXCLUDED.email_address,
             class_level = EXCLUDED.class_level,
             school = EXCLUDED.school,
             medium = EXCLUDED.medium,
             board = EXCLUDED.board,
             country = EXCLUDED.country,
             state = EXCLUDED.state,
             city = EXCLUDED.city,
             updated_at = now()
         RETURNING *`,
        [
          profile.userId,
          fullName,
          fullName,
          profile.emailAddress ?? null,
          profile.classLevel ?? null,
          profile.school ?? null,
          profile.medium ?? null,
          profile.board ?? null,
          profile.country ?? null,
          profile.state ?? null,
          profile.city ?? null,
        ]
      );
      return normalizeStudentProfile(result.rows[0]) as StudentProfile;
    } catch (error: any) {
      if (error?.code === "42P01") {
        await ensureBaseTables();
        const fullName = (profile as any).fullName ?? profile.displayName ?? null;
        const result = await pool.query(
          `INSERT INTO student_profiles
           (user_id, full_name, display_name, email_address, class_level, school, medium, board, country, state, city, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
           ON CONFLICT (user_id) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               display_name = EXCLUDED.display_name,
               email_address = EXCLUDED.email_address,
               class_level = EXCLUDED.class_level,
               school = EXCLUDED.school,
               medium = EXCLUDED.medium,
               board = EXCLUDED.board,
               country = EXCLUDED.country,
               state = EXCLUDED.state,
               city = EXCLUDED.city,
               updated_at = now()
           RETURNING *`,
          [
            profile.userId,
            fullName,
            fullName,
            profile.emailAddress ?? null,
            profile.classLevel ?? null,
            profile.school ?? null,
            profile.medium ?? null,
            profile.board ?? null,
            profile.country ?? null,
            profile.state ?? null,
            profile.city ?? null,
          ]
        );
        return normalizeStudentProfile(result.rows[0]) as StudentProfile;
      }
      throw error;
    }
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
        (mode,language,subject_language,science_category,class_level,difficulty,test_type,chapter,
         test_length,current_question,total_score,correct_answers,conversation_history,mcq_test_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          session.mode,
          session.language,
          session.subjectLanguage ?? null,
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
          (mode,language,subject_language,science_category,class_level,difficulty,test_type,chapter,
           test_length,current_question,total_score,correct_answers,conversation_history)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           RETURNING *`,
          [
            session.mode,
            session.language,
            session.subjectLanguage ?? null,
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
      subjectLanguage: "subject_language",
      classLevel: "class_level",
      durationMinutes: "duration_minutes",
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
      "duration_minutes",
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
    return normalizeTeacher(result.rows[0]);
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    const result = await pool.query(
      "SELECT * FROM teachers WHERE username=$1",
      [username]
    );
    return normalizeTeacher(result.rows[0]);
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const result = await pool.query(
      "SELECT * FROM teachers WHERE LOWER(email)=LOWER($1)",
      [email]
    );

    return normalizeTeacher(result.rows[0]);
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

    return normalizeTeacher(result.rows[0]) as Teacher;
  }

  async updateTeacherVerificationToken(
    teacherId: string,
    token: string
  ): Promise<void> {
    await pool.query(
      `UPDATE teachers
      SET verification_token = $1
      WHERE id = $2`,
      [token, teacherId]
    );
  }

  async updateTeacherApproval(
    teacherId: string,
    isApproved: boolean
  ): Promise<Teacher | undefined> {
    const result = await pool.query(
      `UPDATE teachers
       SET is_approved = $1
       WHERE id = $2
       RETURNING *`,
      [isApproved ? "true" : "false", teacherId]
    );

    return normalizeTeacher(result.rows[0]);
  }

  async verifyTeacher(token: string): Promise<Teacher | undefined> {

  console.log("DB TOKEN:", token);

  const result = await pool.query(
    `UPDATE teachers
     SET
       is_verified = true,
       verified_at = NOW(),
       verification_token = NULL
     WHERE verification_token = $1
     RETURNING *`,
    [token]
  );

  console.log("UPDATED ROWS:", result.rows);

  return normalizeTeacher(result.rows[0]);
}

async updateTeacherResetToken(
  teacherId: string,
  token: string,
  expires: Date
): Promise<void> {

  await pool.query(
    `UPDATE teachers
     SET
       reset_password_token = $1,
       reset_password_expires = $2
     WHERE id = $3`,
    [token, expires, teacherId]
  );

}

async getTeacherByResetToken(
  token: string
): Promise<Teacher | undefined> {

  const result = await pool.query(
    `SELECT *
     FROM teachers
     WHERE
       reset_password_token = $1
       AND reset_password_expires > NOW()`,
    [token]
  );

  return normalizeTeacher(result.rows[0]);

}

async updateTeacherPassword(
  teacherId: string,
  password: string
): Promise<void> {

  await pool.query(
    `UPDATE teachers
     SET password = $1
     WHERE id = $2`,
    [password, teacherId]
  );

}

async clearTeacherResetToken(
  teacherId: string
): Promise<void> {

  await pool.query(
    `UPDATE teachers
     SET
       reset_password_token = NULL,
       reset_password_expires = NULL
     WHERE id = $1`,
    [teacherId]
  );

}

  // ---------------- CUSTOM TEST ----------------

  async createCustomTest(test: InsertCustomTest): Promise<CustomTest> {

    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await pool.query(
      `INSERT INTO custom_tests
      (teacher_id,title,subject,class_level,difficulty,duration_minutes,syllabus,num_questions,
       language,test_type,gpt_model,share_code,instructions,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        test.teacherId,
        test.title,
        test.subject,
        test.classLevel,
        test.difficulty,
        test.durationMinutes ?? 30,
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

    return normalizeCustomTest(result.rows[0]);
  }

  async getCustomTest(id: string): Promise<CustomTest | undefined> {
    const result = await pool.query(
      "SELECT * FROM custom_tests WHERE id=$1",
      [id]
    );
    return normalizeCustomTest(result.rows[0]);
  }

  async getCustomTestByShareCode(shareCode: string) {
    const result = await pool.query(
      "SELECT * FROM custom_tests WHERE share_code=$1",
      [shareCode]
    );
    return normalizeCustomTest(result.rows[0]);
  }

  async getCustomTestsByTeacher(teacherId: string) {
    const result = await pool.query(
      "SELECT * FROM custom_tests WHERE teacher_id=$1",
      [teacherId]
    );

    return result.rows.map(normalizeCustomTest);
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

    return normalizeCustomTest(result.rows[0]);
  }

  async createCustomTestSubmission(submission: InsertCustomTestSubmission): Promise<CustomTestSubmission> {
    const result = await pool.query(
      `INSERT INTO custom_test_submissions
      (test_id,student_name,score,total_questions,time_taken_seconds,submission_type,start_time,end_time,answers)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        submission.testId,
        submission.studentName,
        submission.score,
        submission.totalQuestions,
        submission.timeTakenSeconds,
        submission.submissionType,
        submission.startTime,
        submission.endTime,
        submission.answers ?? "{}",
      ]
    );

    return result.rows[0];
  }

  async getCustomTestSubmissionsByTestId(testId: string) {
    const result = await pool.query(
      `SELECT * FROM custom_test_submissions
       WHERE test_id=$1
       ORDER BY end_time DESC, created_at DESC`,
      [testId]
    );

    return result.rows;
  }

  async getCustomTestSubmission(id: string): Promise<CustomTestSubmission | undefined> {
    const result = await pool.query(
      "SELECT * FROM custom_test_submissions WHERE id=$1",
      [id]
    );

    return result.rows[0];
  }

  async updateCustomTestSubmission(
    id: string,
    updates: Partial<CustomTestSubmission>
  ): Promise<CustomTestSubmission | undefined> {
    const fields = Object.keys(updates).filter((key) => updates[key as keyof CustomTestSubmission] !== undefined);
    if (fields.length === 0) {
      return this.getCustomTestSubmission(id);
    }

    const fieldMap: Record<string, string> = {
      testId: "test_id",
      studentName: "student_name",
      totalQuestions: "total_questions",
      timeTakenSeconds: "time_taken_seconds",
      submissionType: "submission_type",
      startTime: "start_time",
      endTime: "end_time",
    };

    const columns = fields.map((field) => fieldMap[field] ?? field);
    const values = fields.map((field) => {
      const value = (updates as any)[field];
      return value;
    });

    const setQuery = columns.map((column, index) => `${column}=$${index + 1}`).join(", ");
    const result = await pool.query(
      `UPDATE custom_test_submissions SET ${setQuery} WHERE id=$${fields.length + 1} RETURNING *`,
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

  // ---------------- STUDENT SCORE HISTORY ----------------

  async upsertStudentScoreHistory(entry: InsertStudentScoreHistory): Promise<StudentScoreHistory> {
    const sanitizeInsights = (insightsInput: any) => {
      if (!insightsInput) return "{}";
      let val = insightsInput;
      if (typeof val === "string") {
        try {
          val = JSON.parse(val);
        } catch {
          return "{}";
        }
      }
      return JSON.stringify(val ?? {});
    };

    const insightsJson = sanitizeInsights(entry.insights);
    const rawClass = (entry as any).classLevel ?? (entry as any).class_level ?? null;
    const classLevelVal = rawClass != null && !Number.isNaN(Number(rawClass)) && Number(rawClass) > 0 ? Number(rawClass) : null;

    try {
      await databaseReady;
      let result;
      try {
        result = await pool.query(
          `INSERT INTO student_score_history
          (id, user_id, user_email, subject, mode, difficulty, language, class_level, score, max_score, percentage, total_questions, correct_answers, insights)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            user_email = EXCLUDED.user_email,
            subject = EXCLUDED.subject,
            mode = EXCLUDED.mode,
            difficulty = EXCLUDED.difficulty,
            language = EXCLUDED.language,
            class_level = EXCLUDED.class_level,
            score = EXCLUDED.score,
            max_score = EXCLUDED.max_score,
            percentage = EXCLUDED.percentage,
            total_questions = EXCLUDED.total_questions,
            correct_answers = EXCLUDED.correct_answers,
            insights = EXCLUDED.insights
          RETURNING *`,
          [
            (entry as any).id,
            entry.userId,
            entry.userEmail ?? null,
            entry.subject,
            entry.mode ?? null,
            entry.difficulty ?? null,
            entry.language ?? "english",
            classLevelVal,
            entry.score,
            entry.maxScore,
            entry.percentage,
            entry.totalQuestions,
            entry.correctAnswers,
            insightsJson,
          ]
        );
      } catch {
        result = await pool.query(
          `INSERT INTO student_score_history
          (id, user_id, user_email, subject, mode, difficulty, language, score, max_score, percentage, total_questions, correct_answers, insights)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            user_email = EXCLUDED.user_email,
            subject = EXCLUDED.subject,
            mode = EXCLUDED.mode,
            difficulty = EXCLUDED.difficulty,
            language = EXCLUDED.language,
            score = EXCLUDED.score,
            max_score = EXCLUDED.max_score,
            percentage = EXCLUDED.percentage,
            total_questions = EXCLUDED.total_questions,
            correct_answers = EXCLUDED.correct_answers,
            insights = EXCLUDED.insights
          RETURNING *`,
          [
            (entry as any).id,
            entry.userId,
            entry.userEmail ?? null,
            entry.subject,
            entry.mode ?? null,
            entry.difficulty ?? null,
            entry.language ?? "english",
            entry.score,
            entry.maxScore,
            entry.percentage,
            entry.totalQuestions,
            entry.correctAnswers,
            insightsJson,
          ]
        );
      }

      return normalizeStudentScoreHistory(result.rows[0]) as StudentScoreHistory;
    } catch (error: any) {
      if (error?.code === "42P01") {
        await ensureStudentScoreHistoryTable();
        const result = await pool.query(
          `INSERT INTO student_score_history
          (id, user_id, user_email, subject, mode, difficulty, language, score, max_score, percentage, total_questions, correct_answers, insights)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            user_email = EXCLUDED.user_email,
            subject = EXCLUDED.subject,
            mode = EXCLUDED.mode,
            difficulty = EXCLUDED.difficulty,
            language = EXCLUDED.language,
            score = EXCLUDED.score,
            max_score = EXCLUDED.max_score,
            percentage = EXCLUDED.percentage,
            total_questions = EXCLUDED.total_questions,
            correct_answers = EXCLUDED.correct_answers,
            insights = EXCLUDED.insights
          RETURNING *`,
          [
            (entry as any).id,
            entry.userId,
            entry.userEmail ?? null,
            entry.subject,
            entry.mode ?? null,
            entry.difficulty ?? null,
            entry.language ?? "english",
            entry.score,
            entry.maxScore,
            entry.percentage,
            entry.totalQuestions,
            entry.correctAnswers,
            insightsJson,
          ]
        );

        return normalizeStudentScoreHistory(result.rows[0]) as StudentScoreHistory;
      }

      throw error;
    }
  }

  async getStudentScoreHistory(userId: string): Promise<StudentScoreHistory[]> {
    try {
      await databaseReady;
      const result = await pool.query(
        `SELECT * FROM student_score_history
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(normalizeStudentScoreHistory).filter(Boolean) as StudentScoreHistory[];
    } catch (error: any) {
      if (error?.code === "42P01") {
        await ensureStudentScoreHistoryTable();
        const result = await pool.query(
          `SELECT * FROM student_score_history
           WHERE user_id = $1
           ORDER BY created_at DESC`,
          [userId]
        );

        return result.rows.map(normalizeStudentScoreHistory).filter(Boolean) as StudentScoreHistory[];
      }

      throw error;
    }
  }

  async deleteStudentScoreHistory(userId: string) {
    try {
      await databaseReady;
      await pool.query("DELETE FROM student_score_history WHERE user_id = $1", [userId]);
    } catch (error: any) {
      if (error?.code === "42P01") {
        await ensureStudentScoreHistoryTable();
        await pool.query("DELETE FROM student_score_history WHERE user_id = $1", [userId]);
        return;
      }

      throw error;
    }
  }

  // --- Generated Tests & Questions Methods ---

  async createGeneratedTest(
    testData: Partial<InsertGeneratedTest>,
    questions: Array<Partial<InsertGeneratedTestQuestion>>
  ): Promise<{ test: GeneratedTest; questions: GeneratedTestQuestion[] }> {
    await databaseReady;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const testId = (testData as any).id || undefined;
      const testCols = testId
        ? `id, student_id, student_name, student_email, class_level, subject, chapter_topic, medium, board, difficulty, test_type, test_mode, question_count`
        : `student_id, student_name, student_email, class_level, subject, chapter_topic, medium, board, difficulty, test_type, test_mode, question_count`;
      const testVals = testId
        ? `$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13`
        : `$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12`;

      const params = testId
        ? [
            testId,
            testData.studentId || "student-1",
            testData.studentName || "Student",
            testData.studentEmail || null,
            testData.classLevel || null,
            testData.subject || "General",
            testData.chapterTopic || null,
            testData.medium || "English",
            testData.board || "CBSE",
            testData.difficulty || "Medium",
            testData.testType || "MCQ",
            testData.testMode || "Practice",
            questions.length,
          ]
        : [
            testData.studentId || "student-1",
            testData.studentName || "Student",
            testData.studentEmail || null,
            testData.classLevel || null,
            testData.subject || "General",
            testData.chapterTopic || null,
            testData.medium || "English",
            testData.board || "CBSE",
            testData.difficulty || "Medium",
            testData.testType || "MCQ",
            testData.testMode || "Practice",
            questions.length,
          ];

      const testResult = await client.query(
        `INSERT INTO generated_tests (${testCols}) VALUES (${testVals}) RETURNING *`,
        params
      );

      const savedTest = normalizeGeneratedTest(testResult.rows[0]);
      const savedQuestions: GeneratedTestQuestion[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qResult = await client.query(
          `INSERT INTO generated_test_questions (
            generated_test_id, question_number, question, option_a, option_b, option_c, option_d, correct_option, correct_answer, explanation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            savedTest.id,
            q.questionNumber || i + 1,
            q.question || "",
            q.optionA || null,
            q.optionB || null,
            q.optionC || null,
            q.optionD || null,
            q.correctOption || null,
            q.correctAnswer || "",
            q.explanation || null,
          ]
        );
        savedQuestions.push(normalizeGeneratedTestQuestion(qResult.rows[0]));
      }

      await client.query("COMMIT");
      return { test: savedTest, questions: savedQuestions };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getGeneratedTests(params: {
    classLevel?: number | null;
    subject?: string | null;
    chapterTopic?: string | null;
    difficulty?: string | null;
    medium?: string | null;
    board?: string | null;
    testType?: string | null;
    testMode?: string | null;
    studentId?: string | null;
    search?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    page?: number;
    limit?: number;
    ids?: string[];
  }): Promise<{
    tests: GeneratedTest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await databaseReady;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(500, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (params.ids && Array.isArray(params.ids) && params.ids.length > 0) {
      conditions.push(`id = ANY($${paramIdx++})`);
      queryParams.push(params.ids);
    }

    if (params.classLevel != null && !isNaN(Number(params.classLevel))) {
      conditions.push(`class_level = $${paramIdx++}`);
      queryParams.push(Number(params.classLevel));
    }

    if (params.subject && params.subject.trim() && params.subject.toLowerCase() !== "all") {
      conditions.push(`LOWER(subject) = LOWER($${paramIdx++})`);
      queryParams.push(params.subject.trim());
    }

    if (params.difficulty && params.difficulty.trim() && params.difficulty.toLowerCase() !== "all") {
      conditions.push(`LOWER(difficulty) = LOWER($${paramIdx++})`);
      queryParams.push(params.difficulty.trim());
    }

    if (params.medium && params.medium.trim() && params.medium.toLowerCase() !== "all") {
      conditions.push(`LOWER(medium) = LOWER($${paramIdx++})`);
      queryParams.push(params.medium.trim());
    }

    if (params.board && params.board.trim() && params.board.toLowerCase() !== "all") {
      conditions.push(`LOWER(board) = LOWER($${paramIdx++})`);
      queryParams.push(params.board.trim());
    }

    if (params.testType && params.testType.trim() && params.testType.toLowerCase() !== "all") {
      conditions.push(`LOWER(test_type) = LOWER($${paramIdx++})`);
      queryParams.push(params.testType.trim());
    }

    if (params.testMode && params.testMode.trim() && params.testMode.toLowerCase() !== "all") {
      conditions.push(`LOWER(test_mode) = LOWER($${paramIdx++})`);
      queryParams.push(params.testMode.trim());
    }

    if (params.studentId && params.studentId.trim()) {
      conditions.push(`student_id = $${paramIdx++}`);
      queryParams.push(params.studentId.trim());
    }

    if (params.dateFrom && params.dateFrom.trim()) {
      conditions.push(`created_at >= $${paramIdx++}`);
      queryParams.push(new Date(params.dateFrom));
    }

    if (params.dateTo && params.dateTo.trim()) {
      conditions.push(`created_at <= $${paramIdx++}`);
      queryParams.push(new Date(params.dateTo));
    }

    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(student_name) LIKE $${paramIdx} OR
        LOWER(student_email) LIKE $${paramIdx} OR
        LOWER(id) LIKE $${paramIdx} OR
        LOWER(subject) LIKE $${paramIdx} OR
        LOWER(chapter_topic) LIKE $${paramIdx}
      )`);
      queryParams.push(s);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM generated_tests ${whereClause}`,
      queryParams
    );
    const total = Number(countResult.rows[0]?.count || 0);

    const dataQueryParams = [...queryParams, limit, offset];
    const testsResult = await pool.query(
      `SELECT * FROM generated_tests ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      dataQueryParams
    );

    const tests = testsResult.rows.map(normalizeGeneratedTest);
    const totalPages = Math.ceil(total / limit) || 1;

    return { tests, total, page, limit, totalPages };
  }

  async getGeneratedTestWithQuestions(id: string): Promise<{
    test: GeneratedTest;
    questions: GeneratedTestQuestion[];
  } | null> {
    await databaseReady;
    const testRes = await pool.query(`SELECT * FROM generated_tests WHERE id = $1`, [id]);
    if (testRes.rows.length === 0) return null;

    const test = normalizeGeneratedTest(testRes.rows[0]);
    const qRes = await pool.query(
      `SELECT * FROM generated_test_questions WHERE generated_test_id = $1 ORDER BY question_number ASC`,
      [id]
    );
    const questions = qRes.rows.map(normalizeGeneratedTestQuestion);

    return { test, questions };
  }

  async getGeneratedTestStats(): Promise<{
    totalGeneratedTests: number;
    testsGeneratedToday: number;
    testsGeneratedThisWeek: number;
    totalQuestionsGenerated: number;
    mostUsedClass: number | null;
    mostUsedSubject: string | null;
    distinctClasses: number[];
    distinctSubjects: string[];
  }> {
    await databaseReady;
    const totalRes = await pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(question_count), 0) as total_questions FROM generated_tests`);
    const todayRes = await pool.query(`SELECT COUNT(*) as count FROM generated_tests WHERE created_at >= CURRENT_DATE`);
    const weekRes = await pool.query(`SELECT COUNT(*) as count FROM generated_tests WHERE created_at >= NOW() - INTERVAL '7 days'`);

    const classRes = await pool.query(`SELECT class_level, COUNT(*) as count FROM generated_tests WHERE class_level IS NOT NULL GROUP BY class_level ORDER BY count DESC LIMIT 1`);
    const subjectRes = await pool.query(`SELECT subject, COUNT(*) as count FROM generated_tests WHERE subject IS NOT NULL GROUP BY subject ORDER BY count DESC LIMIT 1`);

    const distinctClassRes = await pool.query(`SELECT DISTINCT class_level FROM generated_tests WHERE class_level IS NOT NULL ORDER BY class_level ASC`);
    const distinctSubjRes = await pool.query(`SELECT DISTINCT subject FROM generated_tests WHERE subject IS NOT NULL GROUP BY subject ASC`);

    return {
      totalGeneratedTests: Number(totalRes.rows[0]?.count || 0),
      testsGeneratedToday: Number(todayRes.rows[0]?.count || 0),
      testsGeneratedThisWeek: Number(weekRes.rows[0]?.count || 0),
      totalQuestionsGenerated: Number(totalRes.rows[0]?.total_questions || 0),
      mostUsedClass: classRes.rows[0] ? Number(classRes.rows[0].class_level) : null,
      mostUsedSubject: subjectRes.rows[0] ? String(subjectRes.rows[0].subject) : null,
      distinctClasses: distinctClassRes.rows.map((r) => Number(r.class_level)),
      distinctSubjects: distinctSubjRes.rows.map((r) => String(r.subject)),
    };
  }

  async deleteGeneratedTest(id: string): Promise<boolean> {
    await databaseReady;
    const res = await pool.query(`DELETE FROM generated_tests WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

const normalizeGeneratedTest = (row: any): GeneratedTest => {
  if (!row) return row;
  return {
    id: row.id,
    studentId: row.student_id ?? row.studentId,
    studentName: row.student_name ?? row.studentName ?? "Anonymous Student",
    studentEmail: row.student_email ?? row.studentEmail ?? null,
    classLevel: row.class_level ?? row.classLevel ?? null,
    subject: row.subject,
    chapterTopic: row.chapter_topic ?? row.chapterTopic ?? null,
    medium: row.medium ?? null,
    board: row.board ?? null,
    difficulty: row.difficulty ?? null,
    testType: row.test_type ?? row.testType ?? null,
    testMode: row.test_mode ?? row.testMode ?? null,
    questionCount: Number(row.question_count ?? row.questionCount ?? 0),
    createdAt: row.created_at ?? row.createdAt,
  };
};

const normalizeGeneratedTestQuestion = (row: any): GeneratedTestQuestion => {
  if (!row) return row;
  return {
    id: row.id,
    generatedTestId: row.generated_test_id ?? row.generatedTestId,
    questionNumber: Number(row.question_number ?? row.questionNumber),
    question: row.question,
    optionA: row.option_a ?? row.optionA ?? null,
    optionB: row.option_b ?? row.optionB ?? null,
    optionC: row.option_c ?? row.optionC ?? null,
    optionD: row.option_d ?? row.optionD ?? null,
    correctOption: row.correct_option ?? row.correctOption ?? null,
    correctAnswer: row.correct_answer ?? row.correctAnswer,
    explanation: row.explanation ?? null,
    createdAt: row.created_at ?? row.createdAt,
  };
};

export const storage = new Storage();

