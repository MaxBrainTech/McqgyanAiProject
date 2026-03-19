import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  GraduationCap,
  LogOut,
  Plus,
  Share2,
  Eye,
  Loader2,
  Download,
  Edit,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";

// Hindi font loader (Noto Sans Devanagari) for correct PDF rendering
const HINDI_FONT_URL =
  "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf";
let cachedHindiFont: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunkSize) as any,
    );
  }
  return btoa(binary);
}

async function loadHindiFont(): Promise<string> {
  if (cachedHindiFont) return cachedHindiFont;
  const resp = await fetch(HINDI_FONT_URL);
  const buf = await resp.arrayBuffer();
  cachedHindiFont = arrayBufferToBase64(buf);
  return cachedHindiFont;
}
// import autoTable from "jspdf-autotable";

import { useTranslation } from "react-i18next";

const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subject: z.string().min(1, "Subject is required"),
  language: z.enum(["english", "hindi"]),
  classLevel: z.number().min(6).max(12),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic1: z.string().min(3, "Topic 1 is required (minimum 3 characters)"),
  topic2: z.string().optional(),
  topic3: z.string().optional(),
  topic4: z.string().optional(),
  numQuestions: z.number().min(5).max(50),
  testType: z.enum(["mcq", "open-ended", "mixed"]),
  gptModel: z.enum(["gpt-4o", "gpt-4o-mini"]),
  instructions: z.string().optional(),
});

type TestForm = z.infer<typeof testSchema>;

