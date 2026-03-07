import LeaderboardCard from '../LeaderboardCard';

export default function LeaderboardCardExample() {
  const entries = [
    { language: 'French', score: 9, totalQuestions: 10, date: '2 hours ago' },
    { language: 'Spanish', score: 8, totalQuestions: 10, date: 'Yesterday' },
    { language: 'German', score: 7, totalQuestions: 10, date: '3 days ago' },
  ];

  return (
    <div className="p-8 bg-background">
      <LeaderboardCard entries={entries} />
    </div>
  );
}
