import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestion, evaluateAnswer } from "./openai";

// Chapter mappings for all languages
const CHAPTERS: Record<string, Array<{ id: number; title: string; description: string }>> = {
  french: [
    { id: 1, title: "Les Salutations", description: "Greetings and introductions" },
    { id: 2, title: "Les Nombres", description: "Numbers 1-100" },
    { id: 3, title: "La Famille", description: "Family members" },
    { id: 4, title: "Les Couleurs", description: "Colors and adjectives" },
    { id: 5, title: "La Nourriture", description: "Food and dining" },
  ],
  german: [
    { id: 1, title: "Begrüßungen", description: "Greetings and farewells" },
    { id: 2, title: "Zahlen", description: "Numbers 1-100" },
    { id: 3, title: "Familie", description: "Family relationships" },
    { id: 4, title: "Farben", description: "Colors and descriptions" },
    { id: 5, title: "Essen", description: "Food and meals" },
  ],
  spanish: [
    { id: 1, title: "Saludos", description: "Greetings and introductions" },
    { id: 2, title: "Números", description: "Numbers 1-100" },
    { id: 3, title: "La Familia", description: "Family members" },
    { id: 4, title: "Colores", description: "Colors and adjectives" },
    { id: 5, title: "Comida", description: "Food and eating" },
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
