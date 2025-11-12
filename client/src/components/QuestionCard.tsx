import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { HelpCircle, Pencil } from "lucide-react";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  onSubmit: (answer: string) => void;
  isSubmitting?: boolean;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  onSubmit,
  isSubmitting = false,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer("");
    }
  };

  return (
    <Card className="p-8 shadow-xl border-2">
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Question {questionNumber} of {totalQuestions}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <HelpCircle className="w-3 h-3" />
            <span>Read carefully</span>
          </div>
        </div>

        {/* Question Display - Enhanced */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">Q</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground">
                {question}
              </p>
            </div>
          </div>
        </div>

        {/* Answer Input Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-semibold text-foreground">Your Answer:</label>
          </div>
          <Textarea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-32 text-lg resize-none border-2 focus:border-primary"
            data-testid="textarea-answer"
          />
          <p className="text-xs text-muted-foreground">
            💡 Tip: Make sure to check your spelling and grammar before submitting
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="w-full md:w-auto px-8 py-6 text-lg"
          size="lg"
          data-testid="button-submit-answer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              AI is evaluating your answer...
            </span>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </div>
    </Card>
  );
}
