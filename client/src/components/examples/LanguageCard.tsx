import LanguageCard from '../LanguageCard';
import { Globe } from 'lucide-react';

export default function LanguageCardExample() {
  return (
    <div className="p-8 bg-background">
      <LanguageCard
        language="French"
        icon={Globe}
        color="bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400"
        onClick={() => console.log('French selected')}
      />
    </div>
  );
}
