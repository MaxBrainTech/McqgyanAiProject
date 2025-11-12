import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Lightbulb, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface FeedbackSectionProps {
  score: number;
  maxScore: number;
  feedback: string;
  correctAnswer: string;
  isCorrect: boolean;
  encouragement: string;
  onNext: () => void;
  onEndTest: () => void;
}

export default function FeedbackSection({
  score,
  maxScore,
  feedback,
  correctAnswer,
  isCorrect,
  encouragement,
  onNext,
  onEndTest,
}: FeedbackSectionProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`p-6 ${
          isCorrect
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : score === 5
            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h3 className="text-xl font-bold">{isCorrect ? "Correct!" : score === 5 ? "Partial Credit" : "Incorrect"}</h3>
                <p className="text-3xl font-bold text-primary">
                  {score}/{maxScore}
                </p>
              </div>
            </div>
            <Badge variant={isCorrect ? "default" : "destructive"} className="text-lg px-4 py-2">
              {percentage.toFixed(0)}%
            </Badge>
          </div>

          <div className="bg-card p-4 rounded-lg">
            <p className="text-base leading-relaxed font-medium">{feedback}</p>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">Correct Answer</p>
                <p className="text-base font-medium">{correctAnswer}</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-base font-medium italic">{encouragement}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap pt-2">
            <Button
              onClick={onNext}
              size="lg"
              className="flex-1 min-w-[200px]"
              data-testid="button-next-question"
            >
              Next Question
            </Button>
            <Button
              onClick={onEndTest}
              variant="outline"
              size="lg"
              className="flex-1 min-w-[200px]"
              data-testid="button-end-test"
            >
              End Test
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
