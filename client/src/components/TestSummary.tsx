// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Trophy, Target, TrendingUp, Home } from "lucide-react";
// import { motion } from "framer-motion";
// import { useEffect } from "react";
// import { useTranslation } from "react-i18next";

// interface TestSummaryProps {
//   totalScore: number;
//   totalQuestions: number;
//   correctAnswers: number;
//   subject: string;
//   onNewTest: () => void;
//   onHome: () => void;
// }

// export default function TestSummary({
//   totalScore,
//   totalQuestions,
//   correctAnswers,
//   subject,
//   onNewTest,
//   onHome,
// }: TestSummaryProps) {

//   const { t } = useTranslation();

//   const percentage =
//     totalQuestions > 0
//       ? ((totalScore / (totalQuestions * 10)) * 100).toFixed(0)
//       : "0";

//   const accuracy =
//     totalQuestions > 0
//       ? ((correctAnswers / totalQuestions) * 100).toFixed(0)
//       : "0";

//   useEffect(() => {

//     const savedScores = localStorage.getItem("langbuddy_scores");
//     const scores = savedScores ? JSON.parse(savedScores) : [];

//     const newEntry = {
//       language: subject
//         ? subject.charAt(0).toUpperCase() + subject.slice(1)
//         : "Unknown",
//       score: totalScore,
//       totalQuestions,
//       date: new Date().toLocaleString(),
//     };

//     scores.unshift(newEntry);
//     scores.sort((a: any, b: any) => b.score - a.score);

//     const topScores = scores.slice(0, 5);

//     localStorage.setItem("langbuddy_scores", JSON.stringify(topScores));

//   }, [totalScore, totalQuestions, subject]);

//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.4 }}
//       className="max-w-2xl mx-auto"
//     >

//       <Card className="p-8">

//         <div className="text-center space-y-6">

//           <div className="inline-flex p-4 bg-primary/10 rounded-full">
//             <Trophy className="w-16 h-16 text-primary" />
//           </div>

//           <div>

//             <h1 className="text-3xl font-bold mb-2">
//               {t("test_complete")}
//             </h1>

//             <p className="text-lg text-muted-foreground">
//               {t("great_work")} {subject || t("quiz")}
//             </p>

//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">

//             <Card className="p-4 bg-primary/5">

//               <div className="flex flex-col items-center gap-2">

//                 <Target className="w-8 h-8 text-primary" />

//                 <p className="text-base text-muted-foreground">
//                   {t("total_score")}
//                 </p>

//                 <p className="text-3xl font-bold text-primary">
//                   {totalScore}/{totalQuestions * 10}
//                 </p>

//               </div>

//             </Card>

//             <Card className="p-4 bg-accent/5">

//               <div className="flex flex-col items-center gap-2">

//                 <TrendingUp className="w-8 h-8 text-accent" />

//                 <p className="text-base text-muted-foreground">
//                   {t("accuracy")}
//                 </p>

//                 <p className="text-3xl font-bold text-accent">
//                   {accuracy}%
//                 </p>

//               </div>

//             </Card>

//             <Card className="p-4 bg-green-50 dark:bg-green-950/20">

//               <div className="flex flex-col items-center gap-2">

//                 <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />

//                 <p className="text-base text-muted-foreground">
//                   {t("correct")}
//                 </p>

//                 <p className="text-3xl font-bold text-green-600 dark:text-green-400">
//                   {correctAnswers}/{totalQuestions}
//                 </p>

//               </div>

//             </Card>

//           </div>

//           <div className="bg-muted/50 p-6 rounded-xl">

//             <p className="text-lg font-medium">

//               {parseInt(percentage) >= 80
//                 ? t("outstanding")
//                 : parseInt(percentage) >= 60
//                 ? t("good_progress")
//                 : t("keep_practicing")}

//             </p>

//           </div>

//           <div className="flex flex-col sm:flex-row gap-3 pt-4">

//             <Button
//               onClick={onNewTest}
//               size="lg"
//               className="flex-1 text-base"
//             >
//               {t("try_another_test")}
//             </Button>

//             <Button
//               onClick={onHome}
//               variant="outline"
//               size="lg"
//               className="flex-1 text-base"
//             >
//               <Home className="w-4 h-4 mr-2" />
//               {t("back_home")}
//             </Button>

