import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getAuth } from "firebase/auth";
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
import { clearAuthSession, setTeacherSession, getStoredTeacherId } from "@/lib/authSession";
import { getTopicValidationMessage } from "@/lib/topicValidation";
import { getClientAppUrl } from "@/lib/appUrl";
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
  Clock3,
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
import { generateQuizPdf } from "@/lib/pdfGenerator";
import { getLocalizedText, getSubjectLabel } from "@/lib/quizText";

import { useTranslation } from "react-i18next";



const loadHindiFont = async (): Promise<string> => "";

const user = getAuth().currentUser;

const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subject: z.string().min(1, "Subject is required"),
  language: z.enum(["english", "hindi"]),
  classLevel: z.number().min(6).max(12),
  difficulty: z.enum(["easy", "medium", "hard"]),
  durationMinutes: z.coerce.number().refine((value) => [10, 15, 30, 60].includes(value), {
    message: "Select a valid duration",
  }),
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

const normalizeTeacherTest = (test: any = {}) => ({
  ...test,
  title: test.title || test.testTitle || "",
  subject: test.subject || "",
  classLevel:
    test.classLevel ?? test.class ?? test.class_level ?? test.classlevel ?? null,
  difficulty: test.difficulty || "",
  durationMinutes:
    test.durationMinutes ?? test.duration_minutes ?? test.duration ?? 0,
  numQuestions:
    test.numQuestions ??
    (Array.isArray(test.questions) ? test.questions.length : undefined) ??
    test.questions ??
    test.totalQuestions ??
    test.total_questions ??
    test.test_length ??
    0,
  syllabus: test.syllabus || test.topics || test.topic || "",
  shareCode: test.shareCode || test.share_code || test.sharecode || "",
});

const getQuestionCount = (test: any = {}, questions?: any[]) => {
  const candidates = [
    Array.isArray(questions) ? questions.length : undefined,
    test?.numQuestions,
    test?.totalQuestions,
    test?.total_questions,
    test?.test_length,
    Array.isArray(test?.questions) ? test.questions.length : undefined,
  ];

  const count = candidates.find((value) => Number(value) > 0);
  return Number(count) || 0;
};

const normalizeTeacherProfile = (teacher: any = {}) => ({
  ...teacher,
  fullName:
    teacher.fullName ||
    teacher.full_name ||
    teacher.name ||
    // teacher.username ||
    "",
  approved:
    teacher.approved ??
    teacher.isApproved ??
    teacher.is_approved ??
    false,
  verified:
    teacher.verified ??
    teacher.isVerified ??
    teacher.is_verified ??
    false,
});

export default function TeacherDashboard() {
  const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")} min`;
};
  // 🔥 ADD THIS AT TOP OF COMPONENT
const [openResultsId, setOpenResultsId] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState<any | null>(
    location.state?.teacherData ? normalizeTeacherProfile(location.state.teacherData) : null,
  );
  const [isTeacherLoading, setIsTeacherLoading] = useState(!location.state?.teacherData);
  const preferredLanguage =
    i18n.language && i18n.language.toLowerCase().startsWith("hi")
      ? "hindi"
      : "english";
  const resolvedTeacherId =
    teacherData?.id ||
    getStoredTeacherId() ||
    location.state?.teacherData?.id ||
    "";

  const showBootstrapLoading = isTeacherLoading || !resolvedTeacherId;

  useEffect(() => {
    const stateTeacher = location.state?.teacherData;
    if (stateTeacher) {
      const normalized = normalizeTeacherProfile(stateTeacher);
      setTeacherData(normalized);
      setIsTeacherLoading(false);
      if (normalized.id) {
        setTeacherSession(normalized.id);
      }

      if (!normalized.verified) {
        navigate("/teacher-verification-pending", {
          state: { teacher: normalized },
          replace: true,
        });
        return;
      }

      if (!normalized.approved) {
        navigate("/teacher-approval-pending", {
          state: { teacher: normalized },
          replace: true,
        });
        return;
      }

      return;
    }

    const storedTeacherId = getStoredTeacherId();
    if (!storedTeacherId) {
      setIsTeacherLoading(false);
      navigate("/teacher-auth");
      return;
    }

    let cancelled = false;
    setIsTeacherLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/teacher/${storedTeacherId}`);
        if (!res.ok) {
          throw new Error("Failed to load teacher profile");
        }

        const data = normalizeTeacherProfile(await res.json());
        if (cancelled) return;

        if (!data.verified) {
          navigate("/teacher-verification-pending", {
            state: { teacher: data },
            replace: true,
          });
          return;
        }

        if (!data.approved) {
          navigate("/teacher-approval-pending", {
            state: { teacher: data },
            replace: true,
          });
          return;
        }

        setTeacherData(data);
        if (data.id) {
          setTeacherSession(data.id);
        }
      } catch {
        if (!cancelled) {
          navigate("/teacher-auth");
        }
      } finally {
        if (!cancelled) {
          setIsTeacherLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.state, navigate]);

  const handleLogout = () => {
    clearAuthSession();
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
      durationMinutes: 30,
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

  const formPreview = useWatch({
    control: form.control,
  });

  const previewTitle = formPreview?.title?.trim() || t("teacherDashboard.testTitle");
  const previewSubject = formPreview?.subject
    ? t(`subjects.${formPreview.subject.toLowerCase()}`, formPreview.subject)
    : t("teacherDashboard.subject");
  const previewClassLevel = formPreview?.classLevel ?? 9;
  const previewDifficulty = formPreview?.difficulty
    ? t(`difficulty.${formPreview.difficulty}`)
    : t("teacherDashboard.difficulty");
  const previewDuration = formPreview?.durationMinutes ?? 30;
  const previewQuestions = formPreview?.numQuestions ?? 10;
  const previewTopics = [formPreview?.topic1, formPreview?.topic2, formPreview?.topic3, formPreview?.topic4]
    .map((topic) => topic?.trim())
    .filter((topic): topic is string => Boolean(topic));

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
        durationMinutes: 30,
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
    queryKey: [`/api/teacher/${resolvedTeacherId}/tests`],
    enabled: Boolean(resolvedTeacherId),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/${resolvedTeacherId}/tests`);

      if (!res.ok) {
        throw new Error("Failed to fetch tests");
      }

      const baseTests = await res.json();

      const testsWithSubmissions = await Promise.all(
        (baseTests || []).map(async (test: any) => {
          const detailRes = await fetch(
            `/api/teacher/${resolvedTeacherId}/tests/${test.id}`,
          );

          if (!detailRes.ok) {
            return {
              ...normalizeTeacherTest(test),
              submissions: test.submissions || [],
            };
          }

          const detailData = await detailRes.json();
          const mergedDetail = {
            ...normalizeTeacherTest(test),
            ...normalizeTeacherTest(detailData.test),
          };

          return {
            ...mergedDetail,
            numQuestions:
              detailData.questions?.length ??
              mergedDetail.numQuestions ??
              normalizeTeacherTest(detailData.test).numQuestions,
            submissions: detailData.submissions || detailData.test?.submissions || [],
          };
        }),
      );

      return testsWithSubmissions;
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
    queryKey: [`/api/teacher/${resolvedTeacherId}/tests/${selectedTestId}`],
    enabled: !!selectedTestId,
    queryFn: async () => {
      const res = await fetch(
        `/api/teacher/${resolvedTeacherId}/tests/${selectedTestId}`,
      );
      const detailData = await res.json();
      return {
        ...detailData,
        test: normalizeTeacherTest(detailData.test),
      };
    },
  });

  const test =
    orderedTests.find((item: any) => item.id === selectedTestId) ||
    testDetails?.test;

  const questionCount = getQuestionCount(test, testDetails?.questions);

  const classNumber =
    test?.classLevel || test?.class || test?.title?.match(/\d+/)?.[0];

  const generateMutation = useMutation({
    mutationFn: async (data: TestForm) => {
      const topicList = [data.topic1, data.topic2, data.topic3, data.topic4]
        .map((topic) => topic?.trim() || "")
        .filter((topic) => topic.length > 0);

      const topicValidationMessage = await getTopicValidationMessage({
        classLevel: data.classLevel,
        subject: data.subject,
        topics: topicList,
      });

      if (topicValidationMessage) {
        throw new Error(topicValidationMessage);
      }

      const topics = topicList.join(", ");

      const payload = {
        title: data.title,
        subject: data.subject,
        language: data.language, // ✅ correct
        classLevel: data.classLevel,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        syllabus: topics,
        numQuestions: data.numQuestions,
        testType: data.testType,
        gptModel: data.gptModel,
        instructions: data.instructions,
      };

      const res = await apiRequest(
        "POST",
        `/api/teacher/${resolvedTeacherId}/generate-test`,
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
        queryKey: [`/api/teacher/${resolvedTeacherId}/tests`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teacher/${resolvedTeacherId}/tests/${result.test.id}`],
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
      if (!data.testId) {
        throw new Error("Missing test ID for question edit");
      }

      console.log("[QUESTION EDIT] Sending request", {
        teacherId: resolvedTeacherId,
        testId: data.testId,
        questionId: data.questionId,
      });

      const res = await apiRequest(
        "PATCH",
        `/api/teacher/${resolvedTeacherId}/tests/${data.testId}/question/${data.questionId}/edit`,
        data,
      );
      const text = await res.text();
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        throw new Error(text || "Invalid response from edit API");
      }
    },
    onSuccess: () => {
      toast({
        title: "Question Updated!",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teacher/${resolvedTeacherId}/tests/${selectedTestId}`],
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
    mutationFn: async (data: { questionId: string; feedback: string; testId?: string | null }) => {
      if (!data.testId) {
        throw new Error("Missing test ID for AI edit");
      }

      console.log("[AI QUESTION EDIT] Sending request", {
        teacherId: resolvedTeacherId,
        testId: data.testId,
        questionId: data.questionId,
      });

      const res = await apiRequest(
        "POST",
        `/api/teacher/${resolvedTeacherId}/tests/${data.testId}/question/${data.questionId}/ai-edit`,
        { feedback: data.feedback, testId: data.testId },
      );
      const text = await res.text();
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        throw new Error(text || "Invalid response from AI edit API");
      }
    },
    onSuccess: () => {
      toast({
        title: "Question Improved!",
        description:
          "AI has successfully updated the question based on your feedback.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teacher/${resolvedTeacherId}/tests/${selectedTestId}`],
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
      const pdfResponse = await fetch(
        `/api/teacher/${resolvedTeacherId}/tests/${testId}`,
      );

      if (!pdfResponse.ok) {
        throw new Error("Failed to fetch test data");
      }

      const pdfData = await pdfResponse.json();
      const pdfNormalizedTest = {
        ...pdfData.test,
        shareCode:
          pdfData.test.shareCode ||
          pdfData.test.share_code ||
          pdfData.test.sharecode ||
          "NA",
        classLevel:
          pdfData.test.classLevel ||
          pdfData.test.class ||
          pdfData.test.class_number ||
          pdfData.test.class_level ||
          "—",
        language: (pdfData.test.language || preferredLanguage || "english").toLowerCase(),
        title: pdfData.test.title || String(t("question_paper_title")),
      };

      const normalizeOptions = (value: any) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            return value
              .split(/\r?\n|,/)
              .map((entry) => entry.trim())
              .filter(Boolean);
          }
        }
        return [];
      };

      await generateQuizPdf({
        title: pdfNormalizedTest.title,
        subject: getSubjectLabel(pdfNormalizedTest.subject, t),
        classLevel: pdfNormalizedTest.classLevel,
        difficulty: String(t(`difficulty.${pdfNormalizedTest.difficulty}`, pdfNormalizedTest.difficulty)),
        language: pdfNormalizedTest.language,
        shareCode: pdfNormalizedTest.shareCode,
        fileName: `${pdfNormalizedTest.title.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`,
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
        questions: (pdfData.questions || []).map((question: any) => ({
          question: question.question,
          options: normalizeOptions(question.options),
          correctAnswer: getLocalizedText(question.correctAnswer || question.correctOption, pdfNormalizedTest.language),
          explanation: question.explanation,
        })),
      });

      toast({
        title: t("teacherDashboard.downloadPDF"),
        description: t("pdf_download_ready"),
      });
      return;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || "Failed to generate question paper",
      });
    }
  }

  if (showBootstrapLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-base sm:text-lg font-semibold text-primary">
            Loading teacher dashboard...
          </p>
        </div>
      </div>
    );
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
  {t("teacherDashboard.welcome")},{" "}
  {teacherData?.fullName || "Teacher"}
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
              </div>

              <CardDescription>
                {t("teacherDashboard.testDescription")}
              </CardDescription>

              <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Live header preview
                </p>
                <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-foreground">
                      {previewTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {previewSubject} • {t("teacherDashboard.class")} {previewClassLevel} •{" "}
                      {previewDifficulty} • {previewDuration} mins • {previewQuestions} {t("teacherDashboard.questions")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {previewTopics.length > 0 ? (
                      previewTopics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="rounded-full px-3 py-1">
                          {topic}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t("teacherDashboard.syllabus")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Duration</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-duration">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[10, 15, 30, 60].map((minutes) => (
                                <SelectItem key={minutes} value={minutes.toString()}>
                                  {minutes} mins
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
                            {test.title || t("teacherDashboard.createCustomTest")}
                          </CardTitle>
                          <CardDescription>
                            {t(
                              `subjects.${test.subject.toLowerCase()}`,
                              test.subject,
                            )}{" "}
                            •{t("teacherDashboard.class")} {test.classLevel} •
                            {t(`difficulty.${test.difficulty}`)} • {test.durationMinutes} mins
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
                    {/* <CardContent>
                      <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {t("teacherDashboard.topic")}: {test.syllabus} •{" "}
      {getQuestionCount(test)} {t("teacherDashboard.questions")} • {test.durationMinutes} mins
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
                    </CardContent> */}
                    <CardContent>
  <div className="space-y-2">

    {/* 🔹 TEST INFO */}
    <p className="text-sm text-muted-foreground">
      {t("teacherDashboard.topic")}: {test.syllabus} •{" "}
      {getQuestionCount(test)} {t("teacherDashboard.questions")} • {test.durationMinutes} mins
    </p>

    {/* 🔹 ACTION BUTTONS */}
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
      <Button
  variant="default"
  size="sm"
  onClick={() =>
    setOpenResultsId(openResultsId === test.id ? null : test.id)
  }
>
  {openResultsId === test.id
    ? "Hide Results"
    : "View Student Results"}
</Button>
    </div>

    {/* 🔥 STUDENT RESULTS BUTTON + DROPDOWN */}
    {test.submissions && test.submissions.length > 0 && (
      <div className="mt-4">

        {/* 🔹 SINGLE BUTTON */}
        {/* <Button
          variant="default"
          size="sm"
          onClick={() =>
            setOpenResultsId(openResultsId === test.id ? null : test.id)
          }
        >
          {openResultsId === test.id
            ? "Hide Student Results"
            : "View Student Results"}
        </Button> */}

        {/* 🔽 HORIZONTAL DROPDOWN */}
     {openResultsId === test.id && (
  <div className="mt-3 space-y-2 text-sm">

    {test.submissions.map((s: any) => (
      <div
        key={s.id}
        className="flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-900"
      >
        <span><b>{s.student_name}</b></span>

        <span className="text-muted-foreground">
          Score: {s.score}/{s.total_questions}
        </span>

        <span className="text-muted-foreground">
          Time: {formatTime(s.time_taken_seconds)}
        </span>

        <span
          className={`px-2 py-1 rounded text-xs ${
            s.submission_type === "auto"
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {s.submission_type}
        </span>
      </div>
    ))}
          </div>
        )}

      </div>
    )}

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
              {test?.title || t("teacherDashboard.createCustomTest")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {getQuestionCount(test)} {t("teacherDashboard.questions")} • {test?.syllabus || t("teacherDashboard.syllabus")}
            </p>

            <DialogDescription>
              {t(`subjects.${test?.subject?.toLowerCase()}`, test?.subject)} •{" "}
              {t("teacherDashboard.class")} {classNumber} •{" "}
              {t(`difficulty.${test?.difficulty}`)} • {test?.durationMinutes} mins
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

              {Array.isArray(testDetails?.submissions) &&
                testDetails.submissions.length > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock3 className="h-4 w-4" />
                        Student Submissions
                      </CardTitle>
                      <CardDescription>
                        Latest completed attempts for this test
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {testDetails.submissions.map((submission: any) => (
                        <div
                          key={submission.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3"
                        >
                          <div>
                            <p className="font-semibold">
                              {submission.studentName || "Anonymous"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Score: {submission.score}/{test?.numQuestions || 0} • Time taken: {Math.max(0, Math.floor((submission.timeTakenSeconds || 0) / 60))} min {Math.max(0, (submission.timeTakenSeconds || 0) % 60)} sec
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {(submission.submissionType || "manual") === "auto"
                                ? "Auto"
                                : "Manual"}
                            </Badge>
                            <Badge>
                              {submission.score}/{test?.numQuestions || 0}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
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
                const activeTestId = selectedTestId || testDetails?.test?.id;
                if (!activeTestId) {
                  toast({
                    variant: "destructive",
                    title: "Missing test ID",
                    description:
                      "Please reopen the test and try editing again.",
                  });
                  return;
                }

                manualEditMutation.mutate({
                  questionId: editingQuestion.id,
                  testId: activeTestId,
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
                    const activeTestId = selectedTestId || testDetails?.test?.id;
                    if (!activeTestId) {
                      toast({
                        variant: "destructive",
                        title: "Missing test ID",
                        description: "Please reopen the test and try AI edit again.",
                      });
                      return;
                    }
                    aiEditMutation.mutate({
                      questionId: editingQuestion.id,
                      testId: activeTestId,
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
