import {
  type User, type InsertUser,
  type TestSession, type InsertTestSession,
  type Teacher, type InsertTeacher,
  type StudentProfile, type InsertStudentProfile,
  type CustomTest, type InsertCustomTest,
  type CustomTestSubmission, type InsertCustomTestSubmission,
  type CustomQuestion, type InsertCustomQuestion,
  type AnswerSheetEvaluation, type InsertAnswerSheetEvaluation,
  type StudentScoreHistory, type InsertStudentScoreHistory
} from "@shared/schema";
import pool, { databaseReady, ensureStudentScoreHistoryTable } from "./db";

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
    const result = await pool.query(
      "SELECT * FROM student_profiles WHERE user_id=$1",
      [userId]
    );
    return normalizeStudentProfile(result.rows[0]);
  }

  async upsertStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
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
}

export const storage = new Storage();
