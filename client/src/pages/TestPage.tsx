

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import QuestionCard from "@/components/QuestionCard";
import FeedbackSection from "@/components/FeedbackSection";
import ProgressBar from "@/components/ProgressBar";
import TestSummary from "@/components/TestSummary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { getLocalizedText, getSubjectTestTitle } from "@/lib/quizText";
import { saveScoreHistoryAttempt, extractClassLevel } from "@/lib/scoreHistory";

const normalizeAnswer = (text?: string) =>
  text
    ?.normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export default function TestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const config = location.state?.config;

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Immediate guard: redirect if no config
  useEffect(() => {
    if (!config) {
      navigate('/');
    }
  }, [config, navigate]);

  // Return loading state while redirecting if no config
  if (!config) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-background flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-base sm:text-lg font-semibold text-primary">{t("redirecting")}</p>
        </div>
      </div>
    );
  }

  const isCustomStudentTest = config.mode === "custom-student";
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<any[]>(config.customQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionReview, setQuestionReview] = useState<any[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(isCustomStudentTest ? customQuestions.length : 10);
  const { toast } = useToast();

  const normalizeQuestionType = (type?: string, options?: string[]) => {
    const normalized = (type || "").toString().trim().toLowerCase();
    if (normalized === "mcq" || normalized === "multiple_choice" || normalized === "multiple-choice") {
      return "mcq";
    }
    if ((!normalized || normalized.length === 0) && options && options.length > 0) {
      return "mcq";
    }
    return normalized || "open-ended";
  };

  // Start test session (skip for custom student tests)
  useEffect(() => {
    if (isCustomStudentTest) {
      // For custom student tests, load first question from pre-generated questions
      if (customQuestions.length > 0) {
        const firstQuestion = customQuestions[0];
        setCurrentQuestion(firstQuestion.question);
        setQuestionType(normalizeQuestionType(firstQuestion.questionType, firstQuestion.options));
        setQuestionOptions(firstQuestion.options || []);
        setQuestionNumber(1);
        setTotalQuestions(customQuestions.length);
      }
      return;
    }

    // const startSession = async () => {
    //   try {
    //     const response = await apiRequest("POST", "/api/test/start", config);
    //     const data = await response.json();
    //     setSessionId(data.id);
    //   } catch (error) {
    //     toast({
    //       title: "Error",
    //       description: "Failed to start test. Please try again.",
    //       variant: "destructive",
    //     });
    //   }
    // };

    const startSession = async () => {
      try {
        const testLanguageSource = (
          (config.testLanguage as string) ||
          (config.medium as string) ||
          (config.selectedMedium as string) ||
          (config.language as string) ||
          ""
        )
          .toString()
          .toLowerCase();

        const normalizedTestLanguage = testLanguageSource.startsWith("hi")
          ? "hindi"
          : "english";

        const subjectLanguageSource = (
          (config.subjectLanguage as string) ||
          (config.subject as string) ||
          (config.language as string) ||
          ""
        )
          .toString()
          .toLowerCase();

        const normalizedSubjectLanguage =
          config.mode === "science" ? undefined : (subjectLanguageSource || undefined);

        const payload = {
          mode: config.mode,

          // ✅ selected test language
          language: normalizedTestLanguage,
          testLanguage: normalizedTestLanguage,
          subjectLanguage: normalizedSubjectLanguage,

          // ✅ subject fix
          scienceCategory:
            config.mode === "science"
              ? (config.scienceCategory ?? "physics")
              : undefined,

          // 🔥 MAIN FIX
          classLevel: config.class ?? config.classLevel,

          difficulty: config.difficulty ?? "easy",
          chapter: config.chapter,
          testType: config.testType ?? "mcq-only",
          testLength: config.testLength ?? 10,
        };

        console.log("FINAL PAYLOAD:", payload); // 🔥 debug

        const response = await apiRequest("POST", "/api/test/start", payload);
        const data = await response.json();

        setSessionId(data.id);
      } catch (error) {
        console.error("START TEST ERROR:", error);

        toast({
          title: t("error"),
          description: t("failed_start_test"),
          variant: "destructive",
        });
      }
    };
    startSession();
  }, [config, toast, isCustomStudentTest]);

  // Generate question mutation
  const generateQuestionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/test/${sessionId}/question`);
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentQuestion(data.question);
      setQuestionType(normalizeQuestionType(data.questionType, data.options));
      setQuestionOptions(data.options || []);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failed_generate_question"),
        variant: "destructive",
      });
    },
  });

  // Load first question when session is ready
  useEffect(() => {
    if (sessionId && !currentQuestion && !showSummary) {
      generateQuestionMutation.mutate();
    }
  }, [sessionId]);

  // Evaluate answer mutation
  const evaluateAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const response = await apiRequest("POST", `/api/test/${sessionId}/evaluate`, {
        answer,
      });
      return await response.json();
    },
    onSuccess: (data, answer) => {
      let submittedAnswer = answer;
      if (
        (questionType === "mcq" || questionOptions.length > 0) &&
        typeof answer === "string" &&
        answer.length === 1
      ) {
        const optionIndex = answer.toUpperCase().charCodeAt(0) - 65;
        submittedAnswer = questionOptions[optionIndex] || answer;
      }

      const questionSnapshot = {
        questionNumber,
        question: currentQuestion,
        options: [...questionOptions],
        userAnswer: submittedAnswer,
        correctAnswer: data.correctAnswer || data.correctOption || "",
        isCorrect: Boolean(data.isCorrect),
        explanation:
          data.explanation || data.feedback || (data.isCorrect ? t("answer_correct_explanation_fallback") : t("answer_wrong_explanation_fallback")),
        questionType,
      };
      setQuestionReview((prev) => [...prev, questionSnapshot]);
      setFeedbackData(data);
      setTotalScore(data.totalScore);
      setCorrectAnswers(data.correctAnswers);
      setShowFeedback(true);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failed_evaluate_answer"),
        variant: "destructive",
      });
    },
  });

  const handleSubmitAnswer = (answer: string) => {
    if (isCustomStudentTest) {
      // Prevent duplicate submissions
      if (showFeedback) {
        return;
      }

      // Local evaluation for custom tests
      const currentQ = customQuestions[currentQuestionIndex];
      // const isCorrect = currentQ.questionType === "mcq"
      //   ? answer === currentQ.correctOption
      //   // : answer.trim().toLowerCase() === (currentQ.correctAnswer || "").trim().toLowerCase();
      //   : normalizeAnswer(answer) === normalizeAnswer(currentQ.correctAnswer);
      //   currentQ.correctAnswer || currentQ.correctOption

      const correctAnswer =
        currentQ.correctAnswer || currentQ.correctOption;

      let submittedAnswer = answer;

      // If MCQ options exist, map letter (A/B/...) to option text for fair comparison
      if (
        (questionType === "mcq" || questionOptions.length > 0) &&
        typeof answer === "string" &&
        answer.length === 1
      ) {
        const optionIndex = answer.toUpperCase().charCodeAt(0) - 65;
        submittedAnswer = questionOptions[optionIndex] || answer;
      }

      const isCorrect = normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer);

      const pointsEarned = isCorrect ? 10 : 0;
      const newScore = totalScore + pointsEarned;
      const newCorrect = correctAnswers + (isCorrect ? 1 : 0);

      setTotalScore(newScore);
      setCorrectAnswers(newCorrect);
      setQuestionReview((prev) => [
        ...prev,
        {
          questionNumber: currentQuestionIndex + 1,
          question: currentQ.question,
          options: [...(currentQ.options || [])],
          userAnswer: submittedAnswer,
          correctAnswer,
          isCorrect,
          explanation:
            getLocalizedText(currentQ.explanation, i18n.language) ||
            (isCorrect ? t("answer_correct_explanation_fallback") : t("answer_wrong_explanation_fallback")),
          questionType: currentQ.questionType || questionType,
        },
      ]);

      // Build feedback data matching the API response shape
      setFeedbackData({
        isCorrect,
        feedback: getLocalizedText(currentQ.explanation, i18n.language) || (isCorrect ? t("answer_correct_explanation_fallback") : t("answer_wrong_explanation_fallback")),
        correctAnswer: currentQ.correctAnswer || currentQ.correctOption,
        score: pointsEarned,
        totalScore: newScore,
        correctAnswers: newCorrect,
        encouragement: isCorrect 
          ? t("excellent_work")
          : t("keep_learning"),
      });
      setShowFeedback(true);
    } else {
      evaluateAnswerMutation.mutate(answer);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (questionNumber < totalQuestions) {
      if (isCustomStudentTest) {
        // Load next pre-generated question
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < customQuestions.length) {
          const nextQuestion = customQuestions[nextIndex];
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(nextQuestion.question);
          setQuestionType(normalizeQuestionType(nextQuestion.questionType, nextQuestion.options));
          setQuestionOptions(nextQuestion.options || []);
          setQuestionNumber(nextIndex + 1);
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        generateQuestionMutation.mutate();
      }
    } else {
      setShowSummary(true);
    }
  };

  const handleEndTest = () => {
    setShowSummary(true);
  };

  const handleExitTest = async () => {
    if (!confirm(t("confirm_exit_test"))) {
      return;
    }

    const subject =
      config.mode === "science"
        ? config.scienceCategory
        : (config.subjectLanguage ?? config.language);

    const resolvedClassLevel = extractClassLevel(config) ?? (Number(config?.class ?? config?.classLevel ?? 0) || null);

    await saveScoreHistoryAttempt({
      subject: subject || "quiz",
      totalScore,
      totalQuestions,
      correctAnswers,
      language: i18n.language || "en",
      classLevel: resolvedClassLevel,
      difficulty: config.difficulty,
      mode: config.mode,
      questionPaperTitle: getSubjectTestTitle(subject || "quiz", t),
      questionReview,
    }).catch((error) => {
      console.warn("Failed to save score history on exit", error);
    });

    navigate("/");
  };

  const handleNewTest = () => {
    navigate('/');
  };

  if (showSummary) {
    const subject =
      config.mode === "science"
        ? config.scienceCategory
        : (config.subjectLanguage ?? config.language);
    const resolvedClassLevel = extractClassLevel(config) ?? (Number(config?.class ?? config?.classLevel ?? 0) || null);
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <TestSummary
            totalScore={totalScore}
            totalQuestions={totalQuestions}
            correctAnswers={correctAnswers}
            subject={subject || "quiz"}
            classLevel={resolvedClassLevel}
            language={i18n.language || "en"}
            questionReview={questionReview}
            difficulty={config.difficulty}
            mode={config.mode}
            onNewTest={handleNewTest}
            onHome={() => navigate('/')}
          />
        </div>
      </div>
    );
  }

  // Skip session check for custom student tests
  if (!isCustomStudentTest && (!sessionId || generateQuestionMutation.isPending)) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border bg-card/95 p-8 text-center shadow-2xl">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
          <p className="text-base sm:text-lg font-semibold text-primary">
            {!sessionId ? t("preparing_test") : t("ai_generating_question")}
          </p>
          <p className="mt-2 text-base text-muted-foreground">{t("loading_time_hint")}</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border bg-card/95 p-8 text-center shadow-2xl">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
          <p className="text-base sm:text-lg font-semibold text-primary">{t("ai_generating_question")}</p>
          <p className="mt-2 text-base text-muted-foreground">{t("loading_time_hint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold capitalize">
                {getSubjectTestTitle(
                  config.mode === "science"
                    ? config.scienceCategory
                    : (config.subjectLanguage ?? config.language),
                  t,
                )}
              </h1>
              <p className="text-base text-muted-foreground">
                {t("class")} {config.class} • {t(config.difficulty)}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void handleExitTest();
              }}
              data-testid="button-exit"
              className="h-11 rounded-xl px-4 text-base"
            >
              {t("exit_test")}
            </Button>
          </div>

          <ProgressBar
            current={questionNumber}
            total={totalQuestions}
            score={totalScore}
          />

          {!showFeedback ? (
            <QuestionCard
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              question={currentQuestion}
              questionType={questionType}
              options={questionOptions}
              language={config.language || ""}
              onSubmit={handleSubmitAnswer}
              isSubmitting={isCustomStudentTest ? false : evaluateAnswerMutation.isPending}
            />
          ) : (
            feedbackData && (
              <FeedbackSection
                score={feedbackData.score}
                maxScore={10}
                feedback={feedbackData.feedback}
                correctAnswer={feedbackData.correctAnswer}
                isCorrect={feedbackData.isCorrect}
                encouragement={feedbackData.encouragement}
                language={config.language || ""}
                onNext={handleNext}
                onEndTest={handleEndTest}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
