import { useState, useEffect } from "react";
import { Languages, BookOpen, Sparkles, Trophy, RotateCcw, GraduationCap } from "lucide-react";
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
    chapter: number;
    testLength: number;
  }) => void;
}

export default function Home({ onStartTest }: HomeProps) {
  const [step, setStep] = useState<"language" | "class" | "difficulty" | "testLength" | "chapter">("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Header */}
      <div className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">CBSE Language Learning Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              LangBuddy AI
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Master French, German, and Spanish with AI-powered adaptive testing. 
              <span className="block mt-2 font-medium text-foreground">25 chapters per language • 4 test formats • Real-time feedback</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {step === "language" && (
          <div className="space-y-8">
            {/* Features Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="inline-flex p-2 bg-blue-500/10 rounded-lg mb-2">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold">CBSE Aligned</h3>
                <p className="text-sm text-muted-foreground">Official curriculum coverage</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="inline-flex p-2 bg-green-500/10 rounded-lg mb-2">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold">AI Powered</h3>
                <p className="text-sm text-muted-foreground">Adaptive question generation</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="inline-flex p-2 bg-purple-500/10 rounded-lg mb-2">
                  <Trophy className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold">Track Progress</h3>
                <p className="text-sm text-muted-foreground">Monitor your improvement</p>
              </Card>
            </div>

            {/* Language Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Choose Your Language</h2>
                <Badge variant="secondary" className="text-sm">
                  3 Languages Available
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
            </div>

            {/* Leaderboard Section */}
            {leaderboard.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Your Best Scores</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetScores}
                    data-testid="button-reset-scores"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Scores
                  </Button>
                </div>
                <LeaderboardCard entries={leaderboard} />
              </div>
            )}
          </div>
        )}

        {step === "class" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={handleReset} data-testid="button-back">
                ← Back
              </Button>
              <div>
                <h2 className="text-2xl font-bold capitalize">{selectedLanguage}</h2>
                <p className="text-muted-foreground">Step 1 of 3</p>
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
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("class")} data-testid="button-back">
                ← Back
              </Button>
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass}
                </h2>
                <p className="text-muted-foreground">Step 2 of 3</p>
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

        {step === "testLength" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("difficulty")} data-testid="button-back">
                ← Back
              </Button>
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty}
                </h2>
                <p className="text-muted-foreground">Step 3 of 4</p>
              </div>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Select Test Length</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("testLength")} data-testid="button-back">
                ← Back
              </Button>
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty} - {selectedTestLength} Questions
                </h2>
                <p className="text-muted-foreground">Step 4 of 4</p>
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
