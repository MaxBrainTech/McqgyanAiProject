import FeedbackSection from '../FeedbackSection';

export default function FeedbackSectionExample() {
  return (
    <div className="p-8 bg-background">
      <FeedbackSection
        score={10}
        maxScore={10}
        feedback="Perfect! Your answer demonstrates excellent understanding of French greetings."
        correctAnswer="Bonjour"
        isCorrect={true}
        encouragement="You're making excellent progress! Keep practicing and you'll master French in no time!"
        language="french"
        onNext={() => console.log('Next clicked')}
        onEndTest={() => console.log('End test clicked')}
      />
    </div>
  );
}
