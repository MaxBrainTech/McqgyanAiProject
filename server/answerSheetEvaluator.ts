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

export async function evaluateAnswerSheet(params: EvaluationParams): Promise<EvaluationResult> {
  const { images, studentName, classLevel, subject, gptModel = "gpt-4o" } = params;
  
  console.log(`[EVAL] Starting evaluation of ${images.length} images using ${gptModel}`);
  
  // Prepare messages with all images
  const imageMessages: any[] = images.map((imageData) => ({
    type: "image_url",
    image_url: {
      url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`,
      detail: "high" // High detail for better text recognition
    }
  }));
  
  const prompt = `You are an expert teacher evaluating a student's answer sheet. 
  
Student Name: ${studentName}
${classLevel ? `Class Level: ${classLevel}` : ''}
${subject ? `Subject: ${subject}` : ''}

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

Return your evaluation in this EXACT JSON format:
{
  "totalAnswers": <number of answers found>,
  "averageScore": <average quality score 0-10>,
  "overallFeedback": "<overall assessment of student performance>",
  "answerEvaluations": [
    {
      "questionNumber": <question number or identifier>,
      "extractedAnswer": "<the student's written answer - transcribe it exactly>",
      "qualityScore": <score 0-10>,
      "strengths": ["<what was good>", "<another strength>"],
      "improvements": ["<specific improvement>", "<another improvement>"],
      "correctAnswer": "<provide if student answer was wrong or incomplete>",
      "detailedFeedback": "<detailed, encouraging feedback for this answer>"
    }
  ]
}

IMPORTANT GUIDELINES:
- Be encouraging and constructive - this is for learning
- If an answer is partially correct, acknowledge what's right before suggesting improvements
- Provide specific, actionable improvement suggestions (not just "study more")
- If you can't read some text clearly, note that in the feedback
- For subjective answers, evaluate based on logic, presentation, and understanding
- Consider the student's class level when evaluating (age ${classLevel ? classLevel + 10 : 'unknown'})`;

  try {
    const response = await openai.chat.completions.create({
      model: gptModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageMessages
          ]
        }
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
    if (content.includes('```json')) {
      const match = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonContent = match[1];
    } else if (content.includes('```')) {
      const match = content.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonContent = match[1];
    }
    
    const result = JSON.parse(jsonContent);
    
    console.log(`[EVAL] ✓ Evaluated ${result.totalAnswers} answers. Average score: ${result.averageScore}/10`);
    
    return result;
    
  } catch (error: any) {
    console.error("[EVAL ERROR]", error.message);
    throw new Error(`Failed to evaluate answer sheet: ${error.message}`);
  }
}
