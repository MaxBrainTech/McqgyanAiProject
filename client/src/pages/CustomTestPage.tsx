import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Download } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CustomTestPage() {
  const navigate = useNavigate();
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

  function downloadQuestionPaper() {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please allow popups to download PDF",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${testData?.test?.title || "Question Paper"}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 1.5cm; size: A4; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans', 'Noto Sans Devanagari', Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            padding: 20px;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .test-info {
            font-size: 11pt;
            line-height: 1.8;
          }
          .question {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .question-number {
            font-weight: bold;
            font-size: 13pt;
            margin-bottom: 8px;
          }
          .question-text {
            margin-bottom: 12px;
            font-size: 12pt;
            line-height: 1.8;
          }
          .options {
            margin-left: 20px;
          }
          .option {
            margin: 8px 0;
            line-height: 1.8;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${testData?.test?.title || "Question Paper"}</h1>
          <div class="test-info">
            <div><strong>Subject:</strong> ${testData?.test?.subject}</div>
            <div><strong>Class:</strong> ${testData?.test?.classLevel}</div>
            <div><strong>Difficulty:</strong> ${testData?.test?.difficulty}</div>
            <div><strong>Total Questions:</strong> ${testData?.questions?.length}</div>
            <div><strong>Share Code:</strong> ${shareCode}</div>
          </div>
        </div>

        ${testData?.questions.map((q: any, idx: number) => `
          <div class="question">
            <div class="question-number">Question ${idx + 1}:</div>
            <div class="question-text">${q.question}</div>
            ${q.questionType === 'mcq' && q.options ? `
              <div class="options">
                ${q.options.map((opt: string, optIdx: number) => `
                  <div class="option">
                    <strong>${String.fromCharCode(65 + optIdx)}.</strong> ${opt}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();

    toast({
      title: "Print Dialog Opened",
      description: "Choose 'Save as PDF' to download",
    });
  }

  function downloadAnswerSheet() {
    const stats = calculateStats();
    const percentage = Math.round((stats.totalScore / stats.maxScore) * 100);

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please allow popups to download PDF",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Answer Sheet - ${testData?.test?.title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 1.5cm; size: A4; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans', 'Noto Sans Devanagari', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
            padding: 20px;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .test-info {
            font-size: 11pt;
            line-height: 1.8;
          }
          .score-summary {
            background: #f0f9ff;
            padding: 15px;
            border-left: 4px solid #3b82f6;
            margin: 15px 0;
            page-break-inside: avoid;
          }
          .question-block {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .question-header {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 10px;
          }
          .question-text {
            margin-bottom: 12px;
            line-height: 1.7;
          }
          .answer-section {
            margin: 10px 0;
            padding: 8px;
            background: #f9fafb;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            min-width: 130px;
          }
          .your-answer { color: #2563eb; }
          .correct-answer { color: #16a34a; }
          .explanation { 
            margin-top: 10px;
            padding: 10px;
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            font-size: 10pt;
            line-height: 1.6;
          }
          .result-correct {
            color: #16a34a;
            font-weight: bold;
            margin-top: 8px;
          }
          .result-incorrect {
            color: #dc2626;
            font-weight: bold;
            margin-top: 8px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Answer Sheet</h1>
          <div class="test-info">
            <div><strong>Test:</strong> ${testData?.test?.title}</div>
            <div><strong>Subject:</strong> ${testData?.test?.subject} | <strong>Class:</strong> ${testData?.test?.classLevel}</div>
          </div>
        </div>

        <div class="score-summary">
          <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">Score: ${stats.totalScore}/${stats.maxScore} (${percentage}%)</div>
          <div>Correct Answers: ${stats.correct} out of ${stats.total}</div>
        </div>

        ${testData?.questions.map((q: any, idx: number) => {
          const result = results[q.id];
          const isCorrect = result?.isCorrect;
          return `
            <div class="question-block">
              <div class="question-header">Question ${idx + 1}:</div>
              <div class="question-text">${q.question}</div>

              <div class="answer-section">
                <div class="your-answer">
                  <span class="label">Your Answer:</span> ${answers[q.id] || "Not answered"}
                </div>
                ${!isCorrect && result?.correctAnswer ? `
                  <div class="correct-answer">
                    <span class="label">Correct Answer:</span> ${result.correctAnswer}
                  </div>
                ` : ''}
              </div>

              ${result?.explanation ? `
                <div class="explanation">
                  <strong>Explanation:</strong><br/>
                  ${result.explanation}
                </div>
              ` : ''}

              <div class="${isCorrect ? 'result-correct' : 'result-incorrect'}">
                ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </div>
            </div>
          `;
        }).join('')}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();

    toast({
      title: "Print Dialog Opened",
      description: "Choose 'Save as PDF' to download answer sheet",
    });
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
              <Button variant="outline" onClick={() => navigate('/')} data-testid="button-back">
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
                        <CardContent className="text-sm space-y-3">
                          <p className="font-medium">{question.question}</p>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            <p><span className="font-semibold">Your answer:</span> <span className="text-blue-600">{answers[question.id]}</span></p>
                          </div>
                          {!result?.isCorrect && (
                            <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                              <p><span className="font-semibold">Correct answer:</span> <span className="text-green-600">{result?.correctAnswer}</span></p>
                            </div>
                          )}
                          {result?.explanation && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                              <p className="font-semibold mb-1">Explanation:</p>
                              <p className="text-muted-foreground">{result.explanation}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={downloadAnswerSheet} 
                    variant="outline" 
                    className="flex-1"
                    data-testid="button-download-answer-sheet"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Answer Sheet
                  </Button>
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    Take Another Test
                  </Button>
                </div>
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
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (confirm("Are you sure you want to exit the test? Your progress will be lost.")) {
                      setTestStarted(false);
                      setShareCode("");
                      setCurrentQuestionIndex(0);
                      setAnswers({});
                      setResults({});
                    }
                  }}
                  data-testid="button-exit-test"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit Test
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadQuestionPaper}
                  data-testid="button-download-question-paper"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Questions
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {testData?.questions?.length}
              </span>
            </div>
            <CardTitle>{testData?.test?.title}</CardTitle>
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
                {currentQuestion.options.map((option: string, idx: number) => (
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
