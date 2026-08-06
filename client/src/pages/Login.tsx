import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import AuthBackground from "@/components/auth/AuthBackground";
import {
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Pencil,
  Bot,
  Brain,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { auth } from "@/pages/firebase";
import SignInWithGoogle from "@/pages/signInWithGoogle";
import { setStudentSession } from "@/lib/authSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isHindi = i18n.language.startsWith("hi");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStudentSession();
      navigate("/profile");
    } catch (err: any) {
      console.error("Student login failed:", err);
      setError(t("loginPage.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
  <AuthBackground>
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

    

    <div className="relative z-10 mx-auto w-full max-w-md">

      <Card
        className="relative overflow-hidden rounded-[1.75rem]
        border border-blue-200/70
        bg-white/90
        backdrop-blur-xl
        shadow-[0_20px_60px_rgba(59,130,246,0.18)]
        dark:border-blue-900/30
        dark:bg-slate-950/80"
      >
          <CardHeader className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className={`font-black text-slate-900 dark:text-slate-50 ${isHindi ? "text-3xl" : "text-2xl sm:text-3xl"}`}>
              {t("loginPage.title")}
            </CardTitle>
            <CardDescription className="mt-2 text-slate-600 dark:text-slate-300">
              {t("loginPage.studentLoginDesc")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("loginPage.email")}
                </label>
                <Input
                  type="email"
                  placeholder={t("loginPage.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("loginPage.password")}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("loginPage.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/student/forgot-password")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t("forgot_password")}
                </button>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                disabled={loading}
              >
                {loading ? t("loginPage.loading") : t("loginPage.button")}
              </Button>

              <p className="text-center text-sm text-slate-700 dark:text-slate-300">
                {t("loginPage.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  {t("loginPage.signup")}
                </button>
              </p>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  {t("loginPage.orContinue")}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <SignInWithGoogle role="student" />

              <div className="pt-2 text-center">
                {/* <button
                  type="button"
                  onClick={() => navigate("/teacher-auth")}
                  className="text-sm font-semibold text-slate-700 hover:text-primary hover:underline dark:text-slate-300"
                >
                  {t("loginPage.teacherLogin")}
                </button> */}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </AuthBackground>
  );
}
