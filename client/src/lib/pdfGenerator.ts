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

  try {
    const response = await fetch(HINDI_FONT_URL);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    cachedHindiFont = arrayBufferToBase64(buffer);
    return cachedHindiFont;
  } catch {
    return null;
  }
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
  const headerHeight = 28;
  const footerHeight = 14;
  const topStart = headerHeight + 10;
  const bottomLimit = pageHeight - footerHeight - 6;
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
    if (fontData) {
      pdf.addFileToVFS("NotoSansDevanagari-Regular.ttf", fontData);
      pdf.addFont("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari", "normal");
      pdf.addFont("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari", "bold");
      bodyFont = "NotoSansDevanagari";
    }
  }

  const logoDataUrl = await loadLogoDataUrl();
  const waterMarkText = labels.appName || "MCQGyaan AI";

  const setBodyFont = (style: "normal" | "bold" = "normal", size = 11) => {
    pdf.setFont(bodyFont, style);
    pdf.setFontSize(size);
  };

  const drawHeader = () => {
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, headerHeight, "F");

    pdf.setFillColor(37, 99, 235); // blue-600 accent bar
    pdf.rect(0, headerHeight, pageWidth, 1.5, "F");

    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, "PNG", margin, 7, 14, 14, undefined, "FAST");
      } catch {}
    }

    const textLeft = logoDataUrl ? margin + 18 : margin;
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text(labels.appName || "MCQGyaan AI", textLeft, 13);

    setBodyFont("bold", 12);
    pdf.setTextColor(203, 213, 225);
    pdf.text(mode === "answers" ? (labels.answerSheet || "Answer Sheet Review") : (labels.questionPaper || "Question Paper"), textLeft, 22);

    const formatSubjectName = (sub: string) => sub.replace(/^school[_-]/i, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const infoText = `${formatSubjectName(subject)} | Class ${classLevel || "—"} | ${difficulty || "General"}`;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(147, 197, 253); // blue-300
    pdf.text(infoText, pageWidth - margin, 18, { align: "right" });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 7;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(labels.company || "MCQGyaan AI - Self Learning & Quiz Platform", margin, footerY);
    pdf.text(
      `${labels.page || "Page"} ${pageNumber} ${labels.of || "of"} ${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: "center" },
    );
    pdf.text(labels.website || "www.mcqgyaan.com", pageWidth - margin, footerY, { align: "right" });
  };

  const addWatermark = () => {
    pdf.saveGraphicsState();
    pdf.setTextColor(241, 245, 249); // slate-100
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(36);
    pdf.text(waterMarkText, pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 25,
    });
    pdf.restoreGraphicsState();
  };

  const ensureSpace = (requiredHeight: number, y: number): number => {
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

  const lineBlockHeight = (lines: string[], fontSize: number, spacing = 1.6) =>
    lines.length * (fontSize * 0.35 + spacing);

  drawHeader();
  addWatermark();

  let y = topStart;

  // --- TEST INFO HEADER CARD ---
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, "FD");

  setBodyFont("bold", 12);
  pdf.setTextColor(15, 23, 42);
  pdf.text(title, margin + 4, y + 7);

  setBodyFont("normal", 9.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`${labels.subject || "Subject"}: ${subject}`, margin + 4, y + 14);
  pdf.text(`${labels.class || "Class"}: ${classLevel}`, margin + 65, y + 14);
  pdf.text(`${labels.difficulty || "Difficulty"}: ${difficulty}`, margin + 112, y + 14);

  if (shareCode) {
    pdf.text(`${labels.shareCode || "Code"}: ${shareCode}`, pageWidth - margin - 4, y + 14, { align: "right" });
  }

  y += 28;

  // --- SCORE SUMMARY CARD (FOR ANSWERS / REVIEW MODE) ---
  if (scoreSummary && mode === "answers") {
    y = ensureSpace(18, y);
    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.setDrawColor(191, 219, 254); // blue-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, 16, 2.5, 2.5, "FD");

    setBodyFont("bold", 10.5);
    pdf.setTextColor(30, 58, 138); // blue-900
    pdf.text(`${labels.score || "Score"}: ${scoreSummary.score}/${scoreSummary.maxScore}`, margin + 5, y + 6.5);
    pdf.text(`${labels.correct || "Correct"}: ${scoreSummary.correctAnswers}/${questions.length}`, margin + 65, y + 6.5);
    pdf.text(`${labels.percentage || "Percentage"}: ${scoreSummary.percentage}%`, pageWidth - margin - 5, y + 6.5, { align: "right" });

    // Progress bar representation
    pdf.setFillColor(219, 234, 254);
    pdf.roundedRect(margin + 5, y + 10.5, contentWidth - 10, 2.5, 1, 1, "F");
    const barWidth = Math.max(2, Math.min(contentWidth - 10, ((contentWidth - 10) * Math.min(100, scoreSummary.percentage)) / 100));
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(margin + 5, y + 10.5, barWidth, 2.5, 1, 1, "F");

    y += 22;
  }

  // --- QUESTIONS LOOP ---
  for (let index = 0; index < questions.length; index += 1) {
    const item = questions[index];
    const questionText = getLocalizedText(item.question, languageCode);
    const options = (item.options || []).map((entry) => getLocalizedText(entry, languageCode));
    const correctAnswer = getLocalizedText(item.correctAnswer, languageCode);
    const explanation = getLocalizedText(item.explanation, languageCode);
    const userAnswer = getLocalizedText(item.userAnswer, languageCode);

    const questionHeaderStr = `Q${index + 1}. ${questionText}`;
    const questionLines = getWrappedLines(questionHeaderStr, 11, contentWidth - 28, "bold");
    const questionHeaderHeight = lineBlockHeight(questionLines, 11);

    // Estimate heights of options
    const optionHeights: number[] = [];
    const optionLineArray: string[][] = [];
    options.forEach((option, optionIndex) => {
      const optionStr = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
      const lines = getWrappedLines(optionStr, 10, contentWidth - 16);
      const h = lineBlockHeight(lines, 10) + 3;
      optionLineArray.push(lines);
      optionHeights.push(h);
    });

    const totalOptionsHeight = optionHeights.reduce((a, b) => a + b, 0);

    // Calculate answer & explanation height
    let extraHeight = 0;
    let answerLines: string[] = [];
    let correctLines: string[] = [];
    let expLines: string[] = [];

    if (mode === "answers") {
      answerLines = getWrappedLines(`Your Answer: ${userAnswer || labels.notAnswered || "Not Answered"}`, 9.5, contentWidth - 16);
      extraHeight += lineBlockHeight(answerLines, 9.5) + 4;
    }

    if (correctAnswer) {
      correctLines = getWrappedLines(`Correct Answer: ${correctAnswer}`, 9.5, contentWidth - 16, "bold");
      extraHeight += lineBlockHeight(correctLines, 9.5) + 4;
    }

    if (explanation) {
      expLines = getWrappedLines(`Explanation: ${explanation}`, 9.5, contentWidth - 16);
      extraHeight += lineBlockHeight(expLines, 9.5) + 5;
    }

    const cardPadding = 12;
    const cardContentHeight = questionHeaderHeight + totalOptionsHeight + extraHeight + cardPadding;

    // Check if entire question block fits, if not wrap cleanly to next page
    y = ensureSpace(cardContentHeight + 6, y);

    // Draw main question card container
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, cardContentHeight, 3, 3, "FD");

    // Result badge pill (Top right)
    if (mode === "answers" && typeof item.isCorrect === "boolean") {
      const badgeText = item.isCorrect ? "✓ CORRECT" : "✗ INCORRECT";
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      if (item.isCorrect) {
        pdf.setFillColor(220, 252, 231); // emerald-100
        pdf.setDrawColor(187, 247, 208); // emerald-200
        pdf.setTextColor(22, 101, 52); // emerald-800
      } else {
        pdf.setFillColor(254, 226, 226); // red-100
        pdf.setDrawColor(254, 202, 202); // red-200
        pdf.setTextColor(153, 27, 27); // red-800
      }
      pdf.roundedRect(pageWidth - margin - 26, y + 4, 22, 5.5, 1.5, 1.5, "FD");
      pdf.text(badgeText, pageWidth - margin - 15, y + 7.8, { align: "center" });
    }

    // Question Text
    setBodyFont("bold", 11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(questionLines, margin + 5, y + 7);

    let innerY = y + 7 + questionHeaderHeight + 2;

    // Render Options
    if (options.length > 0) {
      options.forEach((option, optionIndex) => {
        const optionLines = optionLineArray[optionIndex];
        const h = optionHeights[optionIndex];
        const optionRawText = option.trim().toLowerCase();
        const correctRawText = correctAnswer ? correctAnswer.trim().toLowerCase() : "";
        const userRawText = userAnswer ? userAnswer.trim().toLowerCase() : "";

        const isCorrectOption = correctRawText && (optionRawText === correctRawText || optionRawText.startsWith(correctRawText));
        const isUserOption = userRawText && (optionRawText === userRawText || optionRawText.startsWith(userRawText));

        if (mode === "answers" && isCorrectOption) {
          pdf.setFillColor(240, 253, 244); // green-50
          pdf.setDrawColor(187, 247, 208); // green-200
          pdf.roundedRect(margin + 4, innerY - 3.5, contentWidth - 8, h, 2, 2, "FD");
          pdf.setTextColor(22, 101, 52);
          setBodyFont("bold", 10);
        } else if (mode === "answers" && isUserOption && !item.isCorrect) {
          pdf.setFillColor(254, 242, 242); // red-50
          pdf.setDrawColor(254, 202, 202); // red-200
          pdf.roundedRect(margin + 4, innerY - 3.5, contentWidth - 8, h, 2, 2, "FD");
          pdf.setTextColor(153, 27, 27);
          setBodyFont("bold", 10);
        } else {
          pdf.setTextColor(51, 65, 85);
          setBodyFont("normal", 10);
        }

        pdf.text(optionLines, margin + 7, innerY.valueOf());
        innerY += h;
      });
    }

    innerY += 1;

    // Render Selected Answer (if mode === answers)
    if (mode === "answers" && answerLines.length > 0) {
      const lineH = lineBlockHeight(answerLines, 9.5) + 3;
      pdf.setFillColor(239, 246, 255);
      pdf.setDrawColor(191, 219, 254);
      pdf.roundedRect(margin + 4, innerY - 3, contentWidth - 8, lineH, 1.5, 1.5, "FD");

      setBodyFont("normal", 9.5);
      pdf.setTextColor(30, 64, 175); // blue-800
      pdf.text(answerLines, margin + 7, innerY.valueOf());
      innerY += lineH + 2;
    }

    // Render Correct Answer
    if (correctAnswer && correctLines.length > 0) {
      const lineH = lineBlockHeight(correctLines, 9.5) + 3;
      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(187, 247, 208);
      pdf.roundedRect(margin + 4, innerY - 3, contentWidth - 8, lineH, 1.5, 1.5, "FD");

      setBodyFont("bold", 9.5);
      pdf.setTextColor(22, 101, 52); // green-800
      pdf.text(correctLines, margin + 7, innerY.valueOf());
      innerY += lineH + 2;
    }

    // Render Explanation
    if (explanation && expLines.length > 0) {
      const lineH = lineBlockHeight(expLines, 9.5) + 3.5;
      pdf.setFillColor(254, 252, 232); // amber-50
      pdf.setDrawColor(253, 230, 138); // amber-200
      pdf.roundedRect(margin + 4, innerY - 3, contentWidth - 8, lineH, 1.5, 1.5, "FD");

      setBodyFont("normal", 9.5);
      pdf.setTextColor(146, 64, 14); // amber-800
      pdf.text(expLines, margin + 7, innerY.valueOf());
      innerY += lineH + 2;
    }

    y += cardContentHeight + 6;
  }

  // Draw Page Footers on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    drawFooter(page, totalPages);
  }

  pdf.save(fileName);
}
