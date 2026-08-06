import type { Express } from "express";
import type { PoolClient } from "pg";

import pool from "./db";
import { requireAdminSession } from "./adminAuth";
import {
  sendTeacherApprovalEmail,
  sendTeacherRejectionEmail,
} from "./services/emailService";
import { storage } from "./storage";
import { getServerAppUrl } from "./lib/appUrl";

type AdminTeacherRecord = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  school: string;
  createdAt: string | null;
  verified: boolean;
  approved: boolean;
};

type AdminTeacherDetails = AdminTeacherRecord & {
  qualification: string | null;
  subjects: string | null;
  experience: string | null;
  board: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  lastLogin: string | null;
};

type AdminStudentRecord = {
  id: string;
  userId: string;
  name: string;
  fullName: string;
  displayName: string;
  email: string;
  classLevel: number | null;
  board: string;
  medium: string | null;
  school: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminStudentScoreRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  subject: string;
  mode: string | null;
  difficulty: string | null;
  language: string;
  score: number;
  max_score: number;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  created_at: string | Date | null;
};

type AdminStudentDetails = {
  profile: AdminStudentRecord & {
    lastLogin: string | null;
    isActive: boolean;
    activeStatus: "active" | "inactive";
  };
  statistics: {
    testsAttempted: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    totalQuestionsAttempted: number;
    timeSpentLearningMinutes: number | null;
    currentLearningStreak: number;
  };
  subjectPerformance: Array<{
    subject: string;
    attempts: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    totalQuestionsAttempted: number;
  }>;
  recentTestHistory: Array<{
    id: string;
    subject: string;
    mode: string | null;
    difficulty: string | null;
    score: number;
    maxScore: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    createdAt: string | null;
  }>;
  activityTimeline: Array<{
    id: string;
    type: "profile" | "test_attempt";
    title: string;
    description: string;
    createdAt: string | null;
  }>;
  strongSubjects: Array<{
    subject: string;
    attempts: number;
    averageScore: number | null;
  }>;
  weakSubjects: Array<{
    subject: string;
    attempts: number;
    averageScore: number | null;
  }>;
};

type AnalyticsPoint = {
  date: string;
  value: number;
};

type AdminTeacherAnalyticsRow = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  school: string | null;
  created_at: string | Date | null;
  approved: boolean;
  total_tests_generated: number;
  active_students: number;
};

type AdminStudentAnalyticsRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  class_level: number | null;
  attempts: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  last_activity: string | Date | null;
};

type AdminSubjectAnalyticsRow = {
  subject: string;
  attempts: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
};

type AdminRecentStudentRegistrationRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  email_address: string | null;
  class_level: number | null;
  board: string | null;
  created_at: string | Date | null;
};

type AdminRecentTeacherApprovalRow = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  school: string | null;
  created_at: string | Date | null;
  verified_at: string | Date | null;
  is_approved: string | boolean | null;
};

type AdminRecentTestRow = {
  id: string;
  title: string;
  subject: string;
  class_level: number | null;
  difficulty: string | null;
  status: string | null;
  created_at: string | Date | null;
  teacher_name: string | null;
};

type AdminRecentTestAttemptRow = {
  id: string;
  student_name: string;
  student_id: string | null;
  subject: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: string | Date | null;
};

type AdminTeacherDeleteSummary = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  testsDeleted: number;
  questionsDeleted: number;
  submissionsDeleted: number;
};

type AdminStudentDeleteSummary = {
  studentId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  profileDeleted: number;
  scoreHistoryDeleted: number;
  linkedSubmissionsDeleted: number;
};

type AdminAnalytics = {
  overview: {
    totalStudents: number;
    activeStudents: number;
    totalTeachers: number;
    approvedTeachers: number;
    pendingTeachers: number;
    totalTestsGenerated: number;
    totalQuestionsGenerated: number;
    averageStudentScore: number | null;
  };
  charts: {
    studentRegistrations: AnalyticsPoint[];
    teacherRegistrations: AnalyticsPoint[];
    testsGeneratedPerDay: AnalyticsPoint[];
    testsAttemptedPerDay: AnalyticsPoint[];
    averageScoreTrend: AnalyticsPoint[];
  };
  teacherAnalytics: {
    topTeachersByTestsGenerated: Array<{
      id: string;
      fullName: string;
      email: string;
      school: string | null;
      totalTestsGenerated: number;
      activeStudents: number;
      createdAt: string | null;
      approved: boolean;
    }>;
    topTeachersByActiveStudents: Array<{
      id: string;
      fullName: string;
      email: string;
      school: string | null;
      totalTestsGenerated: number;
      activeStudents: number;
      createdAt: string | null;
      approved: boolean;
    }>;
  };
  studentAnalytics: {
    topPerformingStudents: Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      classLevel: number | null;
      attempts: number;
      averageScore: number | null;
      highestScore: number | null;
      lowestScore: number | null;
      lastActivity: string | null;
    }>;
    mostActiveStudents: Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      classLevel: number | null;
      attempts: number;
      averageScore: number | null;
      highestScore: number | null;
      lowestScore: number | null;
      lastActivity: string | null;
    }>;
  };
  subjectAnalytics: {
    mostAttemptedSubjects: Array<{
      subject: string;
      attempts: number;
      averageScore: number | null;
      highestScore: number | null;
      lowestScore: number | null;
    }>;
    averageScoreBySubject: Array<{
      subject: string;
      attempts: number;
      averageScore: number | null;
      highestScore: number | null;
      lowestScore: number | null;
    }>;
  };
  recentActivity: {
    latestStudentRegistrations: Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      classLevel: number | null;
      board: string | null;
      createdAt: string | null;
    }>;
    latestTeacherApprovals: Array<{
      id: string;
      fullName: string;
      email: string;
      school: string | null;
      approvedAt: string | null;
      approved: boolean;
    }>;
    latestGeneratedTests: Array<{
      id: string;
      title: string;
      subject: string;
      classLevel: number | null;
      difficulty: string | null;
      status: string | null;
      teacherName: string | null;
      createdAt: string | null;
    }>;
    latestTestAttempts: Array<{
      id: string;
      studentName: string;
      studentId: string | null;
      subject: string;
      score: number;
      totalQuestions: number;
      percentage: number;
      createdAt: string | null;
    }>;
  };
};

const buildEmptyAnalytics = (): AdminAnalytics => ({
  overview: {
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    approvedTeachers: 0,
    pendingTeachers: 0,
    totalTestsGenerated: 0,
    totalQuestionsGenerated: 0,
    averageStudentScore: null,
  },
  charts: {
    studentRegistrations: [],
    teacherRegistrations: [],
    testsGeneratedPerDay: [],
    testsAttemptedPerDay: [],
    averageScoreTrend: [],
  },
  teacherAnalytics: {
    topTeachersByTestsGenerated: [],
    topTeachersByActiveStudents: [],
  },
  studentAnalytics: {
    topPerformingStudents: [],
    mostActiveStudents: [],
  },
  subjectAnalytics: {
    mostAttemptedSubjects: [],
    averageScoreBySubject: [],
  },
  recentActivity: {
    latestStudentRegistrations: [],
    latestTeacherApprovals: [],
    latestGeneratedTests: [],
    latestTestAttempts: [],
  },
});

