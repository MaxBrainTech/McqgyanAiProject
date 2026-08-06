import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MailCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TeacherVerificationPending() {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const teacher = (location.state as any)?.teacher;

  const handleResend = async () => {
    try {
      setLoading(true);

      const res = await apiRequest("POST", "/api/teacher/resend-verification", {
        email: teacher?.email,
      });

      const response = await res.json();

      toast({
        title: t("teacherVerification.sentTitle"),
        description: response.message,
      });

      setCooldown(60);

      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("teacherVerification.failedTitle"),
        description: error.message || t("teacherVerification.failedDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-10 shadow-xl">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <MailCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold text-slate-900">
          {t("teacherVerification.title")}
        </h1>

        <p className="mt-4 text-center text-slate-600">
          {t("teacherVerification.subtitle")}
        </p>

        <p className="mt-2 break-all text-center font-semibold text-blue-600">
          {teacher?.email || t("teacherVerification.defaultEmail")}
        </p>

        <div className="mt-8 rounded-xl border border-yellow-300 bg-yellow-50 p-5">
          <h2 className="font-semibold text-yellow-800">
            {t("teacherVerification.beforeDashboard")}
          </h2>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>{t("teacherVerification.step1")}</li>
            <li>{t("teacherVerification.step2")}</li>
            <li>{t("teacherVerification.step3")}</li>
            <li>{t("teacherVerification.step4")}</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading
              ? t("teacherVerification.sending")
              : cooldown > 0
              ? t("teacherVerification.resendIn", { seconds: cooldown })
              : t("teacherVerification.resend")}
          </button>

          <button
            onClick={() => navigate("/teacher-auth")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
            {t("back_to_login")}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          {t("teacherVerification.noEmail")}
          <br />
          {t("teacherVerification.spamHint")}
        </p>
      </div>
    </div>
  );
}
