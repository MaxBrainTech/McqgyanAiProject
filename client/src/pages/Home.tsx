import { useState, useEffect } from "react";
import { Languages, BookOpen, Sparkles, Trophy, RotateCcw, GraduationCap, Book, Library, ScrollText } from "lucide-react";
import LanguageCard from "@/components/LanguageCard";
import SelectionGrid from "@/components/SelectionGrid";
import ChapterList from "@/components/ChapterList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeaderboardCard from "@/components/LeaderboardCard";
import { useToast } from "@/hooks/use-toast";

interface HomeProps {
  onStartTest: (config: {
    language: string;
    class: number;
    difficulty: string;
    testType: string;
    chapter: number;
    testLength: number;
  }) => void;
}

export default function Home({ onStartTest }: HomeProps) {
  const [step, setStep] = useState<"language" | "class" | "difficulty" | "testType" | "testLength" | "chapter">("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<string>("");
  const [selectedTestLength, setSelectedTestLength] = useState<number>(0);
  const [chapters, setChapters] = useState<Array<{ id: number; title: string; description: string }>>([]);

  // Load chapters when language is selected
  useEffect(() => {
    if (selectedLanguage && step === "chapter") {
      fetch(`/api/chapters/${selectedLanguage}`)
        .then(res => res.json())
        .then(data => setChapters(data))
        .catch(err => console.error("Error loading chapters:", err));
    }
  }, [selectedLanguage, step]);

  // Load leaderboard from local storage
  const [leaderboard, setLeaderboard] = useState<Array<any>>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedScores = localStorage.getItem("langbuddy_scores");
    if (savedScores) {
      setLeaderboard(JSON.parse(savedScores));
    }
  }, []);

  const handleResetScores = () => {
    localStorage.removeItem("langbuddy_scores");
    setLeaderboard([]);
    toast({
      title: "Scores Reset",
      description: "All your test scores have been cleared successfully!",
    });
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setStep("class");
  };

  const handleClassSelect = (classNum: string | number) => {
    setSelectedClass(classNum as number);
    setStep("difficulty");
  };

  const handleDifficultySelect = (difficulty: string | number) => {
    setSelectedDifficulty(difficulty as string);
    setStep("testType");
  };

  const handleTestTypeSelect = (testType: string) => {
    setSelectedTestType(testType);
    setStep("testLength");
  };

  const handleTestLengthSelect = (length: string | number) => {
    setSelectedTestLength(length as number);
    setStep("chapter");
  };

  const handleChapterSelect = (chapterId: number) => {
    onStartTest({
      language: selectedLanguage,
      class: selectedClass,
      difficulty: selectedDifficulty,
      testType: selectedTestType,
      testLength: selectedTestLength,
      chapter: chapterId,
    });
  };

  const handleReset = () => {
    setStep("language");
    setSelectedLanguage("");
    setSelectedClass(0);
    setSelectedDifficulty("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hero Header */}
      <div className="relative border-b bg-white/40 dark:bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 max-w-6xl">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full border border-primary/20">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-base font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Language Learning Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                MCQGyaan AI
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto px-4">
              Master French, German, Spanish, Hindi, Marathi, and Kannada with AI-powered adaptive testing
              <span className="block mt-3 font-semibold text-foreground text-base flex flex-wrap items-center justify-center gap-3">
                <Badge variant="secondary" className="text-base">6 Languages</Badge>
                <Badge variant="secondary" className="text-base">25 chapters each</Badge>
                <Badge variant="secondary" className="text-base">Real-time AI feedback</Badge>
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {step === "language" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Features Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
            </div>

            {/* Language Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">Choose Your Language</h2>
                <Badge variant="secondary" className="text-base">
                  6 Languages Available
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <LanguageCard
                  language="French"
                  icon={BookOpen}
                  color="bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400"
                  onClick={() => handleLanguageSelect("french")}
                />
                <LanguageCard
                  language="German"
                  icon={Languages}
                  color="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                  onClick={() => handleLanguageSelect("german")}
                />
                <LanguageCard
                  language="Spanish"
                  icon={Sparkles}
                  color="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                  onClick={() => handleLanguageSelect("spanish")}
                />
                <LanguageCard
                  language="Hindi"
                  icon={Book}
                  color="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                  onClick={() => handleLanguageSelect("hindi")}
                />
                <LanguageCard
                  language="Marathi"
                  icon={Library}
                  color="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
                  onClick={() => handleLanguageSelect("marathi")}
                />
                <LanguageCard
                  language="Kannada"
                  icon={ScrollText}
                  color="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                  onClick={() => handleLanguageSelect("kannada")}
                />
              </div>
            </div>

            {/* Leaderboard Section */}
            {leaderboard.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-lg sm:text-xl font-bold">Your Best Scores</h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleResetScores}
                    data-testid="button-reset-scores"
                    className="gap-2 h-11 text-base"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Scores</span>
                  </Button>
                </div>
                <LeaderboardCard entries={leaderboard} />
              </div>
            )}
          </div>
        )}

        {step === "class" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={handleReset} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold capitalize">{selectedLanguage}</h2>
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

        {step === "difficulty" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("class")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass}
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
        )}

        {step === "testType" && (
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
        )}

        {step === "testLength" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("testType")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestType === "mcq-only" ? "MCQ Only" : "Mixed"}
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
        )}

        {step === "chapter" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("testLength")} data-testid="button-back" size="sm">
                ← Back
              </Button>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestType === "mcq-only" ? "MCQ" : "Mixed"} - {selectedTestLength}Q
                </h2>
                <p className="text-sm text-muted-foreground">Step 5 of 5</p>
              </div>
            </div>

            <ChapterList
              chapters={chapters}
              onSelect={handleChapterSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
