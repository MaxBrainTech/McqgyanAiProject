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
  const response = await openai.chat.completions.create({
    model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 500,
  });
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const question = response.choices[0]?.message?.content?.trim() || "Error generating question";
  console.log(`[AI] Question generated in ${elapsed}s: ${question.substring(0, 50)}...`);

  return question;
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
  const response = await openai.chat.completions.create({
    model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
  } catch (error) {
    console.error("[AI] Failed to parse evaluation response:", error);
    return {
      score: 5,
      feedback: "Good effort! Keep practicing.",
      encouragement: "You're doing great!",
    };
  }
}
