import AnimatedBackground from "@/components/AnimatedBackground";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Languages, BookOpen, Sparkles, Trophy, RotateCcw, GraduationCap, Book, Library, ScrollText, Atom, Beaker, Dna, Zap, Settings2, Loader2, ArrowRight } from "lucide-react";
import LanguageCard from "@/components/LanguageCard";
import SelectionGrid from "@/components/SelectionGrid";
import ChapterList from "@/components/ChapterList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeaderboardCard from "@/components/LeaderboardCard";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getTopicValidationMessage } from "@/lib/topicValidation";
import { getStoredAuthRole, getStoredTeacherId } from "@/lib/authSession";
import {
  loadRemoteScoreHistory,
  loadScoreHistory,
  mergeScoreHistoryEntries,
  resetRemoteScoreHistory,
  resetScoreHistory,
  type ScoreHistoryEntry,
} from "@/lib/scoreHistory";

import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

import { useTranslation } from "react-i18next";

import { useForm } from "react-hook-form";
// import { toast } from "@/components/ui/use-toast";

// import React{ userEffect, useState} from "react";
import {auth, db} from "./firebase";
// import {doc, getDoc} from "firebase/firestore"; 

// function profile(){
//   const[userDetails, setUserDetails]=useState(null);
//   const fetchUserDetails=async()=>{
//     auth.onAuthStateChanged(async(user)=>{
//       console.log(user);
//       setUserDetails(user);
//     });
//   };
//   useEffect(()=>{
//     fetchUserDetails();
//   }, []);
// }

// const [leaderboard, setLeaderboard] = useState([]);

export interface LocalizedText {
  english: string;
  hindi: string;
}

export interface Chapter {
  id: number;
  title: LocalizedText;
  description: LocalizedText;
}

interface StudentProfileData {
  fullName?: string | null;
  emailAddress?: string | null;
  classLevel?: number | string | null;
  school?: string | null;
  medium?: string | null;
  board?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
}

// const [chapters, setChapters] = useState<Chapter[]>([]);

export default function Home() {


  const hasInitialized = useRef(false);  
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<"mode" | "subject" | "class" | "difficulty" | "testType" | "testLength" | "testMode" | "chapter" | "customTopics" | "custom">("mode");
  const [selectedMode, setSelectedMode] = useState<string>("");
  // const [selectedLanguage, setSelectedLanguage] = useState<string>("");
// Subject language (French, German etc)
// Subject language (French etc)
const [selectedSubjectLanguage, setSelectedSubjectLanguage] =
  useState<string>("");

// Medium (English / Hindi)
const [selectedMedium, setSelectedMedium] =
  useState<"english" | "hindi">("english");

  const [leaderboard, setLeaderboard] = useState<ScoreHistoryEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const storedAuthRole = getStoredAuthRole();
  const storedTeacherId = getStoredTeacherId();
  const isTeacherSession = storedAuthRole === "teacher" || Boolean(storedTeacherId);
  const isStudentSession = storedAuthRole === "student" || Boolean(currentUser);

const availableLanguageSubjectKeys: string[] = ["french", "german", "spanish", "hindi", "marathi", "kannada"];
const scienceSubjectKeysByClass: Record<"primary" | "secondary", string[]> = {
  primary: [
    "school_english",
    "school_hindi",
    "school_mathematics",
    "school_science",
    "school_social_science",
    "school_computer",
  ],
  secondary: ["physics", "chemistry", "biology", "general"],
};

// Science category
const [selectedScienceCategory, setSelectedScienceCategory] =
  useState<string>("");
  // const [selectedScienceCategory, setSelectedScienceCategory] = useState<"english" | "hindi">("english");
const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedClass, setSelectedClass] = useState<number>(6);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<string>("");
  const [selectedTestLength, setSelectedTestLength] = useState<number>(0);
  const [selectedTestMode, setSelectedTestMode] = useState<string>(""); // "predefined" or "custom"
  const [customTopic1, setCustomTopic1] = useState<string>("");
  const [customTopic2, setCustomTopic2] = useState<string>("");
  const [customTopic3, setCustomTopic3] = useState<string>("");
  const [customTopic4, setCustomTopic4] = useState<string>("");
  const [customTopic5, setCustomTopic5] = useState<string>("");
  const [customTopic6, setCustomTopic6] = useState<string>("");

  const [selectedGptModel, setSelectedGptModel] = useState<string>("gpt-5.2");
