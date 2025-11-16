import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomTestPageProps {
  onBack: () => void;
}

export default function CustomTestPage({ onBack }: CustomTestPageProps) {
  const [shareCode, setShareCode] = useState("");
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const { toast } = useToast();

  const { data: testData, isLoading, refetch } = useQuery<any>({
    queryKey: [`/api/custom-test/${shareCode}`],
    enabled: false,
  });

  const evaluateMutation = useMutation({
    mutationFn: async ({ testId, questionId, studentAnswer }: any) => {
      const res = await apiRequest("POST", "/api/custom-test/evaluate", {
        testId,
        questionId,
        studentAnswer,
      });
      return await res.json();
    },
  });

  async function handleStartTest() {
    if (!shareCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a share code",
      });
      return;
    }

    const result = await refetch();
    if (result.data) {
      setTestStarted(true);
    } else {
      toast({
        variant: "destructive",
        title: "Test not found",
        description: "Invalid share code. Please check and try again.",
      });
    }
  }

  async function handleSubmitAnswer() {
    const question = testData?.questions[currentQuestionIndex];
    const answer = answers[question.id] || "";

    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide an answer",
      });
      return;
    }

    try {
      const result = await evaluateMutation.mutateAsync({
        testId: testData.test.id,
        questionId: question.id,
        studentAnswer: answer,
      });

      setResults(prev => ({ ...prev, [question.id]: result }));

      if (currentQuestionIndex < testData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setTestCompleted(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to evaluate answer",
      });
    }
  }

  function calculateStats() {
    const total = Object.keys(results).length;
    const correct = Object.values(results).filter((r: any) => r.isCorrect).length;
    const totalScore = Object.values(results).reduce((sum: number, r: any) => sum + (r.score || 0), 0);
    const maxScore = total * 10;
    return { correct, total, totalScore, maxScore };
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Take Custom Test</CardTitle>
            <CardDescription>Enter the share code provided by your teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareCode">Share Code</Label>
              <Input
                id="shareCode"
                placeholder="Enter 6-character code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                maxLength={6}
                data-testid="input-share-code"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleStartTest} 
                disabled={isLoading}
                data-testid="button-start-test"
              >
                {isLoading ? "Loading..." : "Start Test"}
              </Button>
              <Button variant="outline" onClick={onBack} data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted) {
    const stats = calculateStats();
    const percentage = Math.round((stats.totalScore / stats.maxScore) * 100);

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Test Completed!</CardTitle>
              <CardDescription>{testData?.test?.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                  <p className="text-4xl font-bold mb-2">{percentage}%</p>
                  <p className="text-lg">
                    {stats.correct} out of {stats.total} correct
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Score: {stats.totalScore}/{stats.maxScore}
                  </p>
                </div>

                <div className="space-y-3">
                  {testData?.questions.map((question: any, index: number) => {
                    const result = results[question.id];
                    return (
                      <Card key={question.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                            {result?.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <p className="font-medium">{question.question}</p>
                          <p>Your answer: <span className="text-blue-600">{answers[question.id]}</span></p>
                          {!result?.isCorrect && (
                            <p>Correct answer: <span className="text-green-600">{result?.correctAnswer}</span></p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Button onClick={() => window.location.reload()} className="w-full">
                  Take Another Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = testData?.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{testData?.test?.title}</CardTitle>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {testData?.questions?.length}
              </span>
            </div>
            <CardDescription>
              {testData?.test?.subject} • Class {testData?.test?.classLevel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg">{currentQuestion?.question}</p>
            </div>

            {currentQuestion?.questionType === "mcq" && currentQuestion?.options ? (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) =>
                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
                }
              >
                {JSON.parse(currentQuestion.options).map((option: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={String.fromCharCode(65 + idx)} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestion?.id] || ""}
                onChange={(e) =>
                  setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))
                }
                rows={4}
                data-testid="textarea-answer"
              />
            )}

            <Button
              onClick={handleSubmitAnswer}
              disabled={evaluateMutation.isPending}
              className="w-full"
              data-testid="button-submit-answer"
            >
              {evaluateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : currentQuestionIndex < testData?.questions?.length - 1 ? (
                "Next Question"
              ) : (
                "Finish Test"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
