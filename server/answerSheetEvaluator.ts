import OpenAI from "openai";
import PDFDocument from "pdfkit";
import { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

interface EvaluationParams {
  images: string[];
  studentName: string;
  classLevel?: number;
  subject?: string;
  gptModel?: string;
}

interface AnswerEvaluation {
  questionNumber: number;
  extractedAnswer: string;
  qualityScore: number;
  strengths: string[];
  improvements: string[];
  correctAnswer?: string;
  detailedFeedback: string;
}

interface EvaluationResult {
  totalAnswers: number;
  averageScore: number;
  overallFeedback: string;
  answerEvaluations: AnswerEvaluation[];
}

type AnswerEvaluationItem = {
  questionNumber: number | string;
  extractedAnswer?: string;
  qualityScore?: number;
  strengths?: string[];
  improvements?: string[];
  correctAnswer?: string;
  detailedFeedback?: string;
};

export async function evaluateAnswerSheet(
  params: EvaluationParams,
): Promise<EvaluationResult> {
  const {
    images,
    studentName,
    classLevel,
    subject,
    gptModel = "gpt-4o",
  } = params;

  console.log(
    `[EVAL] Starting evaluation of ${images.length} images using ${gptModel}`,
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const imageMessages: any[] = images.map((imageData) => ({
    type: "image_url",
    image_url: {
      url: imageData.startsWith("data:")
        ? imageData
        : `data:image/jpeg;base64,${imageData}`,
      detail: "high",
    },
  }));

  const prompt = `You are an expert teacher evaluating a student's answer sheet.

Student Name: ${studentName}
${classLevel ? `Class Level: ${classLevel}` : ""}
${subject ? `Subject: ${subject}` : ""}

I'm providing you with ${images.length} image(s) of the student's answer sheet. Your task is to:

1. **Extract all answers** from the images (OCR the text carefully)
2. **Evaluate each answer** on these criteria:
   - Accuracy and correctness
   - Completeness of the answer
   - Clarity and presentation
   - Depth of understanding shown
3. **Provide constructive feedback** for each answer:
   - What was done well (strengths)
   - How to improve (specific, actionable suggestions)
   - If the answer is incorrect or incomplete, provide the CORRECT/COMPLETE answer
4. **Give an overall assessment** of the student's performance

Return your evaluation in this EXACT JSON format (replace ALL placeholders with actual values):
{
  "totalAnswers": NUMBER_OF_ANSWERS_FOUND,
  "averageScore": AVERAGE_QUALITY_SCORE_0_TO_10,
  "overallFeedback": "OVERALL_ASSESSMENT_OF_STUDENT_PERFORMANCE",
  "answerEvaluations": [
    {
      "questionNumber": QUESTION_NUMBER_OR_IDENTIFIER,
      "extractedAnswer": "THE_STUDENTS_WRITTEN_ANSWER_TRANSCRIBED_EXACTLY",
      "qualityScore": SCORE_0_TO_10,
      "strengths": ["WHAT_WAS_GOOD", "ANOTHER_STRENGTH"],
      "improvements": ["SPECIFIC_IMPROVEMENT", "ANOTHER_IMPROVEMENT"],
      "correctAnswer": "PROVIDE_IF_STUDENT_ANSWER_WAS_WRONG_OR_INCOMPLETE",
      "detailedFeedback": "DETAILED_ENCOURAGING_FEEDBACK_FOR_THIS_ANSWER"
    }
  ]
}

IMPORTANT GUIDELINES:
- Be encouraging and constructive - this is for learning
- If an answer is partially correct, acknowledge what's right before suggesting improvements
- Provide specific, actionable improvement suggestions (not just "study more")
- If you can't read some text clearly, note that in the feedback
- For subjective answers, evaluate based on logic, presentation, and understanding
- Consider the student's class level when evaluating (age ${classLevel ? classLevel + 10 : "unknown"})`;

  try {
    const response = await openai.chat.completions.create({
      model: gptModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageMessages,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content) as EvaluationResult;
    console.log(`[EVAL] Successfully evaluated ${result.totalAnswers} answers`);
    return result;
  } catch (error: any) {
    console.error("[EVAL ERROR]", error.message);
    throw new Error(`Failed to evaluate answer sheet: ${error.message}`);
  }
}

export function generateEvaluationPDF(req: Request, res: Response) {
  const {
    studentName,
    classLevel,
    subject,
    totalAnswers,
    averageScore,
    overallFeedback,
    answerEvaluations,
  } = req.body;

  // A4 Document with precise margins and page buffering
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, bottom: 50, left: 48, right: 48 },
    bufferPages: true,
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=evaluation-report.pdf");

  doc.pipe(res);

  const pageWidth = doc.page.width; // 595.28 pt
  const pageHeight = doc.page.height; // 841.89 pt
  const left = 48;
  const right = pageWidth - 48;
  const contentWidth = pageWidth - left * 2; // 499.28 pt
  const topStart = 58;
  const contentBottom = pageHeight - 52; // 789.89 pt
  const footerRuleY = pageHeight - 38;
  const footerY = pageHeight - 26;

  // Page Header Drawing Function
  const drawPageHeader = () => {
    doc.save();
    // Header Banner Background
    doc.rect(0, 0, pageWidth, 42).fill("#0f172a");
    doc.rect(0, 42, pageWidth, 2.5).fill("#2563eb");

    doc.fillColor("#ffffff");
    doc.font("Helvetica-Bold").fontSize(14).text("MCQGyaan AI", left, 12);
    doc.font("Helvetica").fontSize(9).fillColor("#94a3b8").text("Answer Sheet Evaluation Report", left, 27);

    const formattedDate = new Date().toLocaleDateString();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#93c5fd").text(formattedDate, right - 130, 18, {
      width: 130,
      align: "right",
    });
    doc.restore();
  };

  // Page Footer Drawing Function
  const drawPageFooter = (pageNumber: number, totalPages: number) => {
    doc.save();
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(left, footerRuleY).lineTo(right, footerRuleY).stroke();
    doc.fillColor("#64748b").font("Helvetica").fontSize(8);

    const leftText = "MCQGyaan AI Evaluation Report";
    const centerText = `Page ${pageNumber} of ${totalPages}`;
    const rightText = "www.mcqgyaan.com";

    doc.text(leftText, left, footerY, { width: 160, lineBreak: false });
    doc.text(centerText, pageWidth / 2 - 40, footerY, { width: 80, align: "center", lineBreak: false });
    doc.text(rightText, right - 140, footerY, { width: 140, align: "right", lineBreak: false });
    doc.restore();
  };

  // Space check helper that adds a page ONLY if content will cross contentBottom
  const ensureSpace = (requiredHeight: number) => {
    if (doc.y + requiredHeight > contentBottom) {
      doc.addPage();
      doc.y = topStart;
    }
  };

  // Section Title Helper
  const drawSectionTitle = (title: string, accent = "#1d4ed8") => {
    ensureSpace(24);
    doc.fillColor(accent).font("Helvetica-Bold").fontSize(12);
    doc.text(title, left, doc.y, { width: contentWidth });
    doc.y += 3;
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.y += 10;
  };

  doc.y = topStart;

  // --- 1. STUDENT PROFILE CARD ---
  const profileY = doc.y;
  doc.save();
  doc.roundedRect(left, profileY, contentWidth, 32, 4).fillAndStroke("#f8fafc", "#e2e8f0");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(studentName || "Student", left + 12, profileY + 6);
  doc.fillColor("#475569").font("Helvetica").fontSize(9).text(
    `Class: ${classLevel ?? "N/A"}   |   Subject: ${subject || "General"}   |   Total Answers Evaluated: ${totalAnswers ?? 0}`,
    left + 12,
    profileY + 19,
  );
  doc.restore();

  doc.y = profileY + 44;

  // --- 2. OVERALL EVALUATION SUMMARY CARD ---
  drawSectionTitle("Overall Evaluation Summary", "#1d4ed8");

  const summaryFeedback = overallFeedback || "No overall feedback was provided.";
  doc.font("Helvetica").fontSize(9.5);
  const summaryFeedbackHeight = doc.heightOfString(summaryFeedback, { width: contentWidth - 24, lineGap: 1.2 });
  const summaryCardHeight = Math.max(48, 30 + summaryFeedbackHeight);

  ensureSpace(summaryCardHeight + 10);
  const summaryY = doc.y;

  doc.save();
  doc.roundedRect(left, summaryY, contentWidth, summaryCardHeight, 4).fillAndStroke("#eff6ff", "#bfdbfe");

  doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(11).text("Overall Performance Rating", left + 12, summaryY + 8);
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#1d4ed8").text(
    `${Number(averageScore ?? 0).toFixed(1)} / 10`,
    right - 120,
    summaryY + 6,
    { width: 108, align: "right" },
  );

  doc.fillColor("#334155").font("Helvetica").fontSize(9.5).text(summaryFeedback, left + 12, summaryY + 24, {
    width: contentWidth - 24,
    align: "left",
    lineGap: 1.2,
  });
  doc.restore();

  doc.y = summaryY + summaryCardHeight + 16;

  // --- 3. DETAILED QUESTION BREAKDOWN ---
  drawSectionTitle("Detailed Question Breakdown", "#0f766e");

  const items = (answerEvaluations || []) as AnswerEvaluationItem[];

  items.forEach((ans) => {
    // A. Question Header Bar
    ensureSpace(32);
    const qHeaderY = doc.y;
    doc.save();
    doc.roundedRect(left, qHeaderY, contentWidth, 24, 3).fillAndStroke("#0f172a", "#0f172a");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text(`Question ${ans.questionNumber}`, left + 10, qHeaderY + 6);
    doc.fillColor("#93c5fd").font("Helvetica-Bold").fontSize(10).text(
      `Score: ${typeof ans.qualityScore === "number" ? ans.qualityScore : "N/A"} / 10`,
      right - 110,
      qHeaderY + 6,
      { width: 100, align: "right" },
    );
    doc.restore();
    doc.y = qHeaderY + 30;

    // B. Student Extracted Answer Card
    if (ans.extractedAnswer) {
      doc.font("Helvetica").fontSize(9);
      const textH = doc.heightOfString(ans.extractedAnswer, { width: contentWidth - 24, lineGap: 1.2 });
      const boxH = textH + 20;

      ensureSpace(boxH + 6);
      const curY = doc.y;

      doc.save();
      doc.roundedRect(left, curY, contentWidth, boxH, 4).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5).text("Student Extracted Answer", left + 12, curY + 6);
      doc.fillColor("#334155").font("Helvetica").fontSize(9).text(ans.extractedAnswer, left + 12, curY + 18, {
        width: contentWidth - 24,
        align: "left",
        lineGap: 1.2,
      });
      doc.restore();
      doc.y = curY + boxH + 8;
    }

    // C. Strengths Section Card
    if (ans.strengths?.length) {
      doc.font("Helvetica").fontSize(9);
      let bulletsH = 0;
      ans.strengths.forEach((s) => {
        bulletsH += doc.heightOfString(`•  ${s}`, { width: contentWidth - 24, lineGap: 1.1 }) + 3;
      });
      const boxH = bulletsH + 20;

      ensureSpace(boxH + 6);
      const curY = doc.y;

      doc.save();
      doc.roundedRect(left, curY, contentWidth, boxH, 4).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.fillColor("#15803d").font("Helvetica-Bold").fontSize(9.5).text("Strengths / Well Done", left + 12, curY + 6);

      let bY = curY + 18;
      ans.strengths.forEach((s) => {
        doc.fillColor("#166534").font("Helvetica").fontSize(9).text(`•  ${s}`, left + 12, bY, {
          width: contentWidth - 24,
          align: "left",
          lineGap: 1.1,
        });
        bY = doc.y + 3;
      });
      doc.restore();
      doc.y = curY + boxH + 8;
    }

    // D. Areas for Improvement Section Card
    if (ans.improvements?.length) {
      doc.font("Helvetica").fontSize(9);
      let bulletsH = 0;
      ans.improvements.forEach((imp) => {
        bulletsH += doc.heightOfString(`•  ${imp}`, { width: contentWidth - 24, lineGap: 1.1 }) + 3;
      });
      const boxH = bulletsH + 20;

      ensureSpace(boxH + 6);
      const curY = doc.y;

      doc.save();
      doc.roundedRect(left, curY, contentWidth, boxH, 4).fillAndStroke("#fff7ed", "#ffedd5");
      doc.fillColor("#c2410c").font("Helvetica-Bold").fontSize(9.5).text("Areas for Improvement", left + 12, curY + 6);

      let bY = curY + 18;
      ans.improvements.forEach((imp) => {
        doc.fillColor("#9a3412").font("Helvetica").fontSize(9).text(`•  ${imp}`, left + 12, bY, {
          width: contentWidth - 24,
          align: "left",
          lineGap: 1.1,
        });
        bY = doc.y + 3;
      });
      doc.restore();
      doc.y = curY + boxH + 8;
    }

    // E. Model / Correct Answer Card
    if (ans.correctAnswer) {
      doc.font("Helvetica").fontSize(9);
      const textH = doc.heightOfString(ans.correctAnswer, { width: contentWidth - 24, lineGap: 1.2 });
      const boxH = textH + 20;

      ensureSpace(boxH + 6);
      const curY = doc.y;

      doc.save();
      doc.roundedRect(left, curY, contentWidth, boxH, 4).fillAndStroke("#eff6ff", "#bfdbfe");
      doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(9.5).text("Model / Correct Answer", left + 12, curY + 6);
      doc.fillColor("#1e3a8a").font("Helvetica").fontSize(9).text(ans.correctAnswer, left + 12, curY + 18, {
        width: contentWidth - 24,
        align: "left",
        lineGap: 1.2,
      });
      doc.restore();
      doc.y = curY + boxH + 8;
    }

    // F. Detailed Teacher Feedback Card
    if (ans.detailedFeedback) {
      doc.font("Helvetica").fontSize(9);
      const textH = doc.heightOfString(ans.detailedFeedback, { width: contentWidth - 24, lineGap: 1.2 });
      const boxH = textH + 20;

      ensureSpace(boxH + 6);
      const curY = doc.y;

      doc.save();
      doc.roundedRect(left, curY, contentWidth, boxH, 4).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5).text("Detailed Teacher Feedback", left + 12, curY + 6);
      doc.fillColor("#334155").font("Helvetica").fontSize(9).text(ans.detailedFeedback, left + 12, curY + 18, {
        width: contentWidth - 24,
        align: "left",
        lineGap: 1.2,
      });
      doc.restore();
      doc.y = curY + boxH + 14;
    }
  });

  // Apply Headers and Footers to all generated content pages
  const pages = doc.bufferedPageRange();
  const totalPages = pages.count;
  for (let i = 0; i < totalPages; i += 1) {
    doc.switchToPage(i);
    drawPageHeader();
    drawPageFooter(i + 1, totalPages);
  }

  doc.end();
}