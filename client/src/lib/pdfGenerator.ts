import jsPDF from "jspdf";
import { getLocalizedText, type LocalizedValue } from "@/lib/quizText";

type PdfLabels = {
  appName: string;
  questionPaper: string;
  answerSheet: string;
  subject: string;
  class: string;
  difficulty: string;
  totalQuestions: string;
  shareCode: string;
  questions: string;
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string;
  yourAnswer: string;
  notAnswered: string;
  page: string;
  of: string;
  generatedBy: string;
  company: string;
  website: string;
  correct: string;
  incorrect: string;
  score: string;
  percentage: string;
};

export type PdfQuestion = {
  question: LocalizedValue;
  options?: Array<LocalizedValue>;
  correctAnswer?: LocalizedValue;
  explanation?: LocalizedValue;
  userAnswer?: LocalizedValue;
  isCorrect?: boolean;
};

type GenerateQuizPdfOptions = {
  title: string;
  subject: string;
  classLevel: string | number;
  difficulty: string;
  language: string;
  shareCode?: string;
  questions: PdfQuestion[];
  fileName: string;
  labels: PdfLabels;
  mode?: "questions" | "answers";
  scoreSummary?: {
    score: number;
    maxScore: number;
    percentage: number;
    correctAnswers: number;
  };
};

const APP_LOGO_URL = "/logo.png";
const HINDI_FONT_URL = "/NotoSansDevanagari-Regular.ttf";
let cachedHindiFont: string | null = null;
let cachedLogoDataUrl: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(index, index + chunkSize) as unknown as number[],
    );
  }

  return btoa(binary);
}

async function loadHindiFont() {
  if (cachedHindiFont) return cachedHindiFont;

  const response = await fetch(HINDI_FONT_URL);
  const buffer = await response.arrayBuffer();
  cachedHindiFont = arrayBufferToBase64(buffer);
  return cachedHindiFont;
}

async function loadLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  try {
    const response = await fetch(APP_LOGO_URL);
    if (!response.ok) return null;

    const blob = await response.blob();
    cachedLogoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

function hasDevanagari(value?: LocalizedValue | LocalizedValue[]): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.some((entry) => hasDevanagari(entry));
  const text =
    typeof value === "string"
      ? value
      : `${value.en || ""} ${value.hi || ""}`;

  return /[\u0900-\u097F]/.test(text);
}

