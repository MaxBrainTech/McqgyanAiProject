import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Lightbulb, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface FeedbackSectionProps {
  score: number;
  maxScore: number;
  feedback: string;
  correctAnswer: string;
  isCorrect: boolean;
  encouragement: string;
  language?: string;
  onNext: () => void;
  onEndTest: () => void;
}

export default function FeedbackSection({
  score,
  maxScore,
  feedback,
  correctAnswer,
  isCorrect,
  encouragement,
  language = 'french',
  onNext,
  onEndTest,
}: FeedbackSectionProps) {

  const { t } = useTranslation();

  const percentage = (score / maxScore) * 100;
  const [isPlaying, setIsPlaying] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    loadVoices();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getLanguageCode = (lang: string) => {
    const languageMap: Record<string, string> = {
      'hindi': 'hi-IN',
      'french': 'fr-FR',
      'german': 'de-DE',
      'spanish': 'es-ES',
      'english': 'en-US'
    };
    return languageMap[lang.toLowerCase()] || 'en-US';
  };

  const speakAnswer = () => {

    if (!('speechSynthesis' in window)) {
      alert(t("speech_not_supported"));
      return;
    }

    try {

      window.speechSynthesis.cancel();

      setTimeout(() => {

        setIsPlaying(true);

        const utterance = new SpeechSynthesisUtterance(correctAnswer);

        const langCode = getLanguageCode(language);

        utterance.lang = langCode;
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(voice => voice.lang.startsWith(langCode.split('-')[0]));

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
          setIsPlaying(true);
        };

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = () => {
          setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);

      }, 100);

    } catch {
      setIsPlaying(false);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >

      <Card
        className={`p-4 sm:p-5 md:p-6 ${
          isCorrect
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : score === 5
            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
        }`}
      >

        <div className="space-y-3 sm:space-y-4">

          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">

            <div className="flex items-center gap-2 sm:gap-3">

              {isCorrect ? (
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}

              <div>

                <h3 className="text-lg sm:text-xl font-bold">
                  {isCorrect
                    ? t("correct")
                    : score === 5
                    ? t("partial_credit")
                    : t("incorrect")}
                </h3>

                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {score}/{maxScore}
                </p>

              </div>

            </div>

            <Badge
              variant={isCorrect ? "default" : "destructive"}
              className="text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2"
            >
              {percentage.toFixed(0)}%
            </Badge>

          </div>

          <div className="bg-card p-3 sm:p-4 rounded-lg">
            <p className="text-base leading-relaxed font-medium">
              {feedback}
            </p>
          </div>

          <div className="bg-primary/10 p-3 sm:p-4 rounded-lg border-l-4 border-primary">

            <div className="flex items-start gap-2">

              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />

              <div className="flex-1 min-w-0">

                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 flex-wrap">

                  <p className="font-semibold text-base">
                    {t("correct_answer")}
                  </p>

                  <Button
                    variant={isPlaying ? "secondary" : "outline"}
                    onClick={isPlaying ? stopSpeech : speakAnswer}
                    className="gap-2 flex-shrink-0 h-11 text-base"
                    data-testid="button-pronunciation"
                  >

                    {isPlaying ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>{t("stop")}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>{t("listen")}</span>
                      </>
                    )}

                  </Button>

                </div>

                <p className="text-base font-medium break-words">
                  {correctAnswer}
                </p>

                <p className="text-base text-muted-foreground mt-1.5 sm:mt-2">
                  {t("listen_pronunciation")}
                </p>

              </div>

            </div>

          </div>

          <div className="bg-card p-3 sm:p-4 rounded-lg">

            <div className="flex items-start gap-2">

              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent mt-0.5 flex-shrink-0" />

              <p className="text-base font-medium italic">
                {encouragement}
              </p>

            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">

            <Button
              onClick={onNext}
              size="lg"
              className="w-full sm:flex-1 text-base"
              data-testid="button-next-question"
            >
              {t("next_question")}
            </Button>

            <Button
              onClick={onEndTest}
              variant="outline"
              size="lg"
              className="w-full sm:flex-1 text-base"
              data-testid="button-end-test"
            >
              {t("end_test")}
            </Button>

          </div>

        </div>

      </Card>

    </motion.div>
  );
}