import QuestionCard from '../QuestionCard';

export default function QuestionCardExample() {
  return (
    <div className="p-8 bg-background">
      <QuestionCard
        questionNumber={3}
        totalQuestions={10}
        question="Comment dit-on 'Good morning' en français?"
        onSubmit={(answer) => console.log('Submitted:', answer)}
      />
    </div>
  );
}