type TeacherRow = {
  id: string;
  username: string;
  email: string;
  full_name?: string | null;
  fullName?: string | null;
  school?: string | null;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
  is_verified?: string | boolean | null;
  isVerified?: string | boolean | null;
  is_approved?: string | boolean | null;
  isApproved?: string | boolean | null;
};

type StudentRow = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email_address?: string | null;
  class_level?: number | string | null;
  board?: string | null;
  medium?: string | null;
  school?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

const formatDate = (value: string | Date | null | undefined) =>
  value ? new Date(value).toISOString() : null;

const toBoolean = (value: unknown) => value === true || value === "true";

const normalizeTeacher = (row: TeacherRow): AdminTeacherRecord => ({
  id: row.id,
  username: row.username,
  email: row.email,
  fullName: row.full_name ?? row.fullName ?? "",
  school: row.school ?? "",
  createdAt: formatDate(row.created_at ?? row.createdAt),
  verified: toBoolean(row.is_verified ?? row.isVerified),
  approved: toBoolean(row.is_approved ?? row.isApproved),
});

const normalizeTeacherDetails = (row: TeacherRow): AdminTeacherDetails => ({
  ...normalizeTeacher(row),
  qualification: null,
  subjects: null,
  experience: null,
  board: null,
  country: null,
  state: null,
  city: null,
  lastLogin: null,
});

const normalizeStudent = (row: StudentRow): AdminStudentRecord => ({
  id: row.id,
  userId: row.user_id ?? "",
  name: row.full_name ?? row.display_name ?? "Student",
  fullName: row.full_name ?? row.display_name ?? "Student",
  displayName: row.display_name ?? row.full_name ?? "Student",
  email: row.email_address ?? "",
  classLevel: row.class_level === null || row.class_level === undefined ? null : Number(row.class_level),
  board: row.board ?? "",
  medium: row.medium ?? null,
  school: row.school ?? null,
  country: row.country ?? null,
  state: row.state ?? null,
  city: row.city ?? null,
  createdAt: formatDate(row.created_at),
  updatedAt: formatDate(row.updated_at),
});

const normalizeStudentScore = (row: AdminStudentScoreRow) => ({
  id: row.id,
  userId: row.user_id,
  userEmail: row.user_email,
  subject: row.subject,
  mode: row.mode,
  difficulty: row.difficulty,
  language: row.language ?? "english",
  score: Number(row.score ?? 0),
  maxScore: Number(row.max_score ?? 0),
  percentage: Number(row.percentage ?? 0),
  totalQuestions: Number(row.total_questions ?? 0),
  correctAnswers: Number(row.correct_answers ?? 0),
  createdAt: formatDate(row.created_at),
});

const sendStatusEmailSafely = async (
  action: "approved" | "rejected",
  teacher: AdminTeacherRecord,
  appUrl: string,
) => {
  try {
    if (action === "approved") {
      await sendTeacherApprovalEmail(
        teacher.email,
        teacher.fullName || teacher.username,
        appUrl,
      );
      return;
    }

    await sendTeacherRejectionEmail(
      teacher.email,
      teacher.fullName || teacher.username,
      appUrl,
    );
  } catch (error) {
    console.error(`Failed to send teacher ${action} email:`, error);
  }
};

