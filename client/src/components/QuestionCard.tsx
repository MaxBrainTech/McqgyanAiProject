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
    <Card className="p-4 sm:p-6 md:p-8 shadow-xl border-2">
      <div className="space-y-4 sm:space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base">
              Question {questionNumber} of {totalQuestions}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-base text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Read carefully</span>
          </div>
        </div>

        {/* Question Display - Enhanced */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5 md:p-6 rounded-xl border border-primary/20">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="mt-0.5 sm:mt-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-base">Q</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-relaxed text-foreground break-words">
                {question}
              </p>
            </div>
          </div>
        </div>

        {/* Answer Input Section */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-muted-foreground" />
            <label className="text-base font-semibold text-foreground">Your Answer:</label>
          </div>
          <Textarea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-28 sm:min-h-32 text-base sm:text-lg resize-none border-2 focus:border-primary"
            data-testid="textarea-answer"
          />
          <p className="text-base text-muted-foreground">
            Tip: Check your spelling and grammar before submitting
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="w-full text-base sm:text-lg"
          size="lg"
          data-testid="button-submit-answer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2 justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Evaluating...</span>
            </span>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </div>
    </Card>
  );
}
