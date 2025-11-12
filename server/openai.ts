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
  previousQuestions?: string[];
}

interface AnswerEvaluationParams {
  question: string;
  studentAnswer: string;
  language: string;
  classLevel: number;
  difficulty: string;
}

export async function generateQuestion(params: QuestionGenerationParams & { isMcq?: boolean }): Promise<{
  question: string;
  correctAnswer: string;
  questionType: string;
  options?: string[];
  correctOption?: string;
  explanation?: string;
}> {
  const { language, classLevel, difficulty, chapterTitle, questionNumber, previousPerformance, previousQuestions, isMcq } = params;
  
  console.log(`[AI] Generating ${isMcq ? 'MCQ' : 'open-ended'} question #${questionNumber} for ${language} - ${difficulty} difficulty`);
  
  const adaptiveContext = previousPerformance 
    ? `\nThe student's previous performance: ${previousPerformance}. Adjust the difficulty accordingly.`
    : '';

  const previousQuestionsContext = previousQuestions && previousQuestions.length > 0
    ? `\n\n⚠️ CRITICAL: DO NOT REPEAT THESE QUESTIONS - Generate a completely NEW and DIFFERENT question:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  if (isMcq) {
    return generateMcqQuestion({ language, classLevel, difficulty, chapterTitle, questionNumber, adaptiveContext, previousQuestionsContext });
  }

  const prompt = `You are a strict CBSE ${language} teacher for Class ${classLevel} following the official CBSE curriculum.

Generate question #${questionNumber} about "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}${previousQuestionsContext}

CBSE Curriculum Guidelines:
- Follow NCERT textbook patterns for Class ${classLevel}
- Use authentic, curriculum-appropriate vocabulary
- Focus on grammar, vocabulary, sentence formation, or cultural aspects as per CBSE syllabus
- Question types: translation, fill in the blank, sentence formation, or grammar-based

IMPORTANT - Question Format Rules:
1. Write ALL instructions in ENGLISH (not in ${language})
2. Be crystal clear about what the student should do
3. Use this format for translation questions:
   - "Translate the following English sentence into ${language}:"
   - "Translate the following ${language} sentence into English:"
4. Use this format for other questions:
   - "Fill in the blank with the correct ${language} word:"
   - "Complete the sentence in ${language}:"
   - "Choose the correct form of the verb in ${language}:"
5. Make it obvious what language the student should answer in

Example GOOD questions:
- "Translate the following English sentence into French: 'I am going to school.'"
- "Fill in the blank with the correct German article: ___ Haus (the house)"
- "Complete this Spanish sentence: 'Mi nombre ___' (My name is)"

Example BAD questions (NEVER do this):
- "Übersetzen Sie ins Deutsche: 'Hello'" (confusing - mixes German instruction with English)
- "Traduisez: 'Good morning'" (unclear what language to translate to)

Return your response in this exact JSON format:
{
  "question": "<the question with CLEAR ENGLISH instructions>",
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

async function generateMcqQuestion(params: {
  language: string;
  classLevel: number;
  difficulty: string;
  chapterTitle: string;
  questionNumber: number;
  adaptiveContext: string;
  previousQuestionsContext: string;
}): Promise<{
  question: string;
  correctAnswer: string;
  questionType: string;
  options: string[];
  correctOption: string;
  explanation: string;
}> {
  const { language, classLevel, difficulty, chapterTitle, adaptiveContext, previousQuestionsContext } = params;

  const prompt = `You are a strict CBSE ${language} teacher for Class ${classLevel} following the official CBSE curriculum.

Generate a multiple choice question (MCQ) about "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}${previousQuestionsContext}

CBSE MCQ Guidelines:
- Follow NCERT textbook patterns for Class ${classLevel}
- Use authentic, curriculum-appropriate vocabulary
- Focus on grammar, vocabulary, comprehension, or cultural aspects
- Create 4 distinct options (A, B, C, D) with only ONE correct answer
- Make distractors (wrong answers) plausible but clearly incorrect
- Options should be of similar length and complexity

IMPORTANT - MCQ Format Rules:
1. Write ALL instructions in ENGLISH (not in ${language})
2. Question should test a specific concept clearly
3. All 4 options must be distinct and well-formatted
4. Provide a clear explanation of why the correct answer is right

Example GOOD MCQ:
Question: "Which article is correct in French: ___ maison (the house)?"
Options: ["A. un", "B. une", "C. la", "D. le"]
Correct: "C"
Explanation: "'La' is the correct feminine definite article for 'maison', which is a feminine noun in French."

Return your response in this exact JSON format:
{
  "question": "<the MCQ question with CLEAR ENGLISH instructions>",
  "options": ["A. <option 1>", "B. <option 2>", "C. <option 3>", "D. <option 4>"],
  "correctOption": "<A, B, C, or D>",
  "correctAnswer": "<the full text of the correct answer>",
  "explanation": "<brief explanation why this answer is correct>",
  "questionType": "mcq"
}

Make the question challenging but fair for Class ${classLevel} CBSE level with clear, distinct options.`;

  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 800,
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("AI returned empty response");
    }
    
    const result = JSON.parse(content);
    console.log(`[AI] MCQ generated in ${elapsed}s: ${result.question.substring(0, 50)}...`);
    
    // Validate MCQ response
    if (!Array.isArray(result.options) || result.options.length !== 4) {
      console.error("[AI ERROR] MCQ must have exactly 4 options, got:", result.options?.length);
      throw new Error("Invalid MCQ format: must have 4 options");
    }
    
    if (!["A", "B", "C", "D"].includes(result.correctOption)) {
      console.error("[AI ERROR] Invalid correctOption:", result.correctOption);
      throw new Error("Invalid MCQ format: correctOption must be A, B, C, or D");
    }
    
    if (!result.explanation || result.explanation.trim().length === 0) {
      console.error("[AI ERROR] MCQ missing explanation");
      result.explanation = "No explanation provided";
    }
    
    return {
      question: result.question || "Error generating question",
      options: result.options,
      correctOption: result.correctOption,
      correctAnswer: result.correctAnswer || result.options[0] || "N/A",
      explanation: result.explanation,
      questionType: "mcq",
    };
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to generate MCQ:`, error.message || error);
    throw new Error(`Failed to generate MCQ: ${error.message || "Unknown error"}`);
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