const SUBJECTS = [
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Marathi", label: "Marathi" },
  { value: "Kannada", label: "Kannada" },
  { value: "Sanskrit", label: "Sanskrit" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Spanish", label: "Spanish" },
  { value: "General", label: "General Science" },
  { value: "Social Studies", label: "Social Studies" },
];

export default function TeacherDashboard() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const teacherData = location.state?.teacherData;
  const preferredLanguage =
    i18n.language && i18n.language.toLowerCase().startsWith("hi")
      ? "hindi"
      : "english";

  // Redirect to teacher auth if no teacher data
  useEffect(() => {
    if (!teacherData) {
      navigate("/teacher-auth");
    }
  }, [teacherData, navigate]);

  // Return loading state while redirecting if no teacher data
  if (!teacherData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-base sm:text-lg font-semibold text-primary">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    navigate("/");
  };

  // Robust clipboard helper with fallback for browsers blocking navigator.clipboard
  const copyToClipboard = async (text: string) => {
    if (!text) throw new Error("No code available to copy");

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (err: any) {
      throw new Error(err?.message || "Clipboard copy failed");
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showManualEditDialog, setShowManualEditDialog] = useState(false);
  const [showAIEditDialog, setShowAIEditDialog] = useState(false);
  const [aiEditFeedback, setAIEditFeedback] = useState("");
  const { toast } = useToast();

  const form = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      subject: "",
      language: preferredLanguage,
      classLevel: 9,
      difficulty: "medium",
      topic1: "",
      topic2: "",
      topic3: "",
      topic4: "",
      numQuestions: 10,
      testType: "mcq",
      gptModel: "gpt-4o-mini",
      instructions: "",
    },
  });

  // Keep form language in sync with UI locale so Hindi UI creates Hindi tests by default
  useEffect(() => {
    const uiLang =
      i18n.language && i18n.language.toLowerCase().startsWith("hi")
        ? "hindi"
        : "english";
    form.setValue("language", uiLang);
  }, [i18n.language, form]);

  // When the create-test form is opened, reset defaults aligned to the current UI language
  useEffect(() => {
    if (showForm) {
      const uiLang =
        i18n.language && i18n.language.toLowerCase().startsWith("hi")
          ? "hindi"
          : "english";
      form.reset({
        title: "",
        subject: "",
        language: uiLang,
        classLevel: 9,
        difficulty: "medium",
        topic1: "",
        topic2: "",
        topic3: "",
        topic4: "",
        numQuestions: 10,
        testType: "mcq",
        gptModel: "gpt-4o-mini",
        instructions: "",
      });
    }
  }, [showForm, i18n.language, form]);

  const { data: tests = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/teacher/${teacherData.id}/tests`],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/${teacherData.id}/tests`);

      if (!res.ok) {
        throw new Error("Failed to fetch tests");
      }

      return res.json();
    },
  });

  const getCreatedTime = (test: any) => {
    const ts = test?.createdAt || test?.created_at;
    const dateVal = ts ? new Date(ts).getTime() : 0;
    if (Number.isFinite(dateVal)) return dateVal;
    // fallback: derive from numeric id chunk if present
    return 0;
  };

  const orderedTests = [...tests].sort(
    (a, b) => getCreatedTime(b) - getCreatedTime(a),
  );

  const { data: testDetails } = useQuery<any>({
    queryKey: [`/api/teacher/${teacherData.id}/tests/${selectedTestId}`],
    enabled: !!selectedTestId,
    queryFn: async () => {
      const res = await fetch(
        `/api/teacher/${teacherData.id}/tests/${selectedTestId}`,
      );
      return res.json();
    },
  });

  const test = testDetails?.test;

  const classNumber =
    test?.class || test?.classLevel || test?.title?.match(/\d+/)?.[0];

  const generateMutation = useMutation({
    mutationFn: async (data: TestForm) => {
      // Combine topics into comma-separated syllabus
      const topics = [data.topic1, data.topic2, data.topic3, data.topic4]
        .filter((topic) => topic && topic.trim().length > 0)
        .join(", ");

      const payload = {
        title: data.title,
        subject: data.subject,
        language: data.language, // ✅ correct
        classLevel: data.classLevel,
        difficulty: data.difficulty,
        syllabus: topics,
        numQuestions: data.numQuestions,
        testType: data.testType,
        gptModel: data.gptModel,
        instructions: data.instructions,
      };

      const res = await apiRequest(
        "POST",
        `/api/teacher/${teacherData.id}/generate-test`,
        payload,
      );
      return await res.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Test Generated!",
        description: `Successfully created ${result.questionsGenerated} questions. Share code: ${result.test.shareCode}`,
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teacher/${teacherData.id}/tests`],
      });
      form.reset();
      setShowForm(false);
      // Show the questions dialog
      setSelectedTestId(result.test.id);
      setTimeout(() => {
        setShowQuestionsDialog(true);
      }, 300);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Could not generate test",
      });
    },
  });

  const manualEditMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "PATCH",
        `/api/teacher/${teacherData.id}/question/${data.questionId}/edit`,
        data,
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Updated!",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teacher/${teacherData.id}/tests/${selectedTestId}`],
      });
      setShowManualEditDialog(false);
      setEditingQuestion(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Could not update question",
      });
    },
  });

  const aiEditMutation = useMutation({
    mutationFn: async (data: { questionId: string; feedback: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/teacher/${teacherData.id}/question/${data.questionId}/ai-edit`,
        { feedback: data.feedback },
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Improved!",
        description:
          "AI has successfully updated the question based on your feedback.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teacher/${teacherData.id}/tests/${selectedTestId}`],
      });
      setShowAIEditDialog(false);
      setEditingQuestion(null);
      setAIEditFeedback("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "AI Edit failed",
        description: error.message || "Could not improve question with AI",
      });
    },
  });

  function handleSubmit(data: TestForm) {
    generateMutation.mutate(data);
  }

  function copyShareCode(shareCode: string) {
    if (!shareCode) {
      toast({
        variant: "destructive",
        title: "No code found",
        description: "Share code is missing for this test",
      });
      return;
    }

    copyToClipboard(shareCode)
      .then(() =>
        toast({
          title: "Copied!",
          description: "Share code copied to clipboard",
        }),
      )
      .catch((error: any) =>
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: error?.message || "Unable to copy code. Please copy manually.",
        }),
      );
  }

  async function downloadQuestionPaper(testId: string) {
    try {
      // Fetch test details if not already loaded
      // const response = await fetch(`/api/teacher/${teacherData.id}/tests/${testId}`);
      // const data = await response.json();

      const response = await fetch(
        `/api/teacher/${teacherData.id}/tests/${testId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch test data");
      }

      const data = await response.json();
      const normalizedTest = {
        ...data.test,
        shareCode:
          data.test.shareCode ||
          data.test.share_code ||
          data.test.sharecode ||
          "NA",
        classLevel:
          data.test.classLevel ||
          data.test.class ||
          data.test.class_number ||
          data.test.class_level ||
          "—",
        language: (data.test.language || "english").toLowerCase(),
        title: data.test.title || "Test",
      };

      const hasDevanagari = (text?: string) =>
        !!text && /[\u0900-\u097F]/.test(text);

      const questionsContainHindi = (data.questions || []).some((q: any) =>
        hasDevanagari(q.question) ||
        hasDevanagari(q.explanation) ||
        hasDevanagari(q.correctAnswer) ||
        (Array.isArray(q.options) && q.options.some((opt: string) => hasDevanagari(opt)))
      );

      // Prepare PDF instance
      // Create PDF with jsPDF for professional formatting
      const pdf = new (jsPDF as any)({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Load and register Hindi font if needed
      const needsHindiFont =
        normalizedTest.language === "hindi" || questionsContainHindi;

      const bodyFont = needsHindiFont ? "NotoSansDevanagari" : "helvetica";
      let activeFont = bodyFont;

      if (needsHindiFont) {
        try {
          const fontData = await loadHindiFont();
          pdf.addFileToVFS("NotoSansDevanagari-Regular.ttf", fontData);
          pdf.addFont(
            "NotoSansDevanagari-Regular.ttf",
            "NotoSansDevanagari",
            "normal",
          );
          pdf.addFont(
            "NotoSansDevanagari-Regular.ttf",
            "NotoSansDevanagari",
            "bold",
          );
          pdf.setFont(activeFont, "normal");
          activeFont = bodyFont;
        } catch (fontErr) {
          console.warn("[PDF] Hindi font load failed, falling back to default", fontErr);
          activeFont = "helvetica";
        }
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margins = { top: 15, bottom: 15, left: 15, right: 15 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let yPosition = margins.top;

      // Helper function to add text with wrapping
      const addWrappedText = (
        text: string,
        x: number,
        maxWidth: number,
        fontSize: number,
        isBold: boolean = false,
      ) => {
        pdf.setFontSize(fontSize);
        if (isBold) pdf.setFont(activeFont, "bold");
        else pdf.setFont(activeFont, "normal");

        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, yPosition);
        yPosition += lines.length * (fontSize * 0.35) + 2;
        return lines.length;
      };
      // ===== HEADER BACKGROUND =====
      // ======= HEADER SECTION =======
      pdf.setFillColor(30, 41, 59); // dark navy background
      pdf.rect(0, 0, pageWidth, 32, "F");

      // ---- Test Title (Left side) ----
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont(activeFont, "bold");
      pdf.text(normalizedTest.title, margins.left, 18);

      // ===== RIGHT SIDE BRAND (NO LOGO) =====
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");

      // Text
      const brandText = "MCQGyaan AI";

      // Text width calculate
      const brandTextWidth = pdf.getTextWidth(brandText);

      // Right align position
      const brandX = pageWidth - margins.right - brandTextWidth;

      // White text
      pdf.setTextColor(255, 255, 255);

      // Print brand name
      pdf.text(brandText, brandX, 18);

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Start content position
      yPosition = 42;

      pdf.setDrawColor(200);
      pdf.line(margins.left, 30, pageWidth - margins.right, 30);

      // Test Info Section
      pdf.setFontSize(10);
      pdf.setFont(activeFont, "bold");
      pdf.text(
        normalizedTest.language === "hindi" ? "परीक्षा विवरण" : "Test Information",
        margins.left,
        yPosition,
      );
      yPosition += 8;

      pdf.setFont(activeFont, "normal");
      pdf.setFontSize(9);
      const labels =
        normalizedTest.language === "hindi"
          ? {
              subject: "विषय",
              class: "कक्षा",
              difficulty: "कठिनाई",
              total: "कुल प्रश्न",
              code: "कोड",
            }
          : {
              subject: "Subject",
              class: "Class",
              difficulty: "Difficulty",
              total: "Total Questions",
              code: "Share Code",
            };

      const testInfo = [
        `${labels.subject}: ${normalizedTest.subject}`,
        `${labels.class}: ${normalizedTest.classLevel}`,
        `${labels.difficulty}: ${normalizedTest.difficulty}`,
        `${labels.total}: ${data.questions.length}`,
        `${labels.code}: ${normalizedTest.shareCode}`,
      ];

      testInfo.forEach((info) => {
        pdf.text(info, margins.left, yPosition);
        yPosition += 5;
      });

      yPosition += 3;

      // Instructions section if present
      if (data.test.instructions) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margins.left, yPosition - 2, contentWidth, 20, "F");
        pdf.setFont(activeFont, "bold");
        pdf.setFontSize(10);
        pdf.text("Instructions:", margins.left + 3, yPosition + 2);
        yPosition += 6;

        pdf.setFont(activeFont, "normal");
        pdf.setFontSize(9);
        const instructionLines = pdf.splitTextToSize(
          data.test.instructions,
          contentWidth - 6,
        );
        pdf.text(instructionLines, margins.left + 3, yPosition);
        yPosition += instructionLines.length * 4 + 3;
      }

      // Questions section
      pdf.text(
        normalizedTest.language === "hindi" ? "प्रश्न" : "Questions",
        margins.left,
        yPosition + 5,
      );
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margins.left, yPosition, contentWidth, 8, "F");

      pdf.setFontSize(11);
      pdf.setFont(activeFont, "bold");
      pdf.text(
        normalizedTest.language === "hindi" ? "प्रश्न" : "Questions",
        pageWidth / 2,
        yPosition + 6,
        { align: "center" },
      );

      yPosition += 12;
      // pdf.setFont(undefined, 'bold');
      // pdf.setFontSize(10);
      // pdf.text('Questions', margins.left, yPosition + 5);
      // yPosition += 10;

      // Add questions
      data.questions.forEach((q: any, idx: number) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          yPosition = margins.top;
        }

        // Normalize options (supports array, JSON string, comma/line separated, or optionA-D fields)
        let displayOptions: string[] = [];
        if (Array.isArray(q.options)) {
          displayOptions = q.options as string[];
        } else if (typeof q.options === "string") {
          const raw = q.options.trim();
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) displayOptions = parsed;
          } catch {
            const splitChars = raw.includes("\n") ? "\n" : ",";
            displayOptions = raw
              .split(splitChars)
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
        }
        // fallback to optionA/optionB style fields if present
        const altOpts = ["optionA", "optionB", "optionC", "optionD"].flatMap(
          (key) => (q as any)[key] ? [(q as any)[key]] : [],
        );
        if (displayOptions.length === 0 && altOpts.length > 0) {
          displayOptions = altOpts;
        }

        const labels = normalizedTest.language === "hindi"
          ? {
              question: "प्रश्न",
              options: "विकल्प",
              correct: "सही उत्तर",
              explanation: "व्याख्या",
            }
          : {
              question: "Q",
              options: "Options",
              correct: "Correct Answer",
              explanation: "Explanation",
            };

        // Question number and text
        pdf.setFont(activeFont, "bold");
        pdf.setFontSize(10);
        const qLabel =
          normalizedTest.language === "hindi" ? `${labels.question}${idx + 1}.` : `${labels.question}${idx + 1}.`;
        pdf.text(qLabel, margins.left, yPosition);
        yPosition += 5;

        pdf.setFont(activeFont, "normal");
        pdf.setFontSize(9);
        const questionLines = pdf.splitTextToSize(q.question, contentWidth - 5);
        pdf.text(questionLines, margins.left + 5, yPosition);
        const questionLineHeight = 4.2;
        yPosition += questionLines.length * questionLineHeight + 2;

        // Options for MCQ
        if (displayOptions.length > 0) {
          pdf.setFont(activeFont, "bold");
          pdf.setFontSize(9);
          pdf.text(labels.options, margins.left + 5, yPosition);
          yPosition += 5;

          pdf.setFontSize(8.5);
          displayOptions.forEach((opt: string, optIdx: number) => {
            if (yPosition > pageHeight - margins.bottom - 10) {
              pdf.addPage();
              pdf.setFont(activeFont, "normal");
              yPosition = margins.top;
            }

            const optionLetter = String.fromCharCode(65 + optIdx);
            const cleaned = opt.replace(/^[A-D][.)]?\s*/i, "").trim();
            const displayText = `${optionLetter}. ${cleaned}`;
            const isCorrect =
              (!!q.correctOption &&
                q.correctOption.toString().toUpperCase() === optionLetter) ||
              (q.correctAnswer &&
                q.correctAnswer.toString().toLowerCase().includes(cleaned.toLowerCase()));

            const optionLines = pdf.splitTextToSize(
              displayText,
              contentWidth - 8,
            );
            pdf.setFont(activeFont, "normal");
            pdf.text(optionLines, margins.left + 8, yPosition);
            if (isCorrect) {
              pdf.setFont(activeFont, "bold");
              pdf.text(
                needsHindiFont ? "(\u0938\u0939\u0940)" : "(Correct)",
                pageWidth - margins.right - 18,
                yPosition,
              );
              pdf.setFont(activeFont, "normal");
            }
            const optionLineHeight = 4.2;
            yPosition += optionLines.length * optionLineHeight + 2;
          });
        }

        // Correct Answer
        if (q.correctAnswer) {
          if (yPosition > pageHeight - margins.bottom - 10) {
            pdf.addPage();
            pdf.setFont(activeFont, "normal");
            yPosition = margins.top;
          }
          pdf.setFont(activeFont, "bold");
          pdf.setFontSize(9);
          pdf.text(`${labels.correct}:`, margins.left + 5, yPosition);
          pdf.setFont(activeFont, "normal");
          const ansLines = pdf.splitTextToSize(
            q.correctAnswer.toString(),
            contentWidth - 25,
          );
          pdf.text(ansLines, margins.left + 22, yPosition);
          yPosition += ansLines.length * 4.2 + 5;
        }

        // Explanation
        if (q.explanation) {
          if (yPosition > pageHeight - margins.bottom - 12) {
            pdf.addPage();
            pdf.setFont(activeFont, "normal");
            yPosition = margins.top;
          }
          pdf.setFont(activeFont, "bold");
          pdf.setFontSize(9);
          pdf.text(`${labels.explanation}:`, margins.left + 5, yPosition);
          pdf.setFont(activeFont, "normal");
          const expLines = pdf.splitTextToSize(
            q.explanation.toString(),
            contentWidth - 25,
          );
          pdf.text(expLines, margins.left + 22, yPosition);
          const explLineHeight = 4.5;
          yPosition += expLines.length * explLineHeight + 6;
        }

        // Model answer for open-ended
        if (q.questionType === "open-ended") {
          pdf.setFont(activeFont, "bold");
          pdf.setFontSize(8);
          pdf.text(
            "Answer: _____________________________________",
            margins.left + 5,
            yPosition,
          );
          yPosition += 4;
        }

        yPosition += 4;
      });

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont(activeFont, "normal");
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, {
          align: "center",
        });
      }

      // Save the PDF
      pdf.save(`${normalizedTest.title}_${normalizedTest.shareCode}.pdf`);

      toast({
        title: "Success!",
        description: "Question paper downloaded as PDF",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate question paper",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {t("teacherDashboard.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("teacherDashboard.welcome")}, {teacherData.fullName}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("teacherDashboard.logout")}
          </Button>
        </div>

        {!showForm ? (
          <div className="mb-8">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              data-testid="button-create-test"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t("teacherDashboard.createTest")}
            </Button>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("teacherDashboard.createCustomTest")}</CardTitle>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="h-8 px-3 text-sm"
                    variant={
                      form.watch("language") === "english"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => form.setValue("language", "english")}
                  >
                    English
                  </Button>

                  <Button
                    type="button"
                    className="h-8 px-3 text-sm"
                    variant={
                      form.watch("language") === "hindi" ? "default" : "outline"
                    }
                    onClick={() => form.setValue("language", "hindi")}
                  >
                    हिंदी
                  </Button>
                </div>
              </div>

              <CardDescription>
                {t("teacherDashboard.testDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("teacherDashboard.testTitle")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                "teacherDashboard.testTitlePlaceholder",
                              )}
                              {...field}
                              data-testid="input-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("teacherDashboard.subject")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-subject">
                                <SelectValue
                                  placeholder={t(
                                    "teacherDashboard.selectSubject",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SUBJECTS.map((subject) => (
                                <SelectItem
                                  key={subject.value}
                                  value={subject.value}
                                >
                                  {t(`subjects.${subject.value.toLowerCase()}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="classLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("teacherDashboard.classStandard")}
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-class">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[6, 7, 8, 9, 10, 11, 12].map((cls) => (
                                <SelectItem key={cls} value={cls.toString()}>
                                  {t("teacherDashboard.class")} {cls}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("teacherDashboard.difficulty")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-difficulty">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">
                                {t("teacherDashboard.easy")}
                              </SelectItem>
                              <SelectItem value="medium">
                                {t("teacherDashboard.medium")}
                              </SelectItem>
                              <SelectItem value="hard">
                                {t("teacherDashboard.hard")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("teacherDashboard.numQuestions")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={50}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                              data-testid="input-num-questions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("teacherDashboard.questionType")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-test-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mcq">
                                {t("teacherDashboard.mcqOnly")}
                              </SelectItem>
                              <SelectItem value="open-ended">
                                {t("teacherDashboard.openEnded")}
                              </SelectItem>
                              <SelectItem value="mixed">
                                {t("teacherDashboard.mixed")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gptModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("teacherDashboard.gptModel")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-gpt-model">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gpt-4o">
                                {t("teacherDashboard.gpt4o")}
                              </SelectItem>

                              <SelectItem value="gpt-4o-mini">
                                {t("teacherDashboard.gpt4omini")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <FormLabel className="text-base">
                      {t("teacherDashboard.syllabus")}
                    </FormLabel>

                    <p className="text-sm text-muted-foreground">
                      {t("teacherDashboard.syllabusDesc")}
                    </p>

                    <div className="grid gap-3">
                      <FormField
                        control={form.control}
                        name="topic1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("teacherDashboard.topic1")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  "teacherDashboard.topicExample1",
                                )}
                                {...field}
                                data-testid="input-topic1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="topic2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("teacherDashboard.topic2")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  "teacherDashboard.topicExample2",
                                )}
                                {...field}
                                data-testid="input-topic2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="topic3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("teacherDashboard.topic3")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  "teacherDashboard.topicExample3",
                                )}
                                {...field}
                                data-testid="input-topic3"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="topic4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("teacherDashboard.topic4")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  "teacherDashboard.topicExample4",
                                )}
                                {...field}
                                data-testid="input-topic4"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("teacherDashboard.instructions")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              "teacherDashboard.instructionsPlaceholder",
                            )}
                            {...field}
                            data-testid="textarea-instructions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={generateMutation.isPending}
                      data-testid="button-generate"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("teacherDashboard.generating") as string}
                        </>
                      ) : (
                        (t("teacherDashboard.generateTest") as string)
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      data-testid="button-cancel"
                    >
                      {t("teacherDashboard.cancel")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">
            {t("teacherDashboard.yourTests")}
          </h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("teacherDashboard.noTests")}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orderedTests.map((test: any) => (
                // Normalize share code for legacy snake_case rows
                (() => {
                  test.shareCode =
                    test.shareCode || test.share_code || test.sharecode || "";
                })(),
                  <Card key={test.id} data-testid={`test-card-${test.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          {/* <CardTitle>{test.title}</CardTitle>
                        <CardDescription>
                          {t(`subjects.${test.subject}`)} • {t("teacherDashboard.class")} {test.classLevel} • {t(`difficulty.${test.difficulty}`)}
                        </CardDescription> */}

                          {/* <CardTitle>{test.title}</CardTitle> */}

                          <CardTitle>
                            {t("titleFormat", {
                              class: test.class || test.classLevel,
                              subject: t(
                                `subjects.${test.subject.toLowerCase()}`,
                                test.subject,
                              ),
                            })}
                          </CardTitle>
                          <CardDescription>
                            {t(
                              `subjects.${test.subject.toLowerCase()}`,
                              test.subject,
                            )}{" "}
                            •{t("teacherDashboard.class")} {test.classLevel} •
                            {t(`difficulty.${test.difficulty}`)}
                          </CardDescription>
                        </div>

                        <Badge
                          variant={
                            test.status === "published"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {t(`status.${test.status}`)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {t("teacherDashboard.topic")}: {test.syllabus} •{" "}
                        {test.numQuestions} {t("teacherDashboard.questions")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTestId(test.id);
                            setShowQuestionsDialog(true);
                            }}
                            data-testid={`button-view-${test.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t("teacherDashboard.viewQuestions")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQuestionPaper(test.id)}
                            data-testid={`button-download-${test.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {t("teacherDashboard.downloadPDF")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareCode(test.shareCode || "")}
                            data-testid={`button-copy-${test.id}`}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            {t("teacherDashboard.copyCode")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Questions Preview Dialog */}

      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("titleFormat", {
                class: classNumber,
                subject: t(
                  `subjects.${test?.subject?.toLowerCase()}`,
                  test?.subject,
                ),
              })}
            </DialogTitle>

            <DialogDescription>
              {t(`subjects.${test?.subject?.toLowerCase()}`, test?.subject)} •{" "}
              {t("teacherDashboard.class")} {classNumber} •{" "}
              {t(`difficulty.${test?.difficulty}`)}
            </DialogDescription>
          </DialogHeader>

          {testDetails?.questions ? (
            <div className="space-y-6">
              {testDetails.questions.map((q: any, idx: number) => {
                // ✅ FIX: parse options
                let options = [];

                // if (Array.isArray(q.options)) {
                //   options = q.options;
                // } else {
                //   try {
                //     options = JSON.parse(q.options || "[]");
                //   } catch (e) {
                //     console.error("Invalid options JSON", q.options);
                //   }
                // }

                if (Array.isArray(q.options)) {
                  options = q.options;
                } else {
                  options = JSON.parse(q.options || "[]");
                }

                return (
                  <Card key={q.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {t("teacherDashboard.question")} {idx + 1}
                        </CardTitle>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowManualEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t("teacherDashboard.edit")}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowAIEditDialog(true);
                            }}
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            {t("teacherDashboard.aiEdit")}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* ✅ FIX: CardContent inside map */}
                    <CardContent className="space-y-3">
                      <p className="font-medium">{q.question}</p>

                      {/* ✅ MCQ OPTIONS */}
                      {options.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                              {t("teacherDashboard.options")}
                            </p>
                            {q.correctOption && (
                              <Badge variant="outline">
                                {t("teacherDashboard.correctOption", {
                                  defaultValue: "Correct Option",
                                })}
                                : {q.correctOption.toUpperCase()}
                              </Badge>
                            )}
                          </div>

                          {/* {options.map((opt: string, optIdx: number) => {
                            const optionLetter = String.fromCharCode(65 + optIdx);

                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded ${
                                  q.correctOption === optionLetter
                                    ? "bg-green-100 dark:bg-green-900"
                                    : "bg-muted"
                                }`}
                              >
                                {optionLetter}. {opt}

                                {q.correctOption === optionLetter && (
                                  <Badge className="ml-2">Correct</Badge>
                                )}
                              </div>
                            );
                          })} */}

                          {options.map((opt: string, optIdx: number) => {
                            const optionLetter = String.fromCharCode(
                              65 + optIdx,
                            );

                            const cleanedOption = opt
                              .replace(/^[A-D][.)]?\s*/i, "")
                              .trim();

                            const correctOpt = (q.correctOption || "").toString().trim().toUpperCase();
                            const correctAns = (q.correctAnswer || "").toString().trim();

                            const isCorrect =
                              (!!correctOpt && correctOpt === optionLetter) ||
                              correctAns === optionLetter ||
                              correctAns.toLowerCase() === cleanedOption.toLowerCase() ||
                              correctAns.toLowerCase() === opt.toLowerCase() ||
                              correctAns.toLowerCase().includes(cleanedOption.toLowerCase());

                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded flex items-center justify-between ${
                                  isCorrect
                                    ? "bg-green-100 dark:bg-green-900"
                                    : "bg-muted"
                                }`}
                              >
                                <span>
                                  {optionLetter}. {cleanedOption}
                                </span>
                                {isCorrect && (
                                  <Badge className="ml-3" variant="secondary">
                                    {t("teacherDashboard.correctOptionLabel", { defaultValue: "Correct" })}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ✅ OPEN ENDED */}
                      {q.questionType === "open-ended" && (
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                          <p className="text-sm font-semibold">
                            {t("teacherDashboard.modelAnswer")}
                          </p>
                          <p>{q.correctAnswer}</p>
                        </div>
                      )}

                      {/* ✅ EXPLANATION */}
                      {q.explanation && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                          <p className="text-sm font-semibold">
                            {t("teacherDashboard.explanation")}
                          </p>
                          <p className="text-sm">{q.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Edit Dialog */}
      {editingQuestion && (
        <Dialog
          open={showManualEditDialog}
          onOpenChange={setShowManualEditDialog}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("teacherDashboard.editQuestion")}</DialogTitle>
              <DialogDescription>
                {t("teacherDashboard.manualEditDesc")}
              </DialogDescription>
            </DialogHeader>
            <ManualEditForm
              question={editingQuestion}
              onSave={(data) => {
                manualEditMutation.mutate({
                  questionId: editingQuestion.id,
                  ...data,
                });
              }}
              onCancel={() => {
                setShowManualEditDialog(false);
                setEditingQuestion(null);
              }}
              isLoading={manualEditMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* AI Edit Dialog */}
      {editingQuestion && (
        <Dialog open={showAIEditDialog} onOpenChange={setShowAIEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("teacherDashboard.aiEdit")}</DialogTitle>
              <DialogDescription>
                {t("teacherDashboard.aiEditDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-sm mb-2">
                  {t("teacherDashboard.currentQuestion")}
                </p>
                <p className="text-sm">{editingQuestion.question}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("teacherDashboard.feedbackLabel")}
                </label>
                <Textarea
                  placeholder="e.g., 'Make it more challenging', 'Simplify the language', 'Fix the incorrect option B', 'Add more detail to the explanation'..."
                  value={aiEditFeedback}
                  onChange={(e) => setAIEditFeedback(e.target.value)}
                  rows={4}
                  data-testid="textarea-ai-feedback"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (aiEditFeedback.trim().length < 10) {
                      toast({
                        variant: "destructive",
                        title: "Feedback too short",
                        description:
                          "Please provide at least 10 characters of feedback",
                      });
                      return;
                    }
                    aiEditMutation.mutate({
                      questionId: editingQuestion.id,
                      feedback: aiEditFeedback,
                    });
                  }}
                  disabled={
                    aiEditMutation.isPending ||
                    aiEditFeedback.trim().length < 10
                  }
                  data-testid="button-ai-improve"
                >
                  {aiEditMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("teacherDashboard.improving")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("teacherDashboard.improveAI")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAIEditDialog(false);
                    setEditingQuestion(null);
                    setAIEditFeedback("");
                  }}
                  disabled={aiEditMutation.isPending}
                >
                  {t("teacherDashboard.cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Manual Edit Form Component
function ManualEditForm({
  question,
  onSave,
  onCancel,
  isLoading,
}: {
  question: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState(question.options || ["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(
    question.correctOption || "A",
  );
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation);

  const isMCQ = question.questionType === "mcq";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("teacherDashboard.question")}
        </label>
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          data-testid="textarea-question"
        />
      </div>

      {isMCQ ? (
        <>
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t("teacherDashboard.options")}
            </label>
            {options.map((opt: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="font-semibold w-6">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[idx] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  data-testid={`input-option-${idx}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("teacherDashboard.correctOption")}
            </label>
            <Select value={correctOption} onValueChange={setCorrectOption}>
              <SelectTrigger data-testid="select-correct-option">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {t("teacherDashboard.option")} {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("teacherDashboard.correctAnswer")}
          </label>
          <Textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            rows={2}
            data-testid="textarea-correct-answer"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("teacherDashboard.explanation")}
        </label>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          data-testid="textarea-explanation"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            onSave({
              question: questionText,
              options: isMCQ ? options : undefined,
              correctOption: isMCQ ? correctOption : undefined,
              correctAnswer: isMCQ
                ? options[correctOption.charCodeAt(0) - 65]
                : correctAnswer,
              explanation,
            });
          }}
          disabled={isLoading}
          data-testid="button-save-edit"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("teacherDashboard.saving")}
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t("teacherDashboard.cancel")}
        </Button>
      </div>
    </div>
  );
}

