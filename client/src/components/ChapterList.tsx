import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  description: string;
}

interface ChapterListProps {
  chapters: Chapter[];
  onSelect: (chapterId: number) => void;
}

export default function ChapterList({ chapters, onSelect }: ChapterListProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Select a Chapter
      </h2>
      <div className="space-y-3">
        {chapters.map((chapter) => (
          <Card
            key={chapter.id}
            className="p-4 hover-elevate cursor-pointer transition-all"
            onClick={() => onSelect(chapter.id)}
            data-testid={`card-chapter-${chapter.id}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{chapter.title}</h3>
                <p className="text-base text-muted-foreground">{chapter.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
