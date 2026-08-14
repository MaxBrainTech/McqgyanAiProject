import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ArrowLeft,
  TrendingUp,
  Target,
  Brain,
  BookOpen,
  CalendarClock,
  Sparkles,
  FileText,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import {
  buildLearningInsights,
  buildScoreSummary,
  buildSubjectBreakdown,
  doesAttemptMatchClass,
  extractClassLevel,
  limitAttemptsPerSubject,
  normalizeScoreEntry,
  type ScoreHistoryEntry,
  type ScoreInsightSnapshot,
} from "@/lib/scoreHistory";
import { getSubjectLabel } from "@/lib/quizText";
import { generateHistoryReportPdf } from "@/lib/historyPdf";
import { generateQuizPdf, type PdfQuestion } from "@/lib/pdfGenerator";

type ScoreHistoryReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ScoreHistoryEntry[];
  activeClassLevel?: number | null;
};

const normalizeQuestionPaperItem = (item: any, index: number) => {
  const question = String(item?.question ?? "").trim();
  if (!question) return null;

  let parsedOptions: string[] = [];
  if (Array.isArray(item?.options)) {
    parsedOptions = item.options.map((option: unknown) => String(option ?? "").trim()).filter(Boolean);
  } else if (typeof item?.options === "string" && item.options.trim().length > 0) {
    try {
      const jsonOpts = JSON.parse(item.options);
      if (Array.isArray(jsonOpts)) {
        parsedOptions = jsonOpts.map((option: unknown) => String(option ?? "").trim()).filter(Boolean);
      }
    } catch {}
  }

  return {
    questionNumber: Math.max(1, Number(item?.questionNumber) || index + 1),
    question,
    options: parsedOptions,
    userAnswer: String(item?.userAnswer ?? "").trim(),
    correctAnswer: String(item?.correctAnswer ?? item?.correctOption ?? "").trim(),
    isCorrect: Boolean(item?.isCorrect),
    explanation: String(item?.explanation ?? item?.feedback ?? "").trim() || undefined,
    questionType: String(item?.questionType ?? "").trim() || undefined,
  };
};

const subjectAdvice: Record<string, { en: string; hi: string }> = {
  physics: {
    en: "Work on formulas, numericals, and unit conversion.",
    hi: "सूत्र, संख्यात्मक प्रश्न, और unit conversion पर काम करें।",
  },
  chemistry: {
    en: "Revise reactions, periodic table trends, and equations.",
    hi: "रासायनिक अभिक्रियाएँ, आवर्त सारिणी के रुझान, और समीकरण दोहराएँ।",
  },
  biology: {
    en: "Strengthen diagrams, definitions, and process flow.",
    hi: "आकृतियाँ, परिभाषाएँ, और प्रक्रियाओं को मजबूत करें।",
  },
  general_science: {
    en: "Revise the core concepts from physics, chemistry, and biology together.",
    hi: "भौतिकी, रसायन और जीवविज्ञान के मुख्य सिद्धांत एक साथ दोहराएँ।",
  },
  mathematics: {
    en: "Practice step-by-step solving and formula recall.",
    hi: "कदम-दर-कदम हल करें और सूत्रों को याद रखें।",
  },
  english: {
    en: "Improve grammar, vocabulary, and reading speed.",
    hi: "व्याकरण, शब्दावली, और पढ़ने की गति सुधारें।",
  },
  hindi: {
    en: "Focus on grammar, comprehension, and writing practice.",
    hi: "व्याकरण, समझ, और लेखन अभ्यास पर ध्यान दें।",
  },
  french: {
    en: "Practice vocabulary, verb forms, and sentence structure.",
    hi: "शब्दावली, क्रिया रूप, और वाक्य संरचना का अभ्यास करें।",
  },
  german: {
    en: "Revise common phrases, verbs, and sentence order.",
    hi: "सामान्य वाक्यांश, क्रियाएँ, और वाक्य क्रम दोहराएँ।",
  },
  spanish: {
    en: "Build basic vocabulary and grammar patterns.",
    hi: "मूल शब्दावली और व्याकरण के पैटर्न बनाएं।",
  },
  marathi: {
    en: "Revise translation, grammar, and comprehension.",
    hi: "अनुवाद, व्याकरण, और समझ को दोहराएँ।",
  },
  kannada: {
    en: "Practice sentence meaning, words, and grammar basics.",
    hi: "वाक्य का अर्थ, शब्द, और व्याकरण के मूल बातें अभ्यास करें।",
  },
};

const subjectLabel = (subject: string, t: any) => {
  return getSubjectLabel(subject, t);
};