const hasStatusColumn = async () => {
  const result = await pool.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'teachers'
        AND column_name = 'status'
      LIMIT 1
    `,
  );

  return result.rows.length > 0;
};

const getTeachersByFilter = async (whereClause: string, params: unknown[] = []) => {
  const result = await pool.query(
    `
      SELECT id, username, email, full_name, school, created_at, is_verified, is_approved
      FROM teachers
      ${whereClause}
      ORDER BY created_at DESC, username ASC
    `,
    params,
  );

  return result.rows.map((row) => normalizeTeacher(row));
};

const getTeacherCounts = async () => {
  const supportsStatus = await hasStatusColumn();

  const [allTeachers, pendingTeachers, approvedTeachers, rejectedTeachers, totalStudents, activeStudents, totalTestsGenerated] =
    await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM teachers`),
      pool.query(
        `
          SELECT COUNT(*)::int AS count
          FROM teachers
          WHERE LOWER(COALESCE(is_verified, 'false')) = 'true'
            AND LOWER(COALESCE(is_approved, 'false')) <> 'true'
        `,
      ),
      pool.query(
        `
          SELECT COUNT(*)::int AS count
          FROM teachers
          WHERE LOWER(COALESCE(is_approved, 'false')) = 'true'
        `,
      ),
      supportsStatus
        ? pool.query(
            `
              SELECT COUNT(*)::int AS count
              FROM teachers
              WHERE LOWER(COALESCE(status, '')) = 'rejected'
            `,
          )
        : Promise.resolve({ rows: [{ count: 0 }] } as any),
      pool.query(`SELECT COUNT(*)::int AS count FROM student_profiles`),
      pool.query(
        `
          SELECT COUNT(DISTINCT user_id)::int AS count
          FROM student_score_history
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `,
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM custom_tests`),
    ]);

  return {
    totalTeachers: Number(allTeachers.rows[0]?.count ?? 0),
    pendingTeachers: Number(pendingTeachers.rows[0]?.count ?? 0),
    approvedTeachers: Number(approvedTeachers.rows[0]?.count ?? 0),
    rejectedTeachers: supportsStatus ? Number(rejectedTeachers.rows[0]?.count ?? 0) : 0,
    rejectedSupported: supportsStatus,
    totalStudents: Number(totalStudents.rows[0]?.count ?? 0),
    activeStudents: Number(activeStudents.rows[0]?.count ?? 0),
    totalTestsGenerated: Number(totalTestsGenerated.rows[0]?.count ?? 0),
  };
};

const getTeachers = async () => {
  const result = await pool.query(
    `
      SELECT id, username, email, full_name, school, created_at, is_verified, is_approved
      FROM teachers
      ORDER BY created_at DESC, full_name ASC, username ASC
    `,
  );

  return result.rows.map((row) => normalizeTeacher(row));
};

const getStudents = async () => {
  const result = await pool.query(
    `
      SELECT id, user_id, full_name, display_name, email_address, class_level, board, medium, school, country, state, city, created_at, updated_at
      FROM student_profiles
      ORDER BY created_at DESC, full_name ASC, display_name ASC
    `,
  );

  return result.rows.map((row) => normalizeStudent(row));
};

const calculateLearningStreak = (scores: Array<{ createdAt: string | null }>) => {
  if (scores.length === 0) {
    return 0;
  }

  const activeDays = new Set<string>();

  for (const entry of scores) {
    if (!entry.createdAt) continue;
    activeDays.add(new Date(entry.createdAt).toISOString().slice(0, 10));
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  while (true) {
    const dayKey = cursor.toISOString().slice(0, 10);
    if (!activeDays.has(dayKey)) {
      break;
    }
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
};

const logAnalyticsError = (label: string, error: unknown) => {
  const normalized =
    error && typeof error === "object"
      ? {
          message: (error as { message?: string }).message,
          code: (error as { code?: string }).code,
          detail: (error as { detail?: string }).detail,
          hint: (error as { hint?: string }).hint,
        }
      : error;

  console.error(`[ADMIN ANALYTICS] ${label} failed`, normalized);
};

const safeAnalyticsQuery = async <T>(
  label: string,
  action: () => Promise<T>,
  fallback: T,
): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    logAnalyticsError(label, error);
    return fallback;
  }
};

const safeQueryRows = async <T>(
  label: string,
  queryText: string,
  fallback: T[] = [],
): Promise<T[]> =>
  safeAnalyticsQuery(
    label,
    async () => {
      const result = await pool.query(queryText);
      return result.rows as T[];
    },
    fallback,
  );

const getDateSeries = async (table: string, dateColumn: string, valueExpression = "COUNT(*)::int AS value") => {
  try {
    const result = await pool.query(
      `
        WITH date_series AS (
          SELECT generate_series(
            (CURRENT_DATE - INTERVAL '29 days')::date,
            CURRENT_DATE::date,
            INTERVAL '1 day'
          )::date AS day
        ),
        aggregate_data AS (
          SELECT
            DATE(${dateColumn})::date AS day,
            ${valueExpression}
          FROM ${table}
          WHERE ${dateColumn} >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY 1
        )
        SELECT
          TO_CHAR(date_series.day, 'YYYY-MM-DD') AS date,
          COALESCE(aggregate_data.value, 0)::int AS value
        FROM date_series
        LEFT JOIN aggregate_data ON aggregate_data.day = date_series.day
        ORDER BY date_series.day
      `,
    );

    return result.rows.map((row) => ({
      date: row.date,
      value: Number(row.value ?? 0),
    })) as AnalyticsPoint[];
  } catch (error) {
    logAnalyticsError(`series.${table}.${dateColumn}`, error);
    return [];
  }
};

const getAnalytics = async (): Promise<AdminAnalytics> => {
  const [
    totalStudentsRows,
    activeStudentsRows,
    totalTeachersRows,
    approvedTeachersRows,
    pendingTeachersRows,
    totalTestsGeneratedRows,
    totalQuestionsGeneratedRows,
    averageStudentScoreRows,
    studentRegistrations,
    teacherRegistrations,
    testsGeneratedPerDay,
    testsAttemptedPerDay,
    averageScoreTrend,
    topTeachersByTestsGeneratedRows,
    topTeachersByActiveStudentsRows,
    topPerformingStudentsRows,
    mostActiveStudentsRows,
    mostAttemptedSubjectsRows,
    averageScoreBySubjectRows,
    latestStudentRegistrationsRows,
    latestTeacherApprovalsRows,
    latestGeneratedTestsRows,
    latestTestAttemptsRows,
  ] = await Promise.all([
    safeQueryRows<{ value: number }>("overview.totalStudents", `SELECT COUNT(*)::int AS value FROM student_profiles`),
    safeQueryRows<{ value: number }>("overview.activeStudents", `
      SELECT COUNT(DISTINCT user_id)::int AS value
      FROM student_score_history
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `),
    safeQueryRows<{ value: number }>("overview.totalTeachers", `SELECT COUNT(*)::int AS value FROM teachers`),
    safeQueryRows<{ value: number }>("overview.approvedTeachers", `
      SELECT COUNT(*)::int AS value
      FROM teachers
      WHERE LOWER(COALESCE(is_approved, 'false')) = 'true'
    `),
    safeQueryRows<{ value: number }>("overview.pendingTeachers", `
      SELECT COUNT(*)::int AS value
      FROM teachers
      WHERE LOWER(COALESCE(is_verified, 'false')) = 'true'
        AND LOWER(COALESCE(is_approved, 'false')) <> 'true'
    `),
    safeQueryRows<{ value: number }>("overview.totalTestsGenerated", `SELECT COUNT(*)::int AS value FROM custom_tests`),
    safeQueryRows<{ value: number }>("overview.totalQuestionsGenerated", `SELECT COUNT(*)::int AS value FROM custom_questions`),
    safeQueryRows<{ value: number | null }>("overview.averageStudentScore", `
      SELECT ROUND(AVG(percentage)::numeric, 2) AS value
      FROM student_score_history
    `),
    getDateSeries("student_profiles", "created_at"),
    getDateSeries("teachers", "created_at"),
    getDateSeries("custom_tests", "created_at"),
    getDateSeries("student_score_history", "created_at"),
    getDateSeries("student_score_history", "created_at", "ROUND(AVG(percentage)::numeric, 2) AS value"),
    safeQueryRows<AdminTeacherAnalyticsRow>("teacherAnalytics.topTeachersByTestsGenerated", `
      SELECT
        t.id,
        t.username,
        t.email,
        t.full_name,
        t.school,
        t.created_at,
        LOWER(COALESCE(t.is_approved, 'false')) = 'true' AS approved,
        COUNT(DISTINCT ct.id)::int AS total_tests_generated,
        COALESCE(active_students.active_students, 0)::int AS active_students
      FROM teachers t
      LEFT JOIN custom_tests ct ON ct.teacher_id = t.id
      LEFT JOIN (
        SELECT
          ct.teacher_id,
          COUNT(DISTINCT COALESCE(NULLIF(cts.student_id, ''), cts.student_name))::int AS active_students
        FROM custom_test_submissions cts
        INNER JOIN custom_tests ct ON ct.id = cts.test_id
        WHERE cts.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY ct.teacher_id
      ) active_students ON active_students.teacher_id = t.id
      GROUP BY t.id, t.username, t.email, t.full_name, t.school, t.created_at, approved, active_students.active_students
      ORDER BY total_tests_generated DESC, active_students DESC, t.created_at DESC
      LIMIT 10
    `),
    safeQueryRows<AdminTeacherAnalyticsRow>("teacherAnalytics.topTeachersByActiveStudents", `
      SELECT
        t.id,
        t.username,
        t.email,
        t.full_name,
        t.school,
        t.created_at,
        LOWER(COALESCE(t.is_approved, 'false')) = 'true' AS approved,
        COUNT(DISTINCT ct.id)::int AS total_tests_generated,
        COALESCE(active_students.active_students, 0)::int AS active_students
      FROM teachers t
      LEFT JOIN custom_tests ct ON ct.teacher_id = t.id
      LEFT JOIN (
        SELECT
          ct.teacher_id,
          COUNT(DISTINCT COALESCE(NULLIF(cts.student_id, ''), cts.student_name))::int AS active_students
        FROM custom_test_submissions cts
        INNER JOIN custom_tests ct ON ct.id = cts.test_id
        WHERE cts.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY ct.teacher_id
      ) active_students ON active_students.teacher_id = t.id
      GROUP BY t.id, t.username, t.email, t.full_name, t.school, t.created_at, approved, active_students.active_students
      ORDER BY active_students DESC, total_tests_generated DESC, t.created_at DESC
      LIMIT 10
    `),
    safeQueryRows<AdminStudentAnalyticsRow>("studentAnalytics.topPerformingStudents", `
      SELECT
        sp.id,
        sp.user_id,
        COALESCE(NULLIF(sp.full_name, ''), NULLIF(sp.display_name, ''), ssh.user_email, 'Student') AS name,
        COALESCE(sp.email_address, ssh.user_email, '') AS email,
        sp.class_level,
        COUNT(*)::int AS attempts,
        ROUND(AVG(ssh.percentage)::numeric, 2) AS average_score,
        MAX(ssh.percentage)::int AS highest_score,
        MIN(ssh.percentage)::int AS lowest_score,
        MAX(ssh.created_at) AS last_activity
      FROM student_score_history ssh
      LEFT JOIN student_profiles sp ON sp.user_id = ssh.user_id
      GROUP BY sp.id, sp.user_id, name, email, sp.class_level
      ORDER BY average_score DESC NULLS LAST, attempts DESC, last_activity DESC
      LIMIT 10
    `),
    safeQueryRows<AdminStudentAnalyticsRow>("studentAnalytics.mostActiveStudents", `
      SELECT
        sp.id,
        sp.user_id,
        COALESCE(NULLIF(sp.full_name, ''), NULLIF(sp.display_name, ''), ssh.user_email, 'Student') AS name,
        COALESCE(sp.email_address, ssh.user_email, '') AS email,
        sp.class_level,
        COUNT(*)::int AS attempts,
        ROUND(AVG(ssh.percentage)::numeric, 2) AS average_score,
        MAX(ssh.percentage)::int AS highest_score,
        MIN(ssh.percentage)::int AS lowest_score,
        MAX(ssh.created_at) AS last_activity
      FROM student_score_history ssh
      LEFT JOIN student_profiles sp ON sp.user_id = ssh.user_id
      GROUP BY sp.id, sp.user_id, name, email, sp.class_level
      ORDER BY attempts DESC, last_activity DESC
      LIMIT 10
    `),
    safeQueryRows<AdminSubjectAnalyticsRow>("subjectAnalytics.mostAttemptedSubjects", `
      SELECT
        subject,
        COUNT(*)::int AS attempts,
        ROUND(AVG(percentage)::numeric, 2) AS average_score,
        MAX(percentage)::int AS highest_score,
        MIN(percentage)::int AS lowest_score
      FROM student_score_history
      GROUP BY subject
      ORDER BY attempts DESC, average_score DESC
      LIMIT 10
    `),
    safeQueryRows<AdminSubjectAnalyticsRow>("subjectAnalytics.averageScoreBySubject", `
      SELECT
        subject,
        COUNT(*)::int AS attempts,
        ROUND(AVG(percentage)::numeric, 2) AS average_score,
        MAX(percentage)::int AS highest_score,
        MIN(percentage)::int AS lowest_score
      FROM student_score_history
      GROUP BY subject
      ORDER BY average_score DESC NULLS LAST, attempts DESC
      LIMIT 10
    `),
    safeQueryRows<AdminRecentStudentRegistrationRow>("recentActivity.latestStudentRegistrations", `
      SELECT
        id,
        user_id,
        full_name,
        display_name,
        email_address,
        class_level,
        board,
        created_at
      FROM student_profiles
      ORDER BY created_at DESC
      LIMIT 10
    `),
    safeQueryRows<AdminRecentTeacherApprovalRow>("recentActivity.latestTeacherApprovals", `
      SELECT
        id,
        username,
        email,
        full_name,
        school,
        created_at,
        verified_at,
        is_approved
      FROM teachers
      WHERE LOWER(COALESCE(is_approved, 'false')) = 'true'
      ORDER BY COALESCE(verified_at, created_at) DESC, created_at DESC
      LIMIT 10
    `),
    safeQueryRows<AdminRecentTestRow>("recentActivity.latestGeneratedTests", `
      SELECT
        ct.id,
        ct.title,
        ct.subject,
        ct.class_level,
        ct.difficulty,
        ct.status,
        ct.created_at,
        t.full_name AS teacher_name
      FROM custom_tests ct
      LEFT JOIN teachers t ON t.id = ct.teacher_id
      ORDER BY ct.created_at DESC
      LIMIT 10
    `),
    safeQueryRows<AdminRecentTestAttemptRow>("recentActivity.latestTestAttempts", `
      SELECT
        cts.id,
        cts.student_name,
        cts.student_id,
        COALESCE(ct.subject, 'Unknown') AS subject,
        cts.score,
        cts.total_questions,
        COALESCE(
          ROUND(
            CASE
              WHEN COALESCE(cts.total_questions, 0) > 0
                THEN (cts.score::numeric / NULLIF(cts.total_questions, 0)) * 100
              ELSE NULL
            END,
            2
          ),
          0
        ) AS percentage,
        cts.created_at
      FROM custom_test_submissions cts
      LEFT JOIN custom_tests ct ON ct.id = cts.test_id
      ORDER BY cts.created_at DESC
      LIMIT 10
    `),
  ]);

  const toIso = (value: string | Date | null | undefined) => formatDate(value);

  const totalStudentsResult = totalStudentsRows;
  const activeStudentsResult = activeStudentsRows;
  const totalTeachersResult = totalTeachersRows;
  const approvedTeachersResult = approvedTeachersRows;
  const pendingTeachersResult = pendingTeachersRows;
  const totalTestsGeneratedResult = totalTestsGeneratedRows;
  const totalQuestionsGeneratedResult = totalQuestionsGeneratedRows;
  const averageStudentScoreResult = averageStudentScoreRows;

  const topTeachersByTestsGenerated = topTeachersByTestsGeneratedRows.map((row) => ({
    id: row.id,
    fullName: row.full_name ?? row.username,
    email: row.email,
    school: row.school ?? null,
    totalTestsGenerated: Number(row.total_tests_generated ?? 0),
    activeStudents: Number(row.active_students ?? 0),
    createdAt: toIso(row.created_at),
    approved: toBoolean(row.approved),
  }));

  const topTeachersByActiveStudents = topTeachersByActiveStudentsRows.map((row) => ({
    id: row.id,
    fullName: row.full_name ?? row.username,
    email: row.email,
    school: row.school ?? null,
    totalTestsGenerated: Number(row.total_tests_generated ?? 0),
    activeStudents: Number(row.active_students ?? 0),
    createdAt: toIso(row.created_at),
    approved: toBoolean(row.approved),
  }));

  const studentAnalyticsRows = topPerformingStudentsRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    classLevel: row.class_level ?? null,
    attempts: Number(row.attempts ?? 0),
    averageScore: row.average_score === null || row.average_score === undefined ? null : Number(row.average_score),
    highestScore: row.highest_score === null || row.highest_score === undefined ? null : Number(row.highest_score),
    lowestScore: row.lowest_score === null || row.lowest_score === undefined ? null : Number(row.lowest_score),
    lastActivity: toIso(row.last_activity),
  }));

  const averageScoreSeries = averageScoreTrend.map((row) => ({
    date: row.date,
    value: row.value === null || row.value === undefined ? 0 : Number(row.value),
  }));

  const latestStudentRegistrations = latestStudentRegistrationsRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.full_name ?? row.display_name ?? "Student",
    email: row.email_address ?? "",
    classLevel: row.class_level ?? null,
    board: row.board ?? null,
    createdAt: formatDate(row.created_at),
  }));

  const latestTeacherApprovals = latestTeacherApprovalsRows.map((row) => ({
    id: row.id,
    fullName: row.full_name ?? row.username,
    email: row.email,
    school: row.school ?? null,
    approvedAt: formatDate(row.verified_at ?? row.created_at),
    approved: toBoolean(row.is_approved),
  }));

  const latestGeneratedTests = latestGeneratedTestsRows.map((row) => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    classLevel: row.class_level ?? null,
    difficulty: row.difficulty ?? null,
    status: row.status ?? null,
    teacherName: row.teacher_name ?? null,
    createdAt: formatDate(row.created_at),
  }));

  const latestTestAttempts = latestTestAttemptsRows.map((row) => ({
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id ?? null,
    subject: row.subject,
    score: Number(row.score ?? 0),
    totalQuestions: Number(row.total_questions ?? 0),
    percentage: Number(row.percentage ?? 0),
    createdAt: formatDate(row.created_at),
  }));

  return {
    overview: {
      totalStudents: Number(totalStudentsResult[0]?.value ?? 0),
      activeStudents: Number(activeStudentsResult[0]?.value ?? 0),
      totalTeachers: Number(totalTeachersResult[0]?.value ?? 0),
      approvedTeachers: Number(approvedTeachersResult[0]?.value ?? 0),
      pendingTeachers: Number(pendingTeachersResult[0]?.value ?? 0),
      totalTestsGenerated: Number(totalTestsGeneratedResult[0]?.value ?? 0),
      totalQuestionsGenerated: Number(totalQuestionsGeneratedResult[0]?.value ?? 0),
      averageStudentScore:
        averageStudentScoreResult[0]?.value === null || averageStudentScoreResult[0]?.value === undefined
          ? null
          : Number(averageStudentScoreResult[0].value),
    },
    charts: {
      studentRegistrations,
      teacherRegistrations,
      testsGeneratedPerDay,
      testsAttemptedPerDay,
      averageScoreTrend: averageScoreSeries,
    },
    teacherAnalytics: {
      topTeachersByTestsGenerated,
      topTeachersByActiveStudents,
    },
    studentAnalytics: {
      topPerformingStudents: studentAnalyticsRows,
      mostActiveStudents: mostActiveStudentsRows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        classLevel: row.class_level ?? null,
        attempts: Number(row.attempts ?? 0),
        averageScore: row.average_score === null || row.average_score === undefined ? null : Number(row.average_score),
        highestScore: row.highest_score === null || row.highest_score === undefined ? null : Number(row.highest_score),
        lowestScore: row.lowest_score === null || row.lowest_score === undefined ? null : Number(row.lowest_score),
        lastActivity: toIso(row.last_activity),
      })),
    },
    subjectAnalytics: {
      mostAttemptedSubjects: mostAttemptedSubjectsRows.map((row) => ({
        subject: row.subject,
        attempts: Number(row.attempts ?? 0),
        averageScore: row.average_score === null || row.average_score === undefined ? null : Number(row.average_score),
        highestScore: row.highest_score === null || row.highest_score === undefined ? null : Number(row.highest_score),
        lowestScore: row.lowest_score === null || row.lowest_score === undefined ? null : Number(row.lowest_score),
      })),
      averageScoreBySubject: averageScoreBySubjectRows.map((row) => ({
        subject: row.subject,
        attempts: Number(row.attempts ?? 0),
        averageScore: row.average_score === null || row.average_score === undefined ? null : Number(row.average_score),
        highestScore: row.highest_score === null || row.highest_score === undefined ? null : Number(row.highest_score),
        lowestScore: row.lowest_score === null || row.lowest_score === undefined ? null : Number(row.lowest_score),
      })),
    },
    recentActivity: {
      latestStudentRegistrations,
      latestTeacherApprovals,
      latestGeneratedTests,
      latestTestAttempts,
    },
  };
};

const getStudentDetails = async (studentId: string): Promise<AdminStudentDetails | null> => {
  const profileResult = await pool.query(
    `
      SELECT id, user_id, full_name, display_name, email_address, class_level, board, medium, school, country, state, city, created_at, updated_at
      FROM student_profiles
      WHERE id = $1 OR user_id = $1
      LIMIT 1
    `,
    [studentId],
  );

  const profileRow = profileResult.rows[0];
  if (!profileRow) {
    return null;
  }

  const historyResult = await pool.query(
    `
      SELECT id, user_id, user_email, subject, mode, difficulty, language, score, max_score, percentage, total_questions, correct_answers, created_at
      FROM student_score_history
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [profileRow.user_id],
  );

  const scores = historyResult.rows.map((row) => normalizeStudentScore(row));
  const testsAttempted = scores.length;
  const percentageValues = scores.map((row) => row.percentage);
  const totalQuestionsAttempted = scores.reduce((sum, row) => sum + row.totalQuestions, 0);
  const lastLogin = scores[0]?.createdAt ?? formatDate(profileRow.updated_at ?? profileRow.created_at);
  const activeStatus = lastLogin && new Date(lastLogin).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000
    ? "active"
    : "inactive";

  const subjectMap = new Map<
    string,
    {
      subject: string;
      attempts: number;
      scores: number[];
      totalQuestionsAttempted: number;
    }
  >();

  for (const score of scores) {
    const subjectKey = (score.subject || "Uncategorized").trim().toLowerCase() || "uncategorized";
    const existing = subjectMap.get(subjectKey) ?? {
      subject: score.subject || "Uncategorized",
      attempts: 0,
      scores: [],
      totalQuestionsAttempted: 0,
    };

    existing.attempts += 1;
    existing.scores.push(score.percentage);
    existing.totalQuestionsAttempted += score.totalQuestions;
    if (!existing.subject && score.subject) {
      existing.subject = score.subject;
    }

    subjectMap.set(subjectKey, existing);
  }

  const subjectPerformance = Array.from(subjectMap.values()).map((entry) => {
    const averageScore = entry.scores.length
      ? Number((entry.scores.reduce((sum, value) => sum + value, 0) / entry.scores.length).toFixed(2))
      : null;

    return {
      subject: entry.subject,
      attempts: entry.attempts,
      averageScore,
      highestScore: entry.scores.length ? Math.max(...entry.scores) : null,
      lowestScore: entry.scores.length ? Math.min(...entry.scores) : null,
      totalQuestionsAttempted: entry.totalQuestionsAttempted,
    };
  }).sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));

  const strongSubjects = subjectPerformance.slice(0, 3).map((entry) => ({
    subject: entry.subject,
    attempts: entry.attempts,
    averageScore: entry.averageScore,
  }));

  const weakSubjects = [...subjectPerformance]
    .sort((a, b) => (a.averageScore ?? 999) - (b.averageScore ?? 999))
    .slice(0, 3)
    .map((entry) => ({
      subject: entry.subject,
      attempts: entry.attempts,
      averageScore: entry.averageScore,
    }));

  const recentTestHistory = scores.slice(0, 10).map((score) => ({
    id: score.id,
    subject: score.subject,
    mode: score.mode,
    difficulty: score.difficulty,
    score: score.score,
    maxScore: score.maxScore,
    percentage: score.percentage,
    totalQuestions: score.totalQuestions,
    correctAnswers: score.correctAnswers,
    createdAt: score.createdAt,
  }));

  const activityTimeline = [
    {
      id: `profile-${profileRow.id}`,
      type: "profile" as const,
      title: "Profile registered",
      description: `Student profile created for ${profileRow.display_name ?? profileRow.full_name ?? profileRow.email_address ?? "this student"}.`,
      createdAt: formatDate(profileRow.created_at),
    },
    ...recentTestHistory.map((item) => ({
      id: `history-${item.id}`,
      type: "test_attempt" as const,
      title: `${item.subject} attempt`,
      description: `${item.percentage}% score with ${item.correctAnswers}/${item.totalQuestions} correct answers.`,
      createdAt: item.createdAt,
    })),
  ].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  }).slice(0, 12);

  const averageScore = percentageValues.length
    ? Number((percentageValues.reduce((sum, value) => sum + value, 0) / percentageValues.length).toFixed(2))
    : null;

  return {
    profile: {
      ...normalizeStudent(profileRow),
      lastLogin,
      isActive: activeStatus === "active",
      activeStatus,
    },
    statistics: {
      testsAttempted,
      averageScore,
      highestScore: percentageValues.length ? Math.max(...percentageValues) : null,
      lowestScore: percentageValues.length ? Math.min(...percentageValues) : null,
      totalQuestionsAttempted,
      timeSpentLearningMinutes: null,
      currentLearningStreak: calculateLearningStreak(scores),
    },
    subjectPerformance,
    recentTestHistory,
    activityTimeline,
    strongSubjects,
    weakSubjects,
  };
};

