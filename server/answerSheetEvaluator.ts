import OpenAI from "openai";
import PDFDocument from "pdfkit";
import { Request, Response } from "express";
import { getServerAppUrl } from "./lib/appUrl";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

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

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, bottom: 54, left: 48, right: 48 },
    bufferPages: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=evaluation-report.pdf");

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = 48;
  const right = pageWidth - 48;
  const contentWidth = pageWidth - left * 2;
  const contentBottom = pageHeight - 64;
  const footerY = pageHeight - 24;
  const footerRuleY = pageHeight - 34;

  const setBodyText = (fontSize = 10, color = "#263238", bold = false) => {
    doc.fillColor(color);
    doc.fontSize(fontSize);
    doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  };

  const drawPageHeader = () => {
    doc.save();
    // Header Banner Background
    doc.rect(0, 0, pageWidth, 42).fill("#0f172a");
    doc.rect(0, 42, pageWidth, 2.5).fill("#2563eb");

    doc.fillColor("#ffffff");
    doc.font("Helvetica-Bold").fontSize(14).text("MCQGyaan AI", left, 12);
    doc.font("Helvetica").fontSize(9).fillColor("#94a3b8").text("Answer Sheet Evaluation Report", left, 27);

    const formattedDate = new Date().toLocaleDateString();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#93c5fd").text(formattedDate, right - 120, 18, {
      width: 120,
      align: "right",
    });
    doc.restore();
  };

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

  const ensureSpace = (requiredHeight: number) => {
    if (doc.y + requiredHeight <= contentBottom) return;
    doc.addPage();
    doc.y = 54;
  };

  const blockHeight = (text: string | undefined, width: number, fontSize: number) => {
    if (!text) return fontSize * 1.4;
    doc.font("Helvetica").fontSize(fontSize);
    return Math.max(doc.heightOfString(text, { width }), fontSize * 1.4);
  };

  const bulletHeight = (items: string[] | undefined, width: number, fontSize: number) => {
    if (!items?.length) return 0;
    return items.reduce((total, item) => total + blockHeight(item, width - 12, fontSize) + 2, 0);
  };

  const drawSectionTitle = (title: string, accent = "#1d4ed8") => {
    setBodyText(12.5, accent, true);
    doc.text(title, left, doc.y, { width: contentWidth });
    doc.moveDown(0.12);
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.3);
  };

  const drawBulletList = (items: string[], bulletColor = "#334155") => {
    items.forEach((item) => {
      setBodyText(9.5, bulletColor, false);
      doc.text(`•  ${item}`, left + 4, doc.y, {
        width: contentWidth - 8,
        align: "left",
        lineGap: 1.1,
      });
      doc.moveDown(0.15);
    });
  };

  drawPageHeader();
  doc.y = 54;

  // Student Info Card
  doc.save();
  doc.roundedRect(left, doc.y, contentWidth, 24, 4).fillAndStroke("#f8fafc", "#e2e8f0");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text(studentName || "Student", left + 10, doc.y + 5);
  doc.fillColor("#475569").font("Helvetica").fontSize(9.5).text(
    `Class: ${classLevel ?? "N/A"}   |   Subject: ${subject || "General"}   |   Evaluated Answers: ${totalAnswers ?? 0}`,
    left + 10,
    doc.y + 14,
  );
  doc.restore();

  doc.y += 30;

  // Evaluation Summary Section
  drawSectionTitle("Evaluation Summary");

  const summaryFeedback = overallFeedback || "No overall feedback was provided.";
  const summaryFeedbackHeight = blockHeight(summaryFeedback, contentWidth - 20, 9.5);
  const summaryCardHeight = 32 + summaryFeedbackHeight;

  ensureSpace(summaryCardHeight);
  const summaryY = doc.y;

  doc.save();
  doc.roundedRect(left, summaryY, contentWidth, summaryCardHeight, 4).fillAndStroke("#eff6ff", "#bfdbfe");

  doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(11).text("Overall Performance Rating", left + 10, summaryY + 6);
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#1d4ed8").text(
    `${Number(averageScore ?? 0).toFixed(1)} / 10`,
    right - 110,
    summaryY + 5,
    { width: 100, align: "right" },
  );

  doc.fillColor("#334155").font("Helvetica").fontSize(9.5).text(summaryFeedback, left + 10, summaryY + 22, {
    width: contentWidth - 20,
    align: "justify",
    lineGap: 1.15,
  });
  doc.restore();

  doc.y = summaryY + summaryCardHeight + 12;

  // Answer Breakdown Section
  drawSectionTitle("Detailed Answer Breakdown", "#0f766e");

  const items = (answerEvaluations || []) as AnswerEvaluationItem[];
  items.forEach((ans, index) => {
    const answerHeight =
      32 +
      blockHeight(`Question ${ans.questionNumber}`, contentWidth - 110, 11) +
      blockHeight(ans.extractedAnswer || "", contentWidth - 16, 9.5) +
      bulletHeight(ans.strengths, contentWidth - 16, 9.5) +
      bulletHeight(ans.improvements, contentWidth - 16, 9.5) +
      blockHeight(ans.correctAnswer || "", contentWidth - 16, 9.5) +
      blockHeight(ans.detailedFeedback || "", contentWidth - 16, 9.5);

    ensureSpace(answerHeight + 10);

    const startY = doc.y;

    doc.save();
    doc.roundedRect(left, startY, contentWidth, answerHeight, 4).fillAndStroke("#ffffff", "#e2e8f0");

    let innerY = startY + 6;

    // Header of Card
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(`Question ${ans.questionNumber}`, left + 8, innerY);
    doc.fillColor("#1d4ed8").font("Helvetica-Bold").fontSize(10).text(
      `Score: ${typeof ans.qualityScore === "number" ? ans.qualityScore : "N/A"} / 10`,
      right - 100,
      innerY,
      { width: 92, align: "right" },
    );
    innerY += 14;

    doc.strokeColor("#f1f5f9").lineWidth(0.5).moveTo(left + 6, innerY).lineTo(right - 6, innerY).stroke();
    innerY += 6;

    // Student Answer
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5).text("Student Extracted Answer", left + 8, innerY);
    innerY += 11;
    doc.fillColor("#334155").font("Helvetica").fontSize(9).text(ans.extractedAnswer || "No answer extracted.", left + 8, innerY, {
      width: contentWidth - 16,
      align: "justify",
      lineGap: 1.1,
    });
    innerY = doc.y + 6;

    // Strengths
    if (ans.strengths?.length) {
      doc.fillColor("#15803d").font("Helvetica-Bold").fontSize(9.5).text("Strengths", left + 8, innerY);
      innerY += 11;
      doc.y = innerY;
      drawBulletList(ans.strengths, "#166534");
      innerY = doc.y + 6;
    }

    // Improvements
    if (ans.improvements?.length) {
      doc.fillColor("#c2410c").font("Helvetica-Bold").fontSize(9.5).text("Areas for Improvement", left + 8, innerY);
      innerY += 11;
      doc.y = innerY;
      drawBulletList(ans.improvements, "#9a3412");
      innerY = doc.y + 6;
    }

    // Correct Answer
    if (ans.correctAnswer) {
      doc.fillColor("#1d4ed8").font("Helvetica-Bold").fontSize(9.5).text("Correct / Model Answer", left + 8, innerY);
      innerY += 11;
      doc.fillColor("#1e40af").font("Helvetica").fontSize(9).text(ans.correctAnswer, left + 8, innerY, {
        width: contentWidth - 16,
        align: "justify",
        lineGap: 1.1,
      });
      innerY = doc.y + 6;
    }

    // Detailed Feedback
    if (ans.detailedFeedback) {
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9.5).text("Teacher Feedback", left + 8, innerY);
      innerY += 11;
      doc.fillColor("#475569").font("Helvetica").fontSize(9).text(ans.detailedFeedback, left + 8, innerY, {
        width: contentWidth - 16,
        align: "justify",
        lineGap: 1.1,
      });
      innerY = doc.y + 6;
    }

    doc.restore();
    doc.y = Math.max(doc.y + 10, startY + answerHeight + 8);
  });

  const pages = doc.bufferedPageRange();
  const totalPages = pages.count;
  for (let i = 0; i < pages.count; i += 1) {
    doc.switchToPage(i);
    drawPageHeader();
    drawPageFooter(i + 1, totalPages);
  }

  doc.end();
}