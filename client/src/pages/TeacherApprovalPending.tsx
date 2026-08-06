import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Clock3, ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getStoredTeacherId } from "@/lib/authSession";

const normalizeTeacherProfile = (teacher: any = {}) => ({
  ...teacher,
  fullName: teacher.fullName || teacher.full_name || teacher.name || "",
  approved: teacher.approved ?? teacher.isApproved ?? teacher.is_approved ?? false,
  verified: teacher.verified ?? teacher.isVerified ?? teacher.is_verified ?? false,
});

export default function TeacherApprovalPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState<any>(
    normalizeTeacherProfile((location.state as any)?.teacher ?? {}),
  );
  const hasCheckedStatus = useRef(false);

  useEffect(() => {
    const teacherId = getStoredTeacherId();

    if (!teacherId || hasCheckedStatus.current) {
      return;
    }

    hasCheckedStatus.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/teacher/${teacherId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(t("teacher_profile_load_failed"));
        }

        const data = normalizeTeacherProfile(await res.json());

        if (cancelled) return;

        setTeacher(data);

        if (data.verified && data.approved) {
          navigate("/teacher-dashboard", {
            state: { teacherData: data },
            replace: true,
          });
        }
      } catch {
        // Keep the current screen if the status check fails; the user can retry.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  const checkStatus = async () => {
    const teacherId = teacher.id || getStoredTeacherId();

    if (!teacherId) {
      navigate("/teacher-auth", { replace: true });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/teacher/${teacherId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(t("teacher_profile_load_failed"));
      }

      const data = normalizeTeacherProfile(await res.json());
      setTeacher(data);

      if (!data.verified) {
        navigate("/teacher-verification-pending", {
          state: { teacher: data },
          replace: true,
        });
        return;
      }

      if (!data.approved) {
        return;
      }

      navigate("/teacher-dashboard", {
        state: { teacherData: data },
        replace: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.24),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_#0f172a,_#111827_55%,_#020617)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                <Clock3 className="h-4 w-4" />
                {t("teacherApproval.reviewing")}
              </div>

              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {t("teacherApproval.title")}
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                {t("teacherApproval.subtitle")}
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("teacherApproval.email")}
                </p>
                <p className="mt-2 break-all text-sm font-medium text-white">
                  {teacher.email || "teacher@email.com"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t("teacherApproval.status")}
                </p>
                <p className="mt-2 text-sm font-medium text-emerald-300">
                  {t("teacherApproval.verifiedWaiting")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-50 p-6 text-slate-900 shadow-xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              {t("teacherApproval.underway")}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {t("teacherApproval.details")}
            </p>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-100 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-slate-900" />
                <p className="text-sm text-slate-700">{t("teacherApproval.step1")}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-slate-900" />
                <p className="text-sm text-slate-700">{t("teacherApproval.step2")}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-slate-900" />
                <p className="text-sm text-slate-700">{t("teacherApproval.step3")}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={checkStatus}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {loading ? t("teacherApproval.checking") : t("teacherApproval.checkStatus")}
              </button>

              <button
                onClick={() => navigate("/teacher-auth")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back_to_login")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
