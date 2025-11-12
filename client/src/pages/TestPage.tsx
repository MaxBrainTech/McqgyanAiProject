import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import QuestionCard from "@/components/QuestionCard";
import FeedbackSection from "@/components/FeedbackSection";
import ProgressBar from "@/components/ProgressBar";
import TestSummary from "@/components/TestSummary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TestPageProps {
  config: {
    language: string;
    class: number;
    difficulty: string;
    chapter: number;
  };
  onExit: () => void;
}

export default function TestPage({ config, onExit }: TestPageProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  const totalQuestions = 10;

  // Start test session
  useEffect(() => {
    const startSession = async () => {
      try {
        const response = await apiRequest("POST", "/api/test/start", config);
        const data = await response.json();
        setSessionId(data.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start test. Please try again.",
          variant: "destructive",
        });
      }
    };
    startSession();
  }, [config, toast]);

  // Generate question mutation
  const generateQuestionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/test/${sessionId}/question`);
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate question. Please try again.",
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
        question: currentQuestion,
        answer,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setFeedbackData(data);
      setTotalScore(data.totalScore);
      setCorrectAnswers(data.correctAnswers);
      setShowFeedback(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to evaluate answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAnswer = (answer: string) => {
    evaluateAnswerMutation.mutate(answer);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (questionNumber < totalQuestions) {
      generateQuestionMutation.mutate();
    } else {
      setShowSummary(true);
    }
  };

  const handleEndTest = () => {
    setShowSummary(true);
  };

  const handleNewTest = () => {
    onExit();
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <TestSummary
            totalScore={totalScore}
            totalQuestions={questionNumber}
            correctAnswers={correctAnswers}
            language={config.language}
            onNewTest={handleNewTest}
            onHome={onExit}
          />
        </div>
      </div>
    );
  }

  if (!sessionId || generateQuestionMutation.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-semibold text-primary">
            {!sessionId ? "Preparing your test..." : "AI is generating your question..."}
          </p>
          <p className="text-sm text-muted-foreground">This may take 5-20 seconds</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-semibold text-primary">AI is generating your question...</p>
          <p className="text-sm text-muted-foreground">This may take 5-20 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold capitalize">{config.language} Test</h1>
              <p className="text-muted-foreground">
                Class {config.class} • {config.difficulty}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onExit}
              data-testid="button-exit"
            >
              Exit Test
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
              onSubmit={handleSubmitAnswer}
              isSubmitting={evaluateAnswerMutation.isPending}
            />
          ) : (
            feedbackData && (
              <FeedbackSection
                score={feedbackData.score}
                maxScore={10}
                feedback={feedbackData.feedback}
                correction={feedbackData.correction}
                encouragement={feedbackData.encouragement}
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
