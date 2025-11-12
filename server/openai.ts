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

export async function generateQuestion(params: QuestionGenerationParams): Promise<string> {
  const { language, classLevel, difficulty, chapterTitle, questionNumber, previousPerformance } = params;
  
  console.log(`[AI] Generating question #${questionNumber} for ${language} - ${difficulty} difficulty`);
  
  const adaptiveContext = previousPerformance 
    ? `\nThe student's previous performance: ${previousPerformance}. Adjust the difficulty accordingly.`
    : '';

  const prompt = `You are a friendly language teacher for CBSE Class ${classLevel} students learning ${language}.

Generate question #${questionNumber} about "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}

Requirements:
- Ask the question in ${language} or ask for translation to ${language}
- Make it appropriate for Class ${classLevel} level
- Keep it concise and clear
- Make it engaging for school students
- Focus on practical usage

Return ONLY the question text, nothing else.`;

  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o which is well-tested with AI Integrations
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 500,
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const question = response.choices[0]?.message?.content?.trim();
    
    if (!question) {
      throw new Error("AI returned empty response");
    }
    
    console.log(`[AI] Question generated in ${elapsed}s: ${question.substring(0, 50)}...`);
    return question;
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to generate question:`, error.message || error);
    console.error(`[AI ERROR] Full error:`, error);
    throw new Error(`Failed to generate question: ${error.message || "Unknown error"}`);
  }
}

export async function evaluateAnswer(params: AnswerEvaluationParams): Promise<{
  score: number;
  feedback: string;
  correction?: string;
  encouragement: string;
}> {
  const { question, studentAnswer, language, classLevel, difficulty } = params;

  console.log(`[AI] Evaluating answer: "${studentAnswer.substring(0, 30)}..."`);

  const prompt = `You are a warm, encouraging ${language} teacher for CBSE Class ${classLevel} students.

Question asked: ${question}
Student's answer: ${studentAnswer}
Difficulty level: ${difficulty}

Evaluate the answer and provide:
1. A score from 0-10 (be fair but encouraging)
2. Clear, simple feedback in English
3. A correction or suggestion if needed (keep it simple)
4. An encouraging message (be warm and supportive, like "Great job!", "You're improving!", etc.)

Return your response in this exact JSON format:
{
  "score": <number 0-10>,
  "feedback": "<your feedback>",
  "correction": "<optional suggestion>",
  "encouragement": "<encouraging message>"
}`;

  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o which is well-tested with AI Integrations
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    try {
      const result = JSON.parse(content);
      console.log(`[AI] Answer evaluated in ${elapsed}s - Score: ${result.score}/10`);
      return {
        score: result.score || 5,
        feedback: result.feedback || "Good effort!",
        correction: result.correction,
        encouragement: result.encouragement || "Keep practicing!",
      };
    } catch (parseError) {
      console.error("[AI] Failed to parse evaluation response:", parseError);
      return {
        score: 5,
        feedback: "Good effort! Keep practicing.",
        encouragement: "You're doing great!",
      };
    }
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to evaluate answer:`, error.message || error);
    throw new Error(`Failed to evaluate answer: ${error.message || "Unknown error"}`);
  }
}
