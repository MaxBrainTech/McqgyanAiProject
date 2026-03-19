import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface LeaderboardEntry {
  language: string;
  score: number;
  totalQuestions: number;
  date: string;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
}

export default function LeaderboardCard({ entries }: LeaderboardCardProps) {

  const { t } = useTranslation();

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  return (
    <Card className="p-6">

      {entries.length === 0 ? (

        <p className="text-muted-foreground text-center py-8">
          {t("no_scores")}
        </p>

      ) : (

        <div className="space-y-3">

          {entries.map((entry, index) => {

            const percentage =
              ((entry.score / (entry.totalQuestions * 10)) * 100).toFixed(0);

            return (

              <Card key={index} className="p-4 hover-elevate">

                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-3 flex-1">

                    <div className="w-8 flex justify-center">
                      {getIcon(index)}
                    </div>

                    <div className="flex-1">

                      <h3 className="font-semibold capitalize">
                        {t(entry.language.toLowerCase())}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {entry.date}
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-lg font-bold text-primary">
                      {entry.score}/{entry.totalQuestions * 10}
                    </p>

                    <Badge variant="secondary">
                      {percentage}%
                    </Badge>

                  </div>

                </div>

              </Card>

            );

          })}

        </div>

      )}

    </Card>
  );
}