import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, UserPen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginChoice() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center">
          {/* <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">
            {t("loginPage.kicker")}
          </p> */}
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            {t("loginChoice.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {t("loginChoice.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden rounded-[1.75rem] border border-blue-200/70 bg-white/95 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-blue-900/40 dark:bg-slate-950/85">
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <UserPen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-50 sm:text-3xl">
                {t("loginChoice.studentTitle")}
              </CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                {t("loginChoice.studentDesc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-8">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm dark:bg-slate-900">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {t("loginChoice.studentNote")}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => navigate("/student-login")}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t("loginChoice.studentAction")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.75rem] border border-amber-200/70 bg-white/95 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-amber-900/40 dark:bg-slate-950/85">
            <CardHeader className="pt-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-violet-600 shadow-lg shadow-amber-500/30">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-50 sm:text-3xl">
                {t("loginChoice.teacherTitle")}
              </CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-300">
                {t("loginChoice.teacherDesc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-8">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-amber-600 shadow-sm dark:bg-slate-900">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {t("loginChoice.teacherNote")}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => navigate("/teacher-auth")}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-violet-600 font-semibold text-white shadow-lg shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t("loginChoice.teacherAction")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