const getTeacherDetails = async (teacherId: string) => {
  const teacherResult = await pool.query(
    `
      SELECT id, username, email, full_name, school, created_at, is_verified, is_approved
      FROM teachers
      WHERE id = $1
      LIMIT 1
    `,
    [teacherId],
  );

  const teacherRow = teacherResult.rows[0];
  if (!teacherRow) {
    return null;
  }

  const testsResult = await pool.query(
    `
      SELECT
        ct.id,
        ct.title,
        ct.subject,
        ct.class_level AS class_level,
        ct.difficulty,
        ct.duration_minutes AS duration_minutes,
        ct.num_questions AS num_questions,
        ct.status,
        ct.created_at AS created_at,
        COALESCE(question_stats.total_questions, 0)::int AS total_questions
      FROM custom_tests ct
      LEFT JOIN (
        SELECT
          test_id,
          COUNT(*)::int AS total_questions
        FROM custom_questions
        GROUP BY test_id
      ) question_stats ON question_stats.test_id = ct.id
      WHERE ct.teacher_id = $1
      ORDER BY ct.created_at DESC
      LIMIT 10
    `,
    [teacherId],
  );

  const activityResult = await pool.query(
    `
      SELECT
        cts.id,
        cts.student_name AS student_name,
        cts.student_id AS student_id,
        cts.score,
        cts.total_questions AS total_questions,
        cts.time_taken_seconds AS time_taken_seconds,
        cts.created_at AS created_at,
        ct.title AS test_title
      FROM custom_test_submissions cts
      INNER JOIN custom_tests ct ON ct.id = cts.test_id
      WHERE ct.teacher_id = $1
      ORDER BY cts.created_at DESC
      LIMIT 10
    `,
    [teacherId],
  );

  const statsResult = await pool.query(
    `
      SELECT
        COUNT(DISTINCT ct.id)::int AS total_tests_generated,
        COUNT(DISTINCT CASE WHEN LOWER(COALESCE(ct.status, '')) = 'published' THEN ct.id END)::int AS published_tests,
        COUNT(DISTINCT CASE WHEN LOWER(COALESCE(ct.status, '')) = 'draft' THEN ct.id END)::int AS draft_tests,
        COALESCE(SUM(question_counts.total_questions), 0)::int AS total_questions_generated,
        COUNT(DISTINCT cts.student_key)::int AS total_students,
        COUNT(DISTINCT CASE WHEN cts.created_at >= NOW() - INTERVAL '30 days' THEN cts.student_key END)::int AS active_students,
        ROUND(
          AVG(
            CASE
              WHEN cts.total_questions > 0
                THEN (cts.score::numeric / NULLIF(cts.total_questions, 0)) * 100
              ELSE NULL
            END
          ),
          2
        ) AS average_student_score
      FROM custom_tests ct
      LEFT JOIN (
        SELECT
          test_id,
          COUNT(*)::int AS total_questions
        FROM custom_questions
        GROUP BY test_id
      ) question_counts ON question_counts.test_id = ct.id
      LEFT JOIN (
        SELECT
          cts.*,
          COALESCE(NULLIF(cts.student_id, ''), cts.student_name) AS student_key
        FROM custom_test_submissions cts
      ) cts ON cts.test_id = ct.id
      WHERE ct.teacher_id = $1
    `,
    [teacherId],
  );

  const timeline = [
    ...testsResult.rows.map((row) => ({
      id: `test-${row.id}`,
      type: "test" as const,
      title: row.title,
      description: `${row.status ?? "draft"} test created for ${row.subject ?? "Unknown subject"}`,
      createdAt: row.created_at ?? null,
    })),
    ...activityResult.rows.map((row) => ({
      id: `activity-${row.id}`,
      type: "student_activity" as const,
      title: row.student_name || "Student activity",
      description: `Score ${row.score ?? 0}/${row.total_questions ?? 0} on ${row.test_title ?? "a test"}`,
      createdAt: row.created_at ?? null,
    })),
  ].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  }).slice(0, 12);

  return {
    profile: normalizeTeacherDetails(teacherRow),
    statistics: {
      totalTestsGenerated: Number(statsResult.rows[0]?.total_tests_generated ?? 0),
      publishedTests: Number(statsResult.rows[0]?.published_tests ?? 0),
      draftTests: Number(statsResult.rows[0]?.draft_tests ?? 0),
      totalQuestionsGenerated: Number(statsResult.rows[0]?.total_questions_generated ?? 0),
      totalStudents: Number(statsResult.rows[0]?.total_students ?? 0),
      activeStudents: Number(statsResult.rows[0]?.active_students ?? 0),
      averageStudentScore: statsResult.rows[0]?.average_student_score !== null &&
        statsResult.rows[0]?.average_student_score !== undefined
        ? Number(statsResult.rows[0].average_student_score)
        : null,
    },
    recentTests: testsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject ?? "",
      classLevel: row.class_level ?? null,
      difficulty: row.difficulty ?? "",
      status: row.status ?? "draft",
      totalQuestions: Number(row.total_questions ?? 0),
      createdAt: formatDate(row.created_at),
    })),
    recentStudentActivity: activityResult.rows.map((row) => ({
      id: row.id,
      studentName: row.student_name ?? "Student",
      studentId: row.student_id ?? null,
      score: Number(row.score ?? 0),
      totalQuestions: Number(row.total_questions ?? 0),
      testTitle: row.test_title ?? "",
      createdAt: formatDate(row.created_at),
    })),
    activityTimeline: timeline.map((item) => ({
      ...item,
      createdAt: formatDate(item.createdAt),
    })),
  };
};

