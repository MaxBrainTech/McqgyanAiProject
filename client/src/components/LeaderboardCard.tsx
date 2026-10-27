import { useMemo, useState } from "react";
import { Trophy, TrendingUp, Target, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import ScoreHistoryReportDialog from "@/components/ScoreHistoryReportDialog";
import {
  buildScoreSummary,
  normalizeScoreEntry,
  type ScoreHistoryEntry,
} from "@/lib/scoreHistory";

interface LeaderboardCardProps {
  entries: ScoreHistoryEntry[];
  onResetScores?: () => void;
}

export default function LeaderboardCard({ entries }: LeaderboardCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const normalizedEntries = useMemo(
    () =>
      [...entries]
        .map(normalizeScoreEntry)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [entries]
  );

  const summary = useMemo(() => buildScoreSummary(normalizedEntries), [normalizedEntries]);
  const latest = normalizedEntries[0] || null;

  return (
    <>
      <Card className="overflow-hidden border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_60px_rgba(15,23,42,.08)] backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/90 sm:p-6">
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
          <div className="absolute -top-10 right-[-18px] h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-10 left-[-18px] h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
              {t("score_history")}
            </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
              {t("best_scores")}
            </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {t("score_history_desc")}
            </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-200 bg-white/90 px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800 sm:w-auto"
                onClick={() => setOpen(true)}
              >
              {t("view_full_report")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="group relative overflow-hidden rounded-3xl border border-blue-200/80 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-sky-400" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 shadow-inner dark:bg-blue-950/40 dark:text-blue-300">
                <Trophy className="h-5 w-5" />
              </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">{t("attempts")}</p>
                  <p className="mt-1 text-2xl font-black leading-none text-slate-950 dark:text-slate-50">
                  {summary.attempts}
                </p>
              </div>
              </div>
            </Card>

            <Card className="group relative overflow-hidden rounded-3xl border border-sky-200/80 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-400" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600 shadow-inner dark:bg-sky-950/40 dark:text-sky-300">
                <TrendingUp className="h-5 w-5" />
            </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">{t("average_score")}</p>
                  <p className="mt-1 text-2xl font-black leading-none text-slate-950 dark:text-slate-50">
                  {summary.averagePercentage}%
                </p>
              </div>
            </div>
            </Card>

            <Card className="group relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 shadow-inner dark:bg-emerald-950/40 dark:text-emerald-300">
                <Target className="h-5 w-5" />
              </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">{t("best_score")}</p>
                  <p className="mt-1 text-2xl font-black leading-none text-slate-950 dark:text-slate-50">
                  {summary.bestPercentage}%
                </p>
              </div>
            </div>
            </Card>

            <Card className="group relative overflow-hidden rounded-3xl border border-violet-200/80 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-400" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 shadow-inner dark:bg-violet-950/40 dark:text-violet-300">
                <BookOpen className="h-5 w-5" />
              </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">{t("latest_score")}</p>
                  <p className="mt-1 text-lg font-black leading-none text-slate-950 dark:text-slate-50 sm:text-xl whitespace-nowrap">
                  {latest ? `${latest.score}/${latest.maxScore}` : "0/0"}
                </p>
                {summary.latestClassLevel ? (
                    <p className="mt-2 inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                    {t("class")} {summary.latestClassLevel}
                  </p>
                ) : null}
              </div>
            </div>
            </Card>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
            {t("score_history_desc")}
          </div>
        </div>
      </Card>

      <ScoreHistoryReportDialog
        open={open}
        onOpenChange={setOpen}
        entries={normalizedEntries}
      />
    </>
  );
}
