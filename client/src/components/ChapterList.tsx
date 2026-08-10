import { Card } from "@/components/ui/card";
import { BookOpen, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LocalizedText {
  english: string;
  hindi: string;
}

interface Chapter {
  id: number;
  title: LocalizedText | string;
  description: LocalizedText | string;
}

interface ChapterListProps {
  chapters: Chapter[];
  onSelect: (chapterId: number) => void;
  selectedMedium: string;
}

const chapterColors = [
  "bg-red-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-yellow-200",
  "bg-purple-200",
  "bg-pink-200",
  "bg-orange-200",
];

export default function ChapterList({
  chapters,
  onSelect,
  selectedMedium,
}: ChapterListProps) {
  const { t } = useTranslation();
  const isHindi = selectedMedium === "hindi";

  const normalizeText = (field: Chapter["title"]) => {
    if (typeof field === "string") {
      return {
        english: field,
        hindi: field,
      };
    }

    return {
      english: field.english || field.hindi || "",
      hindi: field.hindi || field.english || "",
    };
  };

  const getText = (field: Chapter["title"]) => {
    const normalized = normalizeText(field);
    return isHindi ? normalized.hindi : normalized.english;
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
        <BookOpen className="h-5 w-5 text-white" />
        {t("select_chapter")}
      </h2>

      <div className="space-y-3">
        {chapters.map((chapter, index) => {
          const colorClass = chapterColors[index % chapterColors.length];
          const title = getText(chapter.title);
          const description = getText(chapter.description);

          return (
            <Card
              key={chapter.id}
              className={`cursor-pointer p-4 transition-all ${colorClass} text-slate-900 hover:shadow-lg hover:scale-[1.02]`}
              onClick={() => onSelect(chapter.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 break-words text-slate-800">
                    {description}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-700" />
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
