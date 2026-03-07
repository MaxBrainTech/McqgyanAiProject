import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface ProgressBarProps {
  current: number;
  total: number;
  score?: number;
}

export default function ProgressBar({ current, total, score }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Progress: {current}/{total} questions
          </span>
          {score !== undefined && (
            <span className="font-semibold text-primary">Score: {score} points</span>
          )}
        </div>
        <Progress value={percentage} className="h-3" />
      </div>
    </Card>
  );
}
