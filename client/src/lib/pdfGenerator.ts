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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
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

async function loadHindiFont(): Promise<string | null> {
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

async function loadLogoDataUrl(): Promise<string | null> {
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

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  const headerHeight = 26;
  const footerHeight = 14;
  const topStart = headerHeight + 8; // 34 mm
  const bottomLimit = pageHeight - footerHeight - 4; // 279 mm
  const maxPageSpace = bottomLimit - topStart; // 245 mm
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

  const setPdfFont = (style: "normal" | "bold" = "normal", size = 10) => {
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
        pdf.addImage(logoDataUrl, "PNG", margin, 6, 14, 14, undefined, "FAST");
      } catch {}
    }

    const textLeft = logoDataUrl ? margin + 18 : margin;
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(labels.appName || "MCQGyaan AI", textLeft, 12);

    setPdfFont("bold", 10.5);
    pdf.setTextColor(203, 213, 225);
    pdf.text(
      mode === "answers"
        ? labels.answerSheet || "Answer Sheet & Explanations"
        : labels.questionPaper || "Question Paper",
      textLeft,
      20,
    );

    const formatSubjectName = (sub: string) =>
      sub
        .replace(/^school[_-]/i, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const infoText = `${formatSubjectName(subject)} | Class ${classLevel || "—"} | ${difficulty || "General"}`;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(147, 197, 253);
    pdf.text(infoText, pageWidth - margin, 16, { align: "right" });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 6;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(labels.company || "MCQGyaan AI", margin, footerY);
    pdf.text(
      `${labels.page || "Page"} ${pageNumber} ${labels.of || "of"} ${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: "center" },
    );
    pdf.text(labels.website || "mcqgyaan.ai", pageWidth - margin, footerY, { align: "right" });
  };

  const addWatermark = () => {
    pdf.saveGraphicsState();
    pdf.setTextColor(241, 245, 249);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);
    pdf.text(waterMarkText, pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 25,
    });
    pdf.restoreGraphicsState();
  };

  const createNewPage = (): number => {
    pdf.addPage();
    drawHeader();
    addWatermark();
    return topStart;
  };

  const measureTextLines = (
    text: string,
    width: number,
    fontStyle: "normal" | "bold" = "normal",
    fontSize = 10,
    lineHeightMm = 4.6,
  ) => {
    setPdfFont(fontStyle, fontSize);
    const lines: string[] = pdf.splitTextToSize(text || "", width);
    const heightMm = Math.max(lineHeightMm, lines.length * lineHeightMm);
    return { lines, heightMm, lineHeightMm };
  };

  // Helper to draw clean circular icons
  const drawIconCircle = (cx: number, cy: number, radius: number, bgR: number, bgG: number, bgB: number, symbol: string) => {
    pdf.setFillColor(bgR, bgG, bgB);
    pdf.circle(cx, cy, radius, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text(symbol, cx, cy + 1.1, { align: "center" });
  };

  // --- INITIAL PAGE SETUP ---
  drawHeader();
  addWatermark();
  let y = topStart;

  // --- TEST INFO HEADER CARD ---
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 20, 2.5, 2.5, "FD");

  setPdfFont("bold", 11);
  pdf.setTextColor(15, 23, 42);
  pdf.text(title, margin + 4, y + 6.5);

  setPdfFont("normal", 9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`${labels.subject || "Subject"}: ${subject}`, margin + 4, y + 13.5);
  pdf.text(`${labels.class || "Class"}: ${classLevel}`, margin + 65, y + 13.5);
  pdf.text(`${labels.difficulty || "Difficulty"}: ${difficulty}`, margin + 112, y + 13.5);

  if (shareCode) {
    pdf.text(`${labels.shareCode || "Code"}: ${shareCode}`, pageWidth - margin - 4, y + 13.5, { align: "right" });
  }

  y += 25;

  // --- SCORE SUMMARY CARD (FOR ANSWERS / REVIEW MODE) ---
  if (scoreSummary && mode === "answers") {
    if (y + 18 > bottomLimit) {
      y = createNewPage();
    }

    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.setDrawColor(191, 219, 254); // blue-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, 16, 2.5, 2.5, "FD");

    setPdfFont("bold", 10);
    pdf.setTextColor(30, 58, 138); // blue-900
    pdf.text(`${labels.score || "Score"}: ${scoreSummary.score}/${scoreSummary.maxScore}`, margin + 5, y + 6);
    pdf.text(`${labels.correct || "Correct"}: ${scoreSummary.correctAnswers}/${questions.length}`, margin + 65, y + 6);
    pdf.text(`${labels.percentage || "Percentage"}: ${scoreSummary.percentage}%`, pageWidth - margin - 5, y + 6, { align: "right" });

    // Progress bar
    pdf.setFillColor(219, 234, 254);
    pdf.roundedRect(margin + 5, y + 10, contentWidth - 10, 2.5, 1, 1, "F");
    const barWidth = Math.max(2, Math.min(contentWidth - 10, ((contentWidth - 10) * Math.min(100, scoreSummary.percentage)) / 100));
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(margin + 5, y + 10, barWidth, 2.5, 1, 1, "F");

    y += 21;
  }

  // --- QUESTIONS LOOP ---
  for (let index = 0; index < questions.length; index += 1) {
    const item = questions[index];
    const questionText = getLocalizedText(item.question, languageCode);
    const options = (item.options || []).map((entry) => getLocalizedText(entry, languageCode));
    const correctAnswer = getLocalizedText(item.correctAnswer, languageCode);
    const explanation = getLocalizedText(item.explanation, languageCode);
    const userAnswer = getLocalizedText(item.userAnswer, languageCode);

    // Question Number badge (e.g. Q9.)
    const qBadgeText = `Q${index + 1}.`;
    const qBadgeWidth = 11;

    // Question text width (reserving space for Q badge and Result Pill)
    const availableQWidth = contentWidth - 8 - qBadgeWidth - (mode === "answers" ? 30 : 0);
    const qMeasurement = measureTextLines(questionText, availableQWidth, "bold", 10.5, 4.8);
    const qHeaderHeight = Math.max(10, qMeasurement.heightMm + 6);

    // Options Measurements (with circular letter badge A, B, C, D)
    const optionMeasurements = options.map((option) => {
      return measureTextLines(option, contentWidth - 22, "normal", 9.5, 4.4);
    });

    const totalOptionsHeight = optionMeasurements.reduce((acc, opt) => acc + Math.max(8, opt.heightMm + 4) + 2.5, 0);

    // Answer / Explanation Measurements
    let answerMeasurement: ReturnType<typeof measureTextLines> | null = null;
    let ansBoxHeight = 0;
    if (mode === "answers" && (userAnswer || labels.notAnswered)) {
      const val = userAnswer || labels.notAnswered || "Not Answered";
      answerMeasurement = measureTextLines(val, contentWidth - 36, "normal", 9.5, 4.4);
      ansBoxHeight = Math.max(9, answerMeasurement.heightMm + 5);
    }

    let correctMeasurement: ReturnType<typeof measureTextLines> | null = null;
    let corrBoxHeight = 0;
    if (correctAnswer) {
      correctMeasurement = measureTextLines(correctAnswer, contentWidth - 36, "bold", 9.5, 4.4);
      corrBoxHeight = Math.max(9, correctMeasurement.heightMm + 5);
    }

    let expMeasurement: ReturnType<typeof measureTextLines> | null = null;
    let expBoxHeight = 0;
    if (explanation) {
      expMeasurement = measureTextLines(explanation, contentWidth - 36, "normal", 9.5, 4.4);
      expBoxHeight = Math.max(10, expMeasurement.heightMm + 5);
    }

    // Estimate total question card height
    const cardContentHeight =
      qHeaderHeight +
      totalOptionsHeight +
      (ansBoxHeight ? ansBoxHeight + 3 : 0) +
      (corrBoxHeight ? corrBoxHeight + 3 : 0) +
      (expBoxHeight ? expBoxHeight + 3 : 0) +
      8;

    // Check if entire question block fits on current page
    if (y + cardContentHeight > bottomLimit) {
      if (cardContentHeight <= maxPageSpace) {
        y = createNewPage();
      }
    }

    // Check if Question Header alone fits
    if (y + qHeaderHeight + 8 > bottomLimit) {
      y = createNewPage();
    }

    const cardStartY = y;

    // Draw Outer Question Container Card Box
    pdf.setFillColor(248, 250, 252); // slate-50/60
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, cardStartY, contentWidth, cardContentHeight, 3.5, 3.5, "FD");

    let innerY = cardStartY + 4;

    // --- QUESTION HEADER ROW ---
    // 1. Q Badge Pill (e.g. Q9.)
    pdf.setFillColor(219, 234, 254); // blue-100
    pdf.setDrawColor(191, 219, 254); // blue-200
    pdf.roundedRect(margin + 4, innerY, qBadgeWidth, 7, 2, 2, "FD");

    setPdfFont("bold", 9.5);
    pdf.setTextColor(30, 58, 138); // blue-900
    pdf.text(qBadgeText, margin + 4 + (qBadgeWidth / 2), innerY + 4.8, { align: "center" });

    // 2. Question Text
    setPdfFont("bold", 10.5);
    pdf.setTextColor(15, 23, 42);

    let qTextY = innerY + 4.8;
    qMeasurement.lines.forEach((line) => {
      pdf.text(line, margin + 4 + qBadgeWidth + 3, qTextY);
      qTextY += qMeasurement.lineHeightMm;
    });

    // 3. Result Pill Badge (Top Right)
    if (mode === "answers" && typeof item.isCorrect === "boolean") {
      const badgeText = item.isCorrect ? `✓ ${labels.correct || "Correct"}` : `✗ ${labels.incorrect || "Incorrect"}`;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);

      if (item.isCorrect) {
        pdf.setFillColor(240, 253, 244); // emerald-50
        pdf.setDrawColor(187, 247, 208); // emerald-200
        pdf.setTextColor(22, 101, 52); // emerald-800
      } else {
        pdf.setFillColor(254, 242, 242); // red-50
        pdf.setDrawColor(254, 202, 202); // red-200
        pdf.setTextColor(153, 27, 27); // red-800
      }

      const badgeW = 25;
      pdf.roundedRect(pageWidth - margin - badgeW - 4, innerY, badgeW, 7, 2, 2, "FD");
      pdf.text(badgeText, pageWidth - margin - (badgeW / 2) - 4, innerY + 4.8, { align: "center" });
    }

    innerY += qHeaderHeight + 2;

    // --- RENDER OPTIONS ROWS (White cards with circular letter badges) ---
    if (options.length > 0) {
      options.forEach((option, optIdx) => {
        const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
        const optMeas = optionMeasurements[optIdx];
        const optBoxH = Math.max(8, optMeas.heightMm + 4);

        if (innerY + optBoxH > bottomLimit) {
          innerY = createNewPage();
        }

        // Draw White Option Card Box
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(margin + 4, innerY, contentWidth - 8, optBoxH, 2.5, 2.5, "FD");

        // Circle Badge for Letter (A, B, C, D)
        const circleCx = margin + 4 + 5.5;
        const circleCy = innerY + (optBoxH / 2);
        pdf.setDrawColor(148, 163, 184); // slate-400
        pdf.setFillColor(248, 250, 252);
        pdf.circle(circleCx, circleCy, 3, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(30, 41, 59); // slate-800
        pdf.text(optLetter, circleCx, circleCy + 1.1, { align: "center" });

        // Option Text
        setPdfFont("normal", 9.5);
        pdf.setTextColor(30, 41, 59);

        let optTextY = innerY + (optBoxH / 2) - ((optMeas.lines.length * optMeas.lineHeightMm) / 2) + 3.2;
        optMeas.lines.forEach((line) => {
          pdf.text(line, margin + 16, optTextY);
          optTextY += optMeas.lineHeightMm;
        });

        innerY += optBoxH + 2.5;
      });
    }

    innerY += 1;

    // --- RENDER "YOUR ANSWER" BANNER ---
    if (answerMeasurement) {
      if (innerY + ansBoxHeight > bottomLimit) {
        innerY = createNewPage();
      }

      pdf.setFillColor(239, 246, 255); // blue-50
      pdf.setDrawColor(191, 219, 254); // blue-200
      pdf.roundedRect(margin + 4, innerY, contentWidth - 8, ansBoxHeight, 2.5, 2.5, "FD");

      // Icon circle (i)
      const iconCx = margin + 4 + 5.5;
      const iconCy = innerY + (ansBoxHeight / 2);
      drawIconCircle(iconCx, iconCy, 3, 37, 99, 235, "i"); // blue-600

      // Label: Your Answer:
      setPdfFont("bold", 9.5);
      pdf.setTextColor(30, 64, 175); // blue-800
      pdf.text(`${labels.yourAnswer || "Your Answer"}: `, margin + 15, innerY + (ansBoxHeight / 2) + 1.1);

      const labelW = pdf.getTextWidth(`${labels.yourAnswer || "Your Answer"}: `);

      // Value text
      setPdfFont("normal", 9.5);
      pdf.setTextColor(30, 58, 138); // blue-900

      let textY = innerY + (ansBoxHeight / 2) - ((answerMeasurement.lines.length * answerMeasurement.lineHeightMm) / 2) + 3.2;
      answerMeasurement.lines.forEach((line, lIdx) => {
        const xPos = lIdx === 0 ? margin + 15 + labelW : margin + 15;
        pdf.text(line, xPos, textY);
        textY += answerMeasurement.lineHeightMm;
      });

      innerY += ansBoxHeight + 3;
    }

    // --- RENDER "CORRECT ANSWER" BANNER ---
    if (correctMeasurement) {
      if (innerY + corrBoxHeight > bottomLimit) {
        innerY = createNewPage();
      }

      pdf.setFillColor(240, 253, 244); // emerald-50
      pdf.setDrawColor(187, 247, 208); // emerald-200
      pdf.roundedRect(margin + 4, innerY, contentWidth - 8, corrBoxHeight, 2.5, 2.5, "FD");

      // Icon circle (✓)
      const iconCx = margin + 4 + 5.5;
      const iconCy = innerY + (corrBoxHeight / 2);
      drawIconCircle(iconCx, iconCy, 3, 16, 185, 129, "✓"); // emerald-600

      // Label: Correct Answer:
      setPdfFont("bold", 9.5);
      pdf.setTextColor(22, 101, 52); // emerald-800
      pdf.text(`${labels.correctAnswer || "Correct Answer"}: `, margin + 15, innerY + (corrBoxHeight / 2) + 1.1);

      const labelW = pdf.getTextWidth(`${labels.correctAnswer || "Correct Answer"}: `);

      // Value text
      setPdfFont("bold", 9.5);
      pdf.setTextColor(20, 83, 45); // emerald-900

      let textY = innerY + (corrBoxHeight / 2) - ((correctMeasurement.lines.length * correctMeasurement.lineHeightMm) / 2) + 3.2;
      correctMeasurement.lines.forEach((line, lIdx) => {
        const xPos = lIdx === 0 ? margin + 15 + labelW : margin + 15;
        pdf.text(line, xPos, textY);
        textY += correctMeasurement.lineHeightMm;
      });

      innerY += corrBoxHeight + 3;
    }

    // --- RENDER "EXPLANATION" BANNER ---
    if (expMeasurement) {
      if (innerY + expBoxHeight > bottomLimit) {
        innerY = createNewPage();
      }

      pdf.setFillColor(254, 252, 232); // amber-50
      pdf.setDrawColor(253, 230, 138); // amber-200
      pdf.roundedRect(margin + 4, innerY, contentWidth - 8, expBoxHeight, 2.5, 2.5, "FD");

      // Icon circle (bulb / info)
      const iconCx = margin + 4 + 5.5;
      const iconCy = innerY + 5.5;
      drawIconCircle(iconCx, iconCy, 3, 245, 158, 11, "!"); // amber-500

      // Label: Explanation:
      setPdfFont("bold", 9.5);
      pdf.setTextColor(146, 64, 14); // amber-800
      pdf.text(`${labels.explanation || "Explanation"}: `, margin + 15, innerY + 6.6);

      const labelW = pdf.getTextWidth(`${labels.explanation || "Explanation"}: `);

      // Value text
      setPdfFont("normal", 9.5);
      pdf.setTextColor(120, 53, 15); // amber-900

      let textY = innerY + 6.6;
      expMeasurement.lines.forEach((line, lIdx) => {
        const xPos = lIdx === 0 ? margin + 15 + labelW : margin + 15;
        pdf.text(line, xPos, textY);
        textY += expMeasurement.lineHeightMm;
      });

      innerY += expBoxHeight + 3;
    }

    y = innerY + 5; // spacing between question cards
  }

  // --- DRAW FOOTERS & PAGE NUMBERS ON ALL PAGES ---
  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    drawFooter(page, totalPages);
  }

  pdf.save(fileName);
}
