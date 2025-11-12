import FeedbackSection from '../FeedbackSection';

export default function FeedbackSectionExample() {
  return (
    <div className="p-8 bg-background">
      <FeedbackSection
        score={8}
        maxScore={10}
        feedback="Great job! Your answer shows a good understanding of French greetings. You correctly used 'Bonjour' which is the standard way to say good morning."
        correction="For a more formal greeting, you could also say 'Bon matin' though 'Bonjour' is more commonly used throughout the day."
        encouragement="You're making excellent progress! Keep practicing and you'll master French in no time!"
        onNext={() => console.log('Next clicked')}
        onEndTest={() => console.log('End test clicked')}
      />
    </div>
  );
}
