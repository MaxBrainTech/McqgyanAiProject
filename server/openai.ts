import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// CBSE Blueprint Metadata - Defines age-appropriate expectations for each class level
const CBSE_CLASS_GUIDELINES = {
  6: {
    vocabulary: "simple words, basic sentence structures",
    bloomLevel: "Remember, Understand (basic recall and comprehension)",
    cognitiveLevel: "concrete concepts, familiar situations",
    marks: "1-2 marks per question",
    examples: "name, define, identify, list"
  },
  7: {
    vocabulary: "grade-appropriate words, compound sentences",
    bloomLevel: "Understand, Apply (comprehension and simple application)",
    cognitiveLevel: "connecting ideas, basic reasoning",
    marks: "2-3 marks per question",
    examples: "explain, describe, compare, demonstrate"
  },
  8: {
    vocabulary: "intermediate vocabulary, complex sentences",
    bloomLevel: "Apply, Analyze (application and breaking down concepts)",
    cognitiveLevel: "logical reasoning, cause-effect",
    marks: "3-4 marks per question",
    examples: "analyze, classify, examine, differentiate"
  },
  9: {
    vocabulary: "advanced vocabulary, varied sentence structures",
    bloomLevel: "Analyze, Evaluate (critical thinking)",
    cognitiveLevel: "abstract reasoning, critical analysis",
    marks: "3-5 marks per question",
    examples: "evaluate, justify, critique, defend"
  },
  10: {
    vocabulary: "sophisticated vocabulary, complex structures",
    bloomLevel: "Evaluate, Create (higher-order thinking)",
    cognitiveLevel: "synthesis, creative problem-solving",
    marks: "4-5 marks per question",
    examples: "design, formulate, construct, hypothesize"
  }
};

interface QuestionGenerationParams {
  mode?: string;
  language?: string;
  scienceCategory?: string;
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

// Helper function to verify answer correctness independently
async function verifyAnswer(question: string, proposedAnswer: string, mode: string): Promise<{
  isValid: boolean;
  explanation: string;
  alternativeAnswer?: string;
}> {
  const prompt = `You are an independent fact-checker verifying the correctness of an answer.

Question: ${question}
Proposed Correct Answer: ${proposedAnswer}

Your task:
1. Re-solve this question independently without being biased by the proposed answer
2. Determine if the proposed answer is actually correct
3. ${mode === 'science' ? 'For numerical answers, re-calculate step by step. For conceptual answers, verify against standard scientific knowledge.' : 'Verify the linguistic accuracy and completeness.'}
4. If the proposed answer is WRONG or INCOMPLETE, provide the correct answer

Return JSON format:
{
  "isValid": <true if proposed answer is correct, false if wrong>,
  "explanation": "<explain your verification reasoning>",
  "alternativeAnswer": "<if isValid is false, provide the correct answer here>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.warn(`[VERIFY ERROR] Empty response from AI - failing closed`);
      return { isValid: false, explanation: "Verification failed: empty response", alternativeAnswer: "VERIFICATION_FAILED" };
    }

    const result = JSON.parse(content);
    return {
      isValid: result.isValid === true,
      explanation: result.explanation || "No explanation provided",
      alternativeAnswer: result.alternativeAnswer
    };
  } catch (error: any) {
    console.error(`[VERIFY ERROR]`, error.message);
    return { isValid: false, explanation: `Verification error: ${error.message}`, alternativeAnswer: "VERIFICATION_FAILED" };
  }
}

// Helper function to assess question quality
async function assessQuestionQuality(
  question: string,
  classLevel: number,
  difficulty: string,
  mode: string
): Promise<{ score: number; issues: string[] }> {
  const guidelines = CBSE_CLASS_GUIDELINES[classLevel as keyof typeof CBSE_CLASS_GUIDELINES];
  
  const prompt = `You are a CBSE curriculum expert evaluating question quality for Class ${classLevel}.

Question: ${question}
Expected Difficulty: ${difficulty}
Expected Bloom's Level: ${guidelines.bloomLevel}
Expected Vocabulary: ${guidelines.vocabulary}
Expected Cognitive Level: ${guidelines.cognitiveLevel}

Evaluate on these criteria (score 0-10 for each):
1. Age-appropriateness: Is vocabulary suitable for Class ${classLevel}?
2. Curriculum alignment: Does it match CBSE/NCERT patterns?
3. Clarity: Is the question unambiguous and clear?
4. Difficulty match: Does actual difficulty match "${difficulty}"?
5. Bloom's taxonomy: Does it target the right cognitive level?

Return JSON:
{
  "overallScore": <average of 5 criteria, 0-10>,
  "issues": ["<list any problems found>"],
  "recommendation": "<approve or reject>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 400,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return { score: 5, issues: [] };
    }

    const result = JSON.parse(content);
    return {
      score: result.overallScore || 5,
      issues: result.issues || []
    };
  } catch (error: any) {
    console.error(`[QUALITY ERROR]`, error.message);
    return { score: 5, issues: [] };
  }
}

