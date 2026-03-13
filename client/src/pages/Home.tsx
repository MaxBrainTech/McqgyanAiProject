import AnimatedBackground from "@/components/AnimatedBackground";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Languages, BookOpen, Sparkles, Trophy, RotateCcw, GraduationCap, Book, Library, ScrollText, Atom, Beaker, Dna, Zap, Settings2, Loader2 } from "lucide-react";
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

import { useTranslation } from "react-i18next";
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

// const [chapters, setChapters] = useState<Chapter[]>([]);

export default function Home() {
  const hasInitialized = { current: false };  
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

const [leaderboard, setLeaderboard] = useState([]);

// Science category
const [selectedScienceCategory, setSelectedScienceCategory] =
  useState<string>("");
  // const [selectedScienceCategory, setSelectedScienceCategory] = useState<"english" | "hindi">("english");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedClass, setSelectedClass] = useState<number>(0);
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

  // const [selectedGptModel, setSelectedGptModel] = useState<string>("gpt-5.2");
  const [selectedGptModel, setSelectedGptModel] = useState<string>("gpt-4o-mini");
  const [selectedBoard, setSelectedBoard] = useState<string>("CBSE");
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  // const [chapters, setChapters] = useState<Array<{ id: number; title: string; description: string }>>([]);
    const [chapters, setChapters] = useState<Chapter[]>([])

  const scrollYRef = useRef(0);
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
  const handleBack = () => {
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

//   useEffect(() => {
//     const savedScores = localStorage.getItem("langbuddy_scores");
//     if (savedScores) {
//       setLeaderboard(JSON.parse(savedScores));
//     }
//   }, []);

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
      const res = await fetch(`/api/chapters/${subject}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("API did not return array:", data);
        return;
      }

      const mappedChapters = data.map((ch: any) => ({
        id: ch.id,
        title: ch.title,          // NO WRAPPING
        description: ch.description
      }));

      setChapters(mappedChapters);
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
    }
  };

  fetchChapters();
}, [step, selectedSubjectLanguage, selectedScienceCategory, selectedMode]);

  // 🔒 Save scroll position BEFORE step change
useLayoutEffect(() => {
  const currentScroll = window.scrollY;

  requestAnimationFrame(() => {
    window.scrollTo({ top: currentScroll });
  });
}, [step]);

  const handleResetScores = () => {
    localStorage.removeItem("langbuddy_scores");
    setLeaderboard([]);
    toast({
      title: "Scores Reset",
      description: "All your test scores have been cleared successfully!",
    });
  };


  // Helper function to scroll to top smoothly
  // const ScrollRestoration = () => {
  //   setTimeout(() => {
  //     window.scrollTo({ top: 0, behavior: 'smooth' });
  //   }, 50);
  // };

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    if (mode === "custom") {
      setStep("custom");
    } else {
      setStep("subject");
    }
    // ScrollRestoration();  
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
        title: "Required Topics Missing",
        description: "Please fill Topic 1, Topic 2 and Topic 3 (all are mandatory).",
        variant: "destructive",
      });
      return;
    }

    // ✅ Collect all 6 topics (ignore empty optional ones)
    const topics = [
      customTopic1,
      customTopic2,
      customTopic3,
      customTopic4,
      customTopic5,
      customTopic6,
    ]
      .filter((t) => t && t.trim().length > 0)
      .join(", ");


    try {
      setIsGeneratingTest(true);
      // Generate test via API
      const subject = selectedMode === "science" ? selectedScienceCategory : selectedSubjectLanguage;
      const response = await apiRequest("POST", "/api/student/generate-custom-test", {
        subject,
        classLevel: selectedClass,
        difficulty: selectedDifficulty,
        syllabus: topics,
        numQuestions: selectedTestLength,
        subjectLanguage: selectedSubjectLanguage,
        scienceCategory: selectedScienceCategory,
        medium: selectedMedium,
        testType: selectedTestType === "mcq-only" ? "mcq" : "mixed",
        gptModel: selectedGptModel,
        board: selectedBoard,
        mode: selectedMode,
      });

      const data = await response.json();

      // Navigate to test page with generated questions
      navigate('/test', {
        state: {
          config: {
            mode: "custom-student",
            language: selectedMode === "language" ? selectedSubjectLanguage : undefined,
            scienceCategory: selectedMode === "science" ? selectedScienceCategory : undefined,
            class: selectedClass,
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
        title: "Test Generated!",
        description: `Successfully generated ${data.questionsGenerated} unique questions. Good luck!`,
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate custom test. Please try again.",
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
          language: selectedMode === "language" ? selectedSubjectLanguage : undefined,
          scienceCategory: selectedMode === "science" ? selectedScienceCategory : undefined,
          class: selectedClass,
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
    setSelectedScienceCategory("english");
    setSelectedClass(0);
    setSelectedDifficulty("");
    // ScrollRestoration();
  };

  const { t } = useTranslation();

  return (

    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hero Header - Premium Design */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 dark:from-gray-900 dark:via-gray-800 dark:to-black overflow-hidden">
        <div className="absolute inset-0">
          <AnimatedBackground />
        </div>
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div className="text-white space-y-6 sm:space-y-8">

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <GraduationCap className="w-5 h-5" />
                <span className="text-sm font-semibold">{t("ai_platform")}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">

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

              <p className="text-lg sm:text-xl text-white/90 max-w-xl">
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
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-6 px-8 text-lg rounded-lg transition-all transform hover:scale-105"
                >
                  {t("start_learning")}
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => navigate("/features")}
                  className="border-white text-white hover:bg-white/10 font-bold py-6 px-8 text-lg rounded-lg"
                >
                  {t("explore_features")}
                </Button>

              </div>

            </div>


            {/* Right Stats */}
            <div className="hidden lg:grid grid-cols-2 gap-6">

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-white text-center hover:bg-white/20 transition">
                <Sparkles className="w-10 h-10 mx-auto mb-2 text-yellow-300" />
                <p className="text-3xl font-bold">10,000+</p>
                <p className="text-white/80">{t("ai_questions")}</p>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-white text-center hover:bg-white/20 transition">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-orange-300" />
                <p className="text-3xl font-bold">5,000+</p>
                <p className="text-white/80">{t("active_students")}</p>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-white text-center hover:bg-white/20 transition">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-green-300" />
                <p className="text-3xl font-bold">150+</p>
                <p className="text-white/80">{t("chapters_topics")}</p>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-white text-center hover:bg-white/20 transition">
                <Zap className="w-10 h-10 mx-auto mb-2 text-blue-300" />
                <p className="text-3xl font-bold">{t("realtime")}</p>
                <p className="text-white/80">{t("ai_feedback")}</p>
              </Card>

            </div>

          </div>
          </div>
        </div>
 

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl" data-section="mode-selection">
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

                  onClick={() => handleModeSelect("language")}
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


                  onClick={() => handleModeSelect("science")}
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

                  onClick={() => navigate('/answer-evaluator')}
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
                  <h3 className="text-xl font-bold mb-2">
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
                      {t("best_scores")}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleResetScores}
                    data-testid="button-reset-scores"
                    className="gap-2 h-11 text-base"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t("reset_scores")}</span>

                  </Button>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card 
                className="p-8 text-center hover-elevate cursor-pointer border-2 hover:border-primary transition-all"
                onClick={() => navigate('/teacher-auth')}
                data-testid="card-role-teacher"
              >
                <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                  <GraduationCap className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t("teacher_role")}
                </h3>

                <p className="text-base text-muted-foreground">
                  {t("teacher_role_desc")}
                </p>
              </Card>

              <Card 
                className="p-8 text-center hover-elevate cursor-pointer border-2 hover:border-accent transition-all"
                onClick={() => navigate('/custom-test')}
                data-testid="card-role-student"
              >
                <div className="inline-flex p-4 bg-accent/10 rounded-full mb-4">
                  <BookOpen className="w-12 h-12 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t("student_role")}
                </h3>

                <p className="text-base text-muted-foreground">
                  {t("student_role_desc")}
                </p>
              </Card>
            </div>
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
                <h3 className="font-semibold text-base">Aligned</h3>
                <p className="text-base text-muted-foreground mt-1">Official curriculum coverage</p>
              </Card>


              <Card className="p-4 sm:p-5 text-center hover-elevate">
                <div className="inline-flex p-2 sm:p-3 bg-green-500/10 rounded-lg mb-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-base">AI Powered</h3>
                <p className="text-base text-muted-foreground mt-1">Adaptive question generation</p>
              </Card>

              <Card className="p-4 sm:p-5 text-center hover-elevate">
                <div className="inline-flex p-2 sm:p-3 bg-purple-500/10 rounded-lg mb-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-base">Track Progress</h3>
                <p className="text-base text-muted-foreground mt-1">Monitor your improvement</p>
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
                <LanguageCard
                  language="French"
                  icon={BookOpen}
                  color="bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400"
                  onClick={() => handleSubjectLanguageSelect("french")}
                />
                <LanguageCard
                  language="German"
                  icon={Languages}
                  color="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                  onClick={() => handleSubjectLanguageSelect("german")}
                />
                <LanguageCard
                  language="Spanish"
                  icon={Sparkles}
                  color="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                  onClick={() => handleSubjectLanguageSelect("spanish")}
                />
                <LanguageCard
                  language="Hindi"
                  icon={Book}
                  color="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                  onClick={() => handleSubjectLanguageSelect("hindi")}
                />
                <LanguageCard
                  language="Marathi"
                  icon={Library}
                  color="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
                  onClick={() => handleSubjectLanguageSelect("marathi")}
                />
                <LanguageCard
                  language="Kannada"
                  icon={ScrollText}
                  color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                  onClick={() => handleSubjectLanguageSelect("kannada")}
                />
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
                <LanguageCard
                  language="Physics"
                  icon={Atom}
                  color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                  onClick={() => handleScienceCategorySelect("physics")}
                />
                <LanguageCard
                  language="Chemistry"
                  icon={Beaker}
                  color="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                  onClick={() => handleScienceCategorySelect("chemistry")}
                />
                <LanguageCard
                  language="Biology"
                  icon={Dna}
                  color="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
                  onClick={() => handleScienceCategorySelect("biology")}
                />
                <LanguageCard
                  language="General Science"
                  icon={Zap}
                  color="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                  onClick={() => handleScienceCategorySelect("general")}
                />
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
                  {selectedMode === "science" ? selectedScienceCategory : selectedLanguage}
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
                  {selectedMode === "science" ? selectedScienceCategory : selectedSubjectLanguage}
                </h2>
                <p className="text-sm text-muted-foreground">{t("step_1_4")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Class 6", value: 6, light: "from-green-400 to-green-200", dark: "from-green-700 to-green-500" },
                { label: "Class 7", value: 7, light: "from-blue-400 to-blue-200", dark: "from-blue-700 to-blue-500" },
                { label: "Class 8", value: 8, light: "from-purple-400 to-purple-200", dark: "from-purple-700 to-purple-500" },
                { label: "Class 9", value: 9, light: "from-pink-400 to-pink-200", dark: "from-pink-700 to-pink-500" },
                { label: "Class 10", value: 10, light: "from-yellow-400 to-yellow-200", dark: "from-yellow-700 to-yellow-500" },
              ].map((item) => (
                <div
                  key={item.value}
                  onClick={() => handleClassSelect(item.value)}
                  className={`
                    cursor-pointer p-6 rounded-2xl text-center font-semibold
                    bg-gradient-to-br ${item.light} dark:${item.dark}
                    text-white
                    transition-all transform
                    hover:shadow-xl hover:scale-105
                    ${selectedClass === item.value ? "ring-4 ring-offset-2 ring-indigo-400 dark:ring-indigo-300" : ""}
                  `}
                >
                  {item.label}
                </div>
              ))}
            </div>
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
                  {selectedMode === "science" ? selectedScienceCategory : selectedLanguage} - Class {selectedClass}
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
                  {selectedMode === "science"
                    ? selectedScienceCategory
                    : selectedSubjectLanguage} - Class {selectedClass}
                </h2>
                <p className="text-sm text-muted-foreground">{t("step_2_5")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Easy", value: "easy", light: "from-green-400 to-green-200", dark: "from-green-700 to-green-500" },
                { label: "Medium", value: "medium", light: "from-yellow-400 to-yellow-200", dark: "from-yellow-700 to-yellow-500" },
                { label: "Hard", value: "hard", light: "from-red-400 to-red-200", dark: "from-red-700 to-red-500" },
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
                <h2 className="text-lg sm:text-2xl font-bold capitalize">
                  {selectedSubjectLanguage} - Class {selectedClass} - {selectedDifficulty}
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
                    title: "Mixed Test",
                    description: "MCQ + Open-ended Questions",
                    extra: "50% multiple choice, 50% written answers for comprehensive practice",
                    bgColor: "bg-[rgb(241,234,164)] dark:bg-[rgb(126,43,17)]",
                    icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />,
                  },
                  {
                    id: "mcq-only",
                    title: "MCQ Only Test",
                    description: "Multiple Choice Questions Only",
                    extra: "Fast-paced test with instant feedback on all questions",
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
                        <h3 className="font-semibold text-lg mb-1">{test.title}</h3>
                        <p className="text-base text-muted-foreground">{test.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">{test.extra}</p>
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
                  {selectedMode === "science" ? selectedScienceCategory : selectedLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestType === "mcq-only" ? "MCQ Only" : "Mixed"}
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
                  {selectedMode === "science" ? selectedScienceCategory : selectedSubjectLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestType === "mcq-only" ? "MCQ Only" : "Mixed"}
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
                  { label: "Quick Test", sublabel: "10 Questions", value: 10, time: "~10 mins", bg: "bg-[rgb(241,234,164)] dark:bg-[rgb(126,43,17)]" },
                  { label: "Standard Test", sublabel: "20 Questions", value: 20, time: "~20 mins", bg: "bg-[rgb(247,207,207)] dark:bg-[rgb(160,88,65)]" },
                  { label: "Extended Test", sublabel: "30 Questions", value: 30, time: "~30 mins", bg: "bg-[rgb(200,230,255)] dark:bg-[rgb(20,50,80)]" },
                  { label: "Full Test", sublabel: "50 Questions", value: 50, time: "~50 mins", bg: "bg-[rgb(220,250,220)] dark:bg-[rgb(30,60,40)]" },
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


              {/* <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLanguage("english")}
                  className={`px-4 py-1 rounded ${
                    selectedLanguage === "english"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  English
                </button>

                <button
                  onClick={() => setSelectedLanguage("hindi")}
                  className={`px-4 py-1 rounded ${
                    selectedLanguage === "hindi"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  हिंदी
                </button>
              </div> */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleMediumSelect("english")}
                  className={selectedMedium === "english"
                    ? "bg-blue-600 text-white px-4 py-1 rounded"
                    : "bg-gray-200 px-4 py-1 rounded"}
                >
                  English
                </button>

                <button
                  onClick={() => handleMediumSelect("hindi")}
                  className={selectedMedium === "hindi"
                    ? "bg-blue-600 text-white px-4 py-1 rounded"
                    : "bg-gray-200 px-4 py-1 rounded"}
                >
                  हिंदी
                </button>
              </div>
            </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "Pre-defined Chapters",
                    description: "Choose from curated curriculum chapters",
                    details: "25 chapters covering the complete syllabus",
                    value: "predefined",
                    iconBg: "bg-blue-500/10",
                    iconColor: "text-blue-500",
                    pastel: "bg-[rgb(74_153_255)] dark:bg-[rgb(74_153_255)]",
                  },
                  {
                    label: "Custom Topics",
                    description: "Create test with your own topics",
                    details: "Enter your own topics and customize settings",
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

                        <h3 className="font-semibold text-xl mt-3">{item.label}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.details}</p>
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

                  <div className="space-y-4">
                    {/* Topic 1 */}
                    <div>
                      <Label htmlFor="topic1">{t("topic1_required")}</Label>
                      <Input
                        id="topic1"
                        placeholder="e.g., Basic Greetings, Verb Conjugation, Cell Structure"
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
                        placeholder="e.g., Numbers and Counting, Past Tense"
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
                        placeholder="e.g., Family Members, Photosynthesis"
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
                        placeholder="e.g., Food and Drinks, Chemical Reactions"
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
                        placeholder="e.g., Tenses Practice, Algebra Basics"
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
                        placeholder="e.g., Geometry, Human Digestive System"
                        value={customTopic6}
                        onChange={(e) => setCustomTopic6(e.target.value)}
                        className="mt-1"
                        data-testid="input-topic6"
                        disabled={isGeneratingTest}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="gptModel">{t("ai_model_quality")}</Label>

                    <Select
                      value={selectedGptModel}
                      onValueChange={setSelectedGptModel}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select AI Model" />
                      </SelectTrigger>

                      <SelectContent>

                        {/* 🤗 HuggingFace Model */}
                        <SelectItem value="hf-mcqgyaan">
                          MCQGyaan HF Model 🤗
                        </SelectItem>

                        {/* 🔥 Fine-Tuned Model */}
                      <SelectItem value="ft:gpt-4.1-nano-2025-04-14:maxbrain-technologies:pricer:DD6LfCqA">
                        FT Pricer 4.1 Nano (Custom Trained) 🧠🔥
                      </SelectItem>
                        {/* 🔥 GPT-5 Series */}
                        <SelectItem value="gpt-5.2">
                          GPT-5.2 (Latest • Highest Intelligence) 🧠🔥
                        </SelectItem>

                        <SelectItem value="gpt-5.1">
                          GPT-5.1 (Fast • Near GPT-5.2 Quality) ⚡
                        </SelectItem>

                        {/* GPT-4 Series */}
                        <SelectItem value="gpt-4o">
                          GPT-4o (Best Quality) ⭐
                        </SelectItem>

                        <SelectItem value="gpt-4o-mini">
                          GPT-4o Mini (Fast & Affordable - Recommended) ⚡
                        </SelectItem>

                        {/* Legacy */}
                        <SelectItem value="gpt-3.5-turbo">
                          GPT-3.5 Turbo (Cheapest) 💰
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <p className="text-xs text-muted-foreground mt-1">
                      {t("ai_model_desc")}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="board">{t("education_board")}</Label>
                    <Select value={selectedBoard} onValueChange={setSelectedBoard} disabled={isGeneratingTest}>
                      <SelectTrigger className="mt-1" data-testid="select-board">
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBSE">CBSE (Central Board)</SelectItem>
                        <SelectItem value="ICSE">ICSE (Council for Indian School)</SelectItem>
                        <SelectItem value="IB">IB (International Baccalaureate)</SelectItem>
                        <SelectItem value="RBSE">RBSE (Rajasthan Board)</SelectItem>
                        <SelectItem value="State Board">State Board</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <p><strong>{t("subject")}:</strong> {selectedMode === "science" ? selectedScienceCategory : selectedSubjectLanguage}</p>
                      <p><strong>{t("class")}:</strong> {selectedClass} | <strong>Difficulty:</strong> {selectedDifficulty}</p>
                      <p><strong>{t("type")}</strong> {selectedTestType === "mcq-only" ? "MCQ Only" : "Mixed"} | <strong>Questions:</strong> {selectedTestLength}</p>
                      <p><strong>{t("topics")}</strong> {[customTopic1, customTopic2, customTopic3, customTopic4].filter(t => t.trim()).length} topic(s)</p>
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
                  {selectedMedium === "hindi"
                    ? `हिंदी - कक्षा ${selectedClass} - माध्यम - ${
                        selectedTestType === "mcq-only" ? "एमसीक्यू" : "मिक्स्ड"
                      } - ${selectedTestLength} प्रश्न`
                    : `English - Class ${selectedClass} - Medium - ${
                        selectedTestType === "mcq-only" ? "MCQ" : "Mixed"
                      } - ${selectedTestLength}Q`}
              </h2>
                <p className="text-sm text-muted-foreground">{t("step6_6")}</p>
              </div>
            </div>

            <ChapterList
              chapters={chapters}
              onSelect={handleChapterSelect}
              selectedMedium={selectedMedium}
            />
          </div>
        )}
      </div>
    </div>
  );
}
