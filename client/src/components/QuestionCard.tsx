import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
    <Card className="p-8 shadow-xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>

        <div className="bg-muted/50 p-6 rounded-xl">
          <h2 className="text-2xl font-medium leading-relaxed">{question}</h2>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Your Answer</label>
          <Textarea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-32 text-lg resize-none"
            data-testid="textarea-answer"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="w-full md:w-auto px-8 py-6 text-lg"
          size="lg"
          data-testid="button-submit-answer"
        >
          {isSubmitting ? "Submitting..." : "Submit Answer"}
        </Button>
      </div>
    </Card>
  );
}