export async function generateQuizPdf({
  title,
  subject,
  classLevel,
  difficulty,
  language,
  shareCode,
  questions,
  fileName,
  labels,
  mode = "questions",
  scoreSummary,
}: GenerateQuizPdfOptions) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = 30;
  const footerHeight = 14;
  const topStart = headerHeight + 14;
  const bottomLimit = pageHeight - footerHeight - 8;
  const languageCode = language?.toLowerCase().startsWith("hi") ? "hi" : "en";

  const needsHindiFont =
    languageCode === "hi" ||
    hasDevanagari(subject) ||
    questions.some((item) =>
      [item.question, item.correctAnswer, item.explanation, item.userAnswer, item.options].some(
        (value) => hasDevanagari(value as LocalizedValue | LocalizedValue[]),
      ),
    );

  let bodyFont = "helvetica";

  if (needsHindiFont) {
    const fontData = await loadHindiFont();
    pdf.addFileToVFS("NotoSansDevanagari-Regular.ttf", fontData);
    pdf.addFont("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari", "normal");
    pdf.addFont("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari", "bold");
    bodyFont = "NotoSansDevanagari";
  }

  const logoDataUrl = await loadLogoDataUrl();
  const waterMarkText = labels.appName;

  const setBodyFont = (style: "normal" | "bold" = "normal", size = 11) => {
    pdf.setFont(bodyFont, style);
    pdf.setFontSize(size);
  };

  const drawRoundedBox = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: [number, number, number],
    stroke: [number, number, number],
  ) => {
    pdf.setFillColor(...fill);
    pdf.setDrawColor(...stroke);
    pdf.roundedRect(x, y, width, height, 3, 3, "FD");
  };

  const drawHeader = () => {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, headerHeight, "F");

    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, "PNG", margin, 7, 12, 12, undefined, "FAST");
      } catch {
        // Ignore image failures and continue with text-only header.
      }
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(labels.appName, logoDataUrl ? margin + 16 : margin, 13);

    setBodyFont("bold", 16);
    pdf.text(mode === "answers" ? labels.answerSheet : labels.questionPaper, margin, 22);

    setBodyFont("normal", 10);
    pdf.text(
      `${subject}  |  ${labels.class} ${classLevel}  |  ${difficulty}`,
      pageWidth - margin,
      13,
      { align: "right" },
    );

    pdf.setDrawColor(148, 163, 184);
    pdf.line(margin, headerHeight, pageWidth - margin, headerHeight);
    pdf.setTextColor(33, 37, 41);
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 8;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text(labels.company, margin, footerY);
    pdf.text(
      `${labels.page} ${pageNumber} ${labels.of} ${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: "center" },
    );
    pdf.text(labels.website, pageWidth - margin, footerY, { align: "right" });
    pdf.setTextColor(33, 37, 41);
  };

  const addWatermark = () => {
    pdf.saveGraphicsState();
    pdf.setTextColor(226, 232, 240);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);
    pdf.text(waterMarkText, pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 28,
    });
    pdf.restoreGraphicsState();
  };

  const ensureSpace = (requiredHeight: number, y: number) => {
    if (y + requiredHeight <= bottomLimit) return y;

    pdf.addPage();
    drawHeader();
    addWatermark();
    return topStart;
  };

  const getWrappedLines = (text: string, fontSize: number, width: number, style: "normal" | "bold" = "normal") => {
    setBodyFont(style, fontSize);
    return pdf.splitTextToSize(text, width);
  };

  const lineBlockHeight = (lines: string[], fontSize: number, spacing = 1.75) =>
    lines.length * (fontSize * 0.34 + spacing);

  drawHeader();
  addWatermark();

  let y = topStart;

  drawRoundedBox(margin, y, contentWidth, 24, [248, 250, 252], [226, 232, 240]);
  setBodyFont("bold", 12);
  pdf.text(title, margin + 4, y + 7);
  setBodyFont("normal", 10);
  pdf.text(`${labels.subject}: ${subject}`, margin + 4, y + 13);
  pdf.text(`${labels.class}: ${classLevel}`, margin + 62, y + 13);
  pdf.text(`${labels.difficulty}: ${difficulty}`, margin + 108, y + 13);
  pdf.text(`${labels.totalQuestions}: ${questions.length}`, margin + 4, y + 19);
  if (shareCode) {
    pdf.text(`${labels.shareCode}: ${shareCode}`, pageWidth - margin - 4, y + 19, {
      align: "right",
    });
  }
  y += 31;

  if (scoreSummary && mode === "answers") {
    y = ensureSpace(20, y);
    drawRoundedBox(margin, y, contentWidth, 18, [239, 246, 255], [147, 197, 253]);
    setBodyFont("bold", 11);
    pdf.text(
      `${labels.score}: ${scoreSummary.score}/${scoreSummary.maxScore}`,
      margin + 4,
      y + 7,
    );
    pdf.text(
      `${labels.correct}: ${scoreSummary.correctAnswers}/${questions.length}`,
      margin + 4,
      y + 13,
    );
    pdf.text(
      `${labels.percentage}: ${scoreSummary.percentage}%`,
      pageWidth - margin - 4,
      y + 10,
      { align: "right" },
    );
    y += 24;
  }

  for (let index = 0; index < questions.length; index += 1) {
    const item = questions[index];
    const questionText = getLocalizedText(item.question, languageCode);
    const options = (item.options || []).map((entry) => getLocalizedText(entry, languageCode));
    const correctAnswer = getLocalizedText(item.correctAnswer, languageCode);
    const explanation = getLocalizedText(item.explanation, languageCode);
    const userAnswer = getLocalizedText(item.userAnswer, languageCode);

    const questionLines = getWrappedLines(
      `${labels.question} ${index + 1}. ${questionText}`,
      11.5,
      contentWidth - 10,
      "bold",
    );

    let estimatedHeight = 10 + lineBlockHeight(questionLines, 11.5);

    options.forEach((option, optionIndex) => {
      const optionLines = getWrappedLines(
        `${String.fromCharCode(65 + optionIndex)}. ${option}`,
        10.5,
        contentWidth - 18,
      );
      estimatedHeight += lineBlockHeight(optionLines, 10.5) + 1.5;
    });

    if (correctAnswer) {
      estimatedHeight += lineBlockHeight(
        getWrappedLines(`${labels.correctAnswer}: ${correctAnswer}`, 10.5, contentWidth - 18, "bold"),
        10.5,
      ) + 5;
    }

    if (mode === "answers") {
      estimatedHeight += lineBlockHeight(
        getWrappedLines(
          `${labels.yourAnswer}: ${userAnswer || labels.notAnswered}`,
          10.2,
          contentWidth - 18,
        ),
        10.2,
      ) + 4;
    }

    if (explanation) {
      estimatedHeight += lineBlockHeight(
        getWrappedLines(`${labels.explanation}: ${explanation}`, 10.1, contentWidth - 18),
        10.1,
      ) + 6;
    }

    y = ensureSpace(estimatedHeight + 8, y);

    drawRoundedBox(margin, y, contentWidth, estimatedHeight + 4, [255, 255, 255], [226, 232, 240]);

    setBodyFont("bold", 11.5);
    pdf.text(questionLines, margin + 5, y + 8);
    let innerY = y + 8 + lineBlockHeight(questionLines, 11.5);

    if (options.length > 0) {
      setBodyFont("normal", 10.5);
      options.forEach((option, optionIndex) => {
        const optionText = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
        const optionLines = getWrappedLines(optionText, 10.5, contentWidth - 18);
        const isCorrectOption = correctAnswer
          ? option.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ||
            optionText.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
          : false;

        if (isCorrectOption) {
          pdf.setFillColor(240, 253, 244);
          pdf.roundedRect(margin + 4, innerY - 4.5, contentWidth - 8, lineBlockHeight(optionLines, 10.5) + 5, 2, 2, "F");
          pdf.setTextColor(22, 101, 52);
          setBodyFont("bold", 10.5);
        } else {
          pdf.setTextColor(51, 65, 85);
          setBodyFont("normal", 10.5);
        }

        pdf.text(optionLines, margin + 8, innerY);
        innerY += lineBlockHeight(optionLines, 10.5) + 2;
        pdf.setTextColor(33, 37, 41);
      });
    }

    if (mode === "answers") {
      const yourAnswerLines = getWrappedLines(
        `${labels.yourAnswer}: ${userAnswer || labels.notAnswered}`,
        10.2,
        contentWidth - 18,
      );
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(margin + 4, innerY - 4, contentWidth - 8, lineBlockHeight(yourAnswerLines, 10.2) + 4, 2, 2, "F");
      setBodyFont("normal", 10.2);
      pdf.setTextColor(30, 64, 175);
      pdf.text(yourAnswerLines, margin + 8, innerY);
      innerY += lineBlockHeight(yourAnswerLines, 10.2) + 5;
      pdf.setTextColor(33, 37, 41);
    }

    if (correctAnswer) {
      const correctLines = getWrappedLines(
        `${labels.correctAnswer}: ${correctAnswer}`,
        10.5,
        contentWidth - 18,
        "bold",
      );
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin + 4, innerY - 4.5, contentWidth - 8, lineBlockHeight(correctLines, 10.5) + 5, 2, 2, "F");
      setBodyFont("bold", 10.5);
      pdf.setTextColor(22, 101, 52);
      pdf.text(correctLines, margin + 8, innerY);
      innerY += lineBlockHeight(correctLines, 10.5) + 5;
      pdf.setTextColor(33, 37, 41);
    }

    if (explanation) {
      const explanationLines = getWrappedLines(
        `${labels.explanation}: ${explanation}`,
        10.1,
        contentWidth - 18,
      );
      pdf.setFillColor(255, 251, 235);
      pdf.roundedRect(margin + 4, innerY - 4.5, contentWidth - 8, lineBlockHeight(explanationLines, 10.1) + 5, 2, 2, "F");
      setBodyFont("normal", 10.1);
      pdf.setTextColor(146, 64, 14);
      pdf.text(explanationLines, margin + 8, innerY);
      innerY += lineBlockHeight(explanationLines, 10.1) + 3;
      pdf.setTextColor(33, 37, 41);
    }

    if (mode === "answers" && typeof item.isCorrect === "boolean") {
      setBodyFont("bold", 9.8);
      pdf.setTextColor(item.isCorrect ? 22 : 185, item.isCorrect ? 101 : 28, item.isCorrect ? 52 : 28);
      pdf.text(
        item.isCorrect ? labels.correct : labels.incorrect,
        pageWidth - margin - 5,
        y + 8,
        { align: "right" },
      );
      pdf.setTextColor(33, 37, 41);
    }

    y += estimatedHeight + 10;
  }

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    drawFooter(page, totalPages);
  }

  pdf.save(fileName);
}