type Queryable = Pick<typeof pool, "query"> | Pick<PoolClient, "query">;

const tableExists = async (tableName: string, client: Queryable = pool) => {
  const result = await client.query(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [tableName],
  );

  return Boolean(result.rows[0]?.exists);
};

const getTeacherDeleteSummary = async (teacherId: string): Promise<AdminTeacherDeleteSummary | null> => {
  const teacherResult = await pool.query(
    `
      SELECT id, username, email, full_name
      FROM teachers
      WHERE id = $1
      LIMIT 1
    `,
    [teacherId],
  );

  const teacherRow = teacherResult.rows[0];
  if (!teacherRow) {
    return null;
  }

  const hasTestsTable = await tableExists("custom_tests");
  const hasQuestionsTable = await tableExists("custom_questions");
  const hasSubmissionsTable = await tableExists("custom_test_submissions");

  const testsResult = hasTestsTable
    ? await pool.query(
        `
          SELECT id
          FROM custom_tests
          WHERE teacher_id = $1
        `,
        [teacherId],
      )
    : { rows: [] as Array<{ id: string }> };

  const testIds = testsResult.rows.map((row) => row.id).filter(Boolean);

  let questionsDeleted = 0;
  let submissionsDeleted = 0;

  if (hasQuestionsTable && testIds.length > 0) {
    const questionsResult = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM custom_questions
        WHERE test_id = ANY($1::varchar[])
      `,
      [testIds],
    );
    questionsDeleted = Number(questionsResult.rows[0]?.count ?? 0);
  }

  if (hasSubmissionsTable && testIds.length > 0) {
    const submissionsResult = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM custom_test_submissions
        WHERE test_id = ANY($1::varchar[])
      `,
      [testIds],
    );
    submissionsDeleted = Number(submissionsResult.rows[0]?.count ?? 0);
  }

  return {
    teacherId: teacherRow.id,
    teacherName: teacherRow.full_name ?? teacherRow.username,
    teacherEmail: teacherRow.email,
    testsDeleted: testIds.length,
    questionsDeleted,
    submissionsDeleted,
  };
};

