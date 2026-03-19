import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";



interface AnswerEvaluation {
  questionNumber: number;
  extractedAnswer: string;
  qualityScore: number;
  strengths: string[];
  improvements: string[];
  correctAnswer?: string;
  detailedFeedback: string;
}

interface EvaluationResult {
  totalAnswers: number;
  averageScore: number;
  overallFeedback: string;
  answerEvaluations: AnswerEvaluation[];
}

export default function AnswerSheetEvaluator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState<string>("");
  const [classLevel, setClassLevel] = useState<string>("");
  const [subject, setSubject] = useState<string>("");   
  const [gptModel, setGptModel] = useState<string>("gpt-4o");
  const [images, setImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [questionPreviews, setQuestionPreviews] = useState<string[]>([]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    if (images.length + fileArray.length > 20) {
      toast({
        title: "Too Many Images",
        description: "You can upload maximum 20 images at once",
        variant: "destructive",
      });
      return;
    }

    const newImages: string[] = [];
    const newPreviews: string[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          newImages.push(base64);
          newPreviews.push(base64);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setImages([...images, ...newImages]);
    setImagePreviews([...imagePreviews, ...newPreviews]);

    toast({
      title: "Images Uploaded",
      description: `${newImages.length} image(s) added successfully`,
    });
  };

    const handleQuestionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    const newImages: string[] = [];
    const newPreviews: string[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          newImages.push(base64);
          newPreviews.push(base64);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setQuestionImages([...questionImages, ...newImages]);
    setQuestionPreviews([...questionPreviews, ...newPreviews]);

    toast({
      title: "Question Images Uploaded",
      description: `${newImages.length} image(s) added successfully`,
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleEvaluate = async () => {
    if (images.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one answer sheet image",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
        const res = await apiRequest("POST", "/api/evaluate-answer-sheet", {
          images,
          questionImages: questionImages.length > 0 ? questionImages : undefined,
          studentName: studentName || "Anonymous",
          classLevel: classLevel ? parseInt(classLevel) : undefined,
          subject: subject || undefined,
          gptModel,
        });

      const data = await res.json();
      setEvaluationResult(data);

      toast({
        title: "Evaluation Complete!",
        description: `Evaluated ${data.totalAnswers} answer(s) with average score ${data.averageScore.toFixed(1)}/10`,
      });
    } catch (error: any) {
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to evaluate answer sheets",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("answerEvaluator.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("answerEvaluator.subtitle")}
          </p>
        </div>

        {!evaluationResult ? (
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("answerEvaluator.studentInfo")}</CardTitle>
                <CardDescription>{t("answerEvaluator.studentDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="studentName">{t("answerEvaluator.studentName")}</Label>
                  <Input
                    id="studentName"
                    placeholder={t("answerEvaluator.studentPlaceholder")}
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    data-testid="input-student-name"
                  />
                </div>
                <div>
                  <Label htmlFor="classLevel">{t("answerEvaluator.classLevel")}</Label>
                  <Select value={classLevel} onValueChange={setClassLevel}>
                    <SelectTrigger data-testid="select-class-level">
                      <SelectValue placeholder={t("answerEvaluator.selectClass")} />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8, 9, 10, 11, 12].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {t("answerEvaluator.class")} {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">{t("answerEvaluator.subject")}</Label>
                  <Input
                    id="subject"
                    placeholder={t("answerEvaluator.subjectPlaceholder")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    data-testid="input-subject"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t("answerEvaluator.uploadAnswers")}</CardTitle>
                <CardDescription>{t("answerEvaluator.uploadDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor="image-upload"
                      className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm font-medium mb-1">{t("answerEvaluator.clickUpload")}</p>
                      <p className="text-xs text-muted-foreground">
                      {images.length}/20 {t("answerEvaluator.imagesUploaded")}
                      </p>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        data-testid="input-image-upload"
                      />
                    </Label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Answer sheet ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

             {/* Question Upload (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle>{t("answerEvaluator.uploadQuestions")}</CardTitle>
                <CardDescription>
                  {t("answerEvaluator.questionDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor="question-upload"
                      className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm font-medium mb-1">
                      {t("answerEvaluator.clickUploadQuestions")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                      {questionImages.length} {t("answerEvaluator.questionImagesUploaded")}
                      </p>
                      <Input
                        id="question-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleQuestionUpload}
                      />
                    </Label>
                  </div>

                  {questionPreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {questionPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Question ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* AI Model Selection */}
          { /* <Card>
              <CardHeader>
                <CardTitle>AI Model Quality</CardTitle>
                <CardDescription>Select the AI model for evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={gptModel} onValueChange={setGptModel}>
                  <SelectTrigger data-testid="select-gpt-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Best Quality - Recommended) ⭐</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable) ⚡</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card> */}

            {/* Evaluate Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleEvaluate}
              disabled={isEvaluating || images.length === 0}
              data-testid="button-evaluate"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t("answerEvaluator.evaluating")}
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 mr-2" />
                  {t("answerEvaluator.evaluate")}
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Evaluation Results */
          <div className="space-y-6">
            {/* Overall Summary */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  {t("answerEvaluator.complete")}
                </CardTitle>
                <CardDescription>
                {t("answerEvaluator.analyzed")} {evaluationResult.totalAnswers} {t("answerEvaluator.answers")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{t("answerEvaluator.averageScore")}:</span>
                      <span className={`text-2xl font-bold ${getScoreColor(evaluationResult.averageScore)}`}>
                        {evaluationResult.averageScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${(evaluationResult.averageScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{t("answerEvaluator.overallFeedback")}</h4>
                    <p className="text-sm">{t("answerEvaluator.overallFeedback")}: {evaluationResult.overallFeedback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Answer Evaluations */}
            {evaluationResult.answerEvaluations.map((evaluation, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t("answerEvaluator.answer")} {evaluation.questionNumber}</span>
                    <span className={`text-xl font-bold ${getScoreColor(evaluation.qualityScore)}`}>
                      {evaluation.qualityScore}/10
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t("answerEvaluator.studentAnswer")}:</h4>
                    <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded border italic">
                      {evaluation.extractedAnswer}
                    </p>
                  </div>

                  {evaluation.strengths.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        {t("answerEvaluator.strengths")}:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {evaluation.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.improvements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        {t("answerEvaluator.improvements")}:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {evaluation.improvements.map((improvement, i) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.correctAnswer && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">
                        {t("answerEvaluator.correctAnswer")}:
                      </h4>
                      <p className="text-sm">{t("answerEvaluator.correctAnswer")}: {evaluation.correctAnswer}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{t("answerEvaluator.detailedFeedback")}:</h4>
                  <p className="text-sm">{t("answerEvaluator.detailedFeedback")}: {evaluation.detailedFeedback}</p>                  </div>
                </CardContent>
              </Card>
            ))}

           {/* <Button
            size="lg"
            className="w-full mb-4"
            onClick={async () => {
              const res = await fetch("/api/download-evaluation-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(evaluationResult),
              });

              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "evaluation-report.pdf";
              a.click();
            }}
          >
            Download PDF Report
          </Button> */}

            <Button
              size="lg"
              className="w-full mb-4"
              onClick={async () => {
                try {

                  const res = await fetch("/api/download-evaluation-pdf", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      ...evaluationResult,
                      studentName,
                      classLevel,
                      subject
                    })
                  });

                  if (!res.ok) {
                    throw new Error("PDF generation failed");
                  }

                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);

                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "evaluation-report.pdf";
                  document.body.appendChild(a);
                  a.click();

                  a.remove();
                  window.URL.revokeObjectURL(url);

                } catch (error) {
                  console.error("PDF download error:", error);
                  alert("Failed to download PDF");
                }
              }}
            >
              {t("answerEvaluator.downloadPDF")}
            </Button>
            {/* Reset Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                setEvaluationResult(null);
                setImages([]);
                setImagePreviews([]);
                setQuestionImages([]);
                setQuestionPreviews([]);
                setStudentName("");
                setClassLevel("");
                setSubject("");
              }}
              data-testid="button-evaluate-another"
            >
              {t("answerEvaluator.evaluateAnother")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
