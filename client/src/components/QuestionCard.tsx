// import { Card } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { useState } from "react";
// import { HelpCircle, Pencil, CheckCircle, Languages } from "lucide-react";
// import { useTranslation } from "react-i18next";

// interface QuestionCardProps {
//   questionNumber: number;
//   totalQuestions: number;
//   question: string;
//   questionType?: string;
//   options?: string[];
//   language?: string;
//   onSubmit: (answer: string) => void;
//   isSubmitting?: boolean;
// }

// export default function QuestionCard({
//   questionNumber,
//   totalQuestions,
//   question,
//   questionType = "open-ended",
//   options = [],
//   language = "English",
//   onSubmit,
//   isSubmitting = false,
// }: QuestionCardProps) {

//   const { t } = useTranslation();

//   const [answer, setAnswer] = useState("");
//   const [selectedOption, setSelectedOption] = useState("");

  

//   const isMcq = questionType === "mcq";

//   const handleSubmit = () => {
//     const finalAnswer = isMcq ? selectedOption : answer;
//     if (finalAnswer.trim()) {
//       onSubmit(finalAnswer);
//       setAnswer("");
//       setSelectedOption("");
//     }
//   };

//   return (
//     <Card className="p-4 sm:p-6 md:p-8 shadow-xl border-2">

//       <div className="space-y-4 sm:space-y-6">

//         {/* Header */}

//         <div className="flex items-center justify-between pb-3 sm:pb-4 border-b flex-wrap gap-2">

//           <div className="flex items-center gap-2">

//             <Badge variant="secondary" className="text-base">
//               {t("question")} {questionNumber} {t("of")} {totalQuestions}
//             </Badge>

//             {isMcq && (
//               <Badge variant="outline" className="text-base">
//                 <CheckCircle className="w-3 h-3 mr-1" />
//                 {t("multiple_choice")}
//               </Badge>
//             )}

//           </div>

//           <div className="flex items-center gap-1 text-base text-muted-foreground">
//             <HelpCircle className="w-4 h-4" />
//             <span className="hidden sm:inline">{t("read_carefully")}</span>
//           </div>

//         </div>


//         {/* Question */}

//         <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5 md:p-6 rounded-xl border border-primary/20">

//           <div className="flex items-start gap-2 sm:gap-3">

//             <div className="mt-1">

//               <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
//                 <span className="text-primary font-bold">Q</span>
//               </div>

//             </div>

//             <div className="flex-1">
//               <p className="text-xl font-medium leading-relaxed">
//                 {question}
//               </p>
//             </div>

//           </div>

//         </div>


//         {/* MCQ Section */}

//         {isMcq ? (

//           <div className="space-y-4">

//             <div className="flex items-center gap-2">
//               <CheckCircle className="w-4 h-4 text-muted-foreground" />
//               <label className="text-base font-semibold">
//                 {t("select_answer")}
//               </label>
//             </div>

//             {/* const cleanedOptions = options.map(opt =>
//               opt.replace(/([A-D]\.\s*)+/gi, "").trim()
//             );
//  */}
//             <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>

//               <div className="space-y-3">

//             {options.map((option, index) => (
//               <div
//                 key={index}
//                 className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg border-2 hover-elevate active-elevate-2 cursor-pointer"
//                 onClick={() => setSelectedOption(option)}
//                 data-testid={`option-${index}`}
//                 >
//                 <RadioGroupItem
//                   value={option}
//                   id={`option-${index}`}
//                   className="h-5 w-5"
//                 />

//                 <Label
//                   htmlFor={`option-${index}`}
//                   className="flex-1 text-base sm:text-lg cursor-pointer"
//                 >
//                   {/* 👇 FINAL FIX */}
//                   {String.fromCharCode(65 + index)}.{" "}
//                   {option.replace(/([A-D]\.\s*)+/gi, "").trim()}
//                 </Label>
//               </div>

//                 ))}

//               </div>

             

//             </RadioGroup>

//             <p className="text-base text-muted-foreground">
//               {t("tip_select_best")}
//             </p>

//           </div>

//         ) : (

