import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchAdminSession } from "@/lib/adminAuth";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useTranslation();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await fetchAdminSession();

        if (cancelled) {
          return;
        }

        if (!session) {
          setStatus("denied");
          return;
        }

        setStatus("allowed");
      } catch {
        if (!cancelled) {
          setStatus("denied");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/60">
          {t("verifying_admin_session")}
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}