//           </div>

//         </div>

//       </Card>

//     </motion.div>
//   );
// }


import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarClock, CheckCircle2, Home, Target, TrendingUp, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getAuth } from "firebase/auth";
import { getSubjectLabel, getSubjectTestTitle } from "@/lib/quizText";
import {
  buildLearningInsights,
  buildSubjectBreakdown,
  loadScoreHistory,
  normalizeScoreEntry,
  saveScoreHistoryEntry,
  syncScoreHistoryEntry,
  type ScoreQuestionPaperItem,
  type ScoreQuestionPaperSnapshot,
} from "@/lib/scoreHistory";

interface TestSummaryProps {
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  subject: string;
  classLevel?: number;
  difficulty?: string;
  mode?: string;
  language?: string;
  questionReview?: ScoreQuestionPaperItem[];
  onNewTest: () => void;
  onHome: () => void;
}

export default function TestSummary({
  totalScore,
  totalQuestions,
  correctAnswers,
  subject,
  classLevel = 0,
  difficulty,
  mode,
  language,
  questionReview = [],
  onNewTest,
  onHome,
}: TestSummaryProps) {

  const { t, i18n } = useTranslation();
  const didSaveResult = useRef(false);

  const percentage =
    totalQuestions > 0
      ? ((totalScore / (totalQuestions * 10)) * 100).toFixed(0)
      : "0";

  const accuracy =
    totalQuestions > 0
    ? ((correctAnswers / totalQuestions) * 100).toFixed(0)
    : "0";
  const percentageNumber = parseInt(percentage, 10);
  const maxScore = totalQuestions * 10;
  const timestamp = new Date();
  const subjectLabel = getSubjectLabel(subject, t);
  const formattedDate = timestamp.toLocaleString(
    (language || i18n.language || "en").startsWith("hi") ? "hi-IN" : "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
  const performanceKey =
    percentageNumber >= 85
      ? "performance_excellent"
      : percentageNumber >= 60
      ? "performance_good"
      : percentageNumber >= 40
      ? "performance_average"
      : "performance_needs_improvement";
  const performanceClass =
    percentageNumber >= 85
      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
      : percentageNumber >= 60
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  const progressClass =
    percentageNumber >= 85
      ? "bg-green-500"
      : percentageNumber >= 60
      ? "bg-yellow-500"
      : "bg-red-500";

  useEffect(() => {
    if (didSaveResult.current) return;
    didSaveResult.current = true;

    const questionPaper: ScoreQuestionPaperSnapshot = {
      title: getSubjectTestTitle(subject, t),
      subject: subject || "quiz",
      classLevel: classLevel || null,
      difficulty,
      language: language || i18n.language || "en",
      questions: questionReview.map((item, index) => {
        let optionsList: string[] = [];
        if (Array.isArray(item.options)) {
          optionsList = item.options;
        } else if (typeof item.options === "string" && (item.options as string).trim().length > 0) {
          try {
            const parsed = JSON.parse(item.options);
            if (Array.isArray(parsed)) optionsList = parsed;
          } catch {}
        }

        return {
          questionNumber: item.questionNumber || index + 1,
          question: item.question,
          options: optionsList,
          userAnswer: item.userAnswer || "",
          correctAnswer: item.correctAnswer || (item as any).correctOption || "",
          isCorrect: Boolean(item.isCorrect),
          explanation: item.explanation || (item as any).feedback,
          questionType: item.questionType,
        };
      }),
    };

    const newEntry = normalizeScoreEntry({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      subject: subject || "quiz",
      score: totalScore,
      maxScore,
      percentage: percentageNumber,
      totalQuestions,
      correctAnswers,
      language: language || i18n.language || "en",
      classLevel: classLevel || null,
      timestamp: timestamp.toISOString(),
      date: formattedDate,
      insights: {
        recommendations: [],
        weaknesses: [],
        subjectBreakdown: [],
        classLevel: classLevel || null,
        questionPaper,
      },
    });
    const existingHistory = loadScoreHistory();
    const combinedHistory = [newEntry, ...existingHistory];
    const insights = buildLearningInsights(newEntry, combinedHistory);
    const subjectBreakdown = buildSubjectBreakdown(combinedHistory);
    const snapshot = {
      recommendations: insights.recommendations,
      weaknesses: insights.weaknesses,
      subjectBreakdown,
      classLevel: classLevel || null,
      questionPaper,
    };

    saveScoreHistoryEntry({
      ...newEntry,
      insights: snapshot,
    });

    const user = getAuth().currentUser;
    if (user) {
      void syncScoreHistoryEntry(
        {
          ...newEntry,
          insights: snapshot,
        },
        {
          userId: user.uid,
          userEmail: user.email,
        },
        snapshot
      ).catch((error) => {
        console.warn("Score history sync failed", error);
      });
    }

  }, [classLevel, correctAnswers, difficulty, formattedDate, i18n.language, language, maxScore, mode, percentageNumber, questionReview, subject, subjectLabel, t, timestamp, totalQuestions, totalScore]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-4xl"
    >

      <Card className="overflow-hidden border-0 bg-card/95 shadow-2xl">

        <div className="bg-gradient-to-br from-primary/15 via-background to-accent/10 p-5 text-center sm:p-8">

          <div className="inline-flex rounded-full bg-primary/10 p-4 shadow-inner">
            <Trophy className="h-14 w-14 text-primary sm:h-16 sm:w-16" />
          </div>

          <div>

            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              {t("test_complete")}
            </h1>

            <p className="text-base text-muted-foreground sm:text-lg">
              {getSubjectTestTitle(subject, t)}
            </p>

          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8">

          <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t("result_subject")}</p>
              <p className="text-lg font-bold">{subjectLabel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("result_date_time")}</p>
              <p className="text-base font-semibold">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("result_language")}</p>
              <p className="text-base font-semibold">{(language || i18n.language || "en").startsWith("hi") ? t("language_hindi") : t("language_english")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <Card className="rounded-2xl border-primary/10 bg-primary/5 p-4 shadow-sm">

              <div className="flex flex-col items-center gap-2">

                <Target className="w-8 h-8 text-primary" />

                <p className="text-base text-muted-foreground">
                  {t("total_score")}
                </p>

                <p className="text-3xl font-bold text-primary">
                  {totalScore}/{maxScore}
                </p>

              </div>

            </Card>

            <Card className="rounded-2xl border-accent/10 bg-accent/5 p-4 shadow-sm">

              <div className="flex flex-col items-center gap-2">

                <TrendingUp className="w-8 h-8 text-accent" />

                <p className="text-base text-muted-foreground">
                  {t("accuracy")}
                </p>

                <p className="text-3xl font-bold text-accent">
                  {accuracy}%
                </p>

              </div>

            </Card>

            <Card className="rounded-2xl bg-green-50 p-4 shadow-sm dark:bg-green-950/20">

              <div className="flex flex-col items-center gap-2">

                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />

                <p className="text-base text-muted-foreground">
                  {t("correct")}
                </p>

                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {correctAnswers}/{totalQuestions}
                </p>

              </div>

            </Card>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("total_questions")}</p>
                  <p className="text-2xl font-black">{totalQuestions}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("correct_answers")}</p>
                  <p className="text-2xl font-black text-green-600">{correctAnswers}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("percentage")}</p>
                <p className="text-3xl font-black">{percentage}%</p>
              </div>
              <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${performanceClass}`}>
                {t("performance")}: {t(performanceKey)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressClass}`}
                style={{ width: `${Math.min(100, Math.max(0, percentageNumber))}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 p-5 sm:p-6">

            <p className="text-lg font-medium">

              {percentageNumber >= 80
                ? t("outstanding")
                : percentageNumber >= 60
                ? t("good_progress")
                : t("keep_practicing")}

            </p>

          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">

            <Button
              onClick={onNewTest}
              size="lg"
              className="flex-1 rounded-xl px-5 py-6 text-base"
            >
              {t("try_another_test")}
            </Button>

            <Button
              onClick={onHome}
              variant="outline"
              size="lg"
              className="flex-1 rounded-xl px-5 py-6 text-base"
            >
              <Home className="w-4 h-4 mr-2" />
              {t("back_home")}
            </Button>

          </div>

        </div>

      </Card>

    </motion.div>
  );
}