export default function ScoreHistoryReportDialog({
  open,
  onOpenChange,
  entries,
  activeClassLevel,
}: ScoreHistoryReportDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showQuestionPaper, setShowQuestionPaper] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const trendChartConfig = useMemo(
    () => ({
      percentage: {
        label: t("score_percentage") || "Score %",
        color: "hsl(221 83% 53%)",
      },
    }),
    [t]
  );

  const subjectChartConfig = useMemo(
    () => ({
      average: {
        label: t("performance_average") || "Average",
        color: "hsl(221 83% 53%)",
      },
      best: {
        label: t("best_score") || "Best",
        color: "hsl(142 71% 45%)",
      },
    }),
    [t]
  );
  const dialogScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollReportToTop = () => {
    dialogScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const normalizedEntries = useMemo(
    () =>
      [...entries]
        .map(normalizeScoreEntry)
        .filter((entry) => doesAttemptMatchClass(entry, activeClassLevel))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [entries, activeClassLevel]
  );

  const summary = useMemo(() => buildScoreSummary(normalizedEntries), [normalizedEntries]);
  const subjectBreakdown = useMemo(() => buildSubjectBreakdown(normalizedEntries), [normalizedEntries]);
  const selectedEntry =
    normalizedEntries.find((item) => item.id === selectedId) || normalizedEntries[0] || null;
  const selectedQuestionPaper = selectedEntry?.insights?.questionPaper || null;
  const selectedClassLevel =
    extractClassLevel(selectedEntry) ??
    selectedEntry?.classLevel ??
    selectedEntry?.insights?.classLevel ??
    selectedEntry?.insights?.questionPaper?.classLevel ??
    summary.latestClassLevel ??
    null;
  const visibleQuestionPaper = useMemo(() => {
    if (!selectedEntry) return null;

    const normalizedQuestions = Array.isArray(selectedQuestionPaper?.questions)
      ? selectedQuestionPaper.questions
          .map((item: any, index: number) => normalizeQuestionPaperItem(item, index))
          .filter(Boolean)
      : [];

    const fallbackQuestions = Array.isArray((selectedEntry as any)?.questionReview)
      ? (selectedEntry as any).questionReview
          .map((item: any, index: number) => normalizeQuestionPaperItem(item, index))
          .filter(Boolean)
      : [];

    const questions = normalizedQuestions.length > 0 ? normalizedQuestions : fallbackQuestions;

    if (!selectedQuestionPaper && questions.length === 0) {
      return null;
    }

    return {
      title: selectedQuestionPaper?.title || t("question_paper_title"),
      subject: selectedQuestionPaper?.subject || selectedEntry.subject,
      classLevel: selectedQuestionPaper?.classLevel ?? selectedClassLevel ?? null,
      difficulty: selectedQuestionPaper?.difficulty || selectedEntry.difficulty || undefined,
      language: selectedQuestionPaper?.language || selectedEntry.language || undefined,
      questions,
    };
  }, [selectedEntry, selectedQuestionPaper, selectedClassLevel, t]);
  const selectedSubjectKey =
    selectedQuestionPaper?.subject || selectedEntry?.subject || "quiz";
  const selectedSubjectLabel = selectedEntry ? subjectLabel(selectedSubjectKey, t) : t("quiz");
  const selectAttemptForSubject = (subjectName: string) => {
    const normalizedTarget = subjectName.toLowerCase().replace(/\s+/g, "_");
    const match = [...normalizedEntries]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .find((entry) => {
        const entrySubject = entry.subject.toLowerCase().replace(/\s+/g, "_");
        const paperSubject = entry.insights?.questionPaper?.subject
          ? entry.insights.questionPaper.subject.toLowerCase().replace(/\s+/g, "_")
          : "";
        return entrySubject === normalizedTarget || paperSubject === normalizedTarget;
      });

    if (match) {
      setSelectedId(match.id);
      setShowQuestionPaper(true);
      requestAnimationFrame(() => {
        scrollReportToTop();
      });
    }
  };

  const selectedInsights = useMemo(() => {
    if (!selectedEntry) return null;
    const saved = selectedEntry.insights;
    if (saved) return saved;

    const fallback = buildLearningInsights(selectedEntry, normalizedEntries);
    return {
      recommendations: fallback.recommendations,
      weaknesses: fallback.weaknesses,
      subjectBreakdown,
    } satisfies ScoreInsightSnapshot;
  }, [normalizedEntries, selectedEntry, subjectBreakdown]);

  useEffect(() => {
    if (open && normalizedEntries.length > 0 && !selectedId) {
      setSelectedId(normalizedEntries[0].id);
    }
  }, [open, normalizedEntries, selectedId]);

  useEffect(() => {
    if (selectedQuestionPaper) {
      setShowQuestionPaper(true);
    }
  }, [selectedQuestionPaper]);

  useEffect(() => {
    if (!open) return;
    scrollReportToTop();
  }, [open, selectedId]);

  const trendData = useMemo(
    () =>
      [...normalizedEntries]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((entry, index) => ({
          attempt: index + 1,
          label: `#${index + 1}`,
          percentage: entry.percentage,
        })),
    [normalizedEntries]
  );

  const subjectData = useMemo(
    () =>
      subjectBreakdown.map((item) => ({
        subject: subjectLabel(item.subject, t),
        average: item.averagePercentage,
        best: item.bestPercentage,
      })),
    [subjectBreakdown, t]
  );
  const hasTrendData = trendData.length > 0;
  const hasSubjectData = subjectData.length > 0;

  const exportPdf = async () => {
    if (!selectedEntry || !selectedInsights) return;

    await generateHistoryReportPdf({
      entry: selectedEntry,
      history: normalizedEntries,
      insights: selectedInsights,
      subjectBreakdown,
      labels: {
        appName: "MCQGyaan AI",
        title: t("full_report"),
        subject: t("subject"),
        class: t("class"),
        score: t("total_score"),
        accuracy: t("accuracy"),
        attempts: t("attempts"),
        improvement: t("improvement"),
        strongestSubject: t("strongest_subject"),
        weakestSubject: t("weakest_subject"),
        recommendations: t("ai_insight"),
        weaknesses: t("weaknesses"),
        subjectBreakdown: t("subject_breakdown"),
        recentAttempts: t("recent_attempts"),
        generatedOn: t("generated_on"),
      },
    });
  };

  const exportQuestionPaperPdf = async () => {
    if (!selectedEntry || !visibleQuestionPaper || visibleQuestionPaper.questions.length === 0) return;

    const questions: PdfQuestion[] = visibleQuestionPaper.questions.map((item: PdfQuestion) => ({
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      userAnswer: item.userAnswer,
      isCorrect: item.isCorrect,
    }));

    await generateQuizPdf({
      title: visibleQuestionPaper.title || t("question_paper_title"),
      subject: visibleQuestionPaper.subject || selectedEntry.subject,
      classLevel: visibleQuestionPaper.classLevel ?? selectedClassLevel ?? 0,
      difficulty: visibleQuestionPaper.difficulty || selectedEntry.difficulty || "",
      language: visibleQuestionPaper.language || selectedEntry.language || "en",
      questions,
      fileName: `${(visibleQuestionPaper.title || selectedEntry.subject || t("question_paper_title"))
        .replace(/[\\/:*?"<>|]+/g, "-")
        .toLowerCase()}-question-paper.pdf`,
      labels: {
        appName: "MCQGyaan AI",
        questionPaper: t("question_paper_title"),
        answerSheet: t("answer_sheet_title"),
        subject: t("subject"),
        class: t("class"),
        difficulty: t("difficulty"),
        totalQuestions: t("total_questions"),
        shareCode: t("share_code"),
        questions: t("questions"),
        question: t("question"),
        options: t("options"),
        correctAnswer: t("correct_answer"),
        explanation: t("explanation"),
        yourAnswer: t("your_answer"),
        notAnswered: t("not_answered"),
        page: t("page"),
        of: t("of"),
        generatedBy: t("generated_by"),
        company: "MCQGyaan AI",
        website: "mcqgyaan.ai",
        correct: t("correct"),
        incorrect: t("incorrect"),
        score: t("score"),
        percentage: t("percentage"),
      },
      mode: "answers",
      scoreSummary: {
        score: selectedEntry.score,
        maxScore: selectedEntry.maxScore,
        percentage: Math.round(selectedEntry.percentage),
        correctAnswers: selectedEntry.correctAnswers,
      },
    });
  };

  const currentAdvice = selectedEntry
    ? subjectAdvice[selectedSubjectKey.toLowerCase().replace(/\s+/g, "_")]?.[
        i18n.language.startsWith("hi") ? "hi" : "en"
      ] || t("analysis_hint_desc")
    : t("analysis_hint_desc");

  const [isSpeaking, setIsSpeaking] = useState(false);

  const insightTranslationMap: Record<string, { en: string; hi: string }> = {
    "Keep the same revision rhythm and try harder mixed-topic tests.": {
      en: "Keep the same revision rhythm and try harder mixed-topic tests.",
      hi: "उसी revision rhythm को बनाए रखें और अब मिश्रित विषयों वाले कठिन टेस्ट पर ध्यान दें।",
    },
    "Revise the weak chapter once, then retake a fresh test after practice.": {
      en: "Revise the weak chapter once, then retake a fresh test after practice.",
      hi: "कमज़ोर चैप्टर को दोहराएँ, फिर अभ्यास के बाद ताज़ा टेस्ट दें।",
    },
    "Focus on basics first: read the concept, solve 5 examples, then retry.": {
      en: "Focus on basics first: read the concept, solve 5 examples, then retry.",
      hi: "पहले मूल बातों पर ध्यान दें: अवधारणा पढ़ें, 5 उदाहरण हल करें, फिर दोबारा प्रयास करें।",
    },
    "Nice jump in performance. You are learning faster now.": {
      en: "Nice jump in performance. You are learning faster now.",
      hi: "प्रदर्शन में अच्छी छलांग। आप अब जल्दी सीख रहे हैं।",
    },
    "Your latest attempt dropped compared to the previous one. Revisit the last weak topic.": {
      en: "Your latest attempt dropped compared to the previous one. Revisit the last weak topic.",
      hi: "पिछला प्रयास पिछले प्रयास की तुलना में गिरा है। अंतिम कमजोर विषय को फिर से देखें।",
    },
    "Add a few more attempts to unlock stronger trend analysis.": {
      en: "Add a few more attempts to unlock stronger trend analysis.",
      hi: "मजबूत ट्रेंड विश्लेषण के लिए कुछ और प्रयास जोड़ें।",
    },
    "This subject is currently your weakest area:": {
      en: "This subject is currently your weakest area:",
      hi: "यह विषय वर्तमान में आपकी सबसे कमजोर क्षेत्र है:",
    },
    "Concept clarity is low right now. Start with theory notes before speed practice.": {
      en: "Concept clarity is low right now. Start with theory notes before speed practice.",
      hi: "अभी अवधारणा स्पष्टता कम है। गति अभ्यास करने से पहले सिद्धांत नोट्स से शुरू करें।",
    },
    "Accuracy needs work. Slow down and verify each answer before submitting.": {
      en: "Accuracy needs work. Slow down and verify each answer before submitting.",
      hi: "शुद्धता पर काम करने की आवश्यकता है। सबमिट करने से पहले प्रत्येक उत्तर को धीमे से जांचें।",
    },
    "No major weakness detected from this result. Keep building consistency.": {
      en: "No major weakness detected from this result. Keep building consistency.",
      hi: "इस परिणाम से कोई बड़ी कमजोरी नहीं मिली है। लगातार अभ्यास जारी रखें।",
    },
  };

  const isHindi = i18n.language.startsWith("hi");

  const trendTranslationMap: Array<{
    prefix: string;
    hi: string;
  }> = [
    { prefix: "Strong upward trend", hi: "मजबूत ऊपर की दिशा का ट्रेंड" },
    { prefix: "Steady improvement", hi: "धीरे-धीरे सुधरता प्रदर्शन" },
    { prefix: "Stable performance", hi: "स्थिर प्रदर्शन" },
    { prefix: "Needs attention", hi: "ध्यान देने की आवश्यकता" },
    { prefix: "No history yet", hi: "अभी तक कोई इतिहास नहीं" },
  ];

  const translateTrendLabel = (label: string) => {
    if (!isHindi) return label;

    for (const item of trendTranslationMap) {
      if (label.startsWith(item.prefix)) {
        return `${item.hi}${label.slice(item.prefix.length)}`.trim();
      }
    }

    return label;
  };

  const translateInsightText = (text: string) => {
    for (const [key, translation] of Object.entries(insightTranslationMap)) {
      if (text.startsWith(key)) {
        const tail = text.slice(key.length).trim();
        const translatedBase = translation[isHindi ? "hi" : "en"];
        const translatedTail =
          key === "This subject is currently your weakest area:"
            ? tail
              ? subjectLabel(tail.replace(/[.?!]$/, ""), t) + (tail.endsWith(".") ? "." : "")
              : ""
            : tail;
        return `${translatedBase}${translatedTail ? ` ${translatedTail}` : ""}`;
      }
    }
    return text;
  };

  const getSpeechLanguage = () => (isHindi ? "hi-IN" : "en-US");

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakAiFeedback = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert(t("speech_not_supported"));
      return;
    }

    window.speechSynthesis.cancel();

    const recommendationsText = selectedInsights?.recommendations
      .map(translateInsightText)
      .join(". ");
    const weaknessesText = selectedInsights?.weaknesses
      .map(translateInsightText)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(
      `${t("ai_feedback")}. ${recommendationsText}. ${t("weaknesses")}. ${weaknessesText}.`
    );
    utterance.lang = getSpeechLanguage();
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const locale = utterance.lang.split("-")[0];
    const matchingVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(locale)
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogScrollRef}
        className="score-history-scrollbar fixed inset-0 !left-0 !top-0 h-[100dvh] w-[100vw] max-w-none !translate-x-0 !translate-y-0 overflow-y-auto overflow-x-hidden rounded-none border-0 p-0"
      >
        <div className="min-h-[100dvh] bg-background dark:bg-background">
          <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1720px] flex-col gap-4 px-3 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] lg:px-6 lg:py-6">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/85 sm:px-5 lg:px-6 lg:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Button variant="outline" className="w-full rounded-full px-4 sm:w-auto" onClick={() => onOpenChange(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("back")}
                </Button>
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                    {t("score_history")}
                  </DialogTitle>
                  <DialogDescription className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                    {t("score_history_desc")}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {activeClassLevel ? (
                  <Badge variant="default" className="w-fit rounded-full px-3 py-1 bg-blue-600 text-white font-bold">
                    {t("class")} {activeClassLevel}
                  </Badge>
                ) : null}
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 dark:bg-slate-800 dark:text-slate-100">
                  {translateTrendLabel(summary.trendLabel)}
                </Badge>
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1 dark:border-slate-700 dark:text-slate-100">
                  {summary.attempts} {t("attempts")}
                </Badge>
                <Button variant="outline" className="w-full rounded-full px-4 sm:w-auto" onClick={exportPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  {t("download_pdf")}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="flex min-h-0 w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/75 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-slate-950/50 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-1rem)] xl:self-start xl:overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-5 xl:grid-cols-1">
                <Card className="flex min-h-[96px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[108px] sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground dark:text-slate-400 sm:text-xs">
                    {t("average_score")}
                  </p>
                  <p className="text-2xl font-black leading-none text-primary sm:text-3xl">{summary.averagePercentage}%</p>
                </Card>
                <Card className="flex min-h-[96px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[108px] sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground dark:text-slate-400 sm:text-xs">
                    {t("best_score")}
                  </p>
                  <p className="text-2xl font-black leading-none text-emerald-600 sm:text-3xl">{summary.bestPercentage}%</p>
                </Card>
                <Card className="flex min-h-[96px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[108px] sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground dark:text-slate-400 sm:text-xs">
                    {t("improvement")}
                  </p>
                  <p className="text-2xl font-black leading-none text-amber-600 sm:text-3xl">
                    {summary.improvement > 0 ? "+" : ""}
                    {Math.round(summary.improvement)}%
                  </p>
                </Card>
                <Card className="flex min-h-[96px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[108px] sm:p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground dark:text-slate-400 sm:text-xs">
                    {t("weakest_subject")}
                  </p>
                  <p className="break-words text-sm font-bold capitalize leading-5 text-slate-950 dark:text-slate-50 sm:text-lg sm:leading-6">
                    {subjectLabel(summary.weakestSubject, t)}
                  </p>
                </Card>
              </div>

              <ScrollArea className="min-h-0 flex-1 px-4 pb-4 sm:px-5 sm:pb-5 xl:hidden">
                <div className="space-y-3 pr-1" />
              </ScrollArea>
            </aside>

            <main className="min-h-0 w-full overflow-x-hidden overflow-y-visible rounded-[1.5rem] border border-slate-200/80 bg-card/95 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-colors dark:border-slate-800 dark:bg-card/95 xl:px-1">
              {selectedEntry && selectedInsights ? (
                <div className="min-h-0">
                  <div className="mx-auto flex w-full max-w-[520px] flex-col space-y-4 px-3 pb-8 pt-4 sm:max-w-7xl sm:space-y-6 sm:px-6 sm:py-6 sm:pb-10 lg:p-8 lg:pb-10 xl:p-10 xl:pb-12">
                    <Card className="rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-primary/12 via-white to-accent/10 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-800 dark:from-sky-950/70 dark:via-slate-950 dark:to-slate-900 sm:p-6 xl:p-7">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70 dark:text-sky-300/80">
                            {t("full_report")}
                          </p>
                          <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:mt-2 sm:text-4xl capitalize">
                            {subjectLabel(selectedSubjectKey, t)}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300 sm:mt-2 sm:text-base">
                            {selectedEntry.date}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:text-slate-100 sm:px-3 sm:py-1 sm:text-sm">
                              {t("class")} {selectedClassLevel ?? "?"}
                            </Badge>
                            {selectedEntry.difficulty ? (
                              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] capitalize dark:border-slate-700 dark:text-slate-100 sm:px-3 sm:py-1 sm:text-sm">
                                {selectedEntry.difficulty}
                              </Badge>
                            ) : null}
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] capitalize dark:border-slate-700 dark:text-slate-100 sm:px-3 sm:py-1 sm:text-sm">
                              {selectedEntry.language}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 xl:mt-6 xl:grid-cols-4 xl:gap-4">
                        <Card className="flex min-h-[76px] flex-col justify-between rounded-3xl border border-slate-200/60 bg-white/90 p-2.5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[112px] sm:p-4">
                          <div className="flex items-start gap-2 sm:items-center">
                            <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400 sm:text-sm">
                              {t("latest_score")}
                            </p>
                          </div>
                          <p className="break-words text-xl font-black leading-none text-primary sm:text-3xl">
                            {selectedEntry.score}/{selectedEntry.maxScore}
                          </p>
                        </Card>
                        <Card className="flex min-h-[76px] flex-col justify-between rounded-3xl border border-slate-200/60 bg-white/90 p-2.5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[112px] sm:p-4">
                          <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400 sm:text-sm">{t("accuracy")}</p>
                          <p className="break-words text-xl font-black leading-none text-emerald-600 sm:text-3xl">
                            {Math.round(selectedEntry.percentage)}%
                          </p>
                        </Card>
                        <Card className="flex min-h-[76px] flex-col justify-between rounded-3xl border border-slate-200/60 bg-white/90 p-2.5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[112px] sm:p-4">
                          <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400 sm:text-sm">
                            {t("strongest_subject")}
                          </p>
                          <p className="break-words text-sm font-bold capitalize leading-5 text-slate-950 dark:text-slate-50 sm:text-lg sm:leading-6">
                            {subjectLabel(summary.strongestSubject, t)}
                          </p>
                        </Card>
                        <Card className="flex min-h-[76px] flex-col justify-between rounded-3xl border border-slate-200/60 bg-white/90 p-2.5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:min-h-[112px] sm:p-4">
                          <p className="text-xs leading-5 text-muted-foreground dark:text-slate-400 sm:text-sm">
                            {t("weakest_subject")}
                          </p>
                          <p className="break-words text-sm font-bold capitalize leading-5 text-slate-950 dark:text-slate-50 sm:text-lg sm:leading-6">
                            {subjectLabel(summary.weakestSubject, t)}
                          </p>
                        </Card>
                      </div>
                    </Card>

                    <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 sm:p-5 xl:p-6">
                      <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <h4 className="text-lg font-bold text-slate-950 dark:text-slate-50">{t("performance_graph")}</h4>
                        </div>
                        <Badge variant="secondary" className="mx-auto w-fit rounded-full px-2.5 py-1 text-xs dark:bg-slate-800 dark:text-slate-100 sm:mx-0 sm:px-3 sm:text-sm">
                          {translateTrendLabel(summary.trendLabel)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-center text-xs leading-5 text-muted-foreground dark:text-slate-300 sm:text-left sm:text-sm">
                        {t("analysis_graph_desc")}
                      </p>
                      {hasTrendData ? (
                        <ChartContainer config={trendChartConfig} className="mt-5 h-[260px] w-full max-w-full min-w-0 sm:h-[320px]">
                          <AreaChart data={trendData} margin={{ left: 6, right: 20, top: 16, bottom: 8 }}>
                            <defs>
                              <linearGradient id="historyTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.35} />
                            <XAxis
                              dataKey="label"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              interval="preserveStartEnd"
                              padding={{ left: 0, right: 18 }}
                              tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              domain={[0, 100]}
                              tickMargin={6}
                              width={48}
                              ticks={[0, 25, 50, 75, 100]}
                              allowDecimals={false}
                              tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                            <Area
                              type="monotone"
                              dataKey="percentage"
                              stroke="var(--color-percentage)"
                              strokeWidth={4}
                              fill="url(#historyTrendFill)"
                              dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ChartContainer>
                      ) : (
                        <div className="mt-5 flex h-[220px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 sm:h-[320px]">
                          {t("score_history_empty_hint")}
                        </div>
                      )}
                    </Card>

                    <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1.12fr_0.88fr]">
                      <Card className="rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 xl:p-6">
                        <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <h4 className="text-lg font-bold text-slate-950 dark:text-slate-50">{t("ai_feedback")}</h4>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full px-3 py-1.5 text-sm"
                          onClick={isSpeaking ? stopSpeech : speakAiFeedback}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="mr-2 h-4 w-4" />
                              {t("stop_audio")}
                            </>
                          ) : (
                            <>
                              <Volume2 className="mr-2 h-4 w-4" />
                              {t("listen_audio")}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">
                        {translateInsightText(selectedInsights.recommendations[0] || t("analysis_hint_desc"))}
                      </p>
                      <div className="mt-4 space-y-3">
                        {selectedInsights.recommendations.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm leading-6 text-slate-900 dark:border-sky-900/50 dark:bg-sky-950/35 dark:text-slate-100"
                          >
                            {translateInsightText(item)}
                          </div>
                        ))}
                      </div>
                      </Card>

                      <Card className="rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 xl:p-6">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-rose-500" />
                          <h4 className="text-lg font-bold text-slate-950 dark:text-slate-50">{t("weaknesses")}</h4>
                        </div>
                        <div className="mt-4 space-y-3">
                          {selectedInsights.weaknesses.map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm leading-6 text-slate-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-slate-100"
                            >
                              {translateInsightText(item)}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    <Card className="rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 xl:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h4 className="text-lg font-bold text-slate-950 dark:text-slate-50">{t("subject_breakdown")}</h4>
                        </div>
                        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 dark:bg-slate-800 dark:text-slate-100">
                          {selectedSubjectLabel}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                        {subjectBreakdown.map((item) => {
                          const normalizedSubject = item.subject.toLowerCase().replace(/\s+/g, "_");
                          const advice =
                            subjectAdvice[normalizedSubject]?.[i18n.language.startsWith("hi") ? "hi" : "en"] ||
                            currentAdvice;

                          const subjectAttempts = normalizedEntries.filter((entry) => {
                            const entrySubject = (entry.subject || "").toLowerCase().replace(/\s+/g, "_");
                            const paperSubject = entry.insights?.questionPaper?.subject
                              ? entry.insights.questionPaper.subject.toLowerCase().replace(/\s+/g, "_")
                              : "";
                            return entrySubject === normalizedSubject || paperSubject === normalizedSubject;
                          });

                          const chronologicalSubjectAttempts = [...subjectAttempts]
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                            .map((attempt, index) => ({
                              attemptNumber: index + 1,
                              attempt,
                            }));

                          // Take the latest 10 attempts chronologically for UI display
                          const latest10SubjectAttempts = chronologicalSubjectAttempts.slice(-10);

                          // Sort newest first
                          const displayAttempts = [...latest10SubjectAttempts].reverse();

                          const isExpanded = Boolean(expandedSubjects[normalizedSubject]);
                          const visibleAttempts = isExpanded
                            ? displayAttempts
                            : displayAttempts.slice(0, 4);
                          const hasMoreAttempts = displayAttempts.length > 4;
                          const hiddenCount = displayAttempts.length - 4;

                          const isActiveSubject =
                            selectedSubjectKey.toLowerCase().replace(/\s+/g, "_") === normalizedSubject;

                          return (
                            <div
                              key={item.subject}
                              className={`rounded-3xl border bg-slate-50/80 p-4 text-left transition-all dark:border-slate-800 dark:bg-slate-950/50 ${
                                isActiveSubject
                                  ? "border-primary/40 bg-primary/5 shadow-md dark:border-sky-500/40 dark:bg-sky-950/35"
                                  : "hover:border-primary/20 dark:hover:border-slate-700"
                              }`}
                            >
                              <div
                                className="cursor-pointer"
                                onClick={() => selectAttemptForSubject(item.subject)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold capitalize text-slate-950 dark:text-slate-50">
                                    {subjectLabel(item.subject, t)}
                                  </p>
                                  <Badge variant="secondary" className="rounded-full dark:bg-slate-800 dark:text-slate-100">
                                    {item.averagePercentage}%
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-slate-300">{advice}</p>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{ width: `${Math.min(100, item.averagePercentage)}%` }}
                                  />
                                </div>
                                <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                                  <span>
                                    {t("attempts")}: {item.attempts}
                                  </span>
                                  <span>
                                    {t("best_score")}: {item.bestPercentage}%
                                  </span>
                                </div>
                              </div>

                              {/* Clickable Attempts List */}
                              {displayAttempts.length > 0 ? (
                                <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                      Select Attempt:
                                    </p>
                                    {hasMoreAttempts ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedSubjects((prev) => ({
                                            ...prev,
                                            [normalizedSubject]: !prev[normalizedSubject],
                                          }));
                                        }}
                                        className="h-6 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg"
                                      >
                                        {isExpanded ? (
                                          <>
                                            Show Less
                                            <ChevronUp className="ml-1 h-3.5 w-3.5" />
                                          </>
                                        ) : (
                                          <>
                                            Show More Attempts (+{hiddenCount})
                                            <ChevronDown className="ml-1 h-3.5 w-3.5" />
                                          </>
                                        )}
                                      </Button>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {visibleAttempts.map(({ attemptNumber, attempt }, index) => {
                                      const isSelected = selectedId === attempt.id;
                                      const isLatestAttempt = attempt.id === displayAttempts[0]?.attempt.id;
                                      return (
                                        <Button
                                          key={attempt.id}
                                          type="button"
                                          size="sm"
                                          variant={isSelected ? "default" : "outline"}
                                          onClick={() => {
                                            setSelectedId(attempt.id);
                                            setShowQuestionPaper(true);
                                            requestAnimationFrame(() => {
                                              scrollReportToTop();
                                            });
                                          }}
                                          className={`h-8 rounded-xl px-2.5 text-xs font-bold transition-all ${
                                            isSelected
                                              ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/40 hover:bg-blue-700 dark:bg-blue-600 dark:text-white"
                                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                          }`}
                                          title={`${attempt.date || new Date(attempt.timestamp).toLocaleDateString()} - Score: ${attempt.score}/${attempt.maxScore} (${attempt.percentage}%)`}
                                        >
                                          {isLatestAttempt ? (
                                            <span
                                              className={`mr-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                                isSelected
                                                  ? "bg-white/25 text-white"
                                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                              }`}
                                            >
                                              Latest
                                            </span>
                                          ) : null}
                                          Attempt {attemptNumber}
                                          <span
                                            className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                                              isSelected
                                                ? "bg-white/20 text-white"
                                                : attempt.percentage >= 80
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                : attempt.percentage >= 60
                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                            }`}
                                          >
                                            {attempt.percentage}%
                                          </span>
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {visibleQuestionPaper ? (
                      <Card className="rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h4 className="text-lg font-bold text-slate-950 dark:text-slate-50">{t("question_paper_review")}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              className="rounded-full px-4 dark:border-slate-700 dark:text-slate-100"
                              onClick={() => setShowQuestionPaper((value) => !value)}
                            >
                              {showQuestionPaper ? t("hide_question_paper") : t("view_question_paper")}
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-full px-4 dark:border-slate-700 dark:text-slate-100"
                              onClick={exportQuestionPaperPdf}
                              disabled={visibleQuestionPaper.questions.length === 0}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {t("download_question_paper")}
                            </Button>
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">
                          {visibleQuestionPaper.title}
                          {visibleQuestionPaper.classLevel ? ` - ${t("class")} ${visibleQuestionPaper.classLevel}` : ""}
                        </p>

                        {showQuestionPaper ? (
                          <div className="mt-5 space-y-4">
                            {visibleQuestionPaper.questions.map((item: any) => (
                              <div
                                key={`${item.questionNumber}-${item.question}`}
                                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition-colors dark:border-slate-800 dark:bg-slate-950/50"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-primary/70">
                                      {t("question")} {item.questionNumber}
                                    </p>
                                    <p className="mt-2 text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">{item.question}</p>
                                  </div>
                                  <Badge
                                    variant={item.isCorrect ? "default" : "destructive"}
                                    className="rounded-full px-3 py-1 dark:text-slate-100"
                                  >
                                    {item.isCorrect ? t("correct") : t("incorrect")}
                                  </Badge>
                                </div>

                                {item.options.length > 0 ? (
                                  <div className="mt-4 grid gap-2">
                                    {item.options.map((option: string, index: number) => {
                                      const isCorrectOption =
                                        option.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase();
                                      const isUserAnswer =
                                        option.trim().toLowerCase() === item.userAnswer.trim().toLowerCase();

                                      return (
                                        <div
                                          key={`${item.questionNumber}-${index}`}
                                          className={`rounded-2xl border px-3 py-2 text-sm ${
                                            isCorrectOption
                                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                              : isUserAnswer
                                                ? "border-primary/20 bg-primary/5 text-primary"
                                                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
                                          }`}
                                        >
                                          <span className="font-medium">
                                            {String.fromCharCode(65 + index)}.
                                          </span>{" "}
                                          {option.replace(/^\s*[A-D]\.\s*/i, "")}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  <div className="rounded-2xl bg-white p-3 text-sm dark:bg-slate-950/50">
                                    <p className="text-muted-foreground dark:text-slate-400">{t("your_answer")}</p>
                                    <p className="mt-1 break-words font-semibold text-slate-950 dark:text-slate-50">
                                      {item.userAnswer || t("not_answered")}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-white p-3 text-sm dark:bg-slate-950/50">
                                    <p className="text-muted-foreground dark:text-slate-400">{t("correct_answer")}</p>
                                    <p className="mt-1 break-words font-semibold text-emerald-700">
                                      {item.correctAnswer}
                                    </p>
                                  </div>
                                </div>

                                {item.explanation ? (
                                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                                    <p className="text-muted-foreground dark:text-amber-200/80">{t("explanation")}</p>
                                    <p className="mt-1 leading-6">{item.explanation}</p>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </Card>
                    ) : null}

                    <Card className="rounded-[1.75rem] border border-slate-200/70 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-950 xl:p-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <h4 className="text-lg font-bold text-slate-950 dark:text-slate-50">{t("analysis_hint")}</h4>
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground dark:text-slate-300">{currentAdvice}</p>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                  {t("no_scores")}
                </div>
              )}
            </main>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
