import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, TrendingUp, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

interface TestSummaryProps {
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  language: string;
  onNewTest: () => void;
  onHome: () => void;
}

export default function TestSummary({
  totalScore,
  totalQuestions,
  correctAnswers,
  language,
  onNewTest,
  onHome,
}: TestSummaryProps) {
  const percentage = totalQuestions > 0 ? ((totalScore / (totalQuestions * 10)) * 100).toFixed(0) : "0";
  const accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(0) : "0";

  // Save to leaderboard
  useEffect(() => {
    const savedScores = localStorage.getItem("langbuddy_scores");
    const scores = savedScores ? JSON.parse(savedScores) : [];
    
    const newEntry = {
      language: language.charAt(0).toUpperCase() + language.slice(1),
      score: totalScore,
      totalQuestions,
      date: new Date().toLocaleString(),
    };
    
    scores.unshift(newEntry);
    scores.sort((a: any, b: any) => b.score - a.score);
    const topScores = scores.slice(0, 5);
    
    localStorage.setItem("langbuddy_scores", JSON.stringify(topScores));
  }, [totalScore, totalQuestions, language]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 bg-primary/10 rounded-full">
            <Trophy className="w-16 h-16 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Test Complete!</h1>
            <p className="text-lg text-muted-foreground">
              Great work on your {language} test
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            <Card className="p-4 bg-primary/5">
              <div className="flex flex-col items-center gap-2">
                <Target className="w-8 h-8 text-primary" />
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-3xl font-bold text-primary">
                  {totalScore}/{totalQuestions * 10}
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-accent/5">
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="w-8 h-8 text-accent" />
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-3xl font-bold text-accent">{accuracy}%</p>
              </div>
            </Card>

            <Card className="p-4 bg-green-50 dark:bg-green-950/20">
              <div className="flex flex-col items-center gap-2">
                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {correctAnswers}/{totalQuestions}
                </p>
              </div>
            </Card>
          </div>

          <div className="bg-muted/50 p-6 rounded-xl">
            <p className="text-lg font-medium">
              {parseInt(percentage) >= 80
                ? "Outstanding! You're really mastering this language! 🎉"
                : parseInt(percentage) >= 60
                ? "Good job! You're making great progress! 💪"
                : "Nice try! Keep practicing and you'll improve quickly! 📚"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onNewTest}
              size="lg"
              className="flex-1"
              data-testid="button-new-test"
            >
              Try Another Test
            </Button>
            <Button
              onClick={onHome}
              variant="outline"
              size="lg"
              className="flex-1"
              data-testid="button-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
