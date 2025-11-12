import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-primary" />
        Your Best Scores
      </h2>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No scores yet. Start a test to see your results here!
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const percentage = ((entry.score / entry.totalQuestions) * 100).toFixed(0);
            return (
              <Card key={index} className="p-4" data-testid={`row-score-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 flex justify-center">{getIcon(index)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{entry.language}</h3>
                      <p className="text-sm text-muted-foreground">{entry.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {entry.score}/{entry.totalQuestions}
                    </p>
                    <Badge variant="secondary">{percentage}%</Badge>
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
