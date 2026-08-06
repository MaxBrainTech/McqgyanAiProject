import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  clearAuthSession,
  getStoredAuthRole,
  getStoredTeacherId,
  type AuthRole,
} from "@/lib/authSession";

function getSessionRole(): AuthRole | null {
  const storedRole = getStoredAuthRole();
  if (storedRole) return storedRole;
  return getStoredTeacherId() ? "teacher" : null;
}

export function TeacherRouteGuard({ children }: { children: React.ReactNode }) {
  const role = getSessionRole();
  const location = useLocation();
  const { t } = useTranslation();
  const [status, setStatus] = useState<
    "checking" | "allowed" | "auth" | "verification" | "approval"
  >("checking");
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    const teacherId = getStoredTeacherId();

    if (role !== "teacher" || !teacherId) {
      setStatus("auth");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    (async () => {
      try {
        const res = await fetch(`/api/teacher/${teacherId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load teacher profile");
        }

        const data = await res.json();

        if (cancelled) return;

        setTeacher(data);

        if (!data.verified) {
          setStatus("verification");
          return;
        }

        if (!data.approved) {
          setStatus("approval");
          return;
        }

        setStatus("allowed");
      } catch {
        if (!cancelled) {
          clearAuthSession();
          setTeacher(null);
          setStatus("auth");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, role]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
        {t("loading_teacher_access")}
      </div>
    );
  }

  if (status === "auth" || role !== "teacher") {
    return <Navigate to="/teacher-auth" replace />;
  }

  if (status === "verification") {
    return (
      <Navigate
        to="/teacher-verification-pending"
        replace
        state={{ teacher }}
      />
    );
  }

  if (status === "approval") {
    return (
      <Navigate
        to="/teacher-approval-pending"
        replace
        state={{ teacher }}
      />
    );
  }

  return <>{children}</>;
}

export function StudentProfileRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = getSessionRole();

  if (role === "teacher") {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  return <>{children}</>;
}
