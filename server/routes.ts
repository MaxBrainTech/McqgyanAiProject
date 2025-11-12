import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestion, evaluateAnswer } from "./openai";

// Comprehensive chapter mappings for all languages (CBSE Curriculum)
const CHAPTERS: Record<string, Array<{ id: number; title: string; description: string }>> = {
  french: [
    { id: 1, title: "Les Salutations", description: "Greetings and introductions" },
    { id: 2, title: "La Présentation", description: "Self introduction and personal details" },
    { id: 3, title: "Les Nombres", description: "Numbers 1-100" },
    { id: 4, title: "La Famille", description: "Family members and relationships" },
    { id: 5, title: "Les Couleurs", description: "Colors and adjectives" },
    { id: 6, title: "Les Articles", description: "Definite and indefinite articles" },
    { id: 7, title: "Les Verbes", description: "Present tense verbs (être, avoir)" },
    { id: 8, title: "La Nourriture", description: "Food, fruits, and vegetables" },
    { id: 9, title: "Les Vêtements", description: "Clothing and accessories" },
    { id: 10, title: "La Maison", description: "House, rooms, and furniture" },
    { id: 11, title: "L'École", description: "School subjects and activities" },
    { id: 12, title: "Les Animaux", description: "Animals and pets" },
    { id: 13, title: "Le Temps", description: "Weather and seasons" },
    { id: 14, title: "Les Jours et Mois", description: "Days, months, and dates" },
    { id: 15, title: "L'Heure", description: "Telling time" },
    { id: 16, title: "Les Loisirs", description: "Hobbies and leisure activities" },
    { id: 17, title: "Le Corps", description: "Body parts and health" },
    { id: 18, title: "La Ville", description: "City, places, and directions" },
    { id: 19, title: "Les Transports", description: "Transportation and travel" },
    { id: 20, title: "Le Passé Composé", description: "Past tense formation" },
    { id: 21, title: "Le Futur", description: "Future tense" },
    { id: 22, title: "Les Pronoms", description: "Personal and possessive pronouns" },
    { id: 23, title: "Les Prépositions", description: "Prepositions of place and time" },
    { id: 24, title: "La Négation", description: "Negative sentences" },
    { id: 25, title: "Les Questions", description: "Question formation and interrogatives" },
  ],
  german: [
    { id: 1, title: "Begrüßungen", description: "Greetings and farewells" },
    { id: 2, title: "Vorstellung", description: "Self introduction and details" },
    { id: 3, title: "Zahlen", description: "Numbers 1-100" },
    { id: 4, title: "Familie", description: "Family members and relationships" },
    { id: 5, title: "Farben", description: "Colors and descriptions" },
    { id: 6, title: "Artikel", description: "Der, die, das articles" },
    { id: 7, title: "Verben", description: "Present tense verbs (sein, haben)" },
    { id: 8, title: "Essen und Trinken", description: "Food and beverages" },
    { id: 9, title: "Kleidung", description: "Clothing and accessories" },
    { id: 10, title: "Das Haus", description: "House, rooms, and furniture" },
    { id: 11, title: "Die Schule", description: "School subjects and activities" },
    { id: 12, title: "Tiere", description: "Animals and pets" },
    { id: 13, title: "Das Wetter", description: "Weather and seasons" },
    { id: 14, title: "Tage und Monate", description: "Days, months, and dates" },
    { id: 15, title: "Die Uhrzeit", description: "Telling time" },
    { id: 16, title: "Hobbys", description: "Hobbies and free time" },
    { id: 17, title: "Der Körper", description: "Body parts and health" },
    { id: 18, title: "Die Stadt", description: "City, places, and directions" },
    { id: 19, title: "Verkehrsmittel", description: "Transportation modes" },
    { id: 20, title: "Perfekt", description: "Perfect tense formation" },
    { id: 21, title: "Futur", description: "Future tense" },
    { id: 22, title: "Pronomen", description: "Personal and possessive pronouns" },
    { id: 23, title: "Präpositionen", description: "Prepositions (Akkusativ/Dativ)" },
    { id: 24, title: "Negation", description: "Negative sentences (nicht, kein)" },
    { id: 25, title: "Fragen", description: "Question words and formation" },
  ],
  spanish: [
    { id: 1, title: "Saludos", description: "Greetings and introductions" },
    { id: 2, title: "Presentación", description: "Self introduction and personal info" },
    { id: 3, title: "Números", description: "Numbers 1-100" },
    { id: 4, title: "La Familia", description: "Family members and relationships" },
    { id: 5, title: "Colores", description: "Colors and adjectives" },
    { id: 6, title: "Artículos", description: "Definite and indefinite articles" },
    { id: 7, title: "Verbos", description: "Present tense verbs (ser, estar, tener)" },
    { id: 8, title: "Comida", description: "Food, fruits, and vegetables" },
    { id: 9, title: "Ropa", description: "Clothing and accessories" },
    { id: 10, title: "La Casa", description: "House, rooms, and furniture" },
    { id: 11, title: "La Escuela", description: "School subjects and activities" },
    { id: 12, title: "Animales", description: "Animals and pets" },
    { id: 13, title: "El Tiempo", description: "Weather and seasons" },
    { id: 14, title: "Días y Meses", description: "Days, months, and dates" },
    { id: 15, title: "La Hora", description: "Telling time" },
    { id: 16, title: "Pasatiempos", description: "Hobbies and leisure activities" },
    { id: 17, title: "El Cuerpo", description: "Body parts and health" },
    { id: 18, title: "La Ciudad", description: "City, places, and directions" },
    { id: 19, title: "Transporte", description: "Transportation and travel" },
    { id: 20, title: "Pretérito", description: "Past tense (preterite)" },
    { id: 21, title: "Futuro", description: "Future tense" },
    { id: 22, title: "Pronombres", description: "Personal and possessive pronouns" },
    { id: 23, title: "Preposiciones", description: "Prepositions of place and time" },
    { id: 24, title: "Negación", description: "Negative sentences" },
    { id: 25, title: "Preguntas", description: "Question words and formation" },
  ],
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get chapters for a language
  app.get("/api/chapters/:language", (req, res) => {
    const { language } = req.params;
    const chapters = CHAPTERS[language.toLowerCase()] || [];
    res.json(chapters);
  });

  // Start a new test session
  app.post("/api/test/start", async (req, res) => {
    try {
      const { language, class: classLevel, difficulty, chapter, testLength } = req.body;
      
      const session = await storage.createTestSession({
        language,
        classLevel,
        difficulty,
        chapter,
        testLength: testLength || 10,
        currentQuestion: 0,
        totalScore: 0,
        correctAnswers: 0,
        conversationHistory: "[]",
      });

      res.json(session);
    } catch (error) {
      console.error("Error starting test:", error);
      res.status(500).json({ error: "Failed to start test" });
    }
  });

  // Generate next question
  app.post("/api/test/:sessionId/question", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getTestSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const chapters = CHAPTERS[session.language.toLowerCase()] || [];
      const chapter = chapters.find(c => c.id === session.chapter);
      
      if (!chapter) {
        return res.status(400).json({ error: "Invalid chapter" });
      }

      // Determine adaptive context based on previous performance
      const history = JSON.parse(session.conversationHistory || "[]");
      let previousPerformance = "";
      
      if (history.length > 0) {
        const recentScores = history.slice(-3).map((h: any) => h.score);
        const avgScore = recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length;
        
        if (avgScore >= 8) {
          previousPerformance = "The student is performing excellently. Increase difficulty slightly.";
        } else if (avgScore <= 4) {
          previousPerformance = "The student is finding it challenging. Make the next question slightly easier.";
        }
      }

      const questionData = await generateQuestion({
        language: session.language,
        classLevel: session.classLevel,
        difficulty: session.difficulty,
        chapter: session.chapter,
        chapterTitle: chapter.title,
        questionNumber: session.currentQuestion + 1,
        previousPerformance,
      });

      // Store correct answer in session for later evaluation
      history.push({
        questionNumber: session.currentQuestion + 1,
        question: questionData.question,
        correctAnswer: questionData.correctAnswer,
        questionType: questionData.questionType,
      });
      
      await storage.updateTestSession(sessionId, {
        conversationHistory: JSON.stringify(history),
      });

      res.json({ 
        question: questionData.question,
        questionType: questionData.questionType,
        questionNumber: session.currentQuestion + 1,
        totalQuestions: session.testLength,
      });
    } catch (error) {
      console.error("Error generating question:", error);
      res.status(500).json({ error: "Failed to generate question" });
    }
  });

  // Evaluate answer
  app.post("/api/test/:sessionId/evaluate", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answer } = req.body;
      
      const session = await storage.getTestSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Get the current question data from history
      const conversationHistory = JSON.parse(session.conversationHistory || "[]");
      const currentQuestionData = conversationHistory[conversationHistory.length - 1];
      
      if (!currentQuestionData) {
        return res.status(400).json({ error: "No question found for evaluation" });
      }

      const evaluation = await evaluateAnswer({
        question: currentQuestionData.question,
        correctAnswer: currentQuestionData.correctAnswer,
        studentAnswer: answer,
        language: session.language,
        classLevel: session.classLevel,
        difficulty: session.difficulty,
      });

      // Update the last question entry with student's answer and score
      currentQuestionData.studentAnswer = answer;
      currentQuestionData.score = evaluation.score;
      currentQuestionData.isCorrect = evaluation.isCorrect;

      const newTotalScore = session.totalScore + evaluation.score;
      const newCorrectAnswers = session.correctAnswers + (evaluation.isCorrect ? 1 : 0);
      const newCurrentQuestion = session.currentQuestion + 1;

      await storage.updateTestSession(sessionId, {
        currentQuestion: newCurrentQuestion,
        totalScore: newTotalScore,
        correctAnswers: newCorrectAnswers,
        conversationHistory: JSON.stringify(conversationHistory),
      });

      res.json({
        ...evaluation,
        correctAnswer: currentQuestionData.correctAnswer,
        currentQuestion: newCurrentQuestion,
        totalScore: newTotalScore,
        correctAnswers: newCorrectAnswers,
      });
    } catch (error) {
      console.error("Error evaluating answer:", error);
      res.status(500).json({ error: "Failed to evaluate answer" });
    }
  });

  // Get session summary
  app.get("/api/test/:sessionId/summary", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getTestSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({
        totalScore: session.totalScore,
        correctAnswers: session.correctAnswers,
        totalQuestions: session.currentQuestion,
        language: session.language,
      });

      // Clean up session after retrieving summary
      await storage.deleteTestSession(sessionId);
    } catch (error) {
      console.error("Error getting summary:", error);
      res.status(500).json({ error: "Failed to get summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