export async function generateQuestion(params: QuestionGenerationParams & { isMcq?: boolean }): Promise<{
  question: string;
  correctAnswer: string;
  questionType: string;
  options?: string[];
  correctOption?: string;
  explanation?: string;
}> {
  const { mode, language, scienceCategory, classLevel, difficulty, chapterTitle, questionNumber, previousPerformance, previousQuestions, isMcq } = params;
  
  console.log(`[generateQuestion] mode=${mode}, language=${language}, scienceCategory=${scienceCategory}, isMcq=${isMcq}`);
  
  // For science mode, use different generation logic
  if (mode === 'science') {
    console.log(`[generateQuestion] Calling generateScienceQuestion with category=${scienceCategory}`);
    return generateScienceQuestion({ scienceCategory, classLevel, difficulty, chapterTitle, questionNumber, previousPerformance, previousQuestions, isMcq });
  }
  
  console.log(`[AI] Generating ${isMcq ? 'MCQ' : 'open-ended'} question #${questionNumber} for ${language} - ${difficulty} difficulty`);
  
  const adaptiveContext = previousPerformance 
    ? `\nThe student's previous performance: ${previousPerformance}. Adjust the difficulty accordingly.`
    : '';

  const previousQuestionsContext = previousQuestions && previousQuestions.length > 0
    ? `\n\n⚠️ CRITICAL: DO NOT REPEAT THESE QUESTIONS - Generate a completely NEW and DIFFERENT question:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  if (isMcq && language) {
    return generateMcqQuestion({ language, classLevel, difficulty, chapterTitle, questionNumber, adaptiveContext, previousQuestionsContext });
  }

  const languageLower = language?.toLowerCase() || "";
  const isIndianLanguage = ['hindi', 'marathi', 'kannada'].includes(languageLower);
  
  // Determine script type and examples based on language
  const scriptInfo = languageLower === 'kannada' 
    ? {
        scriptName: 'Kannada script',
        exampleTranslation: "ನನ್ನ ತಾಯಿ ರುಚಿಕರವಾದ ಆಹಾರವನ್ನು ಬೇಯಿಸುತ್ತಾರೆ।",
        exampleFillBlank: "ಅವನು ___ ಹೋಗುತ್ತಾನೆ।",
        exampleFillBlankAnswer: "ಶಾಲೆಗೆ",
        exampleWord: "ಪುಸ್ತಕ",
        exampleSentence: "ನಾನು ಒಂದು ಪುಸ್ತಕವನ್ನು ಓದುತ್ತಿದ್ದೇನೆ।"
      }
    : {
        scriptName: 'Devanagari script',
        exampleTranslation: "मेरी माँ स्वादिष्ट खाना बनाती है।",
        exampleFillBlank: "वह ___ जाता है।",
        exampleFillBlankAnswer: "स्कूल",
        exampleWord: "किताब",
        exampleSentence: "मैं एक किताब पढ़ रहा हूँ।"
      };
  
  const indianLanguageGuidelines = isIndianLanguage ? `

📝 CRITICAL - ${language} Language Quality Requirements:
1. COMPLETE SENTENCES: Always provide FULL, grammatically correct sentences in ${scriptInfo.scriptName}
2. PROPER SCRIPT: Use ${scriptInfo.scriptName} - NO romanization or mixed scripts
3. NO PLACEHOLDERS: Never use "...", "___", or incomplete phrases in the ${language} text itself
4. CONTEXT: Provide enough context so students understand exactly what is being asked
5. CLARITY: Questions must be self-contained and unambiguous

Example EXCELLENT ${language} questions:
- "Translate the following English sentence into ${language}: 'My mother cooks delicious food.'"
  Correct Answer: "${scriptInfo.exampleTranslation}" (FULL sentence in ${scriptInfo.scriptName})

- "Fill in the blank with the correct ${language} word. Sentence: '${scriptInfo.exampleFillBlank}' (He goes to school.) What word means 'school'?"
  Correct Answer: "${scriptInfo.exampleFillBlankAnswer}" (complete word provided)

- "Write the ${language} word for 'book' and use it in a complete sentence."
  Correct Answer: "${scriptInfo.exampleWord} - ${scriptInfo.exampleSentence}" (word + complete sentence)

Example BAD ${language} questions (NEVER DO THIS):
- "Translate: 'Hello'" (too short, no context)
- "Fill in the blank without English hint" (unclear what to fill)
- "Write the word for..." (incomplete, no clear instruction)

VALIDATION CHECKLIST before responding:
✓ English instructions are complete and crystal clear
✓ Any ${language} text uses proper ${scriptInfo.scriptName}
✓ ${language} content is COMPLETE (no fragments or placeholders)
✓ The correct answer is a FULL, proper ${language} phrase/sentence
✓ A CBSE Class ${classLevel} student can understand and answer this question
` : '';

  const guidelines = CBSE_CLASS_GUIDELINES[classLevel as keyof typeof CBSE_CLASS_GUIDELINES];

  const prompt = `You are a strict CBSE ${language} teacher for Class ${classLevel} following the official CBSE curriculum.

🎯 CBSE CLASS ${classLevel} BLUEPRINT REQUIREMENTS:
- Bloom's Taxonomy Level: ${guidelines.bloomLevel}
- Vocabulary Level: ${guidelines.vocabulary}
- Cognitive Skills: ${guidelines.cognitiveLevel}
- Question Type Examples: ${guidelines.examples}
- Typical Mark Allocation: ${guidelines.marks}

Generate question #${questionNumber} about "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}${previousQuestionsContext}

CBSE Curriculum Guidelines:
- Follow NCERT textbook patterns EXACTLY for Class ${classLevel}
- Use age-appropriate vocabulary (Class ${classLevel} = ages ${classLevel + 10}-${classLevel + 11})
- Focus on grammar, vocabulary, sentence formation, or cultural aspects as per CBSE syllabus
- Question types: translation, fill in the blank, sentence formation, or grammar-based

DIFFICULTY MAPPING FOR CLASS ${classLevel}:
- EASY: Basic recall, simple vocabulary, direct NCERT content
- MEDIUM: Application of concepts, moderate vocabulary, reasoning required
- HARD: Critical thinking, advanced vocabulary, multi-step reasoning

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
6. Provide COMPLETE content - no fragments, no "...", no placeholders${indianLanguageGuidelines}

Example GOOD questions:
- "Translate the following English sentence into French: 'I am going to school.'"
- "Fill in the blank with the correct German article: ___ Haus (the house)"
- "Complete this Spanish sentence: 'Mi nombre ___' (My name is)"

Example BAD questions (NEVER do this):
- "Übersetzen Sie ins Deutsche: 'Hello'" (confusing - mixes German instruction with English)
- "Traduisez: 'Good morning'" (unclear what language to translate to)

Return your response in this exact JSON format:
{
  "question": "<the question with CLEAR ENGLISH instructions and COMPLETE ${language} content - age-appropriate for Class ${classLevel}>",
  "correctAnswer": "<the COMPLETE and FULL correct answer - in ${language} if translating TO ${language}, in English if translating FROM ${language}>",
  "questionType": "translation|grammar|vocabulary|sentence",
  "answerLanguage": "<'${language}' or 'english' - indicates which language the answer should be in>"
}

Make the question challenging but fair for Class ${classLevel} CBSE level (age ${classLevel + 10}-${classLevel + 11}). Ensure all ${language} text is COMPLETE and PROPERLY FORMATTED.`;

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
    
    // Validate question completeness for Indian languages
    if (isIndianLanguage) {
      if (!result.question || result.question.length < 20) {
        throw new Error("Generated question is too short or incomplete");
      }
      if (!result.correctAnswer || result.correctAnswer.length < 2) {
        throw new Error("Generated answer is incomplete or missing");
      }
      // Check for placeholder patterns that suggest incomplete content
      const hasPlaceholders = /\.{3,}|___+|incomplete|TODO/i.test(result.question + result.correctAnswer);
      if (hasPlaceholders) {
        throw new Error("Generated question contains placeholders or incomplete content");
      }
      
      // Validate correct script usage (only if answer should be in the native language)
      const answerLanguage = (result.answerLanguage || '').trim().toLowerCase();
      const shouldBeNativeLanguage = answerLanguage !== 'english';
      
      if (shouldBeNativeLanguage) {
        const devanagariRegex = /[\u0900-\u097F]/;  // Devanagari Unicode range
        const kannadaRegex = /[\u0C80-\u0CFF]/;     // Kannada Unicode range
        
        if (languageLower === 'kannada') {
          if (!kannadaRegex.test(result.correctAnswer)) {
            throw new Error("Answer must contain Kannada script characters, not romanized text");
          }
        } else if (languageLower === 'hindi' || languageLower === 'marathi') {
          if (!devanagariRegex.test(result.correctAnswer)) {
            throw new Error("Answer must contain Devanagari script characters, not romanized text");
          }
        }
      }
    }
    
    // STEP 1: Verify answer correctness for open-ended language questions
    console.log(`[AI] Verifying answer correctness for ${language} open-ended question...`);
    const verification = await verifyAnswer(
      result.question,
      result.correctAnswer,
      'language'
    );
    
    let verifiedAnswer = result.correctAnswer;
    if (!verification.isValid) {
      if (verification.alternativeAnswer && verification.alternativeAnswer !== "VERIFICATION_FAILED") {
        console.warn(`[AI WARNING] Answer verification failed! Original: "${result.correctAnswer}" | Corrected: "${verification.alternativeAnswer}"`);
        console.warn(`[AI WARNING] Reason: ${verification.explanation}`);
        verifiedAnswer = verification.alternativeAnswer;
      } else {
        console.error(`[AI ERROR] Answer verification failed with no alternative: ${verification.explanation}`);
        throw new Error(`Answer verification failed: ${verification.explanation}`);
      }
    } else {
      console.log(`[AI] ✓ Answer verified as correct`);
    }
    
    // STEP 2: Assess question quality
    console.log(`[AI] Assessing ${language} open-ended question quality...`);
    const quality = await assessQuestionQuality(
      result.question,
      classLevel,
      difficulty,
      'language'
    );
    
    console.log(`[AI] Quality Score: ${quality.score}/10`);
    if (quality.issues.length > 0) {
      console.log(`[AI] Quality Issues: ${quality.issues.join(', ')}`);
    }
    
    if (quality.score < 6) {
      console.warn(`[AI WARNING] Question quality below threshold (${quality.score}/10). Consider manual review.`);
    }
    
    // Only return verified data
    return {
      question: result.question || "Error generating question",
      correctAnswer: verifiedAnswer || "N/A",
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

  const languageLower = language?.toLowerCase() || "";
  const isIndianLanguage = ['hindi', 'marathi', 'kannada'].includes(languageLower);
  
  // Determine script type and MCQ examples based on language
  const mcqScriptInfo = languageLower === 'kannada'
    ? {
        scriptName: 'Kannada script',
        exampleOptions1: ["A. ನೀರು", "B. ಹಾಲು", "C. ರೊಟ್ಟಿ", "D. ಚಹಾ"],
        exampleAnswer1: "ನೀರು",
        exampleExplanation1: "ನೀರು means water in Kannada. ಹಾಲು means milk, ರೊಟ್ಟಿ means bread, and ಚಹಾ means tea.",
        exampleOptions2: ["A. ಶುಭ ರಾತ್ರಿ", "B. ನಮಸ್ಕಾರ", "C. ಶುಭೋದಯ", "D. ಧನ್ಯವಾದ"],
        exampleExplanation2: "ಶುಭೋದಯ means Good morning in Kannada."
      }
    : {
        scriptName: 'Devanagari script',
        exampleOptions1: ["A. पानी", "B. दूध", "C. रोटी", "D. चाय"],
        exampleAnswer1: "पानी",
        exampleExplanation1: "पानी means water. दूध means milk, रोटी means bread, and चाय means tea.",
        exampleOptions2: ["A. शुभ रात्रि", "B. नमस्ते", "C. सुप्रभात", "D. धन्यवाद"],
        exampleExplanation2: "सुप्रभात means Good morning."
      };
  
  const indianLanguageMcqGuidelines = isIndianLanguage ? `

📝 CRITICAL - ${language} MCQ Quality Requirements:
1. COMPLETE OPTIONS: All 4 options must be COMPLETE, grammatically correct ${language} words/phrases in ${mcqScriptInfo.scriptName}
2. PROPER SCRIPT: Use ${mcqScriptInfo.scriptName} - NO romanization in options
3. CLEAR CONTEXT: Provide full context in English so students understand what is being tested
4. NO PLACEHOLDERS: Options must be real, complete ${language} content (not "...", "option 1", etc.)

Example EXCELLENT ${language} MCQ:
Question: "What is the correct ${language} word for 'water'?"
Options: ${JSON.stringify(mcqScriptInfo.exampleOptions1)}
Correct: "A"
Explanation: "${mcqScriptInfo.exampleExplanation1}"

Example EXCELLENT translation MCQ:
Question: "How do you say 'Good morning' in ${language}?"
Options: ${JSON.stringify(mcqScriptInfo.exampleOptions2)}
Correct: "C"
Explanation: "${mcqScriptInfo.exampleExplanation2}"
` : '';

  const guidelines = CBSE_CLASS_GUIDELINES[classLevel as keyof typeof CBSE_CLASS_GUIDELINES];

  const prompt = `You are a strict CBSE ${language} teacher for Class ${classLevel} following the official CBSE curriculum.

🎯 CBSE CLASS ${classLevel} BLUEPRINT REQUIREMENTS:
- Bloom's Taxonomy Level: ${guidelines.bloomLevel}
- Vocabulary Level: ${guidelines.vocabulary}
- Cognitive Skills: ${guidelines.cognitiveLevel}
- Question Type Examples: ${guidelines.examples}
- Typical Mark Allocation: ${guidelines.marks}

Generate a multiple choice question (MCQ) about "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}${previousQuestionsContext}

CBSE MCQ Guidelines:
- Follow NCERT textbook patterns EXACTLY for Class ${classLevel}
- Use authentic, age-appropriate vocabulary (avoid overly complex terms for younger classes)
- Focus on grammar, vocabulary, comprehension, or cultural aspects
- Create 4 distinct options (A, B, C, D) with only ONE correct answer
- Make distractors (wrong answers) plausible but clearly incorrect
- Options should be of similar length and complexity
- Ensure questions match the student's age (Class ${classLevel} = ages ${classLevel + 10}-${classLevel + 11})

DIFFICULTY MAPPING FOR CLASS ${classLevel}:
- EASY: Basic recall, simple vocabulary, direct NCERT content
- MEDIUM: Application of concepts, moderate vocabulary, reasoning required
- HARD: Critical thinking, advanced vocabulary, multi-step reasoning

IMPORTANT - MCQ Format Rules:
1. Write ALL instructions in ENGLISH (not in ${language})
2. Question should test ONE specific concept clearly
3. All 4 options must be COMPLETE, distinct, and well-formatted in proper script
4. Provide a detailed explanation of why the correct answer is right
5. Use age-appropriate examples and contexts${indianLanguageMcqGuidelines}

Example GOOD MCQ (French - Class 8):
Question: "Which article is correct in French: ___ maison (the house)?"
Options: ["A. un", "B. une", "C. la", "D. le"]
Correct: "C"
Explanation: "'La' is the correct feminine definite article for 'maison', which is a feminine noun in French. 'Un' and 'une' are indefinite articles, and 'le' is masculine."

Return your response in this exact JSON format:
{
  "question": "<the MCQ question with CLEAR ENGLISH instructions - age-appropriate for Class ${classLevel}>",
  "options": ["A. <complete option 1>", "B. <complete option 2>", "C. <complete option 3>", "D. <complete option 4>"],
  "correctOption": "<A, B, C, or D>",
  "correctAnswer": "<the full text of the correct answer>",
  "explanation": "<detailed explanation why this answer is correct>",
  "questionType": "mcq"
}

Make the question challenging but fair for Class ${classLevel} CBSE level (age ${classLevel + 10}-${classLevel + 11}) with clear, COMPLETE, distinct options in proper script.`;

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
    
    // Additional validation for Indian languages
    if (isIndianLanguage) {
      // Check that all options have meaningful content (not just "A. ", "B. ", etc.)
      const hasIncompleteOptions = result.options.some((opt: string) => {
        const content = opt.replace(/^[A-D]\.\s*/, '').trim();
        return content.length < 2; // Option content too short
      });
      
      if (hasIncompleteOptions) {
        throw new Error("MCQ options are incomplete or missing content");
      }
      
      // Check question completeness
      if (!result.question || result.question.length < 20) {
        throw new Error("MCQ question is too short or incomplete");
      }
      
      // Validate correct script usage in options
      const devanagariRegex = /[\u0900-\u097F]/;  // Devanagari Unicode range
      const kannadaRegex = /[\u0C80-\u0CFF]/;     // Kannada Unicode range
      
      // Check if at least one option contains the correct script
      const optionsText = result.options.join(' ');
      if (languageLower === 'kannada') {
        if (!kannadaRegex.test(optionsText)) {
          throw new Error("MCQ options must contain Kannada script characters");
        }
      } else if (languageLower === 'hindi' || languageLower === 'marathi') {
        if (!devanagariRegex.test(optionsText)) {
          throw new Error("MCQ options must contain Devanagari script characters");
        }
      }
    }
    
    // STEP 1: Verify answer correctness for language questions
    console.log(`[AI] Verifying answer correctness for ${language} MCQ...`);
    const verification = await verifyAnswer(
      result.question,
      result.correctAnswer,
      'language'
    );
    
    let verifiedAnswer = result.correctAnswer;
    let verifiedExplanation = result.explanation;
    let verifiedOption = result.correctOption;
    
    if (!verification.isValid) {
      if (verification.alternativeAnswer && verification.alternativeAnswer !== "VERIFICATION_FAILED") {
        console.warn(`[AI WARNING] MCQ answer verification failed! Original: "${result.correctAnswer}" | Corrected: "${verification.alternativeAnswer}"`);
        console.warn(`[AI WARNING] Reason: ${verification.explanation}`);
        
        // Try to find which option matches the corrected answer
        const matchingOptionIndex = result.options.findIndex((opt: string) => 
          opt.toLowerCase().includes(verification.alternativeAnswer!.toLowerCase()) ||
          verification.alternativeAnswer!.toLowerCase().includes(opt.replace(/^[A-D]\.\s*/, '').trim().toLowerCase())
        );
        
        if (matchingOptionIndex >= 0) {
          verifiedOption = String.fromCharCode(65 + matchingOptionIndex); // 65 is 'A'
          verifiedAnswer = verification.alternativeAnswer;
          verifiedExplanation = `${result.explanation}\n\n[Verified: ${verification.explanation}]`;
          console.warn(`[AI WARNING] Updated correctOption from "${result.correctOption}" to "${verifiedOption}"`);
        } else {
          console.error(`[AI ERROR] Corrected answer "${verification.alternativeAnswer}" does not match any option`);
          throw new Error(`MCQ verification failed: corrected answer not in options`);
        }
      } else {
        console.error(`[AI ERROR] MCQ answer verification failed with no alternative: ${verification.explanation}`);
        throw new Error(`MCQ answer verification failed: ${verification.explanation}`);
      }
    } else {
      console.log(`[AI] ✓ Answer verified as correct: ${verification.explanation.substring(0, 50)}...`);
    }
    
    // STEP 2: Assess question quality
    console.log(`[AI] Assessing ${language} MCQ quality...`);
    const quality = await assessQuestionQuality(
      result.question,
      classLevel,
      difficulty,
      'language'
    );
    
    console.log(`[AI] Quality Score: ${quality.score}/10`);
    if (quality.issues.length > 0) {
      console.log(`[AI] Quality Issues: ${quality.issues.join(', ')}`);
    }
    
    if (quality.score < 6) {
      console.warn(`[AI WARNING] Question quality below threshold (${quality.score}/10).`);
    }
    
    // Only return verified data
    return {
      question: result.question || "Error generating question",
      options: result.options,
      correctOption: verifiedOption,
      correctAnswer: verifiedAnswer || result.options[0] || "N/A",
      explanation: verifiedExplanation,
      questionType: "mcq",
    };
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to generate MCQ:`, error.message || error);
    throw new Error(`Failed to generate MCQ: ${error.message || "Unknown error"}`);
  }
}

