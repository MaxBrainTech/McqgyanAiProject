import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface LanguageCardProps {
  language: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export default function LanguageCard({ language, icon: Icon, color, onClick }: LanguageCardProps) {
  return (
    <Card
      className={`p-8 cursor-pointer transition-all hover-elevate active-elevate-2 hover:scale-105 ${color}`}
      onClick={onClick}
      data-testid={`card-language-${language.toLowerCase()}`}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 bg-card rounded-2xl shadow-lg">
          <Icon className="w-16 h-16" />
        </div>
        <h3 className="text-2xl font-bold">{language}</h3>
      </div>
    </Card>
  );
}
