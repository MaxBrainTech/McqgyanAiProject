import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CalendarClock, CheckCircle, Download, Lightbulb, Loader2, Target, Trophy, XCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { getLocalizedText, getSubjectLabel, getSubjectTestTitle } from "@/lib/quizText";
import { generateQuizPdf } from "@/lib/pdfGenerator";
import TestTimerBar from "@/components/TestTimerBar";
import { saveScoreHistoryAttempt } from "@/lib/scoreHistory";
import { getClientAppUrl } from "@/lib/appUrl";

type ResultMap = Record<string, any>;
type AnswerMap = Record<string, string>;

type StoredSession = {
  shareCode: string;
  studentName: string;
  submissionId?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  testId?: string;
  currentQuestionIndex?: number;
  answers?: AnswerMap;
  results?: ResultMap;
  testStarted?: boolean;
  testCompleted?: boolean;
  finalResult?: any;
  scoreHistorySaved?: boolean;
};

const STORAGE_PREFIX = "mcqgyaan_custom_test";

const normalizeQuestionType = (type?: string, options?: any[]) => {
  const normalized = (type || "").toString().trim().toLowerCase();
  if (normalized === "mcq" || normalized === "multiple_choice" || normalized === "multiple-choice") return "mcq";
  if ((!normalized || normalized.length === 0) && Array.isArray(options) && options.length > 0) return "mcq";
  return normalized || "open-ended";
};

const cleanOption = (opt: string) =>
  (opt ?? "").replace(/^[A-D][.)]?\s*/i, "").trim();

const getTestDurationMinutes = (test: any) =>
  Number(test?.durationMinutes ?? 0);

