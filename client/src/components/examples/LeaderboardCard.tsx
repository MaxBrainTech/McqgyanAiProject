import LeaderboardCard from '../LeaderboardCard';
import type { ScoreHistoryEntry } from '@/lib/scoreHistory';

export default function LeaderboardCardExample() {
  const entries: ScoreHistoryEntry[] = [
    {
      id: 'demo-1',
      subject: 'French',
      score: 90,
      maxScore: 100,
      percentage: 90,
      totalQuestions: 10,
      correctAnswers: 9,
      language: 'en',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      date: '2 hours ago',
    },
    {
      id: 'demo-2',
      subject: 'Spanish',
      score: 80,
      maxScore: 100,
      percentage: 80,
      totalQuestions: 10,
      correctAnswers: 8,
      language: 'en',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      date: 'Yesterday',
    },
    {
      id: 'demo-3',
      subject: 'German',
      score: 70,
      maxScore: 100,
      percentage: 70,
      totalQuestions: 10,
      correctAnswers: 7,
      language: 'en',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      date: '3 days ago',
    },
  ];

  return (
    <div className="p-8 bg-background">
      <LeaderboardCard entries={entries} onResetScores={() => {}} />
    </div>
  );
}