const getStudentDeleteSummary = async (studentId: string): Promise<AdminStudentDeleteSummary | null> => {
  const profileResult = await pool.query(
    `
      SELECT id, user_id, full_name, display_name, email_address
      FROM student_profiles
      WHERE id = $1 OR user_id = $1
      LIMIT 1
    `,
    [studentId],
  );

  const profileRow = profileResult.rows[0];
  if (!profileRow) {
    return null;
  }

  const hasScoreHistoryTable = await tableExists("student_score_history");
  const hasSubmissionsTable = await tableExists("custom_test_submissions");

  const scoreHistoryDeleted = hasScoreHistoryTable
    ? Number(
        (
          await pool.query(
            `
              SELECT COUNT(*)::int AS count
              FROM student_score_history
              WHERE user_id = $1
            `,
            [profileRow.user_id],
          )
        ).rows[0]?.count ?? 0,
      )
    : 0;

  const linkedSubmissionsDeleted = hasSubmissionsTable
    ? Number(
        (
          await pool.query(
            `
              SELECT COUNT(*)::int AS count
              FROM custom_test_submissions
              WHERE student_id = $1
            `,
            [profileRow.user_id],
          )
        ).rows[0]?.count ?? 0,
      )
    : 0;

  return {
    studentId: profileRow.id,
    userId: profileRow.user_id,
    studentName: profileRow.full_name ?? profileRow.display_name ?? "Student",
    studentEmail: profileRow.email_address ?? "",
    profileDeleted: 1,
    scoreHistoryDeleted,
    linkedSubmissionsDeleted,
  };
};

