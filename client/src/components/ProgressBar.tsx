import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface ProgressBarProps {
  current: number;
  total: number;
  score?: number;
}

export default function ProgressBar({ current, total, score }: ProgressBarProps) {

  const { t } = useTranslation();
  const percentage = (current / total) * 100;

  return (
    <Card className="p-4">
      <div className="space-y-3">

        <div className="flex items-center justify-between text-sm">

          <span className="font-medium">
            {t("progress")} {current}/{total} {t("questions")}
          </span>

          {score !== undefined && (
            <span className="font-semibold text-primary">
              {t("score")} {score} {t("points")}
            </span>
          )}

        </div>

        <Progress value={percentage} className="h-3" />

      </div>
    </Card>
  );
}