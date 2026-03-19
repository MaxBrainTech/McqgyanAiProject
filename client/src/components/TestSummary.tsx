// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Trophy, Target, TrendingUp, Home } from "lucide-react";
// import { motion } from "framer-motion";
// import { useEffect } from "react";
// import { useTranslation } from "react-i18next";

// interface TestSummaryProps {
//   totalScore: number;
//   totalQuestions: number;
//   correctAnswers: number;
//   subject: string;
//   onNewTest: () => void;
//   onHome: () => void;
// }

// export default function TestSummary({
//   totalScore,
//   totalQuestions,
//   correctAnswers,
//   subject,
//   onNewTest,
//   onHome,
// }: TestSummaryProps) {

//   const { t } = useTranslation();

//   const percentage =
//     totalQuestions > 0
//       ? ((totalScore / (totalQuestions * 10)) * 100).toFixed(0)
//       : "0";

//   const accuracy =
//     totalQuestions > 0
//       ? ((correctAnswers / totalQuestions) * 100).toFixed(0)
//       : "0";

//   useEffect(() => {

//     const savedScores = localStorage.getItem("langbuddy_scores");
//     const scores = savedScores ? JSON.parse(savedScores) : [];

//     const newEntry = {
//       language: subject
//         ? subject.charAt(0).toUpperCase() + subject.slice(1)
//         : "Unknown",
//       score: totalScore,
//       totalQuestions,
//       date: new Date().toLocaleString(),
//     };

//     scores.unshift(newEntry);
//     scores.sort((a: any, b: any) => b.score - a.score);

//     const topScores = scores.slice(0, 5);

//     localStorage.setItem("langbuddy_scores", JSON.stringify(topScores));

//   }, [totalScore, totalQuestions, subject]);

//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.4 }}
//       className="max-w-2xl mx-auto"
//     >

//       <Card className="p-8">

//         <div className="text-center space-y-6">

//           <div className="inline-flex p-4 bg-primary/10 rounded-full">
//             <Trophy className="w-16 h-16 text-primary" />
//           </div>

//           <div>

//             <h1 className="text-3xl font-bold mb-2">
//               {t("test_complete")}
//             </h1>

//             <p className="text-lg text-muted-foreground">
//               {t("great_work")} {subject || t("quiz")}
//             </p>

//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">

//             <Card className="p-4 bg-primary/5">

//               <div className="flex flex-col items-center gap-2">

//                 <Target className="w-8 h-8 text-primary" />

//                 <p className="text-base text-muted-foreground">
//                   {t("total_score")}
//                 </p>

//                 <p className="text-3xl font-bold text-primary">
//                   {totalScore}/{totalQuestions * 10}
//                 </p>

//               </div>

//             </Card>

//             <Card className="p-4 bg-accent/5">

//               <div className="flex flex-col items-center gap-2">

//                 <TrendingUp className="w-8 h-8 text-accent" />

//                 <p className="text-base text-muted-foreground">
//                   {t("accuracy")}
//                 </p>

//                 <p className="text-3xl font-bold text-accent">
//                   {accuracy}%
//                 </p>

//               </div>

//             </Card>

//             <Card className="p-4 bg-green-50 dark:bg-green-950/20">

//               <div className="flex flex-col items-center gap-2">

//                 <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />

//                 <p className="text-base text-muted-foreground">
//                   {t("correct")}
//                 </p>

//                 <p className="text-3xl font-bold text-green-600 dark:text-green-400">
//                   {correctAnswers}/{totalQuestions}
//                 </p>

//               </div>

//             </Card>

//           </div>

//           <div className="bg-muted/50 p-6 rounded-xl">

//             <p className="text-lg font-medium">

//               {parseInt(percentage) >= 80
//                 ? t("outstanding")
//                 : parseInt(percentage) >= 60
//                 ? t("good_progress")
//                 : t("keep_practicing")}

//             </p>

//           </div>

//           <div className="flex flex-col sm:flex-row gap-3 pt-4">

