import { useState } from "react";
import { Languages, BookOpen, Sparkles } from "lucide-react";
import LanguageCard from "@/components/LanguageCard";
import SelectionGrid from "@/components/SelectionGrid";
import ChapterList from "@/components/ChapterList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LeaderboardCard from "@/components/LeaderboardCard";

//todo: remove mock functionality
const CHAPTERS: Record<string, any[]> = {
  french: [
    { id: 1, title: "Les Salutations", description: "Greetings and introductions" },
    { id: 2, title: "Les Nombres", description: "Numbers 1-100" },
    { id: 3, title: "La Famille", description: "Family members" },
    { id: 4, title: "Les Couleurs", description: "Colors and adjectives" },
    { id: 5, title: "La Nourriture", description: "Food and dining" },
  ],
  german: [
    { id: 1, title: "Begrüßungen", description: "Greetings and farewells" },
    { id: 2, title: "Zahlen", description: "Numbers 1-100" },
    { id: 3, title: "Familie", description: "Family relationships" },
    { id: 4, title: "Farben", description: "Colors and descriptions" },
    { id: 5, title: "Essen", description: "Food and meals" },
  ],
  spanish: [
    { id: 1, title: "Saludos", description: "Greetings and introductions" },
    { id: 2, title: "Números", description: "Numbers 1-100" },
    { id: 3, title: "La Familia", description: "Family members" },
    { id: 4, title: "Colores", description: "Colors and adjectives" },
    { id: 5, title: "Comida", description: "Food and eating" },
  ],
};

interface HomeProps {
  onStartTest: (config: {
    language: string;
    class: number;
    difficulty: string;
    chapter: number;
  }) => void;
}

export default function Home({ onStartTest }: HomeProps) {
  const [step, setStep] = useState<"language" | "class" | "difficulty" | "chapter">("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  //todo: remove mock functionality
  const mockLeaderboard = [
    { language: "French", score: 9, totalQuestions: 10, date: "2 hours ago" },
    { language: "Spanish", score: 8, totalQuestions: 10, date: "Yesterday" },
  ];

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
    setStep("chapter");
  };

  const handleChapterSelect = (chapterId: number) => {
    onStartTest({
      language: selectedLanguage,
      class: selectedClass,
      difficulty: selectedDifficulty,
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

            {mockLeaderboard.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <LeaderboardCard entries={mockLeaderboard} />
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

        {step === "chapter" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setStep("difficulty")} data-testid="button-back">
                ← Back
              </Button>
              <div>
                <h2 className="text-2xl font-bold capitalize">
                  {selectedLanguage} - Class {selectedClass} - {selectedDifficulty}
                </h2>
                <p className="text-muted-foreground">Step 3 of 3</p>
              </div>
            </div>

            <ChapterList
              chapters={CHAPTERS[selectedLanguage] || []}
              onSelect={handleChapterSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