async function generateScienceQuestion(params: {
  scienceCategory?: string;
  classLevel: number;
  difficulty: string;
  chapterTitle: string;
  questionNumber: number;
  previousPerformance?: string;
  previousQuestions?: string[];
  isMcq?: boolean;
}): Promise<{
  question: string;
  correctAnswer: string;
  questionType: string;
  options: string[];
  correctOption: string;
  explanation: string;
}> {
  const { scienceCategory, classLevel, difficulty, chapterTitle, questionNumber, previousPerformance, previousQuestions, isMcq } = params;
  
  console.log(`[AI] Generating science MCQ #${questionNumber} for ${scienceCategory} - ${difficulty} difficulty`);
  
  const guidelines = CBSE_CLASS_GUIDELINES[classLevel as keyof typeof CBSE_CLASS_GUIDELINES];
  
  const adaptiveContext = previousPerformance 
    ? `\nStudent's previous performance: ${previousPerformance}. Adjust the difficulty accordingly.`
    : '';

  const previousQuestionsContext = previousQuestions && previousQuestions.length > 0
    ? `\n\n⚠️ CRITICAL: DO NOT REPEAT THESE QUESTIONS - Generate a completely NEW and DIFFERENT question:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  const categoryContext = {
    physics: "Focus on concepts like motion, force, energy, pressure, simple machines, and gravity. Use real-world examples and CBSE-appropriate calculations.",
    chemistry: "Focus on matter, elements, compounds, atoms, acids-bases, chemical reactions, and metals. Use NCERT terminology and examples.",
    biology: "Focus on cells, tissues, life processes, classification, human body systems, reproduction, and heredity. Use CBSE diagram-based questions where appropriate.",
    general: "Focus on natural resources, environment, light, sound, heat, and electricity. Use practical applications and everyday examples."
  };

  const categoryGuidelines = categoryContext[scienceCategory?.toLowerCase() as keyof typeof categoryContext] || "";

  const prompt = `You are a strict CBSE General Science teacher for Class ${classLevel} following the official NCERT curriculum.

🎯 CBSE CLASS ${classLevel} BLUEPRINT REQUIREMENTS:
- Bloom's Taxonomy Level: ${guidelines.bloomLevel}
- Vocabulary Level: ${guidelines.vocabulary}
- Cognitive Skills: ${guidelines.cognitiveLevel}
- Question Type Examples: ${guidelines.examples}
- Typical Mark Allocation: ${guidelines.marks}

Generate a multiple choice question (MCQ) for ${scienceCategory} on topic "${chapterTitle}" at ${difficulty} difficulty level.${adaptiveContext}${previousQuestionsContext}

CBSE Science MCQ Guidelines:
- Follow NCERT textbook patterns and terminology EXACTLY for Class ${classLevel}
- ${categoryGuidelines}
- Create 4 distinct options (A, B, C, D) with only ONE correct answer
- Make distractors (wrong answers) plausible but clearly incorrect
- Options should be of similar length and complexity
- Use scientific terminology appropriate for Class ${classLevel} students (age 11-16)
- Include numerical values with proper SI units where relevant
- Ensure the question tests age-appropriate understanding, not rote memorization

🔬 CRITICAL - SCIENTIFIC ACCURACY REQUIREMENTS:
1. For numerical questions: Show complete calculation steps in explanation
2. For conceptual questions: Base answer on verified scientific principles
3. Double-check all facts against standard NCERT textbooks
4. Ensure units are correct (use SI units: meters, kilograms, seconds, etc.)
5. Verify that the correct option is definitively right and distractors are definitively wrong

MCQ Question Types (choose one appropriate for ${difficulty} level):
1. EASY: Fact-based recall, simple definitions, direct NCERT terminology
2. MEDIUM: Application to familiar scenarios, 1-step calculations, compare-contrast
3. HARD: Multi-step reasoning, unfamiliar applications, analyze cause-effect

IMPORTANT - MCQ Format Rules:
1. Question must be crystal clear and test ONE specific concept
2. All 4 options must be distinct and well-formatted
3. Provide detailed explanation with step-by-step reasoning
4. For calculations: show formula, substitution, and final answer with units
5. Ensure age-appropriate vocabulary for Class ${classLevel} (avoid university-level terms)

Example EXCELLENT Science MCQ (Physics - Class 8):
Question: "A car travels 150 km in 3 hours. What is its average speed?"
Options: ["A. 30 km/h", "B. 45 km/h", "C. 50 km/h", "D. 60 km/h"]
Correct: "C"
Explanation: "Average speed = Total distance ÷ Total time = 150 km ÷ 3 hours = 50 km/h. The formula for average speed is distance divided by time."

Example EXCELLENT Science MCQ (Biology - Class 9):
Question: "Which organelle is known as the powerhouse of the cell?"
Options: ["A. Nucleus", "B. Mitochondria", "C. Ribosome", "D. Chloroplast"]
Correct: "B"
Explanation: "Mitochondria are called the powerhouse of the cell because they produce energy (ATP) through cellular respiration. The nucleus controls cell activities, ribosomes make proteins, and chloroplasts perform photosynthesis in plant cells."

Return your response in this exact JSON format:
{
  "question": "<the question text - clear and age-appropriate>",
  "options": ["A. <option1>", "B. <option2>", "C. <option3>", "D. <option4>"],
  "correctOption": "<A, B, C, or D>",
  "correctAnswer": "<the full text of the correct answer>",
  "explanation": "<detailed step-by-step explanation proving why this answer is correct>",
  "questionType": "mcq"
}

Make the question challenging but fair for Class ${classLevel} CBSE students. Ensure 100% scientific accuracy - you will be fact-checked.`;

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
    console.log(`[AI] Science MCQ generated in ${elapsed}s: ${result.question.substring(0, 50)}...`);
    
    // Validate MCQ format
    if (!Array.isArray(result.options) || result.options.length !== 4) {
      throw new Error("Invalid MCQ format: must have exactly 4 options");
    }
    
    if (!["A", "B", "C", "D"].includes(result.correctOption)) {
      throw new Error("Invalid MCQ format: correctOption must be A, B, C, or D");
    }
    
    if (!result.explanation || result.explanation.trim().length === 0) {
      console.error("[AI ERROR] Science MCQ missing explanation");
      result.explanation = "No explanation provided";
    }
    
    // STEP 1: Verify answer correctness independently
    console.log(`[AI] Verifying answer correctness for science question...`);
    const verification = await verifyAnswer(
      result.question,
      result.correctAnswer,
      'science'
    );
    
    let verifiedAnswer = result.correctAnswer;
    let verifiedExplanation = result.explanation;
    let verifiedOption = result.correctOption;
    
    if (!verification.isValid) {
      if (verification.alternativeAnswer && verification.alternativeAnswer !== "VERIFICATION_FAILED") {
        console.warn(`[AI WARNING] Science answer verification failed! Original: "${result.correctAnswer}" | Corrected: "${verification.alternativeAnswer}"`);
        console.warn(`[AI WARNING] Reason: ${verification.explanation}`);
        
        // Try to find which option matches the corrected answer
        const matchingOptionIndex = result.options.findIndex((opt: string) => 
          opt.toLowerCase().includes(verification.alternativeAnswer!.toLowerCase()) ||
          verification.alternativeAnswer!.toLowerCase().includes(opt.replace(/^[A-D]\.\s*/, '').trim().toLowerCase())
        );
        
        if (matchingOptionIndex >= 0) {
          verifiedOption = String.fromCharCode(65 + matchingOptionIndex); // 65 is 'A'
          verifiedAnswer = verification.alternativeAnswer;
          verifiedExplanation = `${result.explanation}\n\n[Verified Answer: ${verification.explanation}]`;
          console.warn(`[AI WARNING] Updated correctOption from "${result.correctOption}" to "${verifiedOption}"`);
        } else {
          console.error(`[AI ERROR] Corrected answer "${verification.alternativeAnswer}" does not match any option`);
          throw new Error(`Science MCQ verification failed: corrected answer not in options`);
        }
      } else {
        console.error(`[AI ERROR] Science answer verification failed with no alternative: ${verification.explanation}`);
        throw new Error(`Science answer verification failed: ${verification.explanation}`);
      }
    } else {
      console.log(`[AI] ✓ Answer verified as correct: ${verification.explanation}`);
    }
    
    // STEP 2: Assess question quality
    console.log(`[AI] Assessing question quality...`);
    const quality = await assessQuestionQuality(
      result.question,
      classLevel,
      difficulty,
      'science'
    );
    
    console.log(`[AI] Quality Score: ${quality.score}/10`);
    if (quality.issues.length > 0) {
      console.log(`[AI] Quality Issues: ${quality.issues.join(', ')}`);
    }
    
    // If quality is too low, log warning but still return (to avoid infinite loops)
    if (quality.score < 6) {
      console.warn(`[AI WARNING] Question quality below threshold (${quality.score}/10). Consider regeneration.`);
    }
    
    // Only return verified data
    return {
      question: result.question || "Error generating question",
      options: result.options,
      correctOption: verifiedOption,
      correctAnswer: verifiedAnswer || result.options[0] || "N/A",
      explanation: verifiedExplanation,
      questionType: "mcq",
    };
  } catch (error: any) {
    console.error(`[AI ERROR] Failed to generate science MCQ:`, error.message || error);
    throw new Error(`Failed to generate science MCQ: ${error.message || "Unknown error"}`);
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
