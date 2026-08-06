import OpenAI from "openai";
import PDFDocument from "pdfkit";
import { Request, Response } from "express";
import { getServerAppUrl } from "./lib/appUrl";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

EXAMPLE:
{
  "totalAnswers": 3,
  "averageScore": 7.5,
  "overallFeedback": "Good effort overall with clear understanding of basic concepts.",
  "answerEvaluations": [
    {
      "questionNumber": 1,
      "extractedAnswer": "Photosynthesis is the process by which plants make food using sunlight.",
      "qualityScore": 8,
      "strengths": ["Clear definition", "Mentioned key components"],
      "improvements": ["Could include the chemical equation", "Mention chlorophyll's role"],
      "correctAnswer": "Photosynthesis is the process by which plants convert light energy (usually from the sun) into chemical energy stored in glucose, using carbon dioxide and water, with chlorophyll as the catalyst. The equation is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2",
      "detailedFeedback": "Excellent start! You've correctly identified the basic concept of photosynthesis. To make your answer more complete, try including the raw materials (CO2 and water), the products (glucose and oxygen), and the role of chlorophyll."
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
          content: [{ type: "text", text: prompt }, ...imageMessages],
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No response from AI");
    }

    let jsonContent = content;
    if (content.includes("```json")) {
      const match = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonContent = match[1];
    } else if (content.includes("```")) {
      const match = content.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonContent = match[1];
    }

    const result = JSON.parse(jsonContent);

    console.log(
      `[EVAL] ✓ Evaluated ${result.totalAnswers} answers. Average score: ${result.averageScore}/10`,
    );

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
    margins: { top: 58, bottom: 56, left: 54, right: 54 },
    bufferPages: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=evaluation-report.pdf");

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const left = 54;
  const right = pageWidth - 54;
  const contentWidth = pageWidth - left * 2;
  const contentBottom = pageHeight - 76;
  const footerY = pageHeight - 28;
  const footerRuleY = pageHeight - 38;

  const setBodyText = (fontSize = 11, color = "#263238", bold = false) => {
    doc.fillColor(color);
    doc.fontSize(fontSize);
    doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  };

  const drawPageHeader = () => {
    doc.save();
    doc.strokeColor("#d1d5db").moveTo(left, 36).lineTo(right, 36).stroke();
    doc.fillColor("#0f172a");
    doc.font("Helvetica-Bold").fontSize(12).text("MCQGyaan AI", left, 16);
    doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text("Answer Sheet Evaluation Report", right, 18, {
      width: 140,
      align: "right",
      lineBreak: false,
    });
    doc.restore();
  };

  const drawPageFooter = (pageNumber: number, totalPages: number) => {
    doc.save();
    doc.strokeColor("#e5e7eb").moveTo(left, footerRuleY).lineTo(right, footerRuleY).stroke();
    doc.fillColor("#64748b").font("Helvetica").fontSize(8.25);

    const leftText = "Max Brain Technologies";
    const centerText = `Page ${pageNumber} of ${totalPages}`;
    const rightText = getServerAppUrl();

    const leftWidth = doc.widthOfString(leftText);
    const centerWidth = doc.widthOfString(centerText);
    const rightWidth = doc.widthOfString(rightText);

    doc.text(leftText, left, footerY, {
      width: Math.max(leftWidth + 4, 140),
      lineBreak: false,
    });
    doc.text(centerText, pageWidth / 2 - centerWidth / 2, footerY, {
      width: Math.max(centerWidth + 4, 90),
      align: "center",
      lineBreak: false,
    });
    doc.text(rightText, pageWidth - rightWidth - left, footerY, {
      width: Math.max(rightWidth + 4, 140),
      align: "right",
      lineBreak: false,
    });
    doc.restore();
  };

  const ensureSpace = (requiredHeight: number) => {
    if (doc.y + requiredHeight <= contentBottom) return;
    doc.addPage();
    doc.y = 52;
  };

  const blockHeight = (text: string | undefined, width: number, fontSize: number) => {
    if (!text) return fontSize * 1.5;
    doc.font("Helvetica").fontSize(fontSize);
    return Math.max(doc.heightOfString(text, { width }), fontSize * 1.5);
  };

  const bulletHeight = (items: string[] | undefined, width: number, fontSize: number) => {
    if (!items?.length) return 0;
    return items.reduce((total, item) => total + blockHeight(item, width - 10, fontSize) + 2, 0);
  };

  const drawSectionTitle = (title: string, accent = "#1d4ed8") => {
    setBodyText(14, accent, true);
    doc.text(title, left, doc.y, { width: contentWidth });
    doc.moveDown(0.12);
    doc.strokeColor("#d7dce2").moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.35);
  };

  const drawBulletList = (items: string[]) => {
    items.forEach((item) => {
      setBodyText(10.5, "#374151", false);
      doc.text(`- ${item}`, left + 2, doc.y, {
        width: contentWidth - 12,
        align: "left",
      });
      doc.moveDown(0.05);
    });
  };

  drawPageHeader();
  doc.y = 52;

  doc.fillColor("#111827");
  doc.font("Helvetica-Bold").fontSize(16).text(studentName || "Student", left, doc.y, {
    width: contentWidth,
  });
  doc.moveDown(0.08);

  setBodyText(10.5, "#475569", false);
  doc.text(
    `Class: ${classLevel ?? "N/A"}   |   Subject: ${subject || "N/A"}   |   Total Answers: ${totalAnswers ?? 0}`,
    { width: contentWidth, lineGap: 1.1 },
  );

  doc.moveDown(0.45);
  drawSectionTitle("Evaluation Summary");

  const summaryFeedback = overallFeedback || "No overall feedback was provided.";
  const summaryFeedbackHeight = blockHeight(summaryFeedback, contentWidth - 24, 10.5);
  const summaryCardHeight = 34 + summaryFeedbackHeight;

  ensureSpace(summaryCardHeight);
  const summaryY = doc.y;
  doc.fillColor("#0f172a");
  doc.font("Helvetica-Bold").fontSize(12).text("Average Score", left, summaryY, {
    width: contentWidth - 110,
  });
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#1d4ed8").text(
    `${Number(averageScore ?? 0).toFixed(1)}/10`,
    right - 100,
    summaryY - 2,
    { width: 100, align: "right" },
  );
  setBodyText(10.5, "#475569", false);
  doc.text(summaryFeedback, left, summaryY + 18, {
    width: contentWidth,
    align: "justify",
    lineGap: 1.15,
  });
  doc.y = summaryY + summaryCardHeight + 4;

  doc.moveDown(0.25);
  drawSectionTitle("Answer Breakdown", "#0f766e");

  const items = (answerEvaluations || []) as AnswerEvaluationItem[];
  items.forEach((ans, index) => {
    const answerHeight =
      36 +
      blockHeight(`Question ${ans.questionNumber}`, contentWidth - 130, 12.5) +
      blockHeight(ans.extractedAnswer || "", contentWidth, 10.2) +
      bulletHeight(ans.strengths, contentWidth, 10.2) +
      bulletHeight(ans.improvements, contentWidth, 10.2) +
      blockHeight(ans.correctAnswer || "", contentWidth, 10.2) +
      blockHeight(ans.detailedFeedback || "", contentWidth, 10.2);

    ensureSpace(answerHeight + 18);

    const startY = doc.y;
    const cardHeight = Math.max(answerHeight, 98);

    let innerY = startY;

    doc.fillColor("#0f172a");
    doc.font("Helvetica-Bold").fontSize(12.5).text(`Question ${ans.questionNumber}`, left, innerY, {
      width: contentWidth - 110,
    });
    setBodyText(10.25, "#1d4ed8", true);
    doc.text(`Marks: ${typeof ans.qualityScore === "number" ? ans.qualityScore : "N/A"}/10`, right - 96, innerY, {
      width: 96,
      align: "right",
    });
    innerY += 16;
    doc.strokeColor("#e5e7eb").moveTo(left, innerY).lineTo(right, innerY).stroke();
    innerY += 8;

    setBodyText(10.5, "#0f172a", true);
    doc.text("Student Answer", left, innerY, { width: contentWidth });
    innerY += 12;
    setBodyText(10, "#334155", false);
    doc.text(ans.extractedAnswer || "No answer extracted.", left, innerY, {
      width: contentWidth,
      align: "justify",
      lineGap: 1.1,
    });
    innerY = doc.y + 4;

    if (ans.strengths?.length) {
      setBodyText(10.5, "#15803d", true);
      doc.text("Strengths", left, innerY, { width: contentWidth });
      innerY += 12;
      doc.y = innerY;
      drawBulletList(ans.strengths);
      innerY = doc.y + 4;
    }

    if (ans.improvements?.length) {
      setBodyText(10.5, "#c2410c", true);
      doc.text("Areas for Improvement", left, innerY, { width: contentWidth });
      innerY += 12;
      doc.y = innerY;
      drawBulletList(ans.improvements);
      innerY = doc.y + 4;
    }

    if (ans.correctAnswer) {
      setBodyText(10.5, "#1d4ed8", true);
      doc.text("Correct Answer", left, innerY, { width: contentWidth });
      innerY += 12;
      setBodyText(10, "#334155", false);
      doc.text(ans.correctAnswer, left, innerY, {
        width: contentWidth,
        align: "justify",
        lineGap: 1.1,
      });
      innerY = doc.y + 4;
    }

    setBodyText(10.5, "#0f172a", true);
    doc.text("Detailed Feedback", left, innerY, { width: contentWidth });
    innerY += 12;
    setBodyText(10, "#334155", false);
    doc.text(ans.detailedFeedback || "No detailed feedback provided.", left, innerY, {
      width: contentWidth,
      align: "justify",
      lineGap: 1.1,
    });

    doc.y = Math.max(doc.y + 8, startY + cardHeight + 4);

    if (index < items.length - 1) {
      doc.moveDown(0.3);
    }
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
