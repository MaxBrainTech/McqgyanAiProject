import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { HelpCircle, Pencil, CheckCircle, Languages } from "lucide-react";
import { transliterate, isTransliterationAvailable, getTransliterationLabel } from "@/lib/transliterate";

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
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [transliterationEnabled, setTransliterationEnabled] = useState(false);
  const [englishInput, setEnglishInput] = useState("");

  const isMcq = questionType === "mcq";
  const showTransliteration = !isMcq && isTransliterationAvailable(language);

  const handleSubmit = () => {
    const finalAnswer = isMcq ? selectedOption : answer;
    if (finalAnswer.trim()) {
      onSubmit(finalAnswer);
      setAnswer("");
      setSelectedOption("");
      setEnglishInput("");
    }
  };

  const handleAnswerChange = (value: string) => {
    if (transliterationEnabled) {
      setEnglishInput(value);
      const transliterated = transliterate(value, language);
      setAnswer(transliterated);
    } else {
      setAnswer(value);
      setEnglishInput("");
    }
  };

  const toggleTransliteration = () => {
    if (!transliterationEnabled) {
      // Switching to transliteration mode
      setEnglishInput("");
      setAnswer("");
    } else {
      // Switching to normal mode
      setEnglishInput("");
    }
    setTransliterationEnabled(!transliterationEnabled);
  };

  return (
    <Card className="p-4 sm:p-6 md:p-8 shadow-xl border-2">
      <div className="space-y-4 sm:space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            {isMcq && (
              <Badge variant="outline" className="text-base">
                <CheckCircle className="w-3 h-3 mr-1" />
                Multiple Choice
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-base text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Read carefully</span>
          </div>
        </div>

        {/* Question Display - Enhanced */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5 md:p-6 rounded-xl border border-primary/20">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="mt-0.5 sm:mt-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-base">Q</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-relaxed text-foreground break-words">
                {question}
              </p>
            </div>
          </div>
        </div>

        {/* Answer Input Section */}
        {isMcq ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <label className="text-base font-semibold text-foreground">Select your answer:</label>
            </div>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="space-y-3">
                {/* {options.map((option) => {
                  const optionKey = option.charAt(0);
                  return (
                    <div
                      key={optionKey}
                      className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg border-2 hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => setSelectedOption(optionKey)}
                      data-testid={`option-${optionKey.toLowerCase()}`}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} className="h-5 w-5" />
                      <Label
                        htmlFor={optionKey}
                        className="flex-1 text-base sm:text-lg cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })} */}
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg border-2 hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => setSelectedOption(option)}
                    data-testid={`option-${index}`}
                    >
                    <RadioGroupItem
                      value={option}
                      id={`option-${index}`}
                      className="h-5 w-5"
                    />

                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 text-base sm:text-lg cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <p className="text-base text-muted-foreground">
              Tip: Select the best answer from the options above
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-muted-foreground" />
                <label className="text-base font-semibold text-foreground">Your Answer:</label>
              </div>
              {showTransliteration && (
                <Button
                  type="button"
                  variant={transliterationEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleTransliteration}
                  className="gap-2"
                  data-testid="button-toggle-transliteration"
                >
                  <Languages className="w-4 h-4" />
                  <span className="hidden sm:inline">{getTransliterationLabel(language)}</span>
                  <span className="sm:hidden">Type in English</span>
                </Button>
              )}
            </div>
            {transliterationEnabled && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">
                  <Languages className="w-3 h-3 inline mr-1" />
                  Type in English below, and it will convert to {language} script automatically
                </p>
                <div className="text-lg font-medium text-foreground">
                  {answer || <span className="text-muted-foreground/50">Your {language} text will appear here...</span>}
                </div>
              </div>
            )}
            <Textarea
              placeholder={transliterationEnabled ? "Type in English... (e.g., namaste, kaise ho)" : "Type your answer here..."}
              value={transliterationEnabled ? englishInput : answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="min-h-28 sm:min-h-32 text-base sm:text-lg resize-none border-2 focus:border-primary"
              data-testid="textarea-answer"
            />
            <p className="text-base text-muted-foreground">
              {transliterationEnabled 
                ? "Tip: Type phonetically in English (e.g., 'namaste' → 'नमस्ते')"
                : "Tip: Check your spelling and grammar before submitting"}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={(isMcq ? !selectedOption : !answer.trim()) || isSubmitting}
          className="w-full text-base sm:text-lg"
          size="lg"
          data-testid="button-submit-answer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2 justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Evaluating...</span>
            </span>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </div>
    </Card>
  );
}
