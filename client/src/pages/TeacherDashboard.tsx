import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  FileText,
  Search,
  Check,
  Building2,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateQuizPdf } from "@/lib/pdfGenerator";
import { getLocalizedText, getSubjectLabel } from "@/lib/quizText";
import { useTranslation } from "react-i18next";

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
    "",
  school: teacher.school || teacher.school_name || "",
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

  const [openResultsId, setOpenResultsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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

  useEffect(() => {
    const uiLang =
      i18n.language && i18n.language.toLowerCase().startsWith("hi")
        ? "hindi"
        : "english";
    form.setValue("language", uiLang);
  }, [i18n.language, form]);

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
    return 0;
  };

  const orderedTests = useMemo(() => {
    return [...tests].sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
  }, [tests]);

  const filteredTests = useMemo(() => {
    return orderedTests.filter((item: any) => {
      const titleMatch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      const subjectMatch = (item.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
      const codeMatch = (item.shareCode || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || subjectMatch || codeMatch;

      const matchesSubject =
        selectedSubjectFilter === "all" ||
        (item.subject || "").toLowerCase() === selectedSubjectFilter.toLowerCase();

      return matchesSearch && matchesSubject;
    });
  }, [orderedTests, searchQuery, selectedSubjectFilter]);

  // Overall Statistics Metrics
  const stats = useMemo(() => {
    const totalTests = orderedTests.length;
    const totalQuestions = orderedTests.reduce((acc, t) => acc + getQuestionCount(t), 0);
    const totalSubmissions = orderedTests.reduce((acc, t) => acc + (t.submissions?.length || 0), 0);
    
    let totalScorePctSum = 0;
    let totalScoredAttempts = 0;

    orderedTests.forEach((t) => {
      if (Array.isArray(t.submissions)) {
        t.submissions.forEach((s: any) => {
          const qCount = Number(s.total_questions) || getQuestionCount(t) || 1;
          const score = Number(s.score) || 0;
          totalScorePctSum += (score / qCount) * 100;
          totalScoredAttempts += 1;
        });
      }
    });

    const avgScorePct = totalScoredAttempts > 0 ? Math.round(totalScorePctSum / totalScoredAttempts) : 0;

    return {
      totalTests,
      totalQuestions,
      totalSubmissions,
      avgScorePct,
    };
  }, [orderedTests]);

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
        language: data.language,
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

  function copyShareCode(shareCode: string, testId?: string) {
    if (!shareCode) {
      toast({
        variant: "destructive",
        title: "No code found",
        description: "Share code is missing for this test",
      });
      return;
    }

    copyToClipboard(shareCode)
      .then(() => {
        if (testId) {
          setCopiedCodeId(testId);
          setTimeout(() => setCopiedCodeId(null), 2000);
        }
        toast({
          title: "Copied to Clipboard!",
          description: `Share code "${shareCode}" copied`,
        });
      })
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
          company: "MCQGyaan AI",
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/30 animate-pulse">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">MCQGyaan AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading Educator Workspace...</p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* --- TOP NAVBAR --- */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  MCQGyaan AI
                </span>
                <Badge variant="outline" className="hidden sm:inline-flex bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5">
                  Educator Suite
                </Badge>
              </div>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {(teacherData?.fullName || "T")[0].toUpperCase()}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {teacherData?.fullName || "Teacher"}
              </span>
              {teacherData?.school && (
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {teacherData.school}
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 sm:mr-2 text-slate-500 group-hover:text-red-600" />
              <span className="hidden sm:inline">{t("teacherDashboard.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- DASHBOARD HERO HEADER & STATS --- */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                {t("teacherDashboard.welcome")}, {teacherData?.fullName || "Educator"} 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Design AI assessments, manage custom tests, and review real-time student submissions.
              </p>
            </div>

            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-2xl px-6 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                data-testid="button-create-test"
              >
                <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                {t("teacherDashboard.createTest")}
              </Button>
            )}
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-blue-500/10 group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Tests</span>
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{stats.totalTests}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Created tests</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-purple-500/10 group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Questions</span>
                <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{stats.totalQuestions}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">AI generated items</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-emerald-500/10 group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Student Attempts</span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{stats.totalSubmissions}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-medium">Completed submissions</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-amber-500/10 group-hover:scale-125 transition-all duration-300" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Avg Class Score</span>
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
                {stats.avgScorePct > 0 ? `${stats.avgScorePct}%` : "—"}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Class accuracy average</p>
            </motion.div>
          </div>
        </div>

        {/* --- CREATE TEST FORM CONTAINER --- */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-3xl border border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                          {t("teacherDashboard.createCustomTest")}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                          {t("teacherDashboard.testDescription")}
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowForm(false)}
                      className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Realtime Live Header Preview Card */}
                  <div className="mt-5 rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        LIVE TEST PREVIEW CARD
                      </span>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-0 text-[10px] font-bold">
                        {previewQuestions} {t("teacherDashboard.questions")} • {previewDuration} mins
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          {previewTitle}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {previewSubject} • {t("teacherDashboard.class")} {previewClassLevel} • {previewDifficulty}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {previewTopics.length > 0 ? (
                          previewTopics.map((topic) => (
                            <Badge key={topic} variant="secondary" className="rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-0.5">
                              {topic}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {t("teacherDashboard.syllabus")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.testTitle")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20"
                                  placeholder={t("teacherDashboard.testTitlePlaceholder")}
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.subject")}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700" data-testid="select-subject">
                                    <SelectValue placeholder={t("teacherDashboard.selectSubject")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  {SUBJECTS.map((subject) => (
                                    <SelectItem key={subject.value} value={subject.value}>
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.classStandard")}
                              </FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700" data-testid="select-class">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.difficulty")}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700" data-testid="select-difficulty">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="easy">{t("teacherDashboard.easy")}</SelectItem>
                                  <SelectItem value="medium">{t("teacherDashboard.medium")}</SelectItem>
                                  <SelectItem value="hard">{t("teacherDashboard.hard")}</SelectItem>
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                Test Duration
                              </FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700" data-testid="select-duration">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.numQuestions")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={5}
                                  max={50}
                                  className="rounded-xl border-slate-200 dark:border-slate-700"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.questionType")}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700" data-testid="select-test-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="mcq">{t("teacherDashboard.mcqOnly")}</SelectItem>
                                  <SelectItem value="open-ended">{t("teacherDashboard.openEnded")}</SelectItem>
                                  <SelectItem value="mixed">{t("teacherDashboard.mixed")}</SelectItem>
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
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {t("teacherDashboard.gptModel")}
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700" data-testid="select-gpt-model">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="gpt-4o">{t("teacherDashboard.gpt4o")}</SelectItem>
                                  <SelectItem value="gpt-4o-mini">{t("teacherDashboard.gpt4omini")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Syllabus & Topics */}
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {t("teacherDashboard.syllabus")}
                          </FormLabel>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("teacherDashboard.syllabusDesc")}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="topic1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {t("teacherDashboard.topic1")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    placeholder={t("teacherDashboard.topicExample1")}
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
                                <FormLabel className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {t("teacherDashboard.topic2")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    placeholder={t("teacherDashboard.topicExample2")}
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
                                <FormLabel className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {t("teacherDashboard.topic3")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    placeholder={t("teacherDashboard.topicExample3")}
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
                                <FormLabel className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                  {t("teacherDashboard.topic4")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    placeholder={t("teacherDashboard.topicExample4")}
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
                            <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              {t("teacherDashboard.instructions")}
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                className="rounded-xl border-slate-200 dark:border-slate-700 min-h-[70px]"
                                placeholder={t("teacherDashboard.instructionsPlaceholder")}
                                {...field}
                                data-testid="textarea-instructions"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="submit"
                          size="lg"
                          disabled={generateMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 rounded-xl font-bold px-6"
                          data-testid="button-generate"
                        >
                          {generateMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t("teacherDashboard.generating") as string}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              {(t("teacherDashboard.generateTest") as string)}
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => setShowForm(false)}
                          className="rounded-xl border-slate-200 dark:border-slate-700"
                          data-testid="button-cancel"
                        >
                          {t("teacherDashboard.cancel")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- CREATED TESTS SECTION --- */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {t("teacherDashboard.yourTests")}
                <Badge variant="secondary" className="rounded-full font-bold text-xs bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredTests.length}
                </Badge>
              </h2>
            </div>

            {/* Filter Controls */}
            {orderedTests.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tests..."
                    className="pl-9 w-full sm:w-60 rounded-xl h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>

                <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
                  <SelectTrigger className="w-full sm:w-44 rounded-xl h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="all">All Subjects</SelectItem>
                    {SUBJECTS.map((sub) => (
                      <SelectItem key={sub.value} value={sub.value}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Test List Rendering */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Fetching tests...</p>
            </div>
          ) : orderedTests.length === 0 ? (
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    No Tests Created Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("teacherDashboard.noTests")}
                  </p>
                </div>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 font-semibold text-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Your First Test
                </Button>
              </CardContent>
            </Card>
          ) : filteredTests.length === 0 ? (
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 text-sm">
              No tests match your filter search.
            </Card>
          ) : (
            <div className="grid gap-5">
              {filteredTests.map((testItem: any) => {
                const shareCode = testItem.shareCode || testItem.share_code || testItem.sharecode || "";
                const isExpanded = openResultsId === testItem.id;
                const submissionCount = testItem.submissions?.length || 0;

                return (
                  <motion.div
                    key={testItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      data-testid={`test-card-${testItem.id}`}
                    >
                      <CardHeader className="p-6 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {testItem.title || t("teacherDashboard.createCustomTest")}
                              </CardTitle>
                              <Badge
                                variant={testItem.status === "published" ? "default" : "secondary"}
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  testItem.status === "published"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {t(`status.${testItem.status || "published"}`)}
                              </Badge>
                            </div>

                            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {t(`subjects.${(testItem.subject || "").toLowerCase()}`, testItem.subject)}
                              </span>
                              <span>•</span>
                              <span>{t("teacherDashboard.class")} {testItem.classLevel || "—"}</span>
                              <span>•</span>
                              <span>{t(`difficulty.${testItem.difficulty}`)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock3 className="w-3 h-3 text-slate-400" />
                                {testItem.durationMinutes} mins
                              </span>
                            </CardDescription>
                          </div>

                          {/* Share Code Pill Badge */}
                          {shareCode && (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5">
                              <div className="text-left">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Share Code</p>
                                <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{shareCode}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyShareCode(shareCode, testItem.id)}
                                className="h-7 w-7 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                title="Copy Share Code"
                                data-testid={`button-copy-${testItem.id}`}
                              >
                                {copiedCodeId === testItem.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 pb-6 pt-0 space-y-4">
                        {/* Topic / Syllabus Summary */}
                        {testItem.syllabus && (
                          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-700 dark:text-slate-200 mr-1.5">
                              {t("teacherDashboard.topic")}:
                            </span>
                            {testItem.syllabus} • {getQuestionCount(testItem)} {t("teacherDashboard.questions")}
                          </div>
                        )}

                        {/* Action Buttons Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTestId(testItem.id);
                                setShowQuestionsDialog(true);
                              }}
                              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                              data-testid={`button-view-${testItem.id}`}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                              {t("teacherDashboard.viewQuestions")}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQuestionPaper(testItem.id)}
                              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                              data-testid={`button-download-${testItem.id}`}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                              {t("teacherDashboard.downloadPDF")}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyShareCode(shareCode, testItem.id)}
                              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold"
                            >
                              <Share2 className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                              {t("teacherDashboard.copyCode")}
                            </Button>
                          </div>

                          <Button
                            variant={submissionCount > 0 ? "default" : "secondary"}
                            size="sm"
                            onClick={() => setOpenResultsId(isExpanded ? null : testItem.id)}
                            className={`rounded-xl text-xs font-bold transition-all ${
                              submissionCount > 0
                                ? "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5 mr-1.5" />
                            {isExpanded ? "Hide Student Results" : `Student Submissions (${submissionCount})`}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                          </Button>
                        </div>

                        {/* Student Submissions Expanded Drawer */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  Class Submission Log ({submissionCount})
                                </h4>
                              </div>

                              {submissionCount === 0 ? (
                                <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 italic">
                                  No student has submitted answers for this test share code yet.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {testItem.submissions.map((sub: any) => {
                                    const scoreVal = Number(sub.score) || 0;
                                    const totalVal = Number(sub.total_questions) || getQuestionCount(testItem) || 1;
                                    const pct = Math.round((scoreVal / totalVal) * 100);

                                    return (
                                      <div
                                        key={sub.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                                            {(sub.student_name || "S")[0].toUpperCase()}
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">
                                              {sub.student_name || "Student"}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                              Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 self-end sm:self-auto">
                                          <div className="text-right">
                                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                              {scoreVal} / {totalVal}
                                            </span>
                                            <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                                          </div>

                                          <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                                            <Clock3 className="w-3 h-3 text-slate-400" />
                                            {formatTime(sub.time_taken_seconds || 0)}
                                          </div>

                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] font-bold uppercase rounded-full px-2 py-0.5 ${
                                              sub.submission_type === "auto"
                                                ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
                                                : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                                            }`}
                                          >
                                            {sub.submission_type || "manual"}
                                          </Badge>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* --- QUESTIONS PREVIEW DIALOG --- */}
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold rounded-full">
                {questionCount} {t("teacherDashboard.questions")}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">
              {test?.title || t("teacherDashboard.createCustomTest")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {t(`subjects.${test?.subject?.toLowerCase()}`, test?.subject)} • {t("teacherDashboard.class")} {classNumber} • {t(`difficulty.${test?.difficulty}`)} • {test?.durationMinutes} mins
            </DialogDescription>
          </DialogHeader>

          {testDetails?.questions ? (
            <div className="space-y-5 pt-2">
              {testDetails.questions.map((q: any, idx: number) => {
                let options = [];
                if (Array.isArray(q.options)) {
                  options = q.options;
                } else {
                  try {
                    options = JSON.parse(q.options || "[]");
                  } catch {
                    options = [];
                  }
                }

                return (
                  <Card key={q.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="rounded-xl text-xs font-bold">
                          {t("teacherDashboard.question")} {idx + 1}
                        </Badge>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowManualEditDialog(true);
                            }}
                            className="rounded-xl text-xs h-8"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            {t("teacherDashboard.edit")}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(q);
                              setShowAIEditDialog(true);
                            }}
                            className="rounded-xl text-xs h-8 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1 text-purple-600" />
                            {t("teacherDashboard.aiEdit")}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
                        {q.question}
                      </p>

                      {/* MCQ Options Grid */}
                      {options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {t("teacherDashboard.options")}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {options.map((opt: string, optIdx: number) => {
                              const optionLetter = String.fromCharCode(65 + optIdx);
                              const cleanedOption = opt.replace(/^[A-D][.)]?\s*/i, "").trim();
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
                                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                    isCorrect
                                      ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800"
                                      : "bg-slate-50 text-slate-700 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-800"
                                  }`}
                                >
                                  <span>
                                    <strong className="mr-1.5">{optionLetter}.</strong> {cleanedOption}
                                  </span>
                                  {isCorrect && (
                                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold rounded-full px-2 py-0.5 border-0">
                                      {t("teacherDashboard.correctOptionLabel", { defaultValue: "Correct" })}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Open Ended Answer */}
                      {q.questionType === "open-ended" && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            {t("teacherDashboard.modelAnswer")}
                          </p>
                          <p className="text-xs text-emerald-900 dark:text-emerald-200">{q.correctAnswer}</p>
                        </div>
                      )}

                      {/* Explanation Callout */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-1">
                          <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                            {t("teacherDashboard.explanation")}
                          </p>
                          <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Submissions Summary List Inside Dialog */}
              {Array.isArray(testDetails?.submissions) && testDetails.submissions.length > 0 && (
                <Card className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Users className="h-4 w-4 text-blue-600" />
                      Student Attempts Log ({testDetails.submissions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {testDetails.submissions.map((submission: any) => (
                      <div
                        key={submission.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white dark:bg-slate-900 p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {submission.studentName || "Student"}
                          </p>
                          <p className="text-slate-500">
                            Score: {submission.score}/{test?.numQuestions || 0} • Time: {Math.max(0, Math.floor((submission.timeTakenSeconds || 0) / 60))} min {Math.max(0, (submission.timeTakenSeconds || 0) % 60)} sec
                          </p>
                        </div>
                        <Badge variant="secondary" className="font-bold">
                          {submission.score} / {test?.numQuestions || 0}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MANUAL EDIT QUESTION DIALOG --- */}
      {editingQuestion && (
        <Dialog open={showManualEditDialog} onOpenChange={setShowManualEditDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t("teacherDashboard.editQuestion")}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
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
                    description: "Please reopen the test and try editing again.",
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

      {/* --- AI REFINE QUESTION DIALOG --- */}
      {editingQuestion && (
        <Dialog open={showAIEditDialog} onOpenChange={setShowAIEditDialog}>
          <DialogContent className="max-w-xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {t("teacherDashboard.aiEdit")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {t("teacherDashboard.aiEditDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t("teacherDashboard.currentQuestion")}
                </p>
                <p className="text-slate-600 dark:text-slate-400">{editingQuestion.question}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {t("teacherDashboard.feedbackLabel")}
                </label>
                <Textarea
                  placeholder="e.g., 'Make it more challenging', 'Simplify the options', 'Fix option B', 'Add explanation'..."
                  value={aiEditFeedback}
                  onChange={(e) => setAIEditFeedback(e.target.value)}
                  rows={4}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs"
                  data-testid="textarea-ai-feedback"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => {
                    if (aiEditFeedback.trim().length < 10) {
                      toast({
                        variant: "destructive",
                        title: "Feedback too short",
                        description: "Please provide at least 10 characters of feedback",
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
                  disabled={aiEditMutation.isPending || aiEditFeedback.trim().length < 10}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs"
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
                  className="rounded-xl text-xs"
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
  const [correctOption, setCorrectOption] = useState(question.correctOption || "A");
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation);

  const isMCQ = question.questionType === "mcq";

  return (
    <div className="space-y-4 pt-2 text-xs">
      <div className="space-y-1.5">
        <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {t("teacherDashboard.question")}
        </label>
        <Textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
          data-testid="textarea-question"
        />
      </div>

      {isMCQ ? (
        <>
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t("teacherDashboard.options")}
            </label>
            {options.map((opt: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="font-bold text-slate-500 w-5">
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
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  data-testid={`input-option-${idx}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t("teacherDashboard.correctOption")}
            </label>
            <Select value={correctOption} onValueChange={setCorrectOption}>
              <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs" data-testid="select-correct-option">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
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
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {t("teacherDashboard.correctAnswer")}
          </label>
          <Textarea
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            rows={2}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
            data-testid="textarea-correct-answer"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {t("teacherDashboard.explanation")}
        </label>
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
          data-testid="textarea-explanation"
        />
      </div>

      <div className="flex gap-2 pt-2">
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
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
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

        <Button variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-xl text-xs">
          {t("teacherDashboard.cancel")}
        </Button>
      </div>
    </div>
  );
}
