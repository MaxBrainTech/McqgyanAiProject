import { useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import FeedbackSection from "@/components/FeedbackSection";
import ProgressBar from "@/components/ProgressBar";
import TestSummary from "@/components/TestSummary";
import { Button } from "@/components/ui/button";

//todo: remove mock functionality - replace with actual API calls
const MOCK_QUESTIONS = [
  "Comment dit-on 'Hello' en français?",
  "Traduisez: 'My name is...'",
  "Quel est le pluriel de 'chat'?",
  "Comment dit-on 'Thank you' en français?",
  "Traduisez: 'I am a student'",
  "Quel est le féminin de 'acteur'?",
  "Comment dit-on 'Goodbye' en français?",
  "Traduisez: 'How are you?'",
  "Quel nombre suit 'dix-neuf'?",
  "Comment dit-on 'Please' en français?",
];

interface TestPageProps {
  config: {
    language: string;
    class: number;
    difficulty: string;
    chapter: number;
  };
  onExit: () => void;
}

export default function TestPage({ config, onExit }: TestPageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = 10;

  //todo: remove mock functionality - replace with actual AI evaluation
  const handleSubmitAnswer = async (answer: string) => {
    setIsSubmitting(true);
    console.log("Answer submitted:", answer);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock scoring
    const score = Math.floor(Math.random() * 5) + 6; // 6-10 points
    setTotalScore(totalScore + score);
    if (score >= 7) setCorrectAnswers(correctAnswers + 1);
    
    setIsSubmitting(false);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentQuestion + 1 < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleEndTest = () => {
    setShowSummary(true);
  };

  const handleNewTest = () => {
    setCurrentQuestion(0);
    setShowFeedback(false);
    setTotalScore(0);
    setCorrectAnswers(0);
    setShowSummary(false);
    onExit();
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <TestSummary
            totalScore={totalScore}
            totalQuestions={totalQuestions}
            correctAnswers={correctAnswers}
            language={config.language}
            onNewTest={handleNewTest}
            onHome={onExit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold capitalize">{config.language} Test</h1>
              <p className="text-muted-foreground">
                Class {config.class} • {config.difficulty}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onExit}
              data-testid="button-exit"
            >
              Exit Test
            </Button>
          </div>

          <ProgressBar
            current={currentQuestion + 1}
            total={totalQuestions}
            score={totalScore}
          />

          {!showFeedback ? (
            <QuestionCard
              questionNumber={currentQuestion + 1}
              totalQuestions={totalQuestions}
              question={MOCK_QUESTIONS[currentQuestion]}
              onSubmit={handleSubmitAnswer}
              isSubmitting={isSubmitting}
            />
          ) : (
            <FeedbackSection
              score={8}
              maxScore={10}
              feedback="Great job! Your answer demonstrates good understanding of the concept. You're on the right track!"
              correction="For a more advanced answer, try including more context or examples."
              encouragement="You're doing amazing! Keep up the fantastic work! 🌟"
              onNext={handleNext}
              onEndTest={handleEndTest}
            />
          )}
        </div>
      </div>
    </div>
  );
}
