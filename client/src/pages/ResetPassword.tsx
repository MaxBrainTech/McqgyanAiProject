import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  validatePassword,
  getPasswordValidation,
} from "@/lib/passwordValidation";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const role = location.pathname.startsWith("/teacher") ? "teacher" : "student";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValidation = getPasswordValidation(password);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      toast({
        variant: "destructive",
        title: t("resetPassword.invalidLinkTitle"),
        description: t("resetPassword.invalidLinkDesc"),
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("resetPassword.mismatchTitle"),
        description: t("resetPassword.mismatchDesc"),
      });
      return;
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: t("resetPassword.weakTitle"),
        description: t("resetPassword.weakDesc"),
      });
      return;
    }

    try {
      setLoading(true);

      await apiRequest("POST", `/api/${role}/reset-password`, {
        token,
        password,
      });

      toast({
        title: t("resetPassword.successTitle"),
        description: t("resetPassword.successDesc"),
      });

      setTimeout(() => {
        navigate(role === "teacher" ? "/teacher-auth" : "/student-login");
      }, 1500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("resetPassword.failedTitle"),
        description: error.message || t("resetPassword.failedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-md">
        <Card className="overflow-hidden rounded-[1.75rem] border border-blue-200/70 bg-white/95 shadow-2xl dark:border-blue-900/40 dark:bg-slate-950/85">
          <CardHeader className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Lock className="h-8 w-8 text-white" />
            </div>

            <CardTitle className="text-3xl font-black text-slate-900 dark:text-slate-50">
              {t("resetPassword.title")}
            </CardTitle>

            <CardDescription className="mt-2 text-slate-600 dark:text-slate-300">
              {t("resetPassword.subtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold">{t("resetPassword.newPassword")}</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("resetPassword.newPasswordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{t("resetPassword.confirmPassword")}</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border bg-slate-50 p-4 dark:bg-slate-900">
                <p className="mb-2 text-sm font-semibold">{t("resetPassword.requirementsTitle")}</p>
                <div className={`flex items-center gap-2 text-sm ${passwordValidation.minLength ? "text-green-600" : "text-slate-500"}`}>
                  <span>{passwordValidation.minLength ? "✓" : "○"}</span>
                  <span>{t("resetPassword.minimumLength")}</span>
                </div>
                <div className={`mt-2 flex items-center gap-2 text-sm ${passwordValidation.specialCharacter ? "text-green-600" : "text-slate-500"}`}>
                  <span>{passwordValidation.specialCharacter ? "✓" : "○"}</span>
                  <span>{t("resetPassword.specialCharacter")}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white"
              >
                {loading ? t("resetPassword.resetting") : t("resetPassword.button")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate(role === "teacher" ? "/teacher-auth" : "/student-login")}
              >
                {t("back_to_login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
