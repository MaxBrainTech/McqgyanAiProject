import TestSummary from '../TestSummary';

export default function TestSummaryExample() {
  return (
    <div className="p-8 bg-background">
      <TestSummary
        totalScore={78}
        totalQuestions={10}
        correctAnswers={8}
        language="French"
        onNewTest={() => console.log('New test')}
        onHome={() => console.log('Go home')}
      />
    </div>
  );
}