export function registerAdminTeacherRoutes(app: Express) {
  app.get("/api/admin/dashboard", requireAdminSession, async (_req, res) => {
    try {
      const counts = await getTeacherCounts();

      return res.json(counts);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      return res.status(500).json({ error: "Failed to load admin dashboard" });
    }
  });

  // app.get("/api/admin/analytics", requireAdminSession, async (_req, res) => {
  //   try {
  //     const analytics = await getAnalytics();
  //     return res.json(analytics);
  //   } catch (error) {
  //     console.error("Failed to load admin analytics:", error);
  //     return res.status(500).json({ error: "Failed to load admin analytics" });
  //   }
  // });

  app.get("/api/admin/analytics", requireAdminSession, async (_req, res) => {
    try {
      const analytics = await getAnalytics();
      return res.json(analytics);
    } catch (error) {
      console.error("[ADMIN ANALYTICS] route fallback activated", error);
      return res.json(buildEmptyAnalytics());
    }
  });

  app.get("/api/admin/teachers", requireAdminSession, async (_req, res) => {
    try {
      const teachers = await getTeachers();

      return res.json({
        teachers,
        count: teachers.length,
      });
    } catch (error) {
      console.error("Failed to load teachers:", error);
      return res.status(500).json({ error: "Failed to load teachers" });
    }
  });

  app.get("/api/admin/teachers/pending", requireAdminSession, async (_req, res) => {
    try {
      const teachers = await getTeachersByFilter(
        `
          WHERE LOWER(COALESCE(is_verified, 'false')) = 'true'
            AND LOWER(COALESCE(is_approved, 'false')) <> 'true'
        `,
      );

      return res.json({
        teachers,
        count: teachers.length,
      });
    } catch (error) {
      console.error("Failed to load pending teachers:", error);
      return res.status(500).json({ error: "Failed to load pending teachers" });
    }
  });

  app.get("/api/admin/students", requireAdminSession, async (_req, res) => {
    try {
      const students = await getStudents();

      return res.json({
        students,
        count: students.length,
      });
    } catch (error) {
      console.error("Failed to load students:", error);
      return res.status(500).json({ error: "Failed to load students" });
    }
  });

  app.get("/api/admin/students/:id", requireAdminSession, async (req, res) => {
    try {
      const details = await getStudentDetails(req.params.id);

      if (!details) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json(details);
    } catch (error) {
      console.error("Failed to load student details:", error);
      return res.status(500).json({ error: "Failed to load student details" });
    }
  });

  app.delete("/api/admin/students/:id", requireAdminSession, async (req, res) => {
    const summary = await getStudentDeleteSummary(req.params.id);

    if (!summary) {
      return res.status(404).json({ error: "Student not found" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      if (await tableExists("student_score_history", client)) {
        await client.query(
          `
            DELETE FROM student_score_history
            WHERE user_id = $1
          `,
          [summary.userId],
        );
      }

      if (await tableExists("custom_test_submissions", client)) {
        await client.query(
          `
            DELETE FROM custom_test_submissions
            WHERE student_id = $1
          `,
          [summary.userId],
        );
      }

      if (await tableExists("student_profiles", client)) {
        const deletedProfile = await client.query(
          `
            DELETE FROM student_profiles
            WHERE id = $1 OR user_id = $1
            RETURNING id
          `,
          [req.params.id],
        );

        if (deletedProfile.rowCount === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Student not found" });
        }
      }

      await client.query("COMMIT");

      return res.json({
        message: "Student account deleted successfully",
        summary,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[ADMIN DELETE] Failed to delete student", {
        studentId: req.params.id,
        error,
      });
      return res.status(500).json({ error: "Failed to delete student account" });
    } finally {
      client.release();
    }
  });

  app.get("/api/admin/teachers/approved", requireAdminSession, async (_req, res) => {
    try {
      const teachers = await getTeachersByFilter(
        `
          WHERE LOWER(COALESCE(is_approved, 'false')) = 'true'
        `,
      );

      return res.json({
        teachers,
        count: teachers.length,
      });
    } catch (error) {
      console.error("Failed to load approved teachers:", error);
      return res.status(500).json({ error: "Failed to load approved teachers" });
    }
  });

  app.post("/api/admin/teachers/:id/approve", requireAdminSession, async (req, res) => {
    try {
      const teacher = await storage.updateTeacherApproval(req.params.id, true);

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      const normalizedTeacher = normalizeTeacher({
          id: teacher.id,
          username: teacher.username,
          email: teacher.email,
          full_name: teacher.fullName,
          school: teacher.school,
          created_at: teacher.createdAt,
          is_verified: teacher.isVerified,
          is_approved: teacher.isApproved,
        });

      await sendStatusEmailSafely("approved", normalizedTeacher, getServerAppUrl(req));

      return res.json({
        teacher: normalizedTeacher,
        message: "Teacher approved successfully",
      });
    } catch (error) {
      console.error("Failed to approve teacher:", error);
      return res.status(500).json({ error: "Failed to approve teacher" });
    }
  });

  app.post("/api/admin/teachers/:id/reject", requireAdminSession, async (req, res) => {
    try {
      const teacher = await storage.updateTeacherApproval(req.params.id, false);

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      const normalizedTeacher = normalizeTeacher({
          id: teacher.id,
          username: teacher.username,
          email: teacher.email,
          full_name: teacher.fullName,
          school: teacher.school,
          created_at: teacher.createdAt,
          is_verified: teacher.isVerified,
          is_approved: teacher.isApproved,
        });

      await sendStatusEmailSafely("rejected", normalizedTeacher, getServerAppUrl(req));

      return res.json({
        teacher: normalizedTeacher,
        message: "Teacher rejected successfully",
      });
    } catch (error) {
      console.error("Failed to reject teacher:", error);
      return res.status(500).json({ error: "Failed to reject teacher" });
    }
  });

  app.delete("/api/admin/teachers/:id", requireAdminSession, async (req, res) => {
    const summary = await getTeacherDeleteSummary(req.params.id);

    if (!summary) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const hasTestsTable = await tableExists("custom_tests", client);
      const hasQuestionsTable = await tableExists("custom_questions", client);
      const hasSubmissionsTable = await tableExists("custom_test_submissions", client);

      const testIdsResult = hasTestsTable
        ? await client.query(
            `
              SELECT id
              FROM custom_tests
              WHERE teacher_id = $1
            `,
            [req.params.id],
          )
        : { rows: [] as Array<{ id: string }> };

      const testIds = testIdsResult.rows.map((row) => row.id).filter(Boolean);

      if (hasSubmissionsTable && testIds.length > 0) {
        await client.query(
          `
            DELETE FROM custom_test_submissions
            WHERE test_id = ANY($1::varchar[])
          `,
          [testIds],
        );
      }

      if (hasQuestionsTable && testIds.length > 0) {
        await client.query(
          `
            DELETE FROM custom_questions
            WHERE test_id = ANY($1::varchar[])
          `,
          [testIds],
        );
      }

      if (hasTestsTable) {
        await client.query(
          `
            DELETE FROM custom_tests
            WHERE teacher_id = $1
          `,
          [req.params.id],
        );
      }

      const deletedTeacher = await client.query(
        `
          DELETE FROM teachers
          WHERE id = $1
          RETURNING id
        `,
        [req.params.id],
      );

      if (deletedTeacher.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Teacher not found" });
      }

      await client.query("COMMIT");

      return res.json({
        message: "Teacher account deleted successfully",
        summary,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[ADMIN DELETE] Failed to delete teacher", {
        teacherId: req.params.id,
        error,
      });
      return res.status(500).json({ error: "Failed to delete teacher account" });
    } finally {
      client.release();
    }
  });

  app.get("/api/admin/teachers/:id", requireAdminSession, async (req, res) => {
    try {
      const details = await getTeacherDetails(req.params.id);

      if (!details) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      return res.json(details);
    } catch (error) {
      console.error("Failed to load teacher details:", error);
      return res.status(500).json({ error: "Failed to load teacher details" });
    }
  });
}
