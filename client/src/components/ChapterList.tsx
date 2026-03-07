// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { BookOpen, ChevronRight } from "lucide-react";

// interface Chapter {
//   id: number;
//   title: string;
//   description: string;
// }

// interface ChapterListProps {
//   chapters: Chapter[];
//   onSelect: (chapterId: number) => void;
// }

// export default function ChapterList({ chapters, onSelect }: ChapterListProps) {
//   return (
//     <Card className="p-6">
//       <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
//         <BookOpen className="w-5 h-5" />
//         Select a Chapter
//       </h2>
//       <div className="space-y-3">
//         {chapters.map((chapter) => (
//           <Card
//             key={chapter.id}
//             className="p-4 hover-elevate cursor-pointer transition-all"
//             onClick={() => onSelect(chapter.id)}
//             data-testid={`card-chapter-${chapter.id}`}
//           >
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="font-semibold">{chapter.title}</h3>
//                 <p className="text-base text-muted-foreground">{chapter.description}</p>
//               </div>
//               <ChevronRight className="w-5 h-5 text-muted-foreground" />
//             </div>
//           </Card>
//         ))}
//       </div>
//     </Card>
//   );
// }




// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { BookOpen, ChevronRight } from "lucide-react";

// interface Chapter {
//   id: number;
//   title: string;
//   description: string;
// }

// interface ChapterListProps {
//   chapters: Chapter[];
//   onSelect: (chapterId: number) => void;
// }

// // Define some colors for chapters
// const chapterColors = [
//   "bg-red-200",
//   "bg-green-200",
//   "bg-blue-200",
//   "bg-yellow-200",
//   "bg-purple-200",
//   "bg-pink-200",
//   "bg-orange-200",
// ];

// export default function ChapterList({ chapters, onSelect }: ChapterListProps) {

//   interface ChapterListProps {
//     chapters: any[];
//     onSelect: (id: number) => void;
//     selectedLanguage: string;
//   }

//   export default function ChapterList({
//     chapters,
//     onSelect,
//     selectedLanguage
//   }: ChapterListProps)

//   return (
//     <Card className="p-6">
//       <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
//         <BookOpen className="w-5 h-5" />
//         Select a Chapter
//       </h2>
//       <div className="space-y-3">
//         {chapters.map((chapter, index) => {
//           // Cycle colors if chapters exceed defined colors
//           const colorClass = chapterColors[index % chapterColors.length];

//           return (
//             <Card
//               key={chapter.id}
//               className={`p-4 cursor-pointer transition-all ${colorClass} hover:shadow-lg hover:scale-105`}
//               onClick={() => onSelect(chapter.id)}
//               data-testid={`card-chapter-${chapter.id}`}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   {/* <h3 className="font-semibold">{chapter.title}</h3>
//                   <p className="text-base text-muted-foreground">{chapter.description}</p> */}
//                   <h3 >
//                   {selectedLanguage === "hindi"
//                     ? chapter.title.hindi
//                     : chapter.title.english}
//                 </h3>

//                 <p>
//                   {selectedLanguage === "hindi"
//                     ? chapter.description.hindi
//                     : chapter.description.english}
//                 </p>
//                 </div>
//                 <ChevronRight className="w-5 h-5 text-muted-foreground" />
//               </div>
//             </Card>
//           );
//         })}
//       </div>
//     </Card>
//   );
// }

import { Card } from "@/components/ui/card";
// import type { Chapter , LocalizedText } from "../pages/Home";
import { BookOpen, ChevronRight } from "lucide-react";

interface LocalizedText {
  english: string;
  hindi: string;
}

interface Chapter {
  id: number;
  title: LocalizedText;
  description: LocalizedText;
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

  // const getText = (field: Chapter["title"]) =>
  // selectedLanguage === "hindi"
  //   ? field.hindi
  //   : field.english;

  const getText = (field: LocalizedText) => {
    return selectedMedium === "hindi"
      ? field.hindi
      : field.english;
  };

//   const getText = (text: any) => {
//   if (!text) return "";

//   // Agar text already string hai
//   // if (typeof text === "string") return text;

//   // Agar object hai
//   if (typeof text === "object") {
//     return text.english || text.hindi || "";
//   }
//   return selectedLanguage === "hindi"
//     ? text.hindi
//     : text.english;
// };

{/* <h2>Current Medium: {selectedLanguage}</h2> */}

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        {selectedMedium === "hindi" ? "अध्याय चुनें" : "Select a Chapter"}
      </h2>

      <div className="space-y-3">
        {chapters.map((chapter, index) => {
          const colorClass =
            chapterColors[index % chapterColors.length];

          return (
            <Card
              key={chapter.id}
              className={`p-4 cursor-pointer transition-all ${colorClass} hover:shadow-lg hover:scale-105`}
              onClick={() => onSelect(chapter.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3>{getText(chapter.title)}</h3>
                  <p>{getText(chapter.description)}</p>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}