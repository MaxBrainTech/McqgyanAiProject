export type AdminTeacher = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  school: string;
  createdAt: string | null;
  verified: boolean;
  approved: boolean;
};

export type AdminTeacherProfile = AdminTeacher & {
  qualification: string | null;
  subjects: string | null;
  experience: string | null;
  board: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  lastLogin: string | null;
};

export type AdminTeacherDetailsResponse = {
  profile: AdminTeacherProfile;
  statistics: {
    totalTestsGenerated: number;
    publishedTests: number;
    draftTests: number;
    totalQuestionsGenerated: number;
    totalStudents: number;
    activeStudents: number;
    averageStudentScore: number | null;
  };
  recentTests: Array<{
    id: string;
    title: string;
    subject: string;
    classLevel: number | null;
    difficulty: string;
    status: string;
    totalQuestions: number;
    createdAt: string | null;
  }>;
  recentStudentActivity: Array<{
    id: string;
    studentName: string;
    studentId: string | null;
    score: number;
    totalQuestions: number;
    testTitle: string;
    createdAt: string | null;
  }>;
  activityTimeline: Array<{
    id: string;
    type: "test" | "student_activity";
    title: string;
    description: string;
    createdAt: string | null;
  }>;
};

export type AdminTeacherDeleteResponse = {
  message: string;
  summary: {
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    testsDeleted: number;
    questionsDeleted: number;
    submissionsDeleted: number;
  };
};

export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  classLevel: number | null;
  board: string;
  createdAt: string | null;
};

export type AdminStudentProfile = {
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
  lastLogin: string | null;
  isActive: boolean;
  activeStatus: "active" | "inactive";
};

export type AdminStudentDetailsResponse = {
  profile: AdminStudentProfile;
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

export type AdminStudentDeleteResponse = {
  message: string;
  summary: {
    studentId: string;
    userId: string;
    studentName: string;
    studentEmail: string;
    profileDeleted: number;
    scoreHistoryDeleted: number;
    linkedSubmissionsDeleted: number;
  };
};

export type AdminDashboardStats = {
  totalTeachers: number;
  pendingTeachers: number;
  approvedTeachers: number;
  rejectedTeachers: number;
  rejectedSupported: boolean;
  totalStudents: number;
  activeStudents: number;
  totalTestsGenerated: number;
};

export type AdminAnalyticsResponse = {
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
    studentRegistrations: Array<{ date: string; value: number }>;
    teacherRegistrations: Array<{ date: string; value: number }>;
    testsGeneratedPerDay: Array<{ date: string; value: number }>;
    testsAttemptedPerDay: Array<{ date: string; value: number }>;
    averageScoreTrend: Array<{ date: string; value: number }>;
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

export type AdminTeachersResponse = {
  teachers: AdminTeacher[];
  count: number;
};

export type AdminStudentsResponse = {
  students: AdminStudent[];
  count: number;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!res.ok) {
    let serverMessage = res.statusText || "Request failed";
    try {
      const text = await res.text();
      if (text) {
        if (text.startsWith("{")) {
          const parsed = JSON.parse(text);
          serverMessage = parsed.error || parsed.message || text;
        } else if (
          text.includes("<!DOCTYPE") ||
          text.includes("<html") ||
          text.includes("<pre>")
        ) {
          // Extract text inside <pre> tag if present (e.g. Cannot POST /api/admin/send-email)
          const preMatch = text.match(/<pre>(.*?)<\/pre>/i);
          if (preMatch && preMatch[1]) {
            serverMessage = preMatch[1];
          } else {
            serverMessage = "HTML error page returned by server";
          }
        } else {
          serverMessage = text;
        }
      }
    } catch {
      // Fallback
    }

    throw new Error(`HTTP ${res.status}: ${serverMessage}`);
  }

  return (await res.json()) as T;
}

export const getAdminDashboard = () =>
  fetchJson<AdminDashboardStats>("/api/admin/dashboard");

export const getAdminAnalytics = () =>
  fetchJson<AdminAnalyticsResponse>("/api/admin/analytics");

export const getPendingTeachers = () =>
  fetchJson<AdminTeachersResponse>("/api/admin/teachers/pending");

export const getApprovedTeachers = () =>
  fetchJson<AdminTeachersResponse>("/api/admin/teachers/approved");

export const getAllTeachers = () =>
  fetchJson<AdminTeachersResponse>("/api/admin/teachers");

export const getAllStudents = () =>
  fetchJson<AdminStudentsResponse>("/api/admin/students");

export const getTeacherDetails = (teacherId: string) =>
  fetchJson<AdminTeacherDetailsResponse>(`/api/admin/teachers/${teacherId}`);

export const getStudentDetails = (studentId: string) =>
  fetchJson<AdminStudentDetailsResponse>(`/api/admin/students/${studentId}`);

export const approveTeacher = (teacherId: string) =>
  fetchJson<{ teacher: AdminTeacher; message: string }>(
    `/api/admin/teachers/${teacherId}/approve`,
    {
      method: "POST",
    },
  );

export const rejectTeacher = (teacherId: string) =>
  fetchJson<{ teacher: AdminTeacher; message: string }>(
    `/api/admin/teachers/${teacherId}/reject`,
    {
      method: "POST",
    },
  );

export const deleteTeacherAccount = (teacherId: string) =>
  fetchJson<AdminTeacherDeleteResponse>(`/api/admin/teachers/${teacherId}`, {
    method: "DELETE",
  });

export const deleteStudentAccount = (studentId: string) =>
  fetchJson<AdminStudentDeleteResponse>(`/api/admin/students/${studentId}`, {
    method: "DELETE",
  });

export type SendAdminEmailPayload = {
  recipientType: "teacher" | "student";
  recipientId: string;
  subject: string;
  message: string;
};

export const sendAdminEmail = (payload: SendAdminEmailPayload) =>
  fetchJson<{ success: boolean; message: string }>("/api/admin/send-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const checkAdminEmailHealth = () =>
  fetchJson<{
    success: boolean;
    service: string;
    timestamp: string;
    smtp: { ok: boolean; message: string };
  }>("/api/admin/email-health");