// const [selectedGptModel, setSelectedGptModel] = useState<string>("ft:gpt-4.1-mini-2025-04-14:maxbrain-technologies:430-example:E4OP0nFv");
const [selectedBoard, setSelectedBoard] = useState<string>("CBSE");
const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  // const [chapters, setChapters] = useState<Array<{ id: number; title: string; description: string }>>([]);
    const [chapters, setChapters] = useState<Chapter[]>([])

  const stepSectionRef = useRef<HTMLDivElement | null>(null);

  const resolvedProfileFullName = String(
    studentProfile?.fullName ?? currentUser?.displayName ?? "",
  ).trim();
  const resolvedProfileEmail = String(
    studentProfile?.emailAddress ?? currentUser?.email ?? "",
  ).trim();

  const studentProfileComplete = Boolean(
    resolvedProfileFullName &&
      resolvedProfileEmail &&
      String(studentProfile?.classLevel ?? "").trim() &&
      String(studentProfile?.school ?? "").trim() &&
      String(studentProfile?.medium ?? "").trim() &&
      String(studentProfile?.board ?? "").trim() &&
      String(studentProfile?.country ?? "").trim() &&
      String(studentProfile?.state ?? "").trim() &&
      String(studentProfile?.city ?? "").trim()
  );

  useEffect(() => {
    setStep("mode");
    setSelectedMode("");
    setSelectedSubjectLanguage("");
    setSelectedMedium("english");
    setSelectedScienceCategory("");
    setSelectedLanguage("english");
    setSelectedClass(0);
    setSelectedDifficulty("");
    setSelectedTestType("");
    setSelectedTestLength(0);
    setSelectedTestMode("");
    setCustomTopic1("");
    setCustomTopic2("");
    setCustomTopic3("");
    setCustomTopic4("");
    setCustomTopic5("");
    setCustomTopic6("");
    setChapters([]);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Reset to mode screen when component mounts/location changes to home
  // useEffect(() => {
    // setStep("mode");
    // setSelectedMode("");
    // setSelectedLanguage("");
    // setSelectedScienceCategory("");
    // setSelectedClass(0);
    // setSelectedDifficulty("");
    // setSelectedTestType("");
    // setSelectedTestLength(0);
    // setSelectedTestMode("");

    // // Scroll to the mode selection section after state updates
    // setTimeout(() => {
    //   const modeSection = document.querySelector('[data-section="mode-selection"]');
    //   if (modeSection) {
    //     modeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //   } else {
    //     window.scrollTo({ top: 0, behavior: 'smooth' });
    //   }
    // }, 100);
  // }, [location.pathname]);

  // Load chapters when subject is selected

  const handleStudentCustomMCQ = () => {
    if (isStudentSession) {
      navigate("/custom-test");
      return;
    }

    navigate("/student-login", {
      state: {
        redirectTo: "/custom-test",
      },
    });
  };
  const handleBack = () => {
  if (!studentProfileComplete && step === "class") {
    handleReset();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }

  setStep((prev) => {
    switch (prev) {
      case "subject":
        return "mode";
      case "class":
        return "subject";
      case "difficulty":
        return "class";
      case "testType":
        return "difficulty";
      case "testLength":
        return "testType";
      case "testMode":
        return "testLength";
      case "customTopics":
        return "testMode";
      case "chapter":
        return "testMode";
      case "custom":
        return "mode";
      default:
        return "mode";
    }
  });
};

//   useEffect(() => {
//     if (step === "chapter") {
//       const subject = selectedMode === "science" ? selectedScienceCategory : selectedLanguage;
//       if (subject) {
//         fetch(`/api/chapters/${subject}`)
//           .then(res => res.json())
//           .then(data => setChapters(data))
//           .catch(err => console.error("Error loading chapters:", err));
//       }
//     }
//   }, [selectedLanguage, selectedScienceCategory, selectedMode, step]);

//   // Load leaderboard from local storage
//   // const [leaderboard, setLeaderboard] = useState<Array<any>>([]);
//   // const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const effectiveClassLevel = Number(studentProfile?.classLevel ?? selectedClass ?? 6) || 6;

  const availableLanguageSubjects = useMemo<string[]>(() => {
    if (effectiveClassLevel < 6) {
      return [];
    }

    return availableLanguageSubjectKeys;
  }, [effectiveClassLevel]);

  const availableScienceCategories = useMemo<string[]>(() => {
    if (effectiveClassLevel >= 9) {
      return scienceSubjectKeysByClass.secondary;
    }

    if (effectiveClassLevel >= 6) {
      return scienceSubjectKeysByClass.primary;
    }

    return [];
  }, [effectiveClassLevel]);

  useEffect(() => {
    if (!currentUser) {
      setStudentProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(
          `/api/student-profile?userId=${encodeURIComponent(currentUser.uid)}`,
          { credentials: "include" },
        );

        if (!res.ok) {
          if (res.status === 404) {
            if (cancelled) return;
            setStudentProfile(null);
            setSelectedClass(6);
            setSelectedBoard("CBSE");
            return;
          }
          throw new Error(`Failed to load profile: ${res.status}`);
        }

        const profile = await res.json();
        if (cancelled) return;
        setStudentProfile(profile);
        setSelectedClass(Number(profile?.classLevel) || 6);
        setSelectedBoard(String(profile?.board || "CBSE"));
      } catch (error) {
        console.error("Failed to load student profile:", error);
        if (!cancelled) {
          setStudentProfile(null);
          setSelectedClass(6);
          setSelectedBoard("CBSE");
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser, navigate, location.key]);

  useEffect(() => {
    if (!studentProfile) return;

    if (
      selectedMode === "language" &&
      selectedSubjectLanguage &&
      !availableLanguageSubjects.includes(selectedSubjectLanguage)
    ) {
      setSelectedSubjectLanguage("");
    }

    if (
      selectedMode === "science" &&
      selectedScienceCategory &&
      !availableScienceCategories.includes(selectedScienceCategory)
    ) {
      setSelectedScienceCategory("");
    }
  }, [studentProfile, selectedMode, selectedSubjectLanguage, selectedScienceCategory, availableLanguageSubjects, availableScienceCategories]);

  const scienceSubjectLabelKey =
    selectedScienceCategory === "general"
      ? "subject_general_science"
      : `subject_${selectedScienceCategory.replace(/^school_/, "")}`;

  useEffect(() => {
    const loadHistory = async () => {
      const localHistory = loadScoreHistory();

      if (!currentUser) {
        setLeaderboard(localHistory);
        return;
      }

      try {
        const remoteHistory = await loadRemoteScoreHistory(currentUser.uid);
        setLeaderboard(mergeScoreHistoryEntries(remoteHistory, localHistory));
      } catch (error) {
        console.warn("Failed to load remote score history", error);
        setLeaderboard(localHistory);
      }
    };

    void loadHistory();
  }, [currentUser]);

//  useEffect(() => {
//   const fetchChapters = async () => {
//     const res = await fetch(`/api/chapters/${selectedSubjectLanguage}`);
//     const data = await res.json();

//     setChapters(
//       data.map((ch: any) => ({
//         id: ch.id,
//         title: {
//           english: ch.title,
//           hindi: ch.title
//         },
//         description: {
//           english: ch.description,
//           hindi: ch.description
//         }
//       }))
//     );
//   };

//   fetchChapters();
// }, []);

// useEffect(() => {
//   const fetchChapters = async () => {
//     try {
//       const res = await fetch(`/api/chapters/${selectedSubjectLanguage}`);
//       const data = await res.json();

//       console.log("API Response:", data);

//       // Ensure data is array
//       if (!Array.isArray(data)) {
//         console.error("Chapters API did not return an array");
//         return;
//       }

//       const mappedChapters: Chapter[] = data.map((ch: any) => ({
//         id: ch.id,
//         title: {
//           english: ch.title,
//           hindi: ch.title,
//         },
//         description: {  
//           english: ch.description,
//           hindi: ch.description,
//         },
//       }));

//       setChapters(mappedChapters);
//     } catch (error) {
//       console.error("Failed to fetch chapters:", error);
//     }
//   };

//   if (selectedSubjectLanguage) {
//     fetchChapters();
//   }
// }, [selectedSubjectLanguage]);

useEffect(() => {
  if (step !== "chapter") return;

  const subject =
    selectedMode === "science"
      ? selectedScienceCategory
      : selectedSubjectLanguage;

  if (!subject) return;

  const fetchChapters = async () => {
    try {
      const params = new URLSearchParams();
      const chapterClassLevel = selectedClass || effectiveClassLevel;
      if (chapterClassLevel) {
        params.set("classLevel", String(chapterClassLevel));
      }
      if (selectedBoard) {
        params.set("board", selectedBoard);
      }

      const query = params.toString();
      const endpoint = `/api/chapters/${encodeURIComponent(subject)}${query ? `?${query}` : ""}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("API did not return array:", data);
        return;
      }

      const mappedChapters = data.map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        description: ch.description,
      }));

      setChapters(mappedChapters);
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
    }
  };

  fetchChapters();
}, [step, selectedSubjectLanguage, selectedScienceCategory, selectedMode, selectedClass, selectedBoard]);

  // 🔒 Save scroll position BEFORE step change
  useEffect(() => {
    if (!stepSectionRef.current) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    requestAnimationFrame(() => {
      stepSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });
  }, [step]);

  const handleResetScores = () => {
    resetScoreHistory();
    setLeaderboard([]);
    if (currentUser) {
      void resetRemoteScoreHistory(currentUser.uid).catch((error) => {
        console.warn("Failed to reset remote score history", error);
      });
    }
    toast({
      title: t("scores_reset_title"),
      description: t("scores_reset_desc"),
    });
  };


  // Helper function to scroll to top smoothly
  // const ScrollRestoration = () => {
  //   setTimeout(() => {
  //     window.scrollTo({ top: 0, behavior: 'smooth' });
  //   }, 50);
  // };

  // const handleModeSelect = (mode: string) => {
  //   setSelectedMode(mode);
  //   if (mode === "custom") {
  //     setStep("custom");
  //   } else {
  //     setStep("subject");
  //   }
  //   // ScrollRestoration();  
  // };

  const handleModeSelect = (mode: string) => {
  const auth = getAuth();
  const user = auth.currentUser;

  // 🔒 Login required only for these
  if (mode === "language" || mode === "science") {
    if (!user) {
      navigate("/login");
      return;
    }
  }

  setSelectedMode(mode);

  if ((mode === "science" || mode === "language") && !studentProfileComplete) {
    setStep("class");
    return;
  }

  if (mode === "custom") {
    setStep("custom");
  } else {
    setStep("subject");
  }
};

  const handleMediumSelect = (medium: "english" | "hindi") => {
  setSelectedMedium(medium);
  };

  const handleSubjectLanguageSelect = (language: string) => {
  setSelectedSubjectLanguage(language);
  setStep("class");
  };

  const handleScienceCategorySelect = (category: string) => {
    setSelectedScienceCategory(category);
    setStep("class");
    // ScrollRestoration();
  };

  const handleClassSelect = (classNum: string | number) => {
    setSelectedClass(classNum as number);
    setStep("difficulty");
    // ScrollRestoration();
  };

  const handleDifficultySelect = (difficulty: string | number) => {
    setSelectedDifficulty(difficulty as string);
    // Science mode always uses MCQ-only tests, so skip test type selection
    if (selectedMode === "science") {
      setSelectedTestType("mcq-only");
      setStep("testLength");
    } else {
      setStep("testType");
    }
    // ScrollRestoration();
  };

  const handleTestTypeSelect = (testType: string) => {
    setSelectedTestType(testType);
    setStep("testLength");
    // ScrollRestoration();
  };

  const handleTestLengthSelect = (length: string | number) => {
    setSelectedTestLength(length as number);
    setStep("testMode");
    // ScrollRestoration();
  };

  const handleTestModeSelect = (mode: string) => {
    setSelectedTestMode(mode);
    if (mode === "predefined") {
      setStep("chapter");
    } else {
      setStep("customTopics");
    }
    // ScrollRestoration();
  };

  // const handleCustomTestGenerate = async () => {
  //   // Validate that at least topic 1 is filled
  //   if (!customTopic1.trim()) {
  //     toast({
  //       title: "Topic Required",
  //       description: "Please enter at least one topic (Topic 1 is mandatory)",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // Collect topics
  //   const topics = [customTopic1, customTopic2, customTopic3, customTopic4]
  //     .filter(t => t && t.trim().length > 0)
  //     .join(', ');

  const handleCustomTestGenerate = async () => {
  // ✅ Validate first 3 required topics
    if (
      !customTopic1.trim() ||
      !customTopic2.trim() ||
      !customTopic3.trim()
    ) {
      toast({
        title: t("required_topics_missing_title"),
        description: t("required_topics_missing_desc"),
        variant: "destructive",
      });
      return;
    }

    const subject =
      selectedMode === "science" ? selectedScienceCategory : selectedSubjectLanguage;

    const topicList = [
      customTopic1,
      customTopic2,
      customTopic3,
      customTopic4,
      customTopic5,
      customTopic6,
    ]
      .map((topic) => topic.trim())
      .filter((topic) => topic.length > 0);

    const topicValidationMessage = await getTopicValidationMessage({
      classLevel: selectedClass,
      subject,
      topics: topicList,
    });

    if (topicValidationMessage) {
      toast({
        title: t("invalid_topics_title"),
        description: topicValidationMessage,
        variant: "destructive",
      });
      return;
    }

    const topics = topicList.join(", ");


    try {
      setIsGeneratingTest(true);
      // Generate test via API
      const response = await apiRequest("POST", "/api/student/generate-custom-test", {
        subject,
        classLevel: effectiveClassLevel,
        difficulty: selectedDifficulty,
        syllabus: topics,
        numQuestions: selectedTestLength,
        subjectLanguage: selectedSubjectLanguage,
        scienceCategory: selectedScienceCategory,
        medium: selectedMedium,
        testLanguage: selectedMedium,
        testType: selectedTestType === "mcq-only" ? "mcq" : "mixed",
        gptModel: selectedGptModel,
        board: selectedBoard,
        mode: selectedMode,
        userId: currentUser?.uid,
        studentId: currentUser?.uid,
      });

      const data = await response.json();

      // Navigate to test page with generated questions
      navigate('/test', {
        state: {
          config: {
            mode: "custom-student",
            language: selectedMedium,
            testLanguage: selectedMedium,
            subjectLanguage: selectedMode === "science" ? undefined : selectedSubjectLanguage,
            scienceCategory: selectedMode === "science" ? selectedScienceCategory : undefined,
            class: effectiveClassLevel,
            difficulty: selectedDifficulty,
            testType: selectedTestType,
            testLength: selectedTestLength,
            chapter: 0,
            customTestId: data.testId,
            customQuestions: data.questions,
          }
        }
      });

      toast({
        title: t("test_generated_title"),
        description: t("test_generated_desc", {
          count: data.questionsGenerated,
        }),
      });
    } catch (error: any) {
      toast({
        title: t("generation_failed_title"),
        description: error.message || t("generation_failed_desc"),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleChapterSelect = (chapterId: number) => {
    navigate('/test', {
      state: {
        config: {
          mode: selectedMode,
          language: preDefinedChapterMedium,
          testLanguage: preDefinedChapterMedium,
          subjectLanguage: selectedMode === "science" ? undefined : selectedSubjectLanguage,
          scienceCategory: selectedMode === "science" ? selectedScienceCategory : undefined,
          class: effectiveClassLevel,
          difficulty: selectedDifficulty,
          testType: selectedTestType,
          testLength: selectedTestLength,
          chapter: chapterId,
        }
      }
    });
  };

  const handleReset = () => {
    setStep("mode");
    setSelectedMode("");
    setSelectedLanguage("");
    setSelectedScienceCategory("");
    setSelectedClass(0);
    setSelectedDifficulty("");
    setSelectedTestType("");
    setSelectedTestLength(0);
    setSelectedTestMode("");
    setCustomTopic1("");
    setCustomTopic2("");
    setCustomTopic3("");
    setCustomTopic4("");
    setCustomTopic5("");
    setCustomTopic6("");
    setChapters([]);
    setSelectedMedium("english");
    setSelectedGptModel("gpt-4o-mini");
    setSelectedBoard("CBSE");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // ScrollRestoration();
  };

  const { t, i18n } = useTranslation();
  const form = useForm({
    defaultValues: {
      language: "english",
    },
  });
  const isHindi = i18n.language.startsWith("hi");
  const preDefinedChapterMedium =
    selectedMode === "science" && selectedScienceCategory === "school_hindi"
      ? "hindi"
      : selectedMode === "science" && selectedScienceCategory === "school_english"
        ? "english"
        : selectedMedium;
  const configuredSubjectLabel = selectedMode === "science"
    ? t(scienceSubjectLabelKey)
    : selectedMode === "language"
      ? t(`subject_${selectedSubjectLanguage}`)
      : "";

  const scienceCategoryOptions =
    effectiveClassLevel >= 9
      ? {
          physics: {
            icon: Atom,
            color: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
            label: t("subject_physics"),
          },
          chemistry: {
            icon: Beaker,
            color: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
            label: t("subject_chemistry"),
          },
          biology: {
            icon: Dna,
            color: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
            label: t("subject_biology"),
          },
          general: {
            icon: Zap,
            color: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400",
            label: t("subject_general_science"),
          },
        }
      : {
          school_english: {
            icon: BookOpen,
            color: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
            label: t("subject_english"),
          },
          school_hindi: {
            icon: Book,
            color: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
            label: t("subject_hindi"),
          },
          school_mathematics: {
            icon: Library,
            color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
            label: t("subject_mathematics"),
          },
          school_science: {
            icon: Atom,
            color: "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400",
            label: t("subject_science"),
          },
          school_social_science: {
            icon: ScrollText,
            color: "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400",
            label: t("subject_social_science"),
          },
          school_computer: {
            icon: Settings2,
            color: "bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400",
            label: t("subject_computer"),
          },
        };

  return (

    //<AnimatedBackground />

    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background shapes */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none"> */}
        {/* <div className="absolute inset-0 overflow-hidden pointer-events-none z-10"> */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hero Header - Premium Design */}
       <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 dark:from-gray-900 dark:via-gray-800 dark:to-black overflow-hidden">
      {/* <div className="relative overflow-hidden"> */}
       {/* <div className="relative overflow-hidden z-10 min-h-[600px]"> */}

        {/* Particles Background */}
         <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          {/* <AnimatedBackground /> */}
        </div>
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left Content */}
            <div className={`text-white ${isHindi ? "space-y-3 sm:space-y-4" : "space-y-6 sm:space-y-8"}`}>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <GraduationCap className="w-5 h-5" />
                <span className="text-sm font-semibold">{t("ai_platform")}</span>
              </div>

              {/* <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"> */}
                <h1
                  className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent
                  ${
                    isHindi
                      ? "mb-1 text-3xl sm:text-4xl lg:text-5xl leading-[0.9] tracking-tight"
                      : "mb-6 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight"
                  }`}
                >

                <span className="block text-white">
                  {t("hero_smart")}
                </span>

                <span className="block bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  {t("hero_ai_practice")}
                </span>

                <span className="block text-purple-200">
                  {t("hero_students")}
                </span>

              </h1>

              <p className="text-base sm:text-lg text-white/90 max-w-xl">
                {t("hero_desc")}
              </p>

              <div className="flex flex-wrap gap-3">

                <Badge variant="secondary" className="text-sm font-semibold bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ✓ {t("six_languages")}
                </Badge>

                <Badge variant="secondary" className="text-sm font-semibold bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ✓ {t("four_subjects")}
                </Badge>

                <Badge variant="secondary" className="text-sm font-semibold bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ✓ {t("free_until")}
                </Badge>

              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">

                <Button 
                  onClick={() => handleModeSelect("language")}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-6 text-base sm:text-lg rounded-lg transition-all transform hover:scale-105"
                >
                  {t("start_learning")}
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => navigate("/features")}
                  className="border-white text-white hover:bg-white/10 font-bold py-4 px-6 text-base sm:text-lg rounded-lg"
                >
                  {t("explore_features")}
                </Button>

              </div>

            </div>


            {/* Right Stats */}
            <div className="hidden lg:grid grid-cols-2 gap-6">

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5 text-white text-center hover:bg-white/20 transition">
                <Sparkles className="w-9 h-9 mx-auto mb-2 text-yellow-300" />
                <p className="text-2xl font-semibold">10,000+</p>
                <p className="text-white/80 text-sm sm:text-base">{t("ai_questions")}</p>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5 text-white text-center hover:bg-white/20 transition">
                <Trophy className="w-9 h-9 mx-auto mb-2 text-orange-300" />
                <p className="text-2xl font-semibold">5,000+</p>
                <p className="text-white/80 text-sm sm:text-base">{t("active_students")}</p>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5 text-white text-center hover:bg-white/20 transition">
                <BookOpen className="w-9 h-9 mx-auto mb-2 text-green-300" />
                <p className="text-2xl font-semibold">150+</p>
                <p className="text-white/80 text-sm sm:text-base">{t("chapters_topics")}</p>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-5 text-white text-center hover:bg-white/20 transition">
                <Zap className="w-9 h-9 mx-auto mb-2 text-blue-300" />
                <p className="text-2xl font-semibold">{t("realtime")}</p>
                <p className="text-white/80 text-sm sm:text-base">{t("ai_feedback")}</p>
              </Card>

            </div>

          </div>
          </div>
        </div>


      {/* <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl" data-section="mode-selection"> */}
      <div
        ref={stepSectionRef}
        className="relative z-20 container mx-auto px-4 py-6 max-w-6xl sm:px-6 sm:py-8"
        data-section="mode-selection"
      >
        {step === "mode" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Mode Selection */}
            <div className="space-y-4">
              {/* <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Quiz Mode</h2>
                <p className="text-base text-muted-foreground">Select between language learning or science quizzes</p>
              </div> */}

              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  {t("choose_quiz_mode")}
                </h2>

                <p className="text-base text-muted-foreground">
                  {t("quiz_mode_desc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <Card 
                  className="
                    p-8 text-center cursor-pointer transition-all rounded-2xl
                    border duration-300

                    bg-[rgb(235,245,255)]
                    dark:bg-[rgb(32,42,60)]

                    border-[rgb(180,195,230)]
                    dark:border-[rgb(70,85,115)]

                    hover:scale-[1.06]
                    hover:bg-[rgb(220,235,255)]
                    dark:hover:bg-[rgb(42,55,78)]

                    hover:border-primary
                    hover:shadow-[0_0_40px_rgba(55,97,186,0.55)]
                    dark:hover:shadow-[0_0_45px_rgba(55,97,186,0.8)]
                  "

                  onClick={() => {
                    const auth = getAuth();
                    if (!auth.currentUser) {
                      navigate("/login");
                    } else {
                      handleModeSelect("language");
                    }
                  }}
                  data-testid="card-mode-language"
                >
                  <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                    <Languages className="w-12 h-12 text-primary" />
                  </div>
                  {/* <h3 className="text-xl font-bold mb-2">Language Learning</h3>
                  <p className="text-base text-muted-foreground">
                    Practice French, German, Spanish, Hindi, Marathi, and Kannada
                  </p>
                  <Badge variant="secondary" className="mt-4 text-base">6 Languages</Badge> */}

                  <h3 className="text-xl font-bold mb-2">
                    {t("language_learning")}
                  </h3>

                  <p className="text-base text-muted-foreground">
                    {t("language_learning_desc")}
                  </p>

                  <Badge variant="secondary" className="mt-4 text-base">
                    {t("six_languages")}
                  </Badge>
                </Card>


                <Card 
                  className="
                    p-8 text-center cursor-pointer transition-all rounded-2xl
                    border-2

                    /* OUTLINE COLOR */
                    border-[rgb(245,158,11)]          /* brighter orange */
                    dark:border-[rgb(255,180,60)]     /* darker orange for dark mode */

                    /* INSIDE BG (instead of pure white) */
                    bg-[rgb(255,243,205)]             /* soft light orange */
                    dark:bg-[rgb(55,45,20)]           /* dark warm orange */

                    /* TEXT COLOR */
                    text-[rgb(80,40,0)]                /* dark text for light bg */
                    dark:text-[rgb(255,220,120)]       /* light text for dark bg */

                    /* HOVER EFFECT */
                    hover:scale-[1.05]

                    hover:bg-[rgb(255,229,153)]       /* slightly brighter on hover */
                    dark:hover:bg-[rgb(70,55,25)]     /* dark mode hover */

                    hover:shadow-[0_0_30px_rgba(245,158,11,0.45)]
                    dark:hover:shadow-[0_0_40px_rgba(255,180,60,0.7)]

                    duration-300
                  "


                  onClick={() => {
                    const auth = getAuth();
                    if (!auth.currentUser) {
                      navigate("/login");
                    } else {
                      handleModeSelect("science");
                    }
                  }}
                  data-testid="card-mode-science"
                >
                  <div className="inline-flex p-4 bg-accent/10 rounded-full mb-4">
                    <BookOpen className="w-12 h-12 text-accent" />
                  </div>
                  {/* <h3 className="text-xl font-bold mb-2">General Science Quiz</h3>
                  <p className="text-base text-muted-foreground">
                    Test your knowledge in Physics, Chemistry, Biology, and more
                  </p>
                  <Badge variant="secondary" className="mt-4 text-base">4 Categories</Badge> */}
                  <h3 className="text-xl font-bold mb-2">
                    {t("science_quiz")}
                  </h3>

                  <p className="text-base text-muted-foreground">
                    {t("science_quiz_desc")}
                  </p>

                  <Badge variant="secondary" className="mt-4 text-base">
                    {t("four_categories")}
                  </Badge>
                </Card>


                <Card 
                  className="
                    p-8 text-center cursor-pointer transition-all rounded-2xl
                    border duration-300

                    /* INSIDE BG */
                    bg-[rgb(245,235,255)]
                    dark:bg-[rgb(40,32,60)]

                    /* BORDER COLOR */
                    border-[rgb(195,180,230)]
                    dark:border-[rgb(85,70,115)]

                    /* HOVER EFFECT */
                    hover:scale-[1.06]
                    hover:bg-[rgb(235,220,255)]
                    dark:hover:bg-[rgb(55,42,78)]

                    hover:border-purple-500
                    hover:shadow-[0_0_40px_rgba(128,0,128,0.55)]
                    dark:hover:shadow-[0_0_45px_rgba(160,32,240,0.8)]
                  "

                  onClick={() => handleModeSelect("custom")}
                  data-testid="card-mode-custom"
                >
                  <div className="inline-flex p-4 bg-purple-500/10 rounded-full mb-4">
                    <GraduationCap className="w-12 h-12 text-purple-600" />
                  </div>
                  {/* <h3 className="text-xl font-bold mb-2">Custom MCQ</h3>
                  <p className="text-base text-muted-foreground">
                    Teachers create tests, students take them
                  </p>
                  <Badge variant="secondary" className="mt-4 text-base">Teacher/Student</Badge> */}

                  <h3 className="text-xl font-bold mb-2">
                    {t("custom_mcq")}
                  </h3>

                  <p className="text-base text-muted-foreground">
                    {t("custom_mcq_desc")}
                  </p>

                  <Badge variant="secondary" className="mt-4 text-base">
                    {t("teacher_student")}
                  </Badge>

                </Card>


                <Card 
                  className="
                    p-8 text-center cursor-pointer transition-all rounded-2xl
                    border-2

                    /* OUTLINE COLOR */
                    border-[rgb(52,211,153)]        
                    dark:border-[rgb(16,185,129)]    

                    /* INSIDE BG */
                    bg-[rgb(236,253,245)]            
                    dark:bg-[rgb(5,50,30)]           

                    /* TEXT COLOR */
                    text-[rgb(22,101,52)]           
                    dark:text-[rgb(110,255,200)]     

                    /* HOVER EFFECT */
                    hover:scale-[1.05]
                    hover:bg-[rgb(200,250,230)]      
                    dark:hover:bg-[rgb(10,70,40)]    

                    hover:shadow-[0_0_30px_rgba(52,211,153,0.45)]
                    dark:hover:shadow-[0_0_40px_rgba(16,185,129,0.7)]

                    duration-300
                  "

                  onClick={() => {
                    const auth = getAuth();
                    if (!auth.currentUser) {
                      navigate("/login");
                    } else {
                      navigate("/answer-evaluator");
                    }
                  }}
                  data-testid="card-answer-evaluator"
                >
                  <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-4">
                    <ScrollText className="w-12 h-12 text-green-600" />
                  </div>
                  {/* <h3 className="text-xl font-bold mb-2">Answer Sheet Evaluator</h3>
                  <p className="text-base text-muted-foreground">
                    AI-powered evaluation of handwritten answer sheets
                  </p>
                  <Badge variant="secondary" className="mt-4 text-base">Upload & Evaluate</Badge>
                </Card> */}
                  <h3 className="text-xl font-bold mb-2" >
                    {t("answer_sheet")}
                  </h3>

                  <p className="text-base text-muted-foreground">
                    {t("answer_sheet_desc")}
                  </p>

                  <Badge variant="secondary" className="mt-4 text-base">
                    {t("upload_evaluate")}
                  </Badge>
                  </Card>
              </div>
            </div>

            {/* Leaderboard Section */}
            {leaderboard.length > 0 && (
              <div className="max-w-2xl mx-auto mt-12">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-lg sm:text-xl font-bold">
                      {t("score_history")}
                    </h2>
                  </div>
                </div>
                <LeaderboardCard entries={leaderboard} />
              </div>
            )}
          </div>
        )}

        {step === "custom" && (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center mb-8">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {t("custom_mcq_platform")}
              </h2>

              <p className="text-base text-muted-foreground">
                {t("choose_role")}
              </p>
            </div>

            {isTeacherSession ? (
              <div className="mx-auto max-w-xl">
                <Card
                  className="cursor-pointer border-2 border-primary p-8 text-center transition-all hover-elevate"
                  onClick={() => navigate("/teacher-dashboard")}
                  data-testid="card-role-teacher"
                >
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                    <GraduationCap className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{t("teacher_dashboard")}</h3>
                  <p className="text-base text-muted-foreground">
                    {t("teacher_dashboard_signed_in")}
                  </p>
                </Card>
              </div>
            ) : isStudentSession ? (
              <div className="mx-auto max-w-xl">
                <Card
                  className="cursor-pointer border-2 border-accent p-8 text-center transition-all hover:border-accent hover-elevate"
                  onClick={() => navigate("/custom-test")}
                  data-testid="card-role-student"
                >
                  <div className="mb-4 inline-flex rounded-full bg-accent/10 p-4">
                    <BookOpen className="h-12 w-12 text-accent" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">
                    {t("student_role")}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {t("student_role_desc")}
                  </p>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 mx-auto max-w-3xl sm:grid-cols-2">
                <Card
                  className="cursor-pointer border-2 border-primary p-8 text-center transition-all hover:border-primary hover-elevate"
                  onClick={() => navigate("/teacher-auth")}
                  data-testid="card-role-teacher"
                >
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
                    <GraduationCap className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">
                    {t("teacher_role")}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {t("teacher_role_desc")}
                  </p>
                </Card>

                <Card
                  className="cursor-pointer border-2 border-accent p-8 text-center transition-all hover:border-accent hover-elevate"
                  onClick={handleStudentCustomMCQ}
                  data-testid="card-role-student"
                >
                  <div className="mb-4 inline-flex rounded-full bg-accent/10 p-4">
                    <BookOpen className="h-12 w-12 text-accent" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">
                    {t("student_role")}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {t("student_role_desc")}
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}

        {step === "subject" && selectedMode === "language" && (
          <div className="space-y-6 sm:space-y-8">
            <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
              <span>{t("back")}</span>
              </Button>
            {/* Features Banner */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-5 text-center hover-elevate">
                <div className="inline-flex p-2 sm:p-3 bg-blue-500/10 rounded-lg mb-2">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-base">{t("aligned")}</h3>
                <p className="text-base text-muted-foreground mt-1">{t("aligned_desc")}</p>
              </Card>


              <Card className="p-4 sm:p-5 text-center hover-elevate">
                <div className="inline-flex p-2 sm:p-3 bg-green-500/10 rounded-lg mb-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-base">{t("ai_powered")}</h3>
                <p className="text-base text-muted-foreground mt-1">{t("ai_powered_desc")}</p>
              </Card>

              <Card className="p-4 sm:p-5 text-center hover-elevate">
                <div className="inline-flex p-2 sm:p-3 bg-purple-500/10 rounded-lg mb-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">{t("track_progress")}</h3>
                <p className="text-base text-muted-foreground mt-1">{t("track_progress_desc")}</p>
              </Card>


            </div> */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Blue Card */}
              <Card className="
                p-4 sm:p-5 text-center rounded-2xl
                bg-blue-700 dark:bg-blue-800
                text-white
              ">
                <div className="inline-flex p-2 sm:p-3 bg-blue-600/30 dark:bg-blue-500/50 rounded-lg mb-2">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-base">
                  {t("aligned")}
                </h3>

                <p className="text-base text-white/80 mt-1">
                  {t("aligned_desc")}
                </p>
              </Card>

              {/* Green Card */}
              <Card className="
                p-4 sm:p-5 text-center rounded-2xl
                bg-green-700 dark:bg-green-800
                text-white
              ">
                <div className="inline-flex p-2 sm:p-3 bg-green-600/30 dark:bg-green-500/50 rounded-lg mb-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-base">
                  {t("ai_powered")}
                </h3>

                <p className="text-base text-white/80 mt-1">
                  {t("ai_powered_desc")}
                </p>
              </Card>

              {/* Purple Card */}
              <Card className="
                p-4 sm:p-5 text-center rounded-2xl
                bg-purple-700 dark:bg-purple-800
                text-white
              ">
                <div className="inline-flex p-2 sm:p-3 bg-purple-600/30 dark:bg-purple-500/50 rounded-lg mb-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-base">
                  {t("track_progress")}
                </h3>

                <p className="text-base text-white/80 mt-1">
                  {t("track_progress_desc")}
                </p>
              </Card>
            </div>


            {/* Language Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {t("choose_language")}
                </h2>

                <Badge variant="secondary" className="text-base">
                  {t("six_languages_available")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {availableLanguageSubjects.map((subjectKey: string) => {
                const subjectOptions: Record<
                  string,
                  {
                    icon: typeof BookOpen;
                    color: string;
                    label: string;
                  }
                > = {
                  french: {
                    icon: BookOpen,
                    color: "bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400",
                    label: t("subject_french"),
                  },
                  german: {
                    icon: Languages,
                    color: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
                    label: t("subject_german"),
                  },
                  spanish: {
                    icon: Sparkles,
                    color: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400",
                    label: t("subject_spanish"),
                  },
                  hindi: {
                    icon: Book,
                    color: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
                    label: t("subject_hindi"),
                  },
                  marathi: {
                    icon: Library,
                    color: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
                    label: t("subject_marathi"),
                  },
                  kannada: {
                    icon: ScrollText,
                    color: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
                    label: t("subject_kannada"),
                  },
                };

                const option = subjectOptions[subjectKey];
                if (!option) return null;

                const Icon = option.icon;

                return (
                  <LanguageCard
                    key={subjectKey}
                    language={option.label}
                    icon={Icon}
                    color={option.color}
                    onClick={() => handleSubjectLanguageSelect(subjectKey)}
                  />
                );
              })}
            </div>
            </div>
          </div>
        )}

        {step === "subject" && selectedMode === "science" && (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {t("science_quiz")}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {t("choose_category")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {t("select_science_category")}
                </h2>

                <Badge variant="secondary" className="text-base">
                  {t("science_categories")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {availableScienceCategories.map((categoryKey: string) => {
                  const option = scienceCategoryOptions[categoryKey as keyof typeof scienceCategoryOptions];
                  if (!option) return null;
                  const Icon = option.icon;

                  return (
                    <LanguageCard
                      key={categoryKey}
                      language={option.label}
                      icon={Icon}
                      color={option.color}
                      onClick={() => handleScienceCategorySelect(categoryKey)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* {step === "class" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("subject")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold capitalize">
                  {selectedMode === "science" ? configuredSubjectLabel : selectedLanguage}
                </h2>
                <p className="text-sm text-muted-foreground">Step 1 of 4</p>
              </div>
            </div>

            <SelectionGrid
              title="Select Your Class"
              items={[
                { label: "Class 6", value: 6 },
                { label: "Class 7", value: 7 },
                { label: "Class 8", value: 8 },
                { label: "Class 9", value: 9 },
                { label: "Class 10", value: 10 },
              ]}
              selected={selectedClass}
              onSelect={handleClassSelect}
            />
          </div>
        )}
 */}
        {step === "class" && (
          <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <Button variant="outline" type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold capitalize">
                  {studentProfileComplete
                    ? (selectedMode === "science"
                        ? configuredSubjectLabel
                        : t(`subject_${selectedSubjectLanguage}`))
                    : t("edit_profile")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {studentProfileComplete ? t("step_1_4") : t("complete_profile_to_continue")}
                </p>
              </div>
            </div>

            {profileLoading ? (
              <div className="rounded-2xl border bg-card p-6 shadow-sm text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <p className="mt-4 text-base font-medium text-slate-900 dark:text-slate-100">
                  {t("loading_profile")}
                </p>
              </div>
            ) : studentProfileComplete ? (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    {t("class_board_locked_profile")}
                  </p>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 flex-1">
                      <p className="text-sm text-muted-foreground">{t("class")}</p>
                      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-2 text-2xl font-semibold text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                        {t("class")} {selectedClass}
                        <span className="rounded-full bg-indigo-500 px-2 py-1 text-xs font-semibold text-white">
                          {t("from_profile")}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 flex-1">
                      <p className="text-sm text-muted-foreground">{t("education_board")}</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedBoard}</p>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setStep("difficulty")} className="w-full" size="lg">
                  {t("continue")}
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {t("update_profile_to_change_class_board")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/profile")}
                    className="w-full shrink-0 px-6 sm:w-auto sm:px-7"
                  >
                    {t("edit_profile")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 shadow-[0_18px_50px_rgba(15,23,42,.08)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
                <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/85 p-5 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/75 sm:p-8">
                  <div className="absolute -top-8 right-[-24px] h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
                  <div className="absolute -bottom-10 left-[-20px] h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
                    <Settings2 className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="relative mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    {t("edit_profile")}
                  </h3>

                  <p className="relative mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                    {t("complete_profile_to_continue")}
                  </p>

                  <div className="relative mt-5 flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-200">
                      Profile
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                      Class
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                      Board
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="relative mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.99]"
                  >
                    {t("edit_profile")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* {step === "difficulty" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("class")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold capitalize">
                  {selectedMode === "science" ? configuredSubjectLabel : selectedLanguage} - Class {selectedClass}
                </h2>
                <p className="text-sm text-muted-foreground">Step 2 of 5</p>
              </div>
            </div>

            <SelectionGrid
              title="Choose Difficulty Level"
              items={[
                { label: "Easy", value: "easy" },
                { label: "Medium", value: "medium" },
                { label: "Hard", value: "hard" },
              ]}
              selected={selectedDifficulty}
              onSelect={handleDifficultySelect}
            />
          </div>
        )} */}

        {step === "difficulty" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold capitalize">
                  {configuredSubjectLabel} - {t("class")} {selectedClass}
                </h2>
                <p className="text-sm text-muted-foreground">{t("step_2_5")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
            { label: t("difficulty_easy"), value: "easy", light: "from-green-400 to-green-200", dark: "from-green-700 to-green-500" },
            { label: t("difficulty_medium"), value: "medium", light: "from-yellow-400 to-yellow-200", dark: "from-yellow-700 to-yellow-500" },
            { label: t("difficulty_hard"), value: "hard", light: "from-red-400 to-red-200", dark: "from-red-700 to-red-500" },
              ].map((item) => (
                <div
                  key={item.value}
                  onClick={() => handleDifficultySelect(item.value)}
                  className={`
                    cursor-pointer p-6 rounded-2xl text-center font-semibold
                    bg-gradient-to-br ${item.light} dark:${item.dark}
                    text-white
                    transition-all transform
                    hover:shadow-xl hover:scale-105
                    ${selectedDifficulty === item.value ? "ring-4 ring-offset-2 ring-indigo-400 dark:ring-indigo-300" : ""}
                  `}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}



        {/* {step === "testType" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("difficulty")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty}
                </h2>
                <p className="text-sm text-muted-foreground">Step 3 of 5</p>
              </div>
            </div>

            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Select Test Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  className={`p-5 sm:p-6 cursor-pointer hover-elevate active-elevate-2 ${
                    selectedTestType === "mixed"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => handleTestTypeSelect("mixed")}
                  data-testid="card-test-type-mixed"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex p-2 sm:p-3 bg-blue-500/10 rounded-lg">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      {selectedTestType === "mixed" && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Mixed Test</h3>
                      <p className="text-base text-muted-foreground">MCQ + Open-ended Questions</p>
                      <p className="text-sm text-muted-foreground mt-2">50% multiple choice, 50% written answers for comprehensive practice</p>
                    </div>
                  </div>
                </Card>

                <Card
                  className={`p-5 sm:p-6 cursor-pointer hover-elevate active-elevate-2 ${
                    selectedTestType === "mcq-only"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => handleTestTypeSelect("mcq-only")}
                  data-testid="card-test-type-mcq"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex p-2 sm:p-3 bg-green-500/10 rounded-lg">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                      </div>
                      {selectedTestType === "mcq-only" && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">MCQ Only Test</h3>
                      <p className="text-base text-muted-foreground">Multiple Choice Questions Only</p>
                      <p className="text-sm text-muted-foreground mt-2">Fast-paced test with instant feedback on all questions</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )} */}

        {step === "testType" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold capitalize">
                  {configuredSubjectLabel}
                </h2>
                <p className="text-sm text-muted-foreground">{t("step_3_5")}</p>
              </div>
            </div>

            <Card  className="
                p-4 sm:p-6 
                bg-[hsl(200.49deg_56.52%_80.08%)]     /* Light mode */
                dark:bg-[hsl(200.49deg_56.52%_30%)]   /* Dark mode */
                transition-colors
              ">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                {t("select_test_type")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
            {
              id: "mixed",
              title: t("test_type_mixed_title"),
              description: t("test_type_mixed_desc"),
              extra: t("test_type_mixed_extra"),
              bgColor: "bg-[rgb(241,234,164)] dark:bg-[rgb(126,43,17)]",
              icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />,
            },
            {
              id: "mcq-only",
              title: t("test_type_mcq_title"),
              description: t("test_type_mcq_desc"),
              extra: t("test_type_mcq_extra"),
              bgColor: "bg-[rgb(247,207,207)] dark:bg-[rgb(160,88,65)]",
              icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />,
            },
                ].map((test) => (
                  <Card
                    key={test.id}
                    className={`p-5 sm:p-6 cursor-pointer transition-all border hover:shadow-lg hover:scale-105 ${test.bgColor} ${
                      selectedTestType === test.id ? "border-primary " : "border-border"
                    }`}
                    onClick={() => handleTestTypeSelect(test.id)}
                    data-testid={`card-test-type-${test.id}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex p-2 sm:p-3 rounded-lg bg-white/20 dark:bg-white/10">
                          {test.icon}
                        </div>
                        {selectedTestType === test.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-primary-foreground"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{t(test.title)}</h3>
                        <p className="text-base text-muted-foreground">{t(test.description)}</p>
                        <p className="text-sm text-muted-foreground mt-2">{t(test.extra)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}



        {/* {step === "testLength" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button 
                variant="outline" 
                onClick={() => setStep(selectedMode === "science" ? "difficulty" : "testType")} 
                data-testid="button-back" 
                size="sm"
              >
                ← Back
              </Button>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold capitalize">
                  {selectedMode === "science" ? configuredSubjectLabel : selectedLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestType === "mcq-only" ? "MCQ Only" : "Mixed"}
                </h2>
                <p className="text-sm text-muted-foreground">Step 4 of 5</p>
              </div>
            </div>

            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Select Test Length</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: "Quick Test", sublabel: "10 Questions", value: 10, time: "~10 mins" },
                  { label: "Standard Test", sublabel: "20 Questions", value: 20, time: "~20 mins" },
                  { label: "Extended Test", sublabel: "30 Questions", value: 30, time: "~30 mins" },
                  { label: "Full Test", sublabel: "50 Questions", value: 50, time: "~50 mins" },
                ].map((item) => (
                  <Card
                    key={item.value}
                    className={`p-4 cursor-pointer hover-elevate active-elevate-2 ${
                      selectedTestLength === item.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => handleTestLengthSelect(item.value)}
                    data-testid={`card-test-length-${item.value}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.label}</h3>
                        <p className="text-muted-foreground">{item.sublabel}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.time}</p>
                      </div>
                      {selectedTestLength === item.value && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )} */}


        {step === "testLength" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold capitalize">
                  {configuredSubjectLabel} - {t("class")} {selectedClass} - {t(`difficulty_${selectedDifficulty}`)} - {selectedTestType === "mcq-only" ? t("test_type_mcq_short") : t("test_type_mixed_short")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("step_4_5")}</p>
              </div>
            </div>

              <Card className="p-4 sm:p-6 bg-[hsl(200.49deg_56.52%_80.08%)] dark:bg-[hsl(200.49deg_56.52%_20%)]">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                  {t("select_test_length")}
                </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
            {
              label: t("test_quick"),
              sublabel: t("test_quick_questions"),
              value: 10,
              time: t("test_quick_time"),
              bg: "bg-[rgb(241,234,164)] dark:bg-[rgb(126,43,17)]"
            },
            {
              label: t("test_standard"),
              sublabel: t("test_standard_questions"),
              value: 20,
              time: t("test_standard_time"),
              bg: "bg-[rgb(247,207,207)] dark:bg-[rgb(160,88,65)]"
            },
            {
              label: t("test_extended"),
              sublabel: t("test_extended_questions"),
              value: 30,
              time: t("test_extended_time"),
              bg: "bg-[rgb(200,230,255)] dark:bg-[rgb(20,50,80)]"
            },
            {
              label: t("test_full"),
              sublabel: t("test_full_questions"),
              value: 50,
              time: t("test_full_time"),
              bg: "bg-[rgb(220,250,220)] dark:bg-[rgb(30,60,40)]"
            },
                ].map((item) => (
                  <Card
                    key={item.value}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border ${
                      selectedTestLength === item.value
                        ? "border-primary bg-primary/10 dark:bg-primary/20"
                        : `border-border ${item.bg}`
                    }`}
                    onClick={() => handleTestLengthSelect(item.value)}
                    data-testid={`card-test-length-${item.value}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{t(item.label)}</h3>
                        <p className="text-muted-foreground">{t(item.sublabel)}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t(item.time)}</p>
                      </div>
                      {selectedTestLength === item.value && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}


        {/* {step === "testMode" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("testLength")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold capitalize">
                  Choose Test Mode
                </h2>
                <p className="text-sm text-muted-foreground">Step 5 of 6</p>
              </div>
            </div>

            <Card className="p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Select How You Want to Create Your Test</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  className={`p-6 cursor-pointer hover-elevate active-elevate-2 ${
                    selectedTestMode === "predefined"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => handleTestModeSelect("predefined")}
                  data-testid="card-test-mode-predefined"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex p-3 bg-blue-500/10 rounded-lg">
                        <Library className="w-6 h-6 text-blue-500" />
                      </div>
                      {selectedTestMode === "predefined" && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-foreground" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Pre-defined Chapters</h3>
                      <p className="text-base text-muted-foreground">Choose from curated curriculum chapters</p>
                      <p className="text-sm text-muted-foreground mt-2">25 chapters covering the complete syllabus</p>
                    </div>
                  </div>
                </Card>

                <Card
                  className={`p-6 cursor-pointer hover-elevate active-elevate-2 ${
                    selectedTestMode === "custom"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => handleTestModeSelect("custom")}
                  data-testid="card-test-mode-custom"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex p-3 bg-purple-500/10 rounded-lg">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                      </div>
                      {selectedTestMode === "custom" && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-foreground" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Custom Topics</h3>
                      <p className="text-base text-muted-foreground">Create test with your own topics</p>
                      <p className="text-sm text-muted-foreground mt-2">Enter your own topics and customize settings</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )} */}



        {step === "testMode" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-bold capitalize">
                  {t("choose_test_mode")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("step_5_6")}</p>
              </div>
            </div>

            <Card className="p-4 sm:p-6 bg-[hsl(200.49deg_56.52%_80.08%)] dark:bg-[hsl(200.49deg_56.52%_20%)]">
              {/* <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                Select How You Want to Create Your Test
              </h2> */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
                  {t("select_test_creation")}
                </h2>
            </div>

              <div className="mb-5 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t("test_language")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("choose_test_language")}
                    </p>
                  </div>
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900">
                    {(["english", "hindi"] as const).map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => handleMediumSelect(language)}
                        className={`min-w-24 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          selectedMedium === language
                            ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        }`}
                        data-testid={`button-test-language-${language}`}
                      >
                        {language === "english"
                          ? t("language_english")
                          : t("language_hindi")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
            {
              label: t("chapter_predefined"),
              description: t("chapter_predefined_desc"),
              details: t("chapter_predefined_details"),
              value: "predefined",
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-500",
              pastel: "bg-[rgb(74_153_255)] dark:bg-[rgb(74_153_255)]",
            },
            {
              label: t("chapter_custom"),
              description: t("chapter_custom_desc"),
              details: t("chapter_custom_details"),
              value: "custom",
              iconBg: "bg-purple-500/10",
              iconColor: "text-purple-500",
              pastel: "bg-[rgb(177_118_236)] dark:bg-[rgb(177_118_236)]",
            },
                ].map((item) => (
                  <Card
                    key={item.value}
                    className={`
                      p-6 cursor-pointer transition-all duration-300 rounded-2xl border shadow-sm
                      ${item.pastel}
                      ${
                        selectedTestMode === item.value
                          ? "border-orange-400 dark:border-orange-500 shadow-md scale-[1.02]"
                          : "border-gray-200 dark:border-gray-700"
                      }
                      hover:shadow-md hover:scale-[1.02]
                    `}
                    onClick={() => handleTestModeSelect(item.value)}
                    data-testid={`card-test-mode-${item.value}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`inline-flex p-3 rounded-lg ${item.iconBg}`}>
                          {item.value === "predefined" ? (
                            <Library className={`w-6 h-6 ${item.iconColor}`} />
                          ) : (
                            <Sparkles className={`w-6 h-6 ${item.iconColor}`} />
                          )}
                        </div>

                        <h3 className="font-semibold text-xl mt-3">{t(item.label)}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{t(item.description)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t(item.details)}</p>
                      </div>

                      {selectedTestMode === item.value && (
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}

        {step === "customTopics" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold capitalize">
                  {t("create_custom_test")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("step_6_settings")}
                </p>
              </div>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3>
                    <Settings2 className="w-5 h-5" />
                    {t("test_topics")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("topics_desc")}
                  </p>

                  {/* Topic 1 */}
                  <div>
                    <Label htmlFor="topic1">{t("topic1_required")}</Label>
                    <Input
                      id="topic1"
                      placeholder={t("topic_placeholder1")}
                      value={customTopic1}
                      onChange={(e) => setCustomTopic1(e.target.value)}
                      className="mt-1"
                      data-testid="input-topic1"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  {/* Topic 2 */}
                  <div>
                    <Label htmlFor="topic2">{t("topic2_required")}</Label>
                    <Input
                      id="topic2"
                      placeholder={t("topic_placeholder2")}
                      value={customTopic2}
                      onChange={(e) => setCustomTopic2(e.target.value)}
                      className="mt-1"
                      data-testid="input-topic2"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  {/* Topic 3 */}
                  <div>
                    <Label htmlFor="topic3">{t("topic3_required")}</Label>
                    <Input
                      id="topic3"
                      placeholder={t("topic_placeholder3")}
                      value={customTopic3}
                      onChange={(e) => setCustomTopic3(e.target.value)}
                      className="mt-1"
                      data-testid="input-topic3"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  {/* Topic 4 */}
                  <div>
                    <Label htmlFor="topic4">{t("topic4_optional")}</Label>
                    <Input
                      id="topic4"
                      placeholder={t("topic_placeholder4")}
                      value={customTopic4}
                      onChange={(e) => setCustomTopic4(e.target.value)}
                      className="mt-1"
                      data-testid="input-topic4"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  {/* Topic 5 */}
                  <div>
                    <Label htmlFor="topic5">{t("topic5_optional")}</Label>
                    <Input
                      id="topic5"
                      placeholder={t("topic_placeholder5")}
                      value={customTopic5}
                      onChange={(e) => setCustomTopic5(e.target.value)}
                      className="mt-1"
                      data-testid="input-topic5"
                      disabled={isGeneratingTest}
                    />
                  </div>

                  {/* Topic 6 */}
                  <div>
                    <Label htmlFor="topic6">{t("topic6_optional")}</Label>
                    <Input
                      id="topic6"
                      placeholder={t("topic_placeholder6")}
                      value={customTopic6}
                      onChange={(e) => setCustomTopic6(e.target.value)}
                      className="mt-1"
                      data-testid="input-topic6"
                      disabled={isGeneratingTest}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="gptModel">{t("ai_model_quality")}</Label>

                    <Select
                      value={selectedGptModel}
                      onValueChange={setSelectedGptModel}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("select_ai_model")} />
                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="hf-mcqgyaan">
                          {t("model_hf")}
                        </SelectItem>

                        <SelectItem value="ft:gpt-4.1-nano-2025-04-14:maxbrain-technologies:pricer:DD6LfCqA">
                          {t("model_ft_pricer")}
                        </SelectItem>

                        <SelectItem value="gpt-5.2">
                          {t("model_gpt52")}
                        </SelectItem>

                        <SelectItem value="gpt-5.1">
                          {t("model_gpt51")}
                        </SelectItem>

                        <SelectItem value="gpt-4o">
                          {t("model_gpt4o")}
                        </SelectItem>

                        <SelectItem value="gpt-4o-mini">
                          {t("model_gpt4o_mini")}
                        </SelectItem>

                        <SelectItem value="gpt-3.5-turbo">
                          {t("model_gpt35")}
                        </SelectItem>

                      </SelectContent>
                    </Select>

                    <p className="text-xs text-muted-foreground mt-1">
                      {t("ai_model_desc")}
                    </p>
                  </div>

                  <div>
                    <Label>{t("education_board")}</Label>
                  <div className="mt-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50">
                    {selectedBoard}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("board_desc")}
                  </p>
                </div>
              </div>

                <div className="pt-4 border-t">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-4">
                    <h4>
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      {t("test_config_summary")}
                    </h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      {configuredSubjectLabel ? (
                        <p>
                          <strong>{t("subject")}: </strong>
                          {configuredSubjectLabel}
                        </p>
                      ) : null}

                      <p>
                        <strong>{t("difficulty_label")}: </strong> 
                        {t(`difficulty_${selectedDifficulty}`)} | <strong>{t("class")}: </strong> {selectedClass} 
                      </p>

                      {/* <p>
                        <strong>{t("class")}:</strong> {selectedClass} | 
                        <strong>{t("difficulty.label")}:</strong> 
                        {t(`difficulty.${selectedDifficulty}`)}
                      </p> */}

                      <p>
                        <strong>{t("type")}: </strong>
                        {selectedTestType === "mcq-only" ? t("test_type_mcq") : t("test_type_mixed")} | 
                        <strong> {t("questions")}:</strong> {selectedTestLength}
                      </p>

                      <p>
                        <strong>{t("topics")}: </strong> 
                        {[customTopic1, customTopic2, customTopic3, customTopic4, customTopic5, customTopic6].filter(t => t.trim()).length} {t("topics_count")}
                      </p>

                    </div>
                  </div>

                  <Button
                    onClick={handleCustomTestGenerate}
                    disabled={isGeneratingTest || !customTopic1.trim()}
                    className="w-full"
                    size="lg"
                    data-testid="button-generate-custom-test"
                  >
                    {isGeneratingTest ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("generating_test")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t("generate_custom_test")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "chapter" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline"type="button" onClick={handleBack} className="
                        group flex items-center gap-2
                        rounded-full px-4 py-2
                        bg-white dark:bg-gray-900
                        border border-gray-300 dark:border-gray-700
                        shadow-md
                        transition-all duration-200
                        hover:shadow-xl hover:scale-[1.03]
                        active:scale-[0.96]
                      ">
                <span className="transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>{t("back")}</span>
              </Button>
              <div>
                {/* <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestType === "mcq-only" ? "MCQ" : "Mixed"} - {selectedTestLength}Q
                </h2> */}

              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold capitalize">
                  {preDefinedChapterMedium === "hindi"
                    ? `हिंदी - कक्षा ${selectedClass} - माध्यम - ${
                        selectedTestType === "mcq-only" ? "एमसीक्यू" : "मिक्स्ड"
                      } - ${selectedTestLength} प्रश्न`
                    : `English - Class ${selectedClass} - Medium - ${
                        selectedTestType === "mcq-only" ? "MCQ" : "Mixed"
                      } - ${selectedTestLength}Q`}
              </h2>
                <p className="text-sm text-muted-foreground">{t("step_6_6")}</p>
              </div>
            </div>

            <ChapterList
              chapters={chapters}
              onSelect={handleChapterSelect}
              selectedMedium={preDefinedChapterMedium}
            />
          </div>
        )}
      </div>
    </div>
  );
}
