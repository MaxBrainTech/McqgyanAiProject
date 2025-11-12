import { useState, useEffect } from "react";
import { Languages, BookOpen, Sparkles } from "lucide-react";
import LanguageCard from "@/components/LanguageCard";
import SelectionGrid from "@/components/SelectionGrid";
import ChapterList from "@/components/ChapterList";
import { Button } from "@/components/ui/button";
import LeaderboardCard from "@/components/LeaderboardCard";

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
  
  useEffect(() => {
    const savedScores = localStorage.getItem("langbuddy_scores");
    if (savedScores) {
      setLeaderboard(JSON.parse(savedScores));
    }
  }, []);

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {step === "language" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-primary/10 rounded-2xl">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Welcome to <span className="text-primary">LangBuddy</span>!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Practice French, German, and Spanish with AI-powered questions. Choose a language to begin your learning journey!
              </p>
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

            {leaderboard.length > 0 && (
              <div className="max-w-2xl mx-auto">
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
          <div className="space-y-6 max-w-3xl mx-auto">
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

            <SelectionGrid
              title="Select Test Length"
              items={[
                { label: "Quick (10 Questions)", value: 10 },
                { label: "Standard (20 Questions)", value: 20 },
                { label: "Extended (30 Questions)", value: 30 },
                { label: "Full Test (50 Questions)", value: 50 },
              ]}
              selected={selectedTestLength}
              onSelect={handleTestLengthSelect}
            />
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
