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

import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CustomTestPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [shareCode, setShareCode] = useState("");
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const { toast } = useToast();

  const normalizeQuestionType = (type?: string, options?: any[]) => {
    const normalized = (type || "").toString().trim().toLowerCase();
    if (normalized === "mcq" || normalized === "multiple_choice" || normalized === "multiple-choice") return "mcq";
    if ((!normalized || normalized.length === 0) && Array.isArray(options) && options.length > 0) return "mcq";
    return normalized || "open-ended";
  };

  const cleanOption = (opt: string) =>
    (opt ?? "")
      .replace(/^[A-D][.)]?\s*/i, "") // strip leading letter/marker
      .trim();

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
        title: t("error"),
        description: t("enter_share_code"),
      });
      return;
    }

    const result = await refetch();
    if (result.data) {
      setTestStarted(true);
    } else {
      toast({
        variant: "destructive",
        title: t("test_not_found"),
        description: t("invalid_share_code"),
      });
    }
  }

  async function handleSubmitAnswer() {
    const question = testData?.questions[currentQuestionIndex];
    const answer = answers[question.id] || "";

    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("provide_answer"),
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
        title: t("error"),
        description: t("evaluate_failed"),
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
        title: t("error"),
        description: t("allow_popup_pdf"),
      });
      return;
    }

    const classLabel = testData?.test?.classLevel
      ?? testData?.test?.class
      ?? (testData?.test as any)?.class_number
      ?? (testData?.test as any)?.class_level
      ?? "—";

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
              <div><strong>Class:</strong> ${classLabel}</div>
              <div><strong>Difficulty:</strong> ${testData?.test?.difficulty}</div>
              <div><strong>Total Questions:</strong> ${testData?.questions?.length}</div>
              <div><strong>Share Code:</strong> ${shareCode}</div>
            </div>
        </div>

        ${testData?.questions.map((q: any, idx: number) => `
          <div class="question">
            <div class="question-number">Question ${idx + 1}:</div>
            <div class="question-text">${q.question}</div>
            ${normalizeQuestionType(q.questionType, q.options) === 'mcq' && q.options ? `
              <div class="options">
                ${q.options.map((opt: string, optIdx: number) => `
                  <div class="option">
                    <strong>${String.fromCharCode(65 + optIdx)}.</strong> ${cleanOption(opt)}
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
      title: t("print_dialog_opened"),
      description: t("choose_save_pdf"),
    });
  }

  function downloadAnswerSheet() {
    const stats = calculateStats();
    const percentage = Math.round((stats.totalScore / stats.maxScore) * 100);
    const classLabel = testData?.test?.classLevel
      ?? testData?.test?.class
      ?? (testData?.test as any)?.class_number
      ?? (testData?.test as any)?.class_level
      ?? "—";

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
            <div><strong>Subject:</strong> ${testData?.test?.subject} | <strong>Class:</strong> ${classLabel}</div>
          </div>
        </div>

        <div class="score-summary">
          <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">Score: ${stats.totalScore}/${stats.maxScore} (${percentage}%)</div>
          <div>Correct Answers: ${stats.correct} out of ${stats.total}</div>
        </div>

        ${testData?.questions.map((q: any, idx: number) => {
          const result = results[q.id];
          const isCorrect = result?.isCorrect;
          const qType = normalizeQuestionType(q.questionType, q.options);
          return `
            <div class="question-block">
              <div class="question-header">Question ${idx + 1}:</div>
              <div class="question-text">${q.question}</div>

              ${qType === 'mcq' && Array.isArray(q.options) ? `
                <div class="options" style="margin: 10px 0 6px 0; padding: 8px; background: #f8fafc; border-radius: 6px;">
                  ${q.options.map((opt: string, optIdx: number) => `
                    <div style="margin: 4px 0;">
                      <strong>${String.fromCharCode(65 + optIdx)}.</strong> ${cleanOption(opt)}
                    </div>
                  `).join('')}
                </div>
              ` : ''}

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
            <CardTitle>{t("take_custom_test")}</CardTitle>
            <CardDescription>{t("enter_share_code_teacher")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                disabled={isLoading}
                data-testid="button-start-test"
              >
                {isLoading ? t("loading") : t("start_test")}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} data-testid="button-back">
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
    const stats = calculateStats();
    const percentage = Math.round((stats.totalScore / stats.maxScore) * 100);

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>{t("test_completed")}</CardTitle>
              <CardDescription>{testData?.test?.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                  <p className="text-4xl font-bold mb-2">{percentage}%</p>
                  {stats.correct} {t("out_of")} {stats.total} {t("correct")}
                  <p className="text-sm text-muted-foreground">
                    {t("total_score")} {stats.totalScore}/{stats.maxScore}
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
                            <p><span className="font-semibold">{t("your_answer")}</span> <span className="text-blue-600">{answers[question.id]}</span></p>
                          </div>
                          {!result?.isCorrect && (
                            <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                              <p><span className="font-semibold">{t("correct_answer")}</span> <span className="text-green-600">{result?.correctAnswer}</span></p>
                            </div>
                          )}
                          {result?.explanation && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded">
                              <p className="font-semibold mb-1">{t("explanation")}</p>
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
                    {t("download_answer_sheet")}
                  </Button>
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    {t("download_answer_sheet")}
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
  const currentQuestionType = normalizeQuestionType(
    currentQuestion?.questionType,
    currentQuestion?.options
  );
  const headerClassLabel = testData?.test?.classLevel
    ?? testData?.test?.class
    ?? (testData?.test as any)?.class_number
    ?? (testData?.test as any)?.class_level
    ?? "—";

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
                  {t("exit_test")}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadQuestionPaper}
                  data-testid="button-download-question-paper"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("download_questions")}
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {t("question")} {currentQuestionIndex + 1} {t("of")} {testData?.questions?.length}
              </span>
            </div>
            <CardTitle>{testData?.test?.title}</CardTitle>
            <CardDescription>
              {testData?.test?.subject} • {t("class")} {headerClassLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg">{currentQuestion?.question}</p>
            </div>

            {currentQuestionType === "mcq" && currentQuestion?.options ? (
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
                placeholder={t("type_answer_here")}
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
                  {t("evaluating")}
                </>
              ) : currentQuestionIndex < testData?.questions?.length - 1 ? (
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
