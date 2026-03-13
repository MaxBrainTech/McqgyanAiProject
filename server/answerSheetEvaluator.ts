import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EvaluationParams {
  images: string[]; // Base64 encoded images
  studentName: string;
  classLevel?: number;
  subject?: string;
  gptModel?: string;
}

interface AnswerEvaluation {
  questionNumber: number;
  extractedAnswer: string;
  qualityScore: number; // 0-10
  strengths: string[];
  improvements: string[];
  correctAnswer?: string; // If answer was wrong
  detailedFeedback: string;
}

interface EvaluationResult {
  totalAnswers: number;
  averageScore: number;
  overallFeedback: string;
  answerEvaluations: AnswerEvaluation[];
}

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

  // Prepare messages with all images
  const imageMessages: any[] = images.map((imageData) => ({
    type: "image_url",
    image_url: {
      url: imageData.startsWith("data:")
        ? imageData
        : `data:image/jpeg;base64,${imageData}`,
      detail: "high", // High detail for better text recognition
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
      "correctAnswer": "Photosynthesis is the process by which plants convert light energy (usually from the sun) into chemical energy stored in glucose, using carbon dioxide and water, with chlorophyll as the catalyst. The equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
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
      temperature: 0.3, // Lower temperature for more consistent evaluation
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No response from AI");
    }

    // Extract JSON from response (might be wrapped in markdown)
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

// import PDFDocument from "pdfkit";
// import { Request, Response } from "express";

// export function generateEvaluationPDF(req: Request, res: Response) {
//   const {
//     studentName,
//     classLevel,
//     subject,
//     totalAnswers,
//     averageScore,
//     overallFeedback,
//     answerEvaluations,
//   } = req.body;

//   const doc = new PDFDocument({
//     size: "A4",
//     margins: {
//       top: 100,
//       bottom: 80,
//       left: 50,
//       right: 50,
//     },
//   });

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "attachment; filename=evaluation-report.pdf");

//   doc.pipe(res);
//   let pageNumber = 1;

//   const drawFooter = () => {
//     const pageHeight = doc.page.height;
//     const pageWidth = doc.page.width;

//     doc
//       .strokeColor("#cccccc")
//       .moveTo(50, pageHeight - 60)
//       .lineTo(pageWidth - 50, pageHeight - 60)
//       .stroke();

//     doc
//       .fontSize(9)
//       .fillColor("gray")
//       .text(
//         "Max Brain Technologies – https://themaxbrain.com/",
//         50,
//         pageHeight - 45,
//         { width: pageWidth - 100, align: "center" }
//       );

//     doc
//       .fontSize(9)
//       .text(`Page ${pageNumber}`, pageWidth - 100, pageHeight - 45);
//   };

//   drawFooter();

//   doc.on("pageAdded", () => {
//     pageNumber++;
//     drawFooter();
//   });

//   /* ================= HEADER ================= */

//   doc.rect(0, 0, doc.page.width, 80).fill("#2f3e52");

//   doc
//     .fillColor("white")
//     .fontSize(20)
//     .text("Answer Sheet Evaluation Report", 50, 30);

//   doc.fontSize(14).text("MCQGyaan AI", 420, 35);

//   doc.fillColor("black");

//   /* ================= STUDENT INFO ================= */

//   doc.moveDown(2)

//   doc
//     .fontSize(14)
//     .fillColor("#000")
//     .text(`Student Name: ${studentName}`, {
//       width: 500
//     })

//   doc
//     .fontSize(12)
//     .text(`Class: ${classLevel} | Subject: ${subject} | Total Answers: ${totalAnswers}`, {
//       width: 500
//     })

//   doc.moveDown(2)

//   /* ================= SUMMARY ================= */

//   doc
//   .fontSize(18)
//   .fillColor("#1a237e")
//   .text("Evaluation Summary");

//   doc.moveDown(0.5);

//   doc.fontSize(12).fillColor("black").text(`Average Score: ${averageScore}/10`);

//   doc.moveDown();

//   doc.fontSize(13).fillColor("#2f3e52").text("Overall Feedback");

//   doc.moveDown(0.5);

//   doc.fontSize(11).fillColor("#444").text(overallFeedback, {
//     align: "justify",
//   });

//   doc.moveDown(2);

//   /* ================= ANSWER SECTION ================= */

//   answerEvaluations.forEach((ans: any) => {
//     if (doc.y > doc.page.height - 150) {
//       doc.addPage();
//     }
//     // doc
//     //   .fontSize(15)
//     //   .fillColor("#1a237e")
//     doc
//       .fontSize(15)
//       .fillColor("#0d47a1")
//       .text(`Question ${ans.questionNumber}`, {
//         continued: true
//       });

//     doc
//       .fontSize(12)
//       .fillColor("#2e7d32")
//       .text(`   Score: ${ans.qualityScore}/10`);

//     doc.moveDown(0.7);

//     /* Student Answer */

//     doc
//       .fontSize(12)
//       .fillColor("#000")
//       .text("Student Answer")

//     doc
//       .fontSize(11)
//       .fillColor("#444")
//       .text(ans.extractedAnswer, {
//         width: 500,
//         align: "justify"
//       });

//     doc.moveDown();

//     /* Strengths */

//     ans.strengths.forEach((s: string) => {
//       doc
//         .fontSize(11)
//         .fillColor("#444")
//         .text(`• ${s}`, { width: 500 });
//     });

//     doc.moveDown();

//     /* Improvements */

//     if (ans.improvements?.length) {
//       doc.fontSize(12).fillColor("#f57f17").text("Areas for Improvement:");

//       ans.improvements.forEach((i: string) => {
//         doc.fontSize(11).fillColor("#333").text(`• ${i}`);
//       });

//       doc.moveDown();
//     }

//     /* Correct Answer */

//     if (ans.correctAnswer) {
//       doc.fontSize(12).fillColor("#1565c0").text("Correct Answer:");

//       doc.fontSize(11).fillColor("#333").text(ans.correctAnswer, {
//         align: "justify",
//       });

//       doc.moveDown();
//     }

//     /* Detailed Feedback */

//     doc
//       .fontSize(12)
//       .fillColor("#000")
//       .text("Detailed Feedback")

//     doc
//         .fontSize(11)
//         .fillColor("#444")
//         .text(ans.detailedFeedback, {
//           width: 500,
//           align: "justify"
//         });

//       if (doc.y > doc.page.height - 150) {
//         doc.addPage();
//       }

//     doc.moveDown();

//     /* divider line */

//     doc
//       .strokeColor("#e0e0e0")
//       .lineWidth(1)
//       .moveTo(50, doc.y)
//       .lineTo(545, doc.y)
//       .stroke()

//     doc.moveDown(2)
//    });
//   doc.end();
// }

// import PDFDocument from "pdfkit";
// import { Request, Response } from "express";

// export function generateEvaluationPDF(req: Request, res: Response) {

//   try {

//     const {
//       studentName,
//       classLevel,
//       subject,
//       totalAnswers,
//       averageScore,
//       overallFeedback,
//       answerEvaluations
//     } = req.body;

//     const doc = new PDFDocument({
//       size: "A4",
//       margins: { top: 100, bottom: 80, left: 50, right: 50 }
//     });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=evaluation-report.pdf");

//     let pageNumber = 1;

//     const drawFooter = () => {
//       const pageHeight = doc.page.height;
//       const pageWidth = doc.page.width;

//       doc
//         .strokeColor("#cccccc")
//         .moveTo(50, pageHeight - 60)
//         .lineTo(pageWidth - 50, pageHeight - 60)
//         .stroke();

//       doc
//         .fontSize(9)
//         .fillColor("gray")
//         .text(
//           "Max Brain Technologies – https://themaxbrain.com/",
//           50,
//           pageHeight - 45,
//           { width: pageWidth - 100, align: "center" }
//         );

//       doc
//         .fontSize(9)
//         .text(`Page ${pageNumber}`, pageWidth - 80, pageHeight - 45);
//     };
//     doc.pipe(res);

//     drawFooter();

//     doc.on("pageAdded", () => {
//       pageNumber++;
//       drawFooter();
//     });

//     /* ---------- HEADER ---------- */

//     doc.rect(0,0,doc.page.width,80).fill("#2f3e52");

//     doc.fillColor("white")
//       .fontSize(20)
//       .text("Answer Sheet Evaluation Report",50,30);

//     doc.fontSize(14).text("MCQGyaan AI",420,35);

//     doc.fillColor("black");
//     doc.y = 110;

//     /* ---------- STUDENT INFO ---------- */

//     doc.fontSize(14)
//       .text(`Student Name: ${studentName}`,{ width:500 });

//     doc.fontSize(12)
//       .text(`Class: ${classLevel} | Subject: ${subject} | Total Answers: ${totalAnswers}`,{ width:500 });

//     doc.moveDown(2);

//     /* ---------- SUMMARY ---------- */

//     doc.fontSize(18)
//       .fillColor("#1a237e")
//       .text("Evaluation Summary");

//     doc.moveDown(0.5);

//     doc.fontSize(12)
//       .fillColor("black")
//       .text(`Average Score: ${averageScore}/10`);

//     doc.moveDown();

//     doc.fontSize(13)
//       .fillColor("#2f3e52")
//       .text("Overall Feedback");

//     doc.moveDown(0.5);

//     doc.fontSize(11)
//       .fillColor("#444")
//       .text(overallFeedback,{
//         width:500,
//         align:"justify"
//       });

//     doc.moveDown(2);

//     /* ---------- ANSWERS ---------- */

//     answerEvaluations.forEach((ans:any)=>{

//       if(doc.y > doc.page.height - 150){
//         doc.addPage();
//       }

//       doc.fontSize(15)
//         .fillColor("#0d47a1")
//         .text(`Question ${ans.questionNumber}`,{continued:true});

//       doc.fontSize(12)
//         .fillColor("#2e7d32")
//         .text(`   Score: ${ans.qualityScore}/10`);

//       doc.moveDown();

//       doc.fontSize(12).fillColor("#000").text("Student Answer");

//       doc.fontSize(11)
//         .fillColor("#444")
//         .text(ans.extractedAnswer,{
//           width:500,
//           align:"justify"
//         });

//       doc.moveDown();

//       if(ans.strengths?.length){
//         doc.fontSize(12).fillColor("#2e7d32").text("Strengths");

//         ans.strengths.forEach((s:string)=>{
//           doc.fontSize(11).fillColor("#444").text(`• ${s}`);
//         });

//         doc.moveDown();
//       }

//       if(ans.improvements?.length){
//         doc.fontSize(12).fillColor("#f57f17").text("Areas for Improvement");

//         ans.improvements.forEach((i:string)=>{
//           doc.fontSize(11).fillColor("#444").text(`• ${i}`);
//         });

//         doc.moveDown();
//       }

//       if(ans.correctAnswer){
//         doc.fontSize(12).fillColor("#1565c0").text("Correct Answer");

//         doc.fontSize(11)
//           .fillColor("#444")
//           .text(ans.correctAnswer,{
//             width:500,
//             align:"justify"
//           });

//         doc.moveDown();
//       }

//       doc.fontSize(12).fillColor("#000").text("Detailed Feedback");

//       doc.fontSize(11)
//         .fillColor("#444")
//         .text(ans.detailedFeedback,{
//           width:500,
//           align:"justify"
//         });

//       doc.moveDown();

//       doc.strokeColor("#e0e0e0")
//         .lineWidth(1)
//         .moveTo(50,doc.y)
//         .lineTo(545,doc.y)
//         .stroke();

//       doc.moveDown(2);

//     });

//     /* IMPORTANT: close stream */
//     doc.end();

//   } catch (error) {

//     console.error("PDF generation failed:", error);

//     if (!res.headersSent) {
//       res.status(500).json({ error: "Failed to generate PDF" });
//     }

//   }
// }

import PDFDocument from "pdfkit";
import { Request, Response } from "express";

export function generateEvaluationPDF(req: Request, res: Response) {

  const {
    studentName,
    classLevel,
    subject,
    totalAnswers,
    averageScore,
    overallFeedback,
    answerEvaluations
  } = req.body;

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 90, bottom: 80, left: 60, right: 60 },
    bufferPages: true
  });

  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition","attachment; filename=evaluation-report.pdf");

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 120;

  /* HEADER */

  doc.rect(0,0,pageWidth,70).fill("#2f3e52");

  doc.fillColor("white")
     .fontSize(20)
     .text("Answer Sheet Evaluation Report",60,30);

  doc.fontSize(14)
     .text("MCQGyaan AI",pageWidth-150,30);

  doc.fillColor("black");

  doc.y = 100;

  /* STUDENT INFO */

  doc.fontSize(14)
     .text(`Student Name: ${studentName}`,60,doc.y,{width:contentWidth});

  doc.fontSize(12)
     .text(`Class: ${classLevel} | Subject: ${subject} | Total Answers: ${totalAnswers}`,{
       width:contentWidth
     });

  doc.moveDown(2);

  /* SUMMARY */

  doc.fontSize(18)
     .fillColor("#1a237e")
     .text("Evaluation Summary",{width:contentWidth});

  doc.moveDown(0.5);

  doc.fontSize(12)
     .fillColor("black")
     .text(`Average Score: ${averageScore}/10`,{width:contentWidth});

  doc.moveDown();

  doc.fontSize(13)
     .fillColor("#2f3e52")
     .text("Overall Feedback",{width:contentWidth});

  doc.moveDown(0.5);

  doc.fontSize(11)
     .fillColor("#444")
     .text(overallFeedback,{
       width:contentWidth,
       align:"justify"
     });

  doc.moveDown(2);

  /* QUESTIONS */

  answerEvaluations.forEach((ans:any)=>{

    if(doc.y > pageHeight - 150){
      doc.addPage();
    }

    doc.fontSize(15)
       .fillColor("#0d47a1")
       .text(`Question ${ans.questionNumber} (${ans.qualityScore}/10)`,{
         width:contentWidth
       });

    doc.moveDown();

    doc.fontSize(12).fillColor("#000")
       .text("Student Answer",{width:contentWidth});

    doc.fontSize(11)
       .fillColor("#444")
       .text(ans.extractedAnswer,{
         width:contentWidth,
         align:"justify"
       });

    doc.moveDown();

    if(ans.strengths?.length){

      doc.fontSize(12)
         .fillColor("#2e7d32")
         .text("Strengths",{width:contentWidth});

      ans.strengths.forEach((s:string)=>{
        doc.fontSize(11)
           .fillColor("#444")
           .text(`• ${s}`,{width:contentWidth});
      });

      doc.moveDown();
    }

    if(ans.improvements?.length){

      doc.fontSize(12)
         .fillColor("#f57f17")
         .text("Areas for Improvement",{width:contentWidth});

      ans.improvements.forEach((i:string)=>{
        doc.fontSize(11)
           .fillColor("#444")
           .text(`• ${i}`,{width:contentWidth});
      });

      doc.moveDown();
    }

    if(ans.correctAnswer){

      doc.fontSize(12)
         .fillColor("#1565c0")
         .text("Correct Answer",{width:contentWidth});

      doc.fontSize(11)
         .fillColor("#444")
         .text(ans.correctAnswer,{
           width:contentWidth,
           align:"justify"
         });

      doc.moveDown();
    }

    doc.fontSize(12)
       .fillColor("#000")
       .text("Detailed Feedback",{width:contentWidth});

    doc.fontSize(11)
       .fillColor("#444")
       .text(ans.detailedFeedback,{
         width:contentWidth,
         align:"justify"
       });

    doc.moveDown();

    doc.moveTo(60,doc.y)
       .lineTo(pageWidth-60,doc.y)
       .strokeColor("#e0e0e0")
       .stroke();

    doc.moveDown(2);

  });

  /* FOOTER */

  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {

    doc.switchToPage(i);

    doc.fontSize(9)
       .fillColor("gray")
       .text(
         "Max Brain Technologies – https://themaxbrain.com/",
         60,
         pageHeight - 40,
         { width: contentWidth, align: "center", lineBreak:false }
       );

    doc.fontSize(9)
       .text(
         `Page ${i + 1} of ${pages.count}`,
         pageWidth - 120,
         pageHeight - 40,
         { lineBreak:false }
       );
  }

  doc.end();
}
