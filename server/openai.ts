import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface QuestionGenerationParams {
  language: string;
  classLevel: number;
  difficulty: string;
  chapter: number;
  chapterTitle: string;
  questionNumber: number;
  previousPerformance?: string;
}

interface AnswerEvaluationParams {
  question: string;
  studentAnswer: string;
  language: string;
  classLevel: number;
  difficulty: string;
}

export async function generateQuestion(params: QuestionGenerationParams): Promise<{
  question: string;
  correctAnswer: string;
  questionType: string;
}> {
  const { language, classLevel, difficulty, chapterTitle, questionNumber, previousPerformance } = params;
  
  console.log(`[AI] Generating question #${questionNumber} for ${language} - ${difficulty} difficulty`);
  
  const adaptiveContext = previousPerformance 
    ? `\nThe student's previous performance: ${previousPerformance}. Adjust the difficulty accordingly.`
    : '';

  const prompt = `You are a strict CBSE ${language} teacher for Class ${classLevel} following the official CBSE curriculum.

Generate question #${questionNumber} about "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}

CBSE Curriculum Guidelines:
- Follow NCERT textbook patterns for Class ${classLevel}
- Use authentic, curriculum-appropriate vocabulary
- Focus on grammar, vocabulary, sentence formation, or cultural aspects as per CBSE syllabus
- Question types: translation, fill in the blank, sentence formation, or grammar-based

Return your response in this exact JSON format:
{
  "question": "<the question in clear language>",
  "correctAnswer": "<the complete correct answer>",
  "questionType": "translation|grammar|vocabulary|sentence"
}

Make the question challenging but fair for Class ${classLevel} CBSE level.`;

  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("AI returned empty response");
    }
    
    const result = JSON.parse(content);
    console.log(`[AI] Question generated in ${elapsed}s: ${result.question.substring(0, 50)}...`);
    
    return {
      question: result.question || "Error generating question",
      correctAnswer: result.correctAnswer || "N/A",
      questionType: result.questionType || "general",
    };
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to generate question:`, error.message || error);
    throw new Error(`Failed to generate question: ${error.message || "Unknown error"}`);
  }
}

export async function evaluateAnswer(params: AnswerEvaluationParams & { correctAnswer: string }): Promise<{
  score: number;
  feedback: string;
  isCorrect: boolean;
  encouragement: string;
}> {
  const { question, studentAnswer, correctAnswer, language, classLevel, difficulty } = params;

  console.log(`[AI] Evaluating answer: "${studentAnswer.substring(0, 30)}..."`);

  const prompt = `You are a strict but fair CBSE ${language} teacher for Class ${classLevel}.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}
Difficulty: ${difficulty}

Evaluate strictly based on CBSE marking scheme:
- Award 0 marks if completely wrong
- Award 5 marks if partially correct (minor mistakes)
- Award 10 marks only if fully correct

Provide:
1. Score (0, 5, or 10 only - be strict!)
2. Clear feedback explaining what was right/wrong
3. Whether the answer is correct (true/false)
4. Encouraging message

Return in this exact JSON format:
{
  "score": <0, 5, or 10>,
  "feedback": "<detailed feedback>",
  "isCorrect": <true or false>,
  "encouragement": "<supportive message>"
}`;

  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    const result = JSON.parse(content);
    console.log(`[AI] Answer evaluated in ${elapsed}s - Score: ${result.score}/10 - Correct: ${result.isCorrect}`);
    
    return {
      score: result.score || 0,
      feedback: result.feedback || "Please try again.",
      isCorrect: result.isCorrect || false,
      encouragement: result.encouragement || "Keep practicing!",
    };
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to evaluate answer:`, error.message || error);
    throw new Error(`Failed to evaluate answer: ${error.message || "Unknown error"}`);
  }
}