//             <Button
//               onClick={onNewTest}
//               size="lg"
//               className="flex-1 text-base"
//             >
//               {t("try_another_test")}
//             </Button>

//             <Button
//               onClick={onHome}
//               variant="outline"
//               size="lg"
//               className="flex-1 text-base"
//             >
//               <Home className="w-4 h-4 mr-2" />
//               {t("back_home")}
//             </Button>

//           </div>

//         </div>

//       </Card>

//     </motion.div>
//   );
// }


import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, TrendingUp, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface TestSummaryProps {
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  subject: string;
  onNewTest: () => void;
  onHome: () => void;
}

export default function TestSummary({
  totalScore,
  totalQuestions,
  correctAnswers,
  subject,
  onNewTest,
  onHome,
}: TestSummaryProps) {

  const { t } = useTranslation();

  const percentage =
    totalQuestions > 0
      ? ((totalScore / (totalQuestions * 10)) * 100).toFixed(0)
      : "0";

  const accuracy =
    totalQuestions > 0
      ? ((correctAnswers / totalQuestions) * 100).toFixed(0)
      : "0";

  useEffect(() => {

    const savedScores = localStorage.getItem("langbuddy_scores");
    const scores = savedScores ? JSON.parse(savedScores) : [];

    const newEntry = {
      language: subject
        ? subject.charAt(0).toUpperCase() + subject.slice(1)
        : "Unknown",
      score: totalScore,
      totalQuestions,
      date: new Date().toLocaleString(),
    };

    scores.unshift(newEntry);
    scores.sort((a: any, b: any) => b.score - a.score);

    const topScores = scores.slice(0, 5);

    localStorage.setItem("langbuddy_scores", JSON.stringify(topScores));

  }, [totalScore, totalQuestions, subject]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >

      <Card className="p-8">

        <div className="text-center space-y-6">

          <div className="inline-flex p-4 bg-primary/10 rounded-full">
            <Trophy className="w-16 h-16 text-primary" />
          </div>

          <div>

            <h1 className="text-3xl font-bold mb-2">
              {t("test_complete")}
            </h1>

            <p className="text-lg text-muted-foreground">
              {t("great_work")} {subject || t("quiz")}
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">

            <Card className="p-4 bg-primary/5">

              <div className="flex flex-col items-center gap-2">

                <Target className="w-8 h-8 text-primary" />

                <p className="text-base text-muted-foreground">
                  {t("total_score")}
                </p>

                <p className="text-3xl font-bold text-primary">
                  {totalScore}/{totalQuestions * 10}
                </p>

              </div>

            </Card>

            <Card className="p-4 bg-accent/5">

              <div className="flex flex-col items-center gap-2">

                <TrendingUp className="w-8 h-8 text-accent" />

                <p className="text-base text-muted-foreground">
                  {t("accuracy")}
                </p>

                <p className="text-3xl font-bold text-accent">
                  {accuracy}%
                </p>

              </div>

            </Card>

            <Card className="p-4 bg-green-50 dark:bg-green-950/20">

              <div className="flex flex-col items-center gap-2">

                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />

                <p className="text-base text-muted-foreground">
                  {t("correct")}
                </p>

                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {correctAnswers}/{totalQuestions}
                </p>

              </div>

            </Card>

          </div>

          <div className="bg-muted/50 p-6 rounded-xl">

            <p className="text-lg font-medium">

              {parseInt(percentage) >= 80
                ? t("outstanding")
                : parseInt(percentage) >= 60
                ? t("good_progress")
                : t("keep_practicing")}

            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">

            <Button
              onClick={onNewTest}
              size="lg"
              className="flex-1 text-base"
            >
              {t("try_another_test")}
            </Button>

            <Button
              onClick={onHome}
              variant="outline"
              size="lg"
              className="flex-1 text-base"
            >
              <Home className="w-4 h-4 mr-2" />
              {t("back_home")}
            </Button>

          </div>

        </div>

      </Card>

    </motion.div>
  );
}