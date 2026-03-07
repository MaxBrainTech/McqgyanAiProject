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
      className={`p-8 cursor-pointer transition-all hover-elevate active-elevate-2 hover:scale-105 border-2 ${color} relative`}
      onClick={onClick}
      data-testid={`card-language-${language.toLowerCase()}`}
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent via-current to-transparent rounded-md"></div>

      <div className="flex flex-col items-center gap-4 text-center relative z-10">
        <div className="p-5 bg-gradient-to-br from-card to-card/80 rounded-2xl shadow-xl border border-current/20">
          <Icon className="w-16 h-16" strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-bold">{language}</h3>
      </div>
    </Card>
  );
}
