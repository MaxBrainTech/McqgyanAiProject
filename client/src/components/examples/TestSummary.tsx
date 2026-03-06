import { Button } from "@/components/ui/button";

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
  const percentage = Math.round(
    (correctAnswers / totalQuestions) * 100
  );

  return (
    <div className="max-w-xl mx-auto bg-card rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center">
        Test Result
      </h2>

      <div className="space-y-1 text-center">
        <p>
          Total Score: <strong>{totalScore}</strong>
        </p>
        <p>
          Correct Answers:{" "}
          <strong>{correctAnswers}</strong> / {totalQuestions}
        </p>
        <p>
          Percentage: <strong>{percentage}%</strong>
        </p>
        <p>
          Language: <strong>{language}</strong>
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onNewTest}>
          New Test
        </Button>
        <Button variant="outline" onClick={onHome}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