export default function CustomTestPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shareCode, setShareCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [testData, setTestData] = useState<any>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const hydratedRef = useRef(false);
  const finalizingRef = useRef(false);
  const scoreHistorySavedRef = useRef(false);
  const latestSessionRef = useRef({
    submissionId: null as string | null,
    studentName: "",
    startTime: null as string | null,
    endTime: null as string | null,
    answers: {} as AnswerMap,
    testData: null as any,
  });

  const getStorageKey = (code: string) => `${STORAGE_PREFIX}:${code || "pending"}`;
  const storageKey = getStorageKey(shareCode);

  const currentQuestion = testData?.questions?.[currentQuestionIndex];
  const currentQuestionType = normalizeQuestionType(
    currentQuestion?.questionType,
    currentQuestion?.options,
  );
  const headerClassLabel =
    testData?.test?.classLevel
    ?? testData?.test?.class
    ?? (testData?.test as any)?.class_number
    ?? (testData?.test as any)?.class_level
    ?? "—";

  const isMCQ = currentQuestionType === "mcq";
  const currentAnswer = currentQuestion?.id ? (answers[currentQuestion.id] || "") : "";
  const totalQuestions = testData?.questions?.length || 0;
  const activeDurationMinutes = testData?.test?.durationMinutes ?? durationMinutes;

  const buildQuestionReview = () =>
    (testData?.questions || []).map((question: any, index: number) => {
      const result = results[question.id];
      return {
        questionNumber: index + 1,
        question: question.question || "",
        options: Array.isArray(question.options) ? question.options : [],
        userAnswer: answers[question.id] || "",
        correctAnswer: result?.correctAnswer || question.correctAnswer || question.correctOption || "",
        isCorrect: Boolean(result?.isCorrect),
        explanation: result?.explanation || question.explanation,
        questionType: question.questionType,
      };
    });

  const saveCurrentAttemptToHistory = async () => {
    if (scoreHistorySavedRef.current || !testData?.test) return;

    const stats = finalResult
      ? {
          totalScore: finalResult.totalScore || 0,
          correct: finalResult.correctAnswers || 0,
          total: finalResult.totalQuestions || totalQuestions,
        }
      : calculateStats();

    await saveScoreHistoryAttempt({
      subject: testData?.test?.subject || testData?.test?.title || "quiz",
      totalScore: stats.totalScore || 0,
      totalQuestions: stats.total || totalQuestions,
      correctAnswers: stats.correct || 0,
      language: i18n.language || "en",
      classLevel: Number(testData?.test?.classLevel ?? headerClassLabel ?? 0) || null,
      difficulty: String(testData?.test?.difficulty || ""),
      mode: "custom-test",
      questionPaperTitle: testData?.test?.title || t("question_paper_title"),
      questionReview: buildQuestionReview(),
    });

    scoreHistorySavedRef.current = true;
    persistSession({ scoreHistorySaved: true });
  };

  const persistSession = (patch?: Partial<StoredSession>) => {
    if (!shareCode) return;

    const session: StoredSession = {
      shareCode,
      studentName,
      submissionId: submissionId || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes,
      testId: testData?.test?.id,
      currentQuestionIndex,
      answers,
      results,
      testStarted,
      testCompleted,
      finalResult,
      scoreHistorySaved: scoreHistorySavedRef.current,
      ...patch,
    };

    localStorage.setItem(getStorageKey(session.shareCode), JSON.stringify(session));
  };

  useEffect(() => {
    latestSessionRef.current = {
      submissionId,
      studentName,
      startTime,
      endTime,
      answers,
      testData,
    };
  }, [submissionId, studentName, startTime, endTime, answers, testData]);

  const loadTestData = async (code: string) => {
    const res = await fetch(`/api/custom-test/${code}`);
    if (!res.ok) {
      throw new Error("Test not found");
    }
    return res.json();
  };

  useEffect(() => {
    if (hydratedRef.current) return;

    const savedEntries: StoredSession[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "null") as StoredSession | null;
        if (parsed?.shareCode) {
          savedEntries.push(parsed);
        }
      } catch {
        // Ignore malformed storage entries.
      }
    }

    const savedEntry = savedEntries[0];

    if (!savedEntry) {
      hydratedRef.current = true;
      return;
    }

    hydratedRef.current = true;
    setShareCode(savedEntry.shareCode);
    setStudentName(savedEntry.studentName || "");
    setSubmissionId(savedEntry.submissionId || null);
    setStartTime(savedEntry.startTime || null);
    setEndTime(savedEntry.endTime || null);
    setDurationMinutes(savedEntry.durationMinutes || 0);
    setCurrentQuestionIndex(savedEntry.currentQuestionIndex || 0);
    setAnswers(savedEntry.answers || {});
    setResults(savedEntry.results || {});
    setTestStarted(!!savedEntry.testStarted);
    setTestCompleted(!!savedEntry.testCompleted);
    setFinalResult(savedEntry.finalResult || null);
    scoreHistorySavedRef.current = !!savedEntry.scoreHistorySaved;
  }, []);

  useEffect(() => {
    if (!shareCode || testData || !testStarted) return;

    let cancelled = false;
    void (async () => {
      try {
        const data = await loadTestData(shareCode);
        if (cancelled) return;
        setTestData(data);
        setDurationMinutes(getTestDurationMinutes(data.test));
      } catch {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: t("test_not_found"),
            description: t("invalid_share_code"),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareCode, testData, testStarted, toast, t]);

  const startBackendSession = async (testId: string, name: string) => {
    const res = await apiRequest("POST", "/api/custom-test/start", {
      testId,
      studentName: name,
    });
    return res.json();
  };

  const finalizeSubmission = async (submissionType: "manual" | "auto") => {
    const snapshot = latestSessionRef.current;
    if (!snapshot.testData?.test?.id || finalizingRef.current || testCompleted) return;

    finalizingRef.current = true;
    setIsFinalizing(true);

    try {
      const now = new Date();
      const normalizedSubmissionType = submissionType === "auto" ? "auto" : "manual";
      const payload = {
        submissionId: snapshot.submissionId,
        testId: snapshot.testData.test.id,
        studentName: snapshot.studentName,
        answers: snapshot.answers,
        submissionType: normalizedSubmissionType,
        startTime: snapshot.startTime,
        endTime: now.toISOString(),
      };

      const res = await apiRequest("POST", "/api/custom-test/submit", payload);
      const data = await res.json();

      setFinalResult(data);
      setTestCompleted(true);
      void saveCurrentAttemptToHistory().catch((saveError) => {
        console.warn("Failed to save custom test history", saveError);
      });
      persistSession({
        testCompleted: true,
        finalResult: data,
        durationMinutes,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error?.message || t("evaluate_failed"),
      });
    } finally {
      setIsFinalizing(false);
      finalizingRef.current = false;
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw || hydratedRef.current) return;

    try {
      const saved: StoredSession = JSON.parse(raw);
      hydratedRef.current = true;
      if (saved.shareCode) {
        setShareCode(saved.shareCode);
        setStudentName(saved.studentName || "");
        setSubmissionId(saved.submissionId || null);
        setStartTime(saved.startTime || null);
        setDurationMinutes(saved.durationMinutes || 0);
        setCurrentQuestionIndex(saved.currentQuestionIndex || 0);
        setAnswers(saved.answers || {});
        setResults(saved.results || {});
        setTestStarted(!!saved.testStarted);
        setTestCompleted(!!saved.testCompleted);
        setFinalResult(saved.finalResult || null);
        scoreHistorySavedRef.current = !!saved.scoreHistorySaved;
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!shareCode) return;
    persistSession();
  }, [
    shareCode,
    studentName,
    submissionId,
    startTime,
    durationMinutes,
    currentQuestionIndex,
    answers,
    results,
    testStarted,
    testCompleted,
    finalResult,
  ]);

  useEffect(() => {
    if (testStarted && testData?.test && !durationMinutes) {
      setDurationMinutes(getTestDurationMinutes(testData.test));
    }
  }, [testStarted, testData, durationMinutes]);

  const handleStartTest = async () => {
    if (!shareCode.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("enter_share_code"),
      });
      return;
    }

    if (!studentName.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("enter_student_name"),
      });
      return;
    }

    try {
      setIsLoadingTest(true);
      const normalizedCode = shareCode.trim().toUpperCase();
      setShareCode(normalizedCode);

      const data = await loadTestData(normalizedCode);
      const session = await startBackendSession(data.test.id, studentName.trim());
      const testDuration = getTestDurationMinutes(data.test);
      const resolvedStartTime = session.startTime || new Date().toISOString();
      const resolvedEndTime = session.endTime || new Date(new Date(resolvedStartTime).getTime() + testDuration * 60 * 1000).toISOString();

      setTestData(data);
      setTestStarted(true);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setResults({});
      setTestCompleted(false);
      setFinalResult(null);
      scoreHistorySavedRef.current = false;
      setSubmissionId(session.submissionId || null);
      setStartTime(resolvedStartTime);
      setEndTime(resolvedEndTime);
      setDurationMinutes(testDuration);
      setTimeRemaining(Math.max(0, Math.ceil((new Date(resolvedEndTime).getTime() - Date.now()) / 1000)));

      localStorage.setItem(
        getStorageKey(normalizedCode),
        JSON.stringify({
          shareCode: normalizedCode,
          studentName: studentName.trim(),
          testId: data.test.id,
          submissionId: session.submissionId,
          startTime: resolvedStartTime,
          endTime: resolvedEndTime,
          durationMinutes: testDuration,
          currentQuestionIndex: 0,
          answers: {},
        results: {},
        testStarted: true,
        testCompleted: false,
        scoreHistorySaved: false,
      }),
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("test_not_found"),
        description: error?.message || t("invalid_share_code"),
      });
    } finally {
      setIsLoadingTest(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion?.id) return;
    const answer = answers[currentQuestion.id] || "";

    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("provide_answer"),
      });
      return;
    }

    try {
      setIsSubmittingAnswer(true);
      const res = await apiRequest("POST", "/api/custom-test/evaluate", {
        testId: testData.test.id,
        questionId: currentQuestion.id,
        studentAnswer: answer,
      });
      const result = await res.json();

      setResults((prev) => ({ ...prev, [currentQuestion.id]: result }));

      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        await finalizeSubmission("manual");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("evaluate_failed"),
      });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const calculateStats = () => {
    const total = Object.keys(results).length;
    const correct = Object.values(results).filter((r: any) => r.isCorrect).length;
    const totalScore = Object.values(results).reduce((sum: number, r: any) => sum + (r.score || 0), 0);
    const maxScore = totalQuestions * 10;
    return { correct, total, totalScore, maxScore };
  };

  const getPerformanceKey = (percentage: number) => {
    if (percentage >= 85) return "performance_excellent";
    if (percentage >= 60) return "performance_good";
    if (percentage >= 40) return "performance_average";
    return "performance_needs_improvement";
  };

  const getPerformanceClasses = (percentage: number) => {
    if (percentage >= 85) {
      return {
        badge: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
        bar: "bg-green-500",
      };
    }
    if (percentage >= 60) {
      return {
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
        bar: "bg-yellow-500",
      };
    }
    return {
      badge: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      bar: "bg-red-500",
    };
  };

  const downloadQuestionPaper = () => {
    const classLabel = testData?.test?.classLevel
      ?? testData?.test?.class
      ?? (testData?.test as any)?.class_number
      ?? (testData?.test as any)?.class_level
      ?? "—";

    generateQuizPdf({
      title: testData?.test?.title || t("question_paper_title"),
      subject: getSubjectLabel(testData?.test?.subject, t),
      classLevel: classLabel,
      difficulty: String(t(`difficulty.${testData?.test?.difficulty}`, testData?.test?.difficulty)),
      language: i18n.language || "en",
      shareCode,
      fileName: `${(testData?.test?.title || t("question_paper_title")).replace(/[\\/:*?"<>|]+/g, "-")}.pdf`,
      labels: {
        appName: "MCQGyaan AI",
        questionPaper: t("question_paper_title"),
        answerSheet: t("download_answer_sheet"),
        subject: t("result_subject"),
        class: t("class"),
        difficulty: t("difficulty_label"),
        totalQuestions: t("total_questions"),
        shareCode: t("share_code"),
        questions: t("questions"),
        question: t("question"),
        options: t("teacherDashboard.options"),
        correctAnswer: t("correct_answer"),
        explanation: t("explanation"),
        yourAnswer: t("your_answer"),
        notAnswered: t("not_answered"),
        page: t("page"),
        of: t("of"),
        generatedBy: t("generated_by"),
        company: "Max Brain Technologies",
        website: getClientAppUrl(),
        correct: t("correct"),
        incorrect: t("incorrect"),
        score: t("score"),
        percentage: t("percentage"),
      },
      questions: (testData?.questions || []).map((q: any) => ({
        question: q.question,
        options: Array.isArray(q.options) ? q.options.map((opt: string) => cleanOption(getLocalizedText(opt, i18n.language))) : [],
        correctAnswer: q.correctAnswer || q.correctOption,
        explanation: q.explanation,
      })),
    }).then(() => {
      toast({
        title: t("download_questions"),
        description: t("pdf_download_ready"),
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("pdf_generation_failed"),
      });
    });
  };

  const handleExitTest = async () => {
    if (!confirm(t("confirm_exit_test"))) {
      return;
    }

    if (!scoreHistorySavedRef.current) {
      await saveCurrentAttemptToHistory().catch((error) => {
        console.warn("Failed to save custom test history on exit", error);
      });
    }

    localStorage.removeItem(storageKey);
    setTestStarted(false);
    setTestData(null);
    setShareCode("");
    setStudentName("");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults({});
    setTestCompleted(false);
    setFinalResult(null);
    scoreHistorySavedRef.current = false;
    navigate("/");
  };

  const downloadAnswerSheet = () => {
    const stats = finalResult
      ? {
          totalScore: finalResult.totalScore || 0,
          correct: finalResult.correctAnswers || 0,
          total: finalResult.totalQuestions || totalQuestions,
          maxScore: (finalResult.totalQuestions || totalQuestions) * 10,
        }
      : calculateStats();

    const percentage = Math.round((stats.totalScore / (stats.maxScore || 1)) * 100);
    const classLabel = testData?.test?.classLevel
      ?? testData?.test?.class
      ?? (testData?.test as any)?.class_number
      ?? (testData?.test as any)?.class_level
      ?? "—";

    generateQuizPdf({
      title: testData?.test?.title || t("download_answer_sheet"),
      subject: getSubjectLabel(testData?.test?.subject, t),
      classLevel: classLabel,
      difficulty: String(t(`difficulty.${testData?.test?.difficulty}`, testData?.test?.difficulty)),
      language: i18n.language || "en",
      shareCode,
      mode: "answers",
      fileName: `${(testData?.test?.title || t("download_answer_sheet")).replace(/[\\/:*?"<>|]+/g, "-")}-answers.pdf`,
      labels: {
        appName: "MCQGyaan AI",
        questionPaper: t("question_paper_title"),
        answerSheet: t("download_answer_sheet"),
        subject: t("result_subject"),
        class: t("class"),
        difficulty: t("difficulty_label"),
        totalQuestions: t("total_questions"),
        shareCode: t("share_code"),
        questions: t("questions"),
        question: t("question"),
        options: t("teacherDashboard.options"),
        correctAnswer: t("correct_answer"),
        explanation: t("explanation"),
        yourAnswer: t("your_answer"),
        notAnswered: t("not_answered"),
        page: t("page"),
        of: t("of"),
        generatedBy: t("generated_by"),
        company: "Max Brain Technologies",
        website: getClientAppUrl(),
        correct: t("correct"),
        incorrect: t("incorrect"),
        score: t("score"),
        percentage: t("percentage"),
      },
      scoreSummary: {
        score: stats.totalScore,
        maxScore: stats.maxScore,
        percentage,
        correctAnswers: stats.correct,
      },
      questions: (testData?.questions || []).map((q: any) => {
        const result = results[q.id];
        return {
          question: q.question,
          options: Array.isArray(q.options) ? q.options.map((opt: string) => cleanOption(getLocalizedText(opt, i18n.language))) : [],
          correctAnswer: result?.correctAnswer || q.correctAnswer || q.correctOption,
          explanation: result?.explanation || q.explanation,
          userAnswer: answers[q.id],
          isCorrect: result?.isCorrect,
        };
      }),
    }).then(() => {
      toast({
        title: t("download_answer_sheet"),
        description: t("pdf_download_ready"),
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("pdf_generation_failed"),
      });
    });
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("take_custom_test")}</CardTitle>
            <CardDescription>{t("enter_share_code_teacher")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">{t("student_name")}</Label>
              <Input
                id="studentName"
                placeholder={t("enter_student_name")}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                data-testid="input-student-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shareCode">{t("share_code")}</Label>
              <Input
                id="shareCode"
                placeholder={t("enter_code_placeholder")}
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                maxLength={6}
                data-testid="input-share-code"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleStartTest}
                disabled={isLoadingTest}
                className="rounded-xl px-4"
                data-testid="button-start-test"
              >
                {isLoadingTest ? t("loading") : t("start_test")}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl px-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted) {
    const stats = finalResult
      ? {
          totalScore: finalResult.totalScore || 0,
          correct: finalResult.correctAnswers || 0,
          total: finalResult.totalQuestions || totalQuestions,
          maxScore: (finalResult.totalQuestions || totalQuestions) * 10,
          timeTakenSeconds: finalResult.timeTakenSeconds || 0,
        }
      : calculateStats();
    const percentage = Math.round((stats.totalScore / (stats.maxScore || 1)) * 100);
    const performanceClasses = getPerformanceClasses(percentage);
    const formattedDate = new Date().toLocaleString(
      i18n.language?.startsWith("hi") ? "hi-IN" : "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-4xl">
          <Card className="overflow-hidden border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-br from-primary/15 via-background to-accent/10 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-9 w-9 text-primary" />
              </div>
              <CardTitle className="text-3xl">{t("test_completed")}</CardTitle>
              <CardDescription className="text-base">
                {getSubjectTestTitle(testData?.test?.subject || testData?.test?.title, t)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-8">
              <div className="space-y-6">
                <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("result_subject")}</p>
                    <p className="text-lg font-bold">{getSubjectLabel(testData?.test?.subject || testData?.test?.title, t)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("result_date_time")}</p>
                    <p className="font-semibold">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("result_language")}</p>
                    <p className="font-semibold">{i18n.language?.startsWith("hi") ? t("language_hindi") : t("language_english")}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="rounded-2xl bg-primary/5 p-4 text-center shadow-sm">
                    <Target className="mx-auto mb-2 h-7 w-7 text-primary" />
                    <p className="text-sm text-muted-foreground">{t("total_score")}</p>
                    <p className="text-2xl font-black text-primary">{stats.totalScore}/{stats.maxScore}</p>
                  </Card>
                  <Card className="rounded-2xl bg-green-50 p-4 text-center shadow-sm dark:bg-green-950/20">
                    <CheckCircle className="mx-auto mb-2 h-7 w-7 text-green-600" />
                    <p className="text-sm text-muted-foreground">{t("correct_answers")}</p>
                    <p className="text-2xl font-black text-green-600">{stats.correct}/{stats.total}</p>
                  </Card>
                  <Card className="rounded-2xl bg-accent/5 p-4 text-center shadow-sm">
                    <CalendarClock className="mx-auto mb-2 h-7 w-7 text-accent" />
                    <p className="text-sm text-muted-foreground">{t("percentage")}</p>
                    <p className="text-2xl font-black text-accent">{percentage}%</p>
                  </Card>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">{t("total_questions")}</p>
                    <p className="text-2xl font-black">{stats.total}</p>
                  </Card>
                  <Card className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">{t("performance")}</p>
                    <p className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${performanceClasses.badge}`}>
                      {t(getPerformanceKey(percentage))}
                    </p>
                  </Card>
                </div>

                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-lg font-bold">{t("performance")}</p>
                    <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${performanceClasses.badge}`}>
                      {t(getPerformanceKey(percentage))}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${performanceClasses.bar}`}
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {testData?.questions.map((question: any, index: number) => {
                    const result = results[question.id] || finalResult?.results?.find?.((r: any) => r.questionId === question.id);
                    const explanation = getLocalizedText(result?.explanation);
                    return (
                      <Card key={question.id} className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className="text-sm">
                              {t("question")} {index + 1}
                            </CardTitle>
                            {result?.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                          <p className="font-medium">{getLocalizedText(question.question, i18n.language)}</p>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            <p>
                              <span className="font-semibold">{t("your_answer")}</span>{" "}
                              <span className="text-blue-600">{answers[question.id] || t("not_answered")}</span>
                            </p>
                          </div>
                          {result?.correctAnswer && (
                            <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                              <p>
                                <span className="font-semibold">{t("correct_answer")}</span>{" "}
                                <span className="text-green-600">{getLocalizedText(result.correctAnswer, i18n.language)}</span>
                              </p>
                            </div>
                          )}
                          {explanation && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/25">
                              <p className="mb-1 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                                <Lightbulb className="h-4 w-4" />
                                {result?.isCorrect ? t("why_correct") : t("why_wrong")}
                              </p>
                              <p className="text-amber-950 dark:text-amber-50">{explanation}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={downloadAnswerSheet}
                    variant="outline"
                    className="flex-1 rounded-xl px-4 py-6"
                    data-testid="button-download-answer-sheet"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("download_answer_sheet")}
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem(storageKey);
                      window.location.reload();
                    }}
                    className="flex-1 rounded-xl px-4 py-6"
                  >
                    {t("take_another_test")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("take_custom_test")}</CardTitle>
            <CardDescription>{t("enter_share_code_teacher")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <TestTimerBar
        endTime={endTime}
        shareCode={shareCode}
        studentName={studentName}
        classLabel={headerClassLabel}
        durationMinutes={activeDurationMinutes}
        onTick={(remainingSeconds) => setTimeRemaining(remainingSeconds)}
        onExpire={() => {
          if (!testCompleted) {
            void finalizeSubmission("auto");
          }
        }}
      />

      <div className="container mx-auto max-w-3xl px-4 py-4 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void handleExitTest();
              }}
              data-testid="button-exit-test"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("exit_test")}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadQuestionPaper} data-testid="button-download-question-paper">
              <Download className="h-4 w-4 mr-2" />
              {t("download_questions")}
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {t("question")} {currentQuestionIndex + 1} {t("of")} {totalQuestions}
          </span>
        </div>

        <Card className="mt-4 shadow-xl">
          <CardHeader>
            <CardTitle>{getSubjectTestTitle(testData?.test?.subject || testData?.test?.title, t)}</CardTitle>
            <CardDescription>
              {getSubjectLabel(testData?.test?.subject, t)} • {t("class")} {headerClassLabel} • {activeDurationMinutes} mins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-lg leading-relaxed">
                {getLocalizedText(currentQuestion?.question, i18n.language)}
              </p>
            </div>

            {isMCQ && currentQuestion?.options ? (
              <RadioGroup
                value={currentAnswer}
                onValueChange={(value) =>
                  {
                    if (timeRemaining <= 0 || isFinalizing) return;
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: value,
                    }));
                  }
                }
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 rounded-xl border p-3 transition-colors hover:bg-muted/60">
                      <RadioGroupItem value={String.fromCharCode(65 + idx)} id={`option-${idx}`} disabled={timeRemaining <= 0 || isFinalizing} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base">
                        {getLocalizedText(option, i18n.language)}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <Textarea
                placeholder={t("type_answer_here")}
                value={currentAnswer}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion?.id]: e.target.value,
                  }))
                }
                rows={5}
                data-testid="textarea-answer"
                disabled={timeRemaining <= 0 || isFinalizing}
              />
            )}

            <Button
              onClick={handleSubmitAnswer}
              disabled={isSubmittingAnswer || isFinalizing || timeRemaining <= 0}
              className="w-full rounded-xl py-6"
              data-testid="button-submit-answer"
            >
              {isSubmittingAnswer || isFinalizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("evaluating")}
                </>
              ) : currentQuestionIndex < totalQuestions - 1 ? (
                t("next_question")
              ) : (
                t("finish_test")
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