//           <div className="space-y-3">

//             <div className="flex items-center gap-2">
//               <Pencil className="w-4 h-4 text-muted-foreground" />
//               <label className="text-base font-semibold">
//                 {t("your_answer")}
//               </label>
//             </div>

//             <Textarea
//               placeholder={t("type_answer")}
//               value={answer}
//               onChange={(e) => setAnswer(e.target.value)}
//               className="min-h-32 text-lg"
//             />

//             <p className="text-base text-muted-foreground">
//               {t("tip_check_spelling")}
//             </p>

//           </div>

//         )}

//         {/* Submit Button */}

//         <Button
//           onClick={handleSubmit}
//           disabled={(isMcq ? !selectedOption : !answer.trim()) || isSubmitting}
//           className="w-full text-lg"
//         >

//           {isSubmitting ? t("evaluating") : t("submit_answer")}

//         </Button>

//       </div>

//     </Card>
//   );
// }



import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { HelpCircle, Pencil, CheckCircle, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  questionType?: string;
  options?: string[];
  language?: string;
  onSubmit: (answer: string) => void;
  isSubmitting?: boolean;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  questionType = "open-ended",
  options = [],
  language = "English",
  onSubmit,
  isSubmitting = false,
}: QuestionCardProps) {

  const { t } = useTranslation();

  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  const isMcq =
    (questionType || "").toLowerCase() === "mcq" || (options?.length ?? 0) > 0;

  const handleSubmit = () => {
    const finalAnswer = isMcq ? selectedOption : answer;
    if (finalAnswer.trim()) {
      onSubmit(finalAnswer);
      setAnswer("");
      setSelectedOption("");
    }
  };

  return (
    <Card className="p-4 sm:p-6 md:p-8 shadow-xl border-2">

      <div className="space-y-4 sm:space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b flex-wrap gap-2">

          <div className="flex items-center gap-2">

            <Badge variant="secondary" className="text-base">
              {t("question")} {questionNumber} {t("of")} {totalQuestions}
            </Badge>

            {isMcq && (
              <Badge variant="outline" className="text-base">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t("multiple_choice")}
              </Badge>
            )}

          </div>

          <div className="flex items-center gap-1 text-base text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("read_carefully")}</span>
          </div>

        </div>


        {/* Question */}

        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5 md:p-6 rounded-xl border border-primary/20">

          <div className="flex items-start gap-2 sm:gap-3">

            <div className="mt-1">

              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">Q</span>
              </div>

            </div>

            <div className="flex-1">
              <p className="text-xl font-medium leading-relaxed">
                {question}
              </p>
            </div>

          </div>

        </div>


        {/* MCQ Section */}

        {isMcq ? (

          <div className="space-y-4">

            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <label className="text-base font-semibold">
                {t("select_answer")}
              </label>
            </div>

            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>

              <div className="space-y-3">

                {options.map((option, index) => {
                  const optionKey = String.fromCharCode(65 + index); // Map to A/B/C/D for backend

                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer"
                      onClick={() => setSelectedOption(optionKey)}
                    >
                      <RadioGroupItem
                        value={optionKey}
                        id={`option-${index}`}
                        className="h-5 w-5"
                      />

                      <Label htmlFor={`option-${index}`} className="flex-1 text-lg">
                        {option}
                      </Label>
                    </div>
                  );
                })}

              </div>

            </RadioGroup>

            <p className="text-base text-muted-foreground">
              {t("tip_select_best")}
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-muted-foreground" />
              <label className="text-base font-semibold">
                {t("your_answer")}
              </label>
            </div>

            <Textarea
              placeholder={t("type_answer")}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-32 text-lg"
            />

            <p className="text-base text-muted-foreground">
              {t("tip_check_spelling")}
            </p>

          </div>

        )}

        {/* Submit Button */}

        <Button
          onClick={handleSubmit}
          disabled={(isMcq ? !selectedOption : !answer.trim()) || isSubmitting}
          className="w-full text-lg"
        >

          {isSubmitting ? t("evaluating") : t("submit_answer")}

        </Button>

      </div>

    </Card>
  );
}
