export type AuthRole = "student" | "teacher";

export const AUTH_ROLE_KEY = "authRole";
export const TEACHER_ID_KEY = "teacherId";

export const getStoredAuthRole = (): AuthRole | null => {
  if (typeof window === "undefined") return null;

  const role = localStorage.getItem(AUTH_ROLE_KEY);
  if (role === "student" || role === "teacher") {
    return role;
  }

  return null;
};

export const setStoredAuthRole = (role: AuthRole) => {
  localStorage.setItem(AUTH_ROLE_KEY, role);
};

export const setTeacherSession = (teacherId: string) => {
  localStorage.setItem(TEACHER_ID_KEY, teacherId);
  setStoredAuthRole("teacher");
};

export const setStudentSession = () => {
  localStorage.removeItem(TEACHER_ID_KEY);
  setStoredAuthRole("student");
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(TEACHER_ID_KEY);
};

export const getStoredTeacherId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TEACHER_ID_KEY);
};
