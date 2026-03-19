import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  generateQuestion,
  evaluateAnswer,
  improveQuestion,
  getEmbedding,
  cosineSimilarity,
  verifyAnswer,
} from "./openai";
import { generateFromHF } from "./services/huggingface";
// import type {  Request, Response } from "express";

import express, { Router, Request, Response } from "express";

import { saveMCQ } from "./services/mcq.service";

import { generateEvaluationPDF } from "./answerSheetEvaluator";

// import { Request, Response } from "express";

const router = Router();

import pool from "./db";
import bcrypt from "bcrypt";
import { openai } from "./openai";

console.log("ROUTES FILE LOADED");

// router.post("/api/teacher/login", async (req: Request, res: Response) => {
//   const { username, password } = req.body;

//   try {
//     const result = await pool.query(
//       "SELECT * FROM teachers WHERE username = $1",
//       [username]
//     );

//     if (result.rows.length === 0) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     const teacher = result.rows[0];

//     // 🔥 IMPORTANT LINE
//     const isMatch = await bcrypt.compare(password, teacher.password);

//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     res.status(200).json(teacher);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

export default router;

// // 🔧 Auto-adjust numQuestions based on topics
// const MAX_QUESTIONS_PER_TOPIC = 3;
// const maxPossibleQuestions = topics.length * MAX_QUESTIONS_PER_TOPIC;

// if (numQuestions > maxPossibleQuestions) {
//   console.warn(
//     `[STUDENT CUSTOM TEST] Reducing questions from ${numQuestions} to ${maxPossibleQuestions}`
//   );
//   numQuestions = maxPossibleQuestions;
// }

// Comprehensive chapter mappings for all languages (CBSE Curriculum)
// const CHAPTERS: Record<string, Array<{ id: number; title: string; description: string }>> = {

interface LocalizedText {
  english: string;
  hindi: string;
}

interface Chapter {
  id: number;
  title: LocalizedText;
  description: LocalizedText;
}
const CHAPTERS: Record<
  string,
  Array<{
    id: number;
    title: { english: string; hindi: string };
    description: { english: string; hindi: string };
  }>
> = {
  // french: [
  //   { id: 1, title: "Les Salutations", description: "Greetings and introductions" },
  //   { id: 2, title: "La Présentation", description: "Self introduction and personal details" },
  //   { id: 3, title: "Les Nombres", description: "Numbers 1-100" },
  //   { id: 4, title: "La Famille", description: "Family members and relationships" },
  //   { id: 5, title: "Les Couleurs", description: "Colors and adjectives" },
  //   { id: 6, title: "Les Articles", description: "Definite and indefinite articles" },
  //   { id: 7, title: "Les Verbes", description: "Present tense verbs (être, avoir)" },
  //   { id: 8, title: "La Nourriture", description: "Food, fruits, and vegetables" },
  //   { id: 9, title: "Les Vêtements", description: "Clothing and accessories" },
  //   { id: 10, title: "La Maison", description: "House, rooms, and furniture" },
  //   { id: 11, title: "L'École", description: "School subjects and activities" },
  //   { id: 12, title: "Les Animaux", description: "Animals and pets" },
  //   { id: 13, title: "Le Temps", description: "Weather and seasons" },
  //   { id: 14, title: "Les Jours et Mois", description: "Days, months, and dates" },
  //   { id: 15, title: "L'Heure", description: "Telling time" },
  //   { id: 16, title: "Les Loisirs", description: "Hobbies and leisure activities" },
  //   { id: 17, title: "Le Corps", description: "Body parts and health" },
  //   { id: 18, title: "La Ville", description: "City, places, and directions" },
  //   { id: 19, title: "Les Transports", description: "Transportation and travel" },
  //   { id: 20, title: "Le Passé Composé", description: "Past tense formation" },
  //   { id: 21, title: "Le Futur", description: "Future tense" },
  //   { id: 22, title: "Les Pronoms", description: "Personal and possessive pronouns" },
  //   { id: 23, title: "Les Prépositions", description: "Prepositions of place and time" },
  //   { id: 24, title: "La Négation", description: "Negative sentences" },
  //   { id: 25, title: "Les Questions", description: "Question formation and interrogatives" },
  // ],

  french: [
    {
      id: 1,
      title: { english: "Les Salutations", hindi: "अभिवादन" },
      description: {
        english: "Greetings and introductions",
        hindi: "अभिवादन और परिचय",
      },
    },
    {
      id: 2,
      title: { english: "La Présentation", hindi: "परिचय" },
      description: {
        english: "Self introduction and personal details",
        hindi: "स्व-परिचय और व्यक्तिगत विवरण",
      },
    },
    {
      id: 3,
      title: { english: "Les Nombres", hindi: "संख्याएँ" },
      description: { english: "Numbers 1-100", hindi: "१-१०० तक की संख्याएँ" },
    },
    {
      id: 4,
      title: { english: "La Famille", hindi: "परिवार" },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और रिश्ते",
      },
    },
    {
      id: 5,
      title: { english: "Les Couleurs", hindi: "रंग" },
      description: { english: "Colors and adjectives", hindi: "रंग और विशेषण" },
    },
    {
      id: 6,
      title: { english: "Les Articles", hindi: "लेख (आर्टिकल्स)" },
      description: {
        english: "Definite and indefinite articles",
        hindi: "निश्चित और अनिश्चित लेख",
      },
    },
    {
      id: 7,
      title: { english: "Les Verbes", hindi: "क्रियाएँ" },
      description: {
        english: "Present tense verbs (être, avoir)",
        hindi: "वर्तमान काल की क्रियाएँ (être, avoir)",
      },
    },
    {
      id: 8,
      title: { english: "La Nourriture", hindi: "भोजन" },
      description: {
        english: "Food, fruits, and vegetables",
        hindi: "भोजन, फल और सब्जियाँ",
      },
    },
    {
      id: 9,
      title: { english: "Les Vêtements", hindi: "कपड़े" },
      description: {
        english: "Clothing and accessories",
        hindi: "कपड़े और सहायक वस्तुएँ",
      },
    },
    {
      id: 10,
      title: { english: "La Maison", hindi: "घर" },
      description: {
        english: "House, rooms, and furniture",
        hindi: "घर, कमरे और फर्नीचर",
      },
    },
    {
      id: 11,
      title: { english: "L'École", hindi: "विद्यालय" },
      description: {
        english: "School subjects and activities",
        hindi: "विद्यालय विषय और गतिविधियाँ",
      },
    },
    {
      id: 12,
      title: { english: "Les Animaux", hindi: "पशु-पक्षी" },
      description: { english: "Animals and pets", hindi: "जानवर और पालतू पशु" },
    },
    {
      id: 13,
      title: { english: "Le Temps", hindi: "मौसम" },
      description: { english: "Weather and seasons", hindi: "मौसम और ऋतुएँ" },
    },
    {
      id: 14,
      title: { english: "Les Jours et Mois", hindi: "दिन और महीने" },
      description: {
        english: "Days, months, and dates",
        hindi: "दिन, महीने और तिथियाँ",
      },
    },
    {
      id: 15,
      title: { english: "L'Heure", hindi: "समय" },
      description: { english: "Telling time", hindi: "समय बताना" },
    },
    {
      id: 16,
      title: { english: "Les Loisirs", hindi: "शौक" },
      description: {
        english: "Hobbies and leisure activities",
        hindi: "शौक और अवकाश गतिविधियाँ",
      },
    },
    {
      id: 17,
      title: { english: "Le Corps", hindi: "शरीर के अंग" },
      description: {
        english: "Body parts and health",
        hindi: "शरीर के अंग और स्वास्थ्य",
      },
    },
    {
      id: 18,
      title: { english: "La Ville", hindi: "शहर" },
      description: {
        english: "City, places, and directions",
        hindi: "शहर, स्थान और दिशाएँ",
      },
    },
    {
      id: 19,
      title: { english: "Les Transports", hindi: "परिवहन" },
      description: {
        english: "Transportation and travel",
        hindi: "यातायात और यात्रा",
      },
    },
    {
      id: 20,
      title: { english: "Le Passé Composé", hindi: "भूतकाल (पासे कॉम्पोज़े)" },
      description: {
        english: "Past tense formation",
        hindi: "भूतकाल का निर्माण (Passé Composé)",
      },
    },
    {
      id: 21,
      title: { english: "Le Futur", hindi: "भविष्यकाल" },
      description: { english: "Future tense", hindi: "भविष्यकाल" },
    },
    {
      id: 22,
      title: { english: "Les Pronoms", hindi: "सर्वनाम" },
      description: {
        english: "Personal and possessive pronouns",
        hindi: "व्यक्तिवाचक और अधिकारवाचक सर्वनाम",
      },
    },
    {
      id: 23,
      title: { english: "Les Prépositions", hindi: "पूर्वसर्ग" },
      description: {
        english: "Prepositions of place and time",
        hindi: "स्थान और समय के पूर्वसर्ग",
      },
    },
    {
      id: 24,
      title: { english: "La Négation", hindi: "नकारात्मक वाक्य" },
      description: { english: "Negative sentences", hindi: "नकारात्मक वाक्य" },
    },
    {
      id: 25,
      title: { english: "Les Questions", hindi: "प्रश्नवाचक वाक्य" },
      description: {
        english: "Question formation and interrogatives",
        hindi: "प्रश्न निर्माण और प्रश्नवाचक शब्द",
      },
    },
  ],
  // german: [
  //   { id: 1, title: "Begrüßungen", description: "Greetings and farewells" },
  //   { id: 2, title: "Vorstellung", description: "Self introduction and details" },
  //   { id: 3, title: "Zahlen", description: "Numbers 1-100" },
  //   { id: 4, title: "Familie", description: "Family members and relationships" },
  //   { id: 5, title: "Farben", description: "Colors and descriptions" },
  //   { id: 6, title: "Artikel", description: "Der, die, das articles" },
  //   { id: 7, title: "Verben", description: "Present tense verbs (sein, haben)" },
  //   { id: 8, title: "Essen und Trinken", description: "Food and beverages" },
  //   { id: 9, title: "Kleidung", description: "Clothing and accessories" },
  //   { id: 10, title: "Das Haus", description: "House, rooms, and furniture" },
  //   { id: 11, title: "Die Schule", description: "School subjects and activities" },
  //   { id: 12, title: "Tiere", description: "Animals and pets" },
  //   { id: 13, title: "Das Wetter", description: "Weather and seasons" },
  //   { id: 14, title: "Tage und Monate", description: "Days, months, and dates" },
  //   { id: 15, title: "Die Uhrzeit", description: "Telling time" },
  //   { id: 16, title: "Hobbys", description: "Hobbies and free time" },
  //   { id: 17, title: "Der Körper", description: "Body parts and health" },
  //   { id: 18, title: "Die Stadt", description: "City, places, and directions" },
  //   { id: 19, title: "Verkehrsmittel", description: "Transportation modes" },
  //   { id: 20, title: "Perfekt", description: "Perfect tense formation" },
  //   { id: 21, title: "Futur", description: "Future tense" },
  //   { id: 22, title: "Pronomen", description: "Personal and possessive pronouns" },
  //   { id: 23, title: "Präpositionen", description: "Prepositions (Akkusativ/Dativ)" },
  //   { id: 24, title: "Negation", description: "Negative sentences (nicht, kein)" },
  //   { id: 25, title: "Fragen", description: "Question words and formation" },
  // ],

  german: [
    {
      id: 1,
      title: { english: "Begrüßungen", hindi: "अभिवादन" },
      description: {
        english: "Greetings and farewells",
        hindi: "अभिवादन और विदाई",
      },
    },
    {
      id: 2,
      title: { english: "Vorstellung", hindi: "परिचय" },
      description: {
        english: "Self introduction and details",
        hindi: "स्व-परिचय और विवरण",
      },
    },
    {
      id: 3,
      title: { english: "Zahlen", hindi: "संख्याएँ" },
      description: { english: "Numbers 1-100", hindi: "१-१०० तक की संख्याएँ" },
    },
    {
      id: 4,
      title: { english: "Familie", hindi: "परिवार" },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और रिश्ते",
      },
    },
    {
      id: 5,
      title: { english: "Farben", hindi: "रंग" },
      description: {
        english: "Colors and descriptions",
        hindi: "रंग और उनके वर्णन",
      },
    },
    {
      id: 6,
      title: { english: "Artikel", hindi: "लेख (आर्टिकल्स)" },
      description: {
        english: "Der, die, das articles",
        hindi: "Der, Die, Das लेख",
      },
    },
    {
      id: 7,
      title: { english: "Verben", hindi: "क्रियाएँ" },
      description: {
        english: "Present tense verbs (sein, haben)",
        hindi: "वर्तमान काल की क्रियाएँ (sein, haben)",
      },
    },
    {
      id: 8,
      title: { english: "Essen und Trinken", hindi: "भोजन और पेय" },
      description: {
        english: "Food and beverages",
        hindi: "भोजन और पेय पदार्थ",
      },
    },
    {
      id: 9,
      title: { english: "Kleidung", hindi: "कपड़े" },
      description: {
        english: "Clothing and accessories",
        hindi: "कपड़े और सहायक वस्तुएँ",
      },
    },
    {
      id: 10,
      title: { english: "Das Haus", hindi: "घर" },
      description: {
        english: "House, rooms, and furniture",
        hindi: "घर, कमरे और फर्नीचर",
      },
    },
    {
      id: 11,
      title: { english: "Die Schule", hindi: "विद्यालय" },
      description: {
        english: "School subjects and activities",
        hindi: "विद्यालय विषय और गतिविधियाँ",
      },
    },
    {
      id: 12,
      title: { english: "Tiere", hindi: "पशु-पक्षी" },
      description: { english: "Animals and pets", hindi: "जानवर और पालतू पशु" },
    },
    {
      id: 13,
      title: { english: "Das Wetter", hindi: "मौसम" },
      description: { english: "Weather and seasons", hindi: "मौसम और ऋतुएँ" },
    },
    {
      id: 14,
      title: { english: "Tage und Monate", hindi: "दिन और महीने" },
      description: {
        english: "Days, months, and dates",
        hindi: "दिन, महीने और तिथियाँ",
      },
    },
    {
      id: 15,
      title: { english: "Die Uhrzeit", hindi: "समय" },
      description: { english: "Telling time", hindi: "समय बताना" },
    },
    {
      id: 16,
      title: { english: "Hobbys", hindi: "शौक" },
      description: {
        english: "Hobbies and free time",
        hindi: "शौक और खाली समय",
      },
    },
    {
      id: 17,
      title: { english: "Der Körper", hindi: "शरीर के अंग" },
      description: {
        english: "Body parts and health",
        hindi: "शरीर के अंग और स्वास्थ्य",
      },
    },
    {
      id: 18,
      title: { english: "Die Stadt", hindi: "शहर" },
      description: {
        english: "City, places, and directions",
        hindi: "शहर, स्थान और दिशाएँ",
      },
    },
    {
      id: 19,
      title: { english: "Verkehrsmittel", hindi: "परिवहन साधन" },
      description: {
        english: "Transportation modes",
        hindi: "यातायात के साधन",
      },
    },
    {
      id: 20,
      title: { english: "Perfekt", hindi: "भूतकाल (परफेक्ट)" },
      description: {
        english: "Perfect tense formation",
        hindi: "परफेक्ट काल का निर्माण",
      },
    },
    {
      id: 21,
      title: { english: "Futur", hindi: "भविष्यकाल" },
      description: { english: "Future tense", hindi: "भविष्यकाल" },
    },
    {
      id: 22,
      title: { english: "Pronomen", hindi: "सर्वनाम" },
      description: {
        english: "Personal and possessive pronouns",
        hindi: "व्यक्तिवाचक और अधिकारवाचक सर्वनाम",
      },
    },
    {
      id: 23,
      title: { english: "Präpositionen", hindi: "पूर्वसर्ग" },
      description: {
        english: "Prepositions (Akkusativ/Dativ)",
        hindi: "पूर्वसर्ग (Akkusativ/Dativ)",
      },
    },
    {
      id: 24,
      title: { english: "Negation", hindi: "नकारात्मक वाक्य" },
      description: {
        english: "Negative sentences (nicht, kein)",
        hindi: "नकारात्मक वाक्य (nicht, kein)",
      },
    },
    {
      id: 25,
      title: { english: "Fragen", hindi: "प्रश्नवाचक वाक्य" },
      description: {
        english: "Question words and formation",
        hindi: "प्रश्नवाचक शब्द और वाक्य निर्माण",
      },
    },
  ],
  // spanish: [
  //   { id: 1, title: "Saludos", description: "Greetings and introductions" },
  //   { id: 2, title: "Presentación", description: "Self introduction and personal info" },
  //   { id: 3, title: "Números", description: "Numbers 1-100" },
  //   { id: 4, title: "La Familia", description: "Family members and relationships" },
  //   { id: 5, title: "Colores", description: "Colors and adjectives" },
  //   { id: 6, title: "Artículos", description: "Definite and indefinite articles" },
  //   { id: 7, title: "Verbos", description: "Present tense verbs (ser, estar, tener)" },
  //   { id: 8, title: "Comida", description: "Food, fruits, and vegetables" },
  //   { id: 9, title: "Ropa", description: "Clothing and accessories" },
  //   { id: 10, title: "La Casa", description: "House, rooms, and furniture" },
  //   { id: 11, title: "La Escuela", description: "School subjects and activities" },
  //   { id: 12, title: "Animales", description: "Animals and pets" },
  //   { id: 13, title: "El Tiempo", description: "Weather and seasons" },
  //   { id: 14, title: "Días y Meses", description: "Days, months, and dates" },
  //   { id: 15, title: "La Hora", description: "Telling time" },
  //   { id: 16, title: "Pasatiempos", description: "Hobbies and leisure activities" },
  //   { id: 17, title: "El Cuerpo", description: "Body parts and health" },
  //   { id: 18, title: "La Ciudad", description: "City, places, and directions" },
  //   { id: 19, title: "Transporte", description: "Transportation and travel" },
  //   { id: 20, title: "Pretérito", description: "Past tense (preterite)" },
  //   { id: 21, title: "Futuro", description: "Future tense" },
  //   { id: 22, title: "Pronombres", description: "Personal and possessive pronouns" },
  //   { id: 23, title: "Preposiciones", description: "Prepositions of place and time" },
  //   { id: 24, title: "Negación", description: "Negative sentences" },
  //   { id: 25, title: "Preguntas", description: "Question words and formation" },
  // ],

  spanish: [
    {
      id: 1,
      title: { english: "Saludos", hindi: "अभिवादन" },
      description: {
        english: "Greetings and introductions",
        hindi: "अभिवादन और परिचय",
      },
    },
    {
      id: 2,
      title: { english: "Presentación", hindi: "परिचय" },
      description: {
        english: "Self introduction and personal info",
        hindi: "स्व-परिचय और व्यक्तिगत जानकारी",
      },
    },
    {
      id: 3,
      title: { english: "Números", hindi: "संख्याएँ" },
      description: { english: "Numbers 1-100", hindi: "१-१०० तक की संख्याएँ" },
    },
    {
      id: 4,
      title: { english: "La Familia", hindi: "परिवार" },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और रिश्ते",
      },
    },
    {
      id: 5,
      title: { english: "Colores", hindi: "रंग" },
      description: { english: "Colors and adjectives", hindi: "रंग और विशेषण" },
    },
    {
      id: 6,
      title: { english: "Artículos", hindi: "लेख (आर्टिकल्स)" },
      description: {
        english: "Definite and indefinite articles",
        hindi: "निश्चित और अनिश्चित लेख",
      },
    },
    {
      id: 7,
      title: { english: "Verbos", hindi: "क्रियाएँ" },
      description: {
        english: "Present tense verbs (ser, estar, tener)",
        hindi: "वर्तमान काल की क्रियाएँ (ser, estar, tener)",
      },
    },
    {
      id: 8,
      title: { english: "Comida", hindi: "भोजन" },
      description: {
        english: "Food, fruits, and vegetables",
        hindi: "भोजन, फल और सब्जियाँ",
      },
    },
    {
      id: 9,
      title: { english: "Ropa", hindi: "कपड़े" },
      description: {
        english: "Clothing and accessories",
        hindi: "कपड़े और सहायक वस्तुएँ",
      },
    },
    {
      id: 10,
      title: { english: "La Casa", hindi: "घर" },
      description: {
        english: "House, rooms, and furniture",
        hindi: "घर, कमरे और फर्नीचर",
      },
    },
    {
      id: 11,
      title: { english: "La Escuela", hindi: "विद्यालय" },
      description: {
        english: "School subjects and activities",
        hindi: "विद्यालय विषय और गतिविधियाँ",
      },
    },
    {
      id: 12,
      title: { english: "Animales", hindi: "पशु-पक्षी" },
      description: { english: "Animals and pets", hindi: "जानवर और पालतू पशु" },
    },
    {
      id: 13,
      title: { english: "El Tiempo", hindi: "मौसम" },
      description: { english: "Weather and seasons", hindi: "मौसम और ऋतुएँ" },
    },
    {
      id: 14,
      title: { english: "Días y Meses", hindi: "दिन और महीने" },
      description: {
        english: "Days, months, and dates",
        hindi: "दिन, महीने और तिथियाँ",
      },
    },
    {
      id: 15,
      title: { english: "La Hora", hindi: "समय" },
      description: { english: "Telling time", hindi: "समय बताना" },
    },
    {
      id: 16,
      title: { english: "Pasatiempos", hindi: "शौक" },
      description: {
        english: "Hobbies and leisure activities",
        hindi: "शौक और अवकाश गतिविधियाँ",
      },
    },
    {
      id: 17,
      title: { english: "El Cuerpo", hindi: "शरीर के अंग" },
      description: {
        english: "Body parts and health",
        hindi: "शरीर के अंग और स्वास्थ्य",
      },
    },
    {
      id: 18,
      title: { english: "La Ciudad", hindi: "शहर" },
      description: {
        english: "City, places, and directions",
        hindi: "शहर, स्थान और दिशाएँ",
      },
    },
    {
      id: 19,
      title: { english: "Transporte", hindi: "परिवहन" },
      description: {
        english: "Transportation and travel",
        hindi: "यातायात और यात्रा",
      },
    },
    {
      id: 20,
      title: { english: "Pretérito", hindi: "भूतकाल" },
      description: {
        english: "Past tense (preterite)",
        hindi: "भूतकाल (प्रेटेराइट)",
      },
    },
    {
      id: 21,
      title: { english: "Futuro", hindi: "भविष्यकाल" },
      description: { english: "Future tense", hindi: "भविष्यकाल" },
    },
    {
      id: 22,
      title: { english: "Pronombres", hindi: "सर्वनाम" },
      description: {
        english: "Personal and possessive pronouns",
        hindi: "व्यक्तिवाचक और अधिकारवाचक सर्वनाम",
      },
    },
    {
      id: 23,
      title: { english: "Preposiciones", hindi: "पूर्वसर्ग" },
      description: {
        english: "Prepositions of place and time",
        hindi: "स्थान और समय के पूर्वसर्ग",
      },
    },
    {
      id: 24,
      title: { english: "Negación", hindi: "नकारात्मक वाक्य" },
      description: { english: "Negative sentences", hindi: "नकारात्मक वाक्य" },
    },
    {
      id: 25,
      title: { english: "Preguntas", hindi: "प्रश्नवाचक वाक्य" },
      description: {
        english: "Question words and formation",
        hindi: "प्रश्नवाचक शब्द और वाक्य निर्माण",
      },
    },
  ],
  // hindi: [
  //   { id: 1, title: "अभिवादन (Abhivadan)", description: "Greetings and basic expressions" },
  //   { id: 2, title: "आत्म परिचय (Parichay)", description: "Self introduction and personal details" },
  //   { id: 3, title: "संख्याएँ (Sankhyaen)", description: "Numbers 1-100" },
  //   { id: 4, title: "परिवार (Parivar)", description: "Family members and relationships" },
  //   { id: 5, title: "रंग (Rang)", description: "Colors and descriptions" },
  //   { id: 6, title: "वर्णमाला (Varnmala)", description: "Hindi alphabet (Swar and Vyanjan)" },
  //   { id: 7, title: "क्रिया (Kriya)", description: "Basic verbs and present tense" },
  //   { id: 8, title: "भोजन (Bhojan)", description: "Food, fruits, and vegetables" },
  //   { id: 9, title: "वस्त्र (Vastra)", description: "Clothing and accessories" },
  //   { id: 10, title: "घर (Ghar)", description: "House, rooms, and household items" },
  //   { id: 11, title: "विद्यालय (Vidyalaya)", description: "School subjects and activities" },
  //   { id: 12, title: "पशु-पक्षी (Pashu-Pakshi)", description: "Animals and birds" },
  //   { id: 13, title: "मौसम (Mausam)", description: "Weather and seasons" },
  //   { id: 14, title: "दिन और महीने (Din aur Mahine)", description: "Days, months, and calendar" },
  //   { id: 15, title: "समय (Samay)", description: "Telling time" },
  //   { id: 16, title: "शौक (Shauk)", description: "Hobbies and interests" },
  //   { id: 17, title: "शरीर के अंग (Sharir ke Ang)", description: "Body parts and health" },
  //   { id: 18, title: "शहर (Shahar)", description: "City, places, and directions" },
  //   { id: 19, title: "यातायात (Yatayat)", description: "Transportation and travel" },
  //   { id: 20, title: "भूतकाल (Bhootkaal)", description: "Past tense formation" },
  //   { id: 21, title: "भविष्यकाल (Bhavishyakaal)", description: "Future tense" },
  //   { id: 22, title: "सर्वनाम (Sarvnam)", description: "Pronouns" },
  //   { id: 23, title: "संबंध सूचक (Sambandh Suchak)", description: "Prepositions and postpositions" },
  //   { id: 24, title: "निषेध वाक्य (Nishedh Vakya)", description: "Negative sentences" },
  //   { id: 25, title: "प्रश्नवाचक शब्द (Prashnvachak Shabd)", description: "Question words and formation" },
  // ],

  hindi: [
    {
      id: 1,
      title: { english: "अभिवादन (Abhivadan)", hindi: "अभिवादन" },
      description: {
        english: "Greetings and basic expressions",
        hindi: "अभिवादन और मूल अभिव्यक्तियाँ",
      },
    },
    {
      id: 2,
      title: { english: "आत्म परिचय (Parichay)", hindi: "आत्म परिचय" },
      description: {
        english: "Self introduction and personal details",
        hindi: "स्व-परिचय और व्यक्तिगत विवरण",
      },
    },
    {
      id: 3,
      title: { english: "संख्याएँ (Sankhyaen)", hindi: "संख्याएँ" },
      description: { english: "Numbers 1-100", hindi: "१-१०० तक की संख्याएँ" },
    },
    {
      id: 4,
      title: { english: "परिवार (Parivar)", hindi: "परिवार" },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और रिश्ते",
      },
    },
    {
      id: 5,
      title: { english: "रंग (Rang)", hindi: "रंग" },
      description: {
        english: "Colors and descriptions",
        hindi: "रंग और उनके वर्णन",
      },
    },
    {
      id: 6,
      title: { english: "वर्णमाला (Varnmala)", hindi: "वर्णमाला" },
      description: {
        english: "Hindi alphabet (Swar and Vyanjan)",
        hindi: "हिंदी वर्णमाला (स्वर और व्यंजन)",
      },
    },
    {
      id: 7,
      title: { english: "क्रिया (Kriya)", hindi: "क्रिया" },
      description: {
        english: "Basic verbs and present tense",
        hindi: "मूल क्रियाएँ और वर्तमान काल",
      },
    },
    {
      id: 8,
      title: { english: "भोजन (Bhojan)", hindi: "भोजन" },
      description: {
        english: "Food, fruits, and vegetables",
        hindi: "भोजन, फल और सब्जियाँ",
      },
    },
    {
      id: 9,
      title: { english: "वस्त्र (Vastra)", hindi: "वस्त्र" },
      description: {
        english: "Clothing and accessories",
        hindi: "कपड़े और सहायक वस्तुएँ",
      },
    },
    {
      id: 10,
      title: { english: "घर (Ghar)", hindi: "घर" },
      description: {
        english: "House, rooms, and household items",
        hindi: "घर, कमरे और घरेलू वस्तुएँ",
      },
    },
    {
      id: 11,
      title: { english: "विद्यालय (Vidyalaya)", hindi: "विद्यालय" },
      description: {
        english: "School subjects and activities",
        hindi: "विद्यालय विषय और गतिविधियाँ",
      },
    },
    {
      id: 12,
      title: { english: "पशु-पक्षी (Pashu-Pakshi)", hindi: "पशु-पक्षी" },
      description: { english: "Animals and birds", hindi: "जानवर और पक्षी" },
    },
    {
      id: 13,
      title: { english: "मौसम (Mausam)", hindi: "मौसम" },
      description: { english: "Weather and seasons", hindi: "मौसम और ऋतुएँ" },
    },
    {
      id: 14,
      title: {
        english: "दिन और महीने (Din aur Mahine)",
        hindi: "दिन और महीने",
      },
      description: {
        english: "Days, months, and calendar",
        hindi: "दिन, महीने और कैलेंडर",
      },
    },
    {
      id: 15,
      title: { english: "समय (Samay)", hindi: "समय" },
      description: { english: "Telling time", hindi: "समय बताना" },
    },
    {
      id: 16,
      title: { english: "शौक (Shauk)", hindi: "शौक" },
      description: {
        english: "Hobbies and interests",
        hindi: "शौक और रुचियाँ",
      },
    },
    {
      id: 17,
      title: { english: "शरीर के अंग (Sharir ke Ang)", hindi: "शरीर के अंग" },
      description: {
        english: "Body parts and health",
        hindi: "शरीर के अंग और स्वास्थ्य",
      },
    },
    {
      id: 18,
      title: { english: "शहर (Shahar)", hindi: "शहर" },
      description: {
        english: "City, places, and directions",
        hindi: "शहर, स्थान और दिशाएँ",
      },
    },
    {
      id: 19,
      title: { english: "यातायात (Yatayat)", hindi: "यातायात" },
      description: {
        english: "Transportation and travel",
        hindi: "परिवहन और यात्रा",
      },
    },
    {
      id: 20,
      title: { english: "भूतकाल (Bhootkaal)", hindi: "भूतकाल" },
      description: {
        english: "Past tense formation",
        hindi: "भूतकाल का निर्माण",
      },
    },
    {
      id: 21,
      title: { english: "भविष्यकाल (Bhavishyakaal)", hindi: "भविष्यकाल" },
      description: { english: "Future tense", hindi: "भविष्यकाल" },
    },
    {
      id: 22,
      title: { english: "सर्वनाम (Sarvnam)", hindi: "सर्वनाम" },
      description: { english: "Pronouns", hindi: "सर्वनाम" },
    },
    {
      id: 23,
      title: { english: "संबंध सूचक (Sambandh Suchak)", hindi: "संबंध सूचक" },
      description: {
        english: "Prepositions and postpositions",
        hindi: "पूर्वसर्ग और परसर्ग",
      },
    },
    {
      id: 24,
      title: { english: "निषेध वाक्य (Nishedh Vakya)", hindi: "निषेध वाक्य" },
      description: { english: "Negative sentences", hindi: "नकारात्मक वाक्य" },
    },
    {
      id: 25,
      title: {
        english: "प्रश्नवाचक शब्द (Prashnvachak Shabd)",
        hindi: "प्रश्नवाचक शब्द",
      },
      description: {
        english: "Question words and formation",
        hindi: "प्रश्नवाचक शब्द और वाक्य निर्माण",
      },
    },
  ],
  // marathi: [
  //   { id: 1, title: "अभिवादन (Abhivadan)", description: "Greetings and basic expressions" },
  //   { id: 2, title: "स्वत:चा परिचय (Parichay)", description: "Self introduction and personal details" },
  //   { id: 3, title: "संख्या (Sankhya)", description: "Numbers 1-100" },
  //   { id: 4, title: "कुटुंब (Kutumb)", description: "Family members and relationships" },
  //   { id: 5, title: "रंग (Rang)", description: "Colors and descriptions" },
  //   { id: 6, title: "वर्णमाला (Varnmala)", description: "Marathi alphabet" },
  //   { id: 7, title: "क्रियापद (Kriyapad)", description: "Basic verbs and present tense" },
  //   { id: 8, title: "अन्न (Anna)", description: "Food, fruits, and vegetables" },
  //   { id: 9, title: "कपडे (Kapde)", description: "Clothing and accessories" },
  //   { id: 10, title: "घर (Ghar)", description: "House, rooms, and furniture" },
  //   { id: 11, title: "शाळा (Shala)", description: "School subjects and activities" },
  //   { id: 12, title: "प्राणी-पक्षी (Prani-Pakshi)", description: "Animals and birds" },
  //   { id: 13, title: "हवामान (Havaman)", description: "Weather and seasons" },
  //   { id: 14, title: "दिवस आणि महिने (Divas ani Mahine)", description: "Days, months, and dates" },
  //   { id: 15, title: "वेळ (Vel)", description: "Telling time" },
  //   { id: 16, title: "छंद (Chhanda)", description: "Hobbies and leisure activities" },
  //   { id: 17, title: "शरीराचे अवयव (Shariraache Avayav)", description: "Body parts and health" },
  //   { id: 18, title: "शहर (Shahar)", description: "City, places, and directions" },
  //   { id: 19, title: "वाहतूक (Vahatuk)", description: "Transportation and travel" },
  //   { id: 20, title: "भूतकाळ (Bhootkaal)", description: "Past tense formation" },
  //   { id: 21, title: "भविष्यकाळ (Bhavishyakaal)", description: "Future tense" },
  //   { id: 22, title: "सर्वनाम (Sarvnam)", description: "Pronouns" },
  //   { id: 23, title: "शब्दयोगी अव्यय (Shabdayogi Avyay)", description: "Prepositions and postpositions" },
  //   { id: 24, title: "नकारार्थी वाक्य (Nakaarthi Vakya)", description: "Negative sentences" },
  //   { id: 25, title: "प्रश्नार्थक शब्द (Prashnarthak Shabd)", description: "Question words and formation" },
  // ],

  marathi: [
    {
      id: 1,
      title: { english: "अभिवादन (Abhivadan)", hindi: "अभिवादन" },
      description: {
        english: "Greetings and basic expressions",
        hindi: "अभिवादन और मूल अभिव्यक्तियाँ",
      },
    },
    {
      id: 2,
      title: { english: "स्वत:चा परिचय (Parichay)", hindi: "स्व-परिचय" },
      description: {
        english: "Self introduction and personal details",
        hindi: "स्व-परिचय और व्यक्तिगत विवरण",
      },
    },
    {
      id: 3,
      title: { english: "संख्या (Sankhya)", hindi: "संख्याएँ" },
      description: { english: "Numbers 1-100", hindi: "१-१०० तक की संख्याएँ" },
    },
    {
      id: 4,
      title: { english: "कुटुंब (Kutumb)", hindi: "परिवार" },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और रिश्ते",
      },
    },
    {
      id: 5,
      title: { english: "रंग (Rang)", hindi: "रंग" },
      description: {
        english: "Colors and descriptions",
        hindi: "रंग और उनके वर्णन",
      },
    },
    {
      id: 6,
      title: { english: "वर्णमाला (Varnmala)", hindi: "वर्णमाला" },
      description: { english: "Marathi alphabet", hindi: "मराठी वर्णमाला" },
    },
    {
      id: 7,
      title: { english: "क्रियापद (Kriyapad)", hindi: "क्रिया" },
      description: {
        english: "Basic verbs and present tense",
        hindi: "मूल क्रियाएँ और वर्तमान काल",
      },
    },
    {
      id: 8,
      title: { english: "अन्न (Anna)", hindi: "भोजन" },
      description: {
        english: "Food, fruits, and vegetables",
        hindi: "भोजन, फल और सब्जियाँ",
      },
    },
    {
      id: 9,
      title: { english: "कपडे (Kapde)", hindi: "कपड़े" },
      description: {
        english: "Clothing and accessories",
        hindi: "कपड़े और सहायक वस्तुएँ",
      },
    },
    {
      id: 10,
      title: { english: "घर (Ghar)", hindi: "घर" },
      description: {
        english: "House, rooms, and furniture",
        hindi: "घर, कमरे और फर्नीचर",
      },
    },
    {
      id: 11,
      title: { english: "शाळा (Shala)", hindi: "विद्यालय" },
      description: {
        english: "School subjects and activities",
        hindi: "स्कूल विषय और गतिविधियाँ",
      },
    },
    {
      id: 12,
      title: { english: "प्राणी-पक्षी (Prani-Pakshi)", hindi: "पशु-पक्षी" },
      description: { english: "Animals and birds", hindi: "जानवर और पक्षी" },
    },
    {
      id: 13,
      title: { english: "हवामान (Havaman)", hindi: "मौसम" },
      description: { english: "Weather and seasons", hindi: "मौसम और ऋतुएँ" },
    },
    {
      id: 14,
      title: {
        english: "दिवस आणि महिने (Divas ani Mahine)",
        hindi: "दिन और महीने",
      },
      description: {
        english: "Days, months, and dates",
        hindi: "दिन, महीने और तिथियाँ",
      },
    },
    {
      id: 15,
      title: { english: "वेळ (Vel)", hindi: "समय" },
      description: { english: "Telling time", hindi: "समय बताना" },
    },
    {
      id: 16,
      title: { english: "छंद (Chhanda)", hindi: "शौक" },
      description: {
        english: "Hobbies and leisure activities",
        hindi: "शौक और अवकाश गतिविधियाँ",
      },
    },
    {
      id: 17,
      title: {
        english: "शरीराचे अवयव (Shariraache Avayav)",
        hindi: "शरीर के अंग",
      },
      description: {
        english: "Body parts and health",
        hindi: "शरीर के अंग और स्वास्थ्य",
      },
    },
    {
      id: 18,
      title: { english: "शहर (Shahar)", hindi: "शहर" },
      description: {
        english: "City, places, and directions",
        hindi: "शहर, स्थान और दिशाएँ",
      },
    },
    {
      id: 19,
      title: { english: "वाहतूक (Vahatuk)", hindi: "परिवहन" },
      description: {
        english: "Transportation and travel",
        hindi: "यातायात और यात्रा",
      },
    },
    {
      id: 20,
      title: { english: "भूतकाळ (Bhootkaal)", hindi: "भूतकाल" },
      description: {
        english: "Past tense formation",
        hindi: "भूतकाल का निर्माण",
      },
    },
    {
      id: 21,
      title: { english: "भविष्यकाळ (Bhavishyakaal)", hindi: "भविष्यकाल" },
      description: { english: "Future tense", hindi: "भविष्यकाल" },
    },
    {
      id: 22,
      title: { english: "सर्वनाम (Sarvnam)", hindi: "सर्वनाम" },
      description: { english: "Pronouns", hindi: "सर्वनाम" },
    },
    {
      id: 23,
      title: {
        english: "शब्दयोगी अव्यय (Shabdayogi Avyay)",
        hindi: "पूर्वसर्ग/परसर्ग",
      },
      description: {
        english: "Prepositions and postpositions",
        hindi: "पूर्वसर्ग और परसर्ग",
      },
    },
    {
      id: 24,
      title: {
        english: "नकारार्थी वाक्य (Nakaarthi Vakya)",
        hindi: "नकारात्मक वाक्य",
      },
      description: { english: "Negative sentences", hindi: "नकारात्मक वाक्य" },
    },
    {
      id: 25,
      title: {
        english: "प्रश्नार्थक शब्द (Prashnarthak Shabd)",
        hindi: "प्रश्नवाचक शब्द",
      },
      description: {
        english: "Question words and formation",
        hindi: "प्रश्नवाचक शब्द और वाक्य निर्माण",
      },
    },
  ],
  // kannada: [
  //   { id: 1, title: "ನಮಸ್ಕಾರ (Namaskara)", description: "Greetings and basic expressions" },
  //   { id: 2, title: "ಪರಿಚಯ (Parichaya)", description: "Self introduction and personal details" },
  //   { id: 3, title: "ಸಂಖ್ಯೆಗಳು (Sankhyegalu)", description: "Numbers 1-100" },
  //   { id: 4, title: "ಕುಟುಂಬ (Kutumba)", description: "Family members and relationships" },
  //   { id: 5, title: "ಬಣ್ಣಗಳು (Bannagalu)", description: "Colors and descriptions" },
  //   { id: 6, title: "ವರ್ಣಮಾಲೆ (Varnamale)", description: "Kannada alphabet (Swaras and Vyanjanagalu)" },
  //   { id: 7, title: "ಕ್ರಿಯಾಪದಗಳು (Kriyapadagalu)", description: "Basic verbs and present tense" },
  //   { id: 8, title: "ಆಹಾರ (Aahara)", description: "Food, fruits, and vegetables" },
  //   { id: 9, title: "ಬಟ್ಟೆಗಳು (Battegalu)", description: "Clothing and accessories" },
  //   { id: 10, title: "ಮನೆ (Mane)", description: "House, rooms, and furniture" },
  //   { id: 11, title: "ಶಾಲೆ (Shaale)", description: "School subjects and activities" },
  //   { id: 12, title: "ಪ್ರಾಣಿ-ಪಕ್ಷಿಗಳು (Prani-Pakshigalu)", description: "Animals and birds" },
  //   { id: 13, title: "ಹವಾಮಾನ (Havamaana)", description: "Weather and seasons" },
  //   { id: 14, title: "ದಿನ ಮತ್ತು ತಿಂಗಳು (Dina mattu Tingalu)", description: "Days, months, and dates" },
  //   { id: 15, title: "ಸಮಯ (Samaya)", description: "Telling time" },
  //   { id: 16, title: "ಹವ್ಯಾಸಗಳು (Havyasagalu)", description: "Hobbies and leisure activities" },
  //   { id: 17, title: "ದೇಹದ ಅಂಗಗಳು (Dehada Angagalu)", description: "Body parts and health" },
  //   { id: 18, title: "ನಗರ (Nagara)", description: "City, places, and directions" },
  //   { id: 19, title: "ಸಾರಿಗೆ (Sarige)", description: "Transportation and travel" },
  //   { id: 20, title: "ಭೂತಕಾಲ (Bhootakaala)", description: "Past tense formation" },
  //   { id: 21, title: "ಭವಿಷ್ಯಕಾಲ (Bhavishyakaala)", description: "Future tense" },
  //   { id: 22, title: "ಸರ್ವನಾಮ (Sarvanama)", description: "Pronouns" },
  //   { id: 23, title: "ಪೂರ್ವಸರ್ಗಗಳು (Poorvasargagalu)", description: "Prepositions and postpositions" },
  //   { id: 24, title: "ನಿರಾಕರಣೆ ವಾಕ್ಯಗಳು (Nirakarane Vakyagalu)", description: "Negative sentences" },
  //   { id: 25, title: "ಪ್ರಶ್ನಾರ್ಥಕ ಪದಗಳು (Prashnarthaka Padagalu)", description: "Question words and formation" },
  // ],

  kannada: [
    {
      id: 1,
      title: { english: "ನಮಸ್ಕಾರ (Namaskara)", hindi: "नमस्कार" },
      description: {
        english: "Greetings and basic expressions",
        hindi: "अभिवादन और मूल अभिव्यक्तियाँ",
      },
    },
    {
      id: 2,
      title: { english: "ಪರಿಚಯ (Parichaya)", hindi: "परिचय" },
      description: {
        english: "Self introduction and personal details",
        hindi: "स्व-परिचय और व्यक्तिगत विवरण",
      },
    },
    {
      id: 3,
      title: { english: "ಸಂಖ್ಯೆಗಳು (Sankhyegalu)", hindi: "संख्याएँ" },
      description: { english: "Numbers 1-100", hindi: "१-१०० तक की संख्याएँ" },
    },
    {
      id: 4,
      title: { english: "ಕುಟುಂಬ (Kutumba)", hindi: "परिवार" },
      description: {
        english: "Family members and relationships",
        hindi: "परिवार के सदस्य और रिश्ते",
      },
    },
    {
      id: 5,
      title: { english: "ಬಣ್ಣಗಳು (Bannagalu)", hindi: "रंग" },
      description: {
        english: "Colors and descriptions",
        hindi: "रंग और उनके वर्णन",
      },
    },
    {
      id: 6,
      title: { english: "ವರ್ಣಮಾಲೆ (Varnamale)", hindi: "वर्णमाला" },
      description: {
        english: "Kannada alphabet (Swaras and Vyanjanagalu)",
        hindi: "कन्नड़ वर्णमाला (स्वर और व्यंजन)",
      },
    },
    {
      id: 7,
      title: { english: "ಕ್ರಿಯಾಪದಗಳು (Kriyapadagalu)", hindi: "क्रियाएँ" },
      description: {
        english: "Basic verbs and present tense",
        hindi: "मूल क्रियाएँ और वर्तमान काल",
      },
    },
    {
      id: 8,
      title: { english: "ಆಹಾರ (Aahara)", hindi: "भोजन" },
      description: {
        english: "Food, fruits, and vegetables",
        hindi: "भोजन, फल और सब्जियाँ",
      },
    },
    {
      id: 9,
      title: { english: "ಬಟ್ಟೆಗಳು (Battegalu)", hindi: "कपड़े" },
      description: {
        english: "Clothing and accessories",
        hindi: "कपड़े और सहायक वस्तुएँ",
      },
    },
    {
      id: 10,
      title: { english: "ಮನೆ (Mane)", hindi: "घर" },
      description: {
        english: "House, rooms, and furniture",
        hindi: "घर, कमरे और फर्नीचर",
      },
    },
    {
      id: 11,
      title: { english: "ಶಾಲೆ (Shaale)", hindi: "विद्यालय" },
      description: {
        english: "School subjects and activities",
        hindi: "स्कूल विषय और गतिविधियाँ",
      },
    },
    {
      id: 12,
      title: {
        english: "ಪ್ರಾಣಿ-ಪಕ್ಷಿಗಳು (Prani-Pakshigalu)",
        hindi: "पशु-पक्षी",
      },
      description: { english: "Animals and birds", hindi: "जानवर और पक्षी" },
    },
    {
      id: 13,
      title: { english: "ಹವಾಮಾನ (Havamaana)", hindi: "मौसम" },
      description: { english: "Weather and seasons", hindi: "मौसम और ऋतुएँ" },
    },
    {
      id: 14,
      title: {
        english: "ದಿನ ಮತ್ತು ತಿಂಗಳು (Dina mattu Tingalu)",
        hindi: "दिन और महीने",
      },
      description: {
        english: "Days, months, and dates",
        hindi: "दिन, महीने और तिथियाँ",
      },
    },
    {
      id: 15,
      title: { english: "ಸಮಯ (Samaya)", hindi: "समय" },
      description: { english: "Telling time", hindi: "समय बताना" },
    },
    {
      id: 16,
      title: { english: "ಹವ್ಯಾಸಗಳು (Havyasagalu)", hindi: "शौक" },
      description: {
        english: "Hobbies and leisure activities",
        hindi: "शौक और अवकाश गतिविधियाँ",
      },
    },
    {
      id: 17,
      title: { english: "ದೇಹದ ಅಂಗಗಳು (Dehada Angagalu)", hindi: "शरीर के अंग" },
      description: {
        english: "Body parts and health",
        hindi: "शरीर के अंग और स्वास्थ्य",
      },
    },
    {
      id: 18,
      title: { english: "ನಗರ (Nagara)", hindi: "शहर" },
      description: {
        english: "City, places, and directions",
        hindi: "शहर, स्थान और दिशाएँ",
      },
    },
    {
      id: 19,
      title: { english: "ಸಾರಿಗೆ (Sarige)", hindi: "परिवहन" },
      description: {
        english: "Transportation and travel",
        hindi: "यातायात और यात्रा",
      },
    },
    {
      id: 20,
      title: { english: "ಭೂತಕಾಲ (Bhootakaala)", hindi: "भूतकाल" },
      description: {
        english: "Past tense formation",
        hindi: "भूतकाल का निर्माण",
      },
    },
    {
      id: 21,
      title: { english: "ಭವಿಷ್ಯಕಾಲ (Bhavishyakaala)", hindi: "भविष्यकाल" },
      description: { english: "Future tense", hindi: "भविष्यकाल" },
    },
    {
      id: 22,
      title: { english: "ಸರ್ವನಾಮ (Sarvanama)", hindi: "सर्वनाम" },
      description: { english: "Pronouns", hindi: "सर्वनाम" },
    },
    {
      id: 23,
      title: { english: "ಪೂರ್ವಸರ್ಗಗಳು (Poorvasargagalu)", hindi: "पूर्वसर्ग" },
      description: {
        english: "Prepositions and postpositions",
        hindi: "पूर्वसर्ग और परसर्ग",
      },
    },
    {
      id: 24,
      title: {
        english: "ನಿರಾಕರಣೆ ವಾಕ್ಯಗಳು (Nirakarane Vakyagalu)",
        hindi: "नकारात्मक वाक्य",
      },
      description: { english: "Negative sentences", hindi: "नकारात्मक वाक्य" },
    },
    {
      id: 25,
      title: {
        english: "ಪ್ರಶ್ನಾರ್ಥಕ ಪದಗಳು (Prashnarthaka Padagalu)",
        hindi: "प्रश्नवाचक शब्द",
      },
      description: {
        english: "Question words and formation",
        hindi: "प्रश्नवाचक शब्द और वाक्य निर्माण",
      },
    },
  ],
  // General Science chapters across four categories
  // physics: [
  //   { id: 1, title: "Measurement and Units", description: "Physical quantities, SI units, measurement tools" },
  //   { id: 2, title: "Motion", description: "Types of motion, speed, velocity, distance-time graphs" },
  //   { id: 3, title: "Force and Pressure", description: "Types of forces, pressure, atmospheric pressure" },
  //   { id: 4, title: "Work and Energy", description: "Work, energy forms, law of conservation of energy" },
  //   { id: 5, title: "Simple Machines", description: "Levers, pulleys, inclined planes, mechanical advantage" },
  //   { id: 6, title: "Gravity", description: "Universal gravitation, weight, free fall" },
  // ],
  physics: [
    {
      id: 1,
      title: {
        english: "Measurement and Units",
        hindi: "मापन और इकाइयाँ",
      },
      description: {
        english: "Physical quantities, SI units, measurement tools",
        hindi: "भौतिक राशियाँ, SI इकाइयाँ, मापन के उपकरण",
      },
    },
    {
      id: 2,
      title: {
        english: "Motion",
        hindi: "गति",
      },
      description: {
        english: "Types of motion, speed, velocity, distance-time graphs",
        hindi: "गति के प्रकार, चाल, वेग, दूरी-समय ग्राफ",
      },
    },
    {
      id: 3,
      title: {
        english: "Force and Pressure",
        hindi: "बल और दाब",
      },
      description: {
        english: "Types of forces, pressure, atmospheric pressure",
        hindi: "बल के प्रकार, दाब, वायुमंडलीय दाब",
      },
    },
    {
      id: 4,
      title: {
        english: "Work and Energy",
        hindi: "कार्य और ऊर्जा",
      },
      description: {
        english: "Work, energy forms, law of conservation of energy",
        hindi: "कार्य, ऊर्जा के प्रकार, ऊर्जा संरक्षण का नियम",
      },
    },
    {
      id: 5,
      title: {
        english: "Simple Machines",
        hindi: "सरल मशीनें",
      },
      description: {
        english: "Levers, pulleys, inclined planes, mechanical advantage",
        hindi: "उतोलक, चरखी, तिरछा तल, यांत्रिक लाभ",
      },
    },
    {
      id: 6,
      title: {
        english: "Gravity",
        hindi: "गुरुत्वाकर्षण",
      },
      description: {
        english: "Universal gravitation, weight, free fall",
        hindi: "सार्वत्रिक गुरुत्वाकर्षण, भार, मुक्त पतन",
      },
    },
  ],
  // chemistry: [
  //   { id: 7, title: "Matter and Its States", description: "Solid, liquid, gas, changes of state" },
  //   { id: 8, title: "Elements and Compounds", description: "Pure substances, mixtures, separation techniques" },
  //   { id: 9, title: "Atoms and Molecules", description: "Atomic structure, ions, chemical formulae" },
  //   { id: 10, title: "Acids, Bases and Salts", description: "Properties, pH scale, neutralization" },
  //   { id: 11, title: "Chemical Reactions", description: "Types of reactions, balancing equations" },
  //   { id: 12, title: "Metals and Non-metals", description: "Properties, reactivity series, corrosion" },
  // ],

  chemistry: [
    {
      id: 7,
      title: {
        english: "Matter and Its States",
        hindi: "पदार्थ और उसकी अवस्थाएँ",
      },
      description: {
        english: "Solid, liquid, gas, changes of state",
        hindi: "ठोस, द्रव, गैस, अवस्था परिवर्तन",
      },
    },
    {
      id: 8,
      title: {
        english: "Elements and Compounds",
        hindi: "तत्व और यौगिक",
      },
      description: {
        english: "Pure substances, mixtures, separation techniques",
        hindi: "शुद्ध पदार्थ, मिश्रण, पृथक्करण की विधियाँ",
      },
    },
    {
      id: 9,
      title: {
        english: "Atoms and Molecules",
        hindi: "परमाणु और अणु",
      },
      description: {
        english: "Atomic structure, ions, chemical formulae",
        hindi: "परमाणु संरचना, आयन, रासायनिक सूत्र",
      },
    },
    {
      id: 10,
      title: {
        english: "Acids, Bases and Salts",
        hindi: "अम्ल, क्षार और लवण",
      },
      description: {
        english: "Properties, pH scale, neutralization",
        hindi: "गुण, pH स्केल, उदासीनीकरण",
      },
    },
    {
      id: 11,
      title: {
        english: "Chemical Reactions",
        hindi: "रासायनिक अभिक्रियाएँ",
      },
      description: {
        english: "Types of reactions, balancing equations",
        hindi: "अभिक्रियाओं के प्रकार, समीकरण संतुलन",
      },
    },
    {
      id: 12,
      title: {
        english: "Metals and Non-metals",
        hindi: "धातु और अधातु",
      },
      description: {
        english: "Properties, reactivity series, corrosion",
        hindi: "गुण, क्रियाशीलता श्रेणी, जंग लगना",
      },
    },
  ],
  // biology: [
  //   { id: 13, title: "Cell - Basic Unit of Life", description: "Cell structure, organelles, prokaryotic vs eukaryotic" },
  //   { id: 14, title: "Tissues", description: "Plant and animal tissues, functions" },
  //   { id: 15, title: "Life Processes", description: "Nutrition, respiration, transportation, excretion" },
  //   { id: 16, title: "Diversity in Living Organisms", description: "Classification, five kingdoms" },
  //   { id: 17, title: "Human Body Systems", description: "Digestive, circulatory, respiratory, nervous systems" },
  //   { id: 18, title: "Reproduction", description: "Asexual and sexual reproduction, human reproduction" },
  //   { id: 19, title: "Heredity and Evolution", description: "Genes, DNA, natural selection, adaptation" },
  // ],

  biology: [
    {
      id: 13,
      title: {
        english: "Cell - Basic Unit of Life",
        hindi: "कोशिका - जीवन की मूल इकाई",
      },
      description: {
        english: "Cell structure, organelles, prokaryotic vs eukaryotic",
        hindi: "कोशिका संरचना, कोशिकांग, प्रोकैरियोटिक और यूकैरियोटिक",
      },
    },
    {
      id: 14,
      title: {
        english: "Tissues",
        hindi: "ऊतक",
      },
      description: {
        english: "Plant and animal tissues, functions",
        hindi: "पादप और जंतु ऊतक, उनके कार्य",
      },
    },
    {
      id: 15,
      title: {
        english: "Life Processes",
        hindi: "जीवन प्रक्रियाएँ",
      },
      description: {
        english: "Nutrition, respiration, transportation, excretion",
        hindi: "पोषण, श्वसन, परिवहन, उत्सर्जन",
      },
    },
    {
      id: 16,
      title: {
        english: "Diversity in Living Organisms",
        hindi: "जीवों में विविधता",
      },
      description: {
        english: "Classification, five kingdoms",
        hindi: "वर्गीकरण, पाँच जगत",
      },
    },
    {
      id: 17,
      title: {
        english: "Human Body Systems",
        hindi: "मानव शरीर तंत्र",
      },
      description: {
        english: "Digestive, circulatory, respiratory, nervous systems",
        hindi: "पाचन, परिसंचरण, श्वसन, तंत्रिका तंत्र",
      },
    },
    {
      id: 18,
      title: {
        english: "Reproduction",
        hindi: "प्रजनन",
      },
      description: {
        english: "Asexual and sexual reproduction, human reproduction",
        hindi: "अलैंगिक और लैंगिक प्रजनन, मानव प्रजनन",
      },
    },
    {
      id: 19,
      title: {
        english: "Heredity and Evolution",
        hindi: "अनुवांशिकता और विकास",
      },
      description: {
        english: "Genes, DNA, natural selection, adaptation",
        hindi: "जीन, डीएनए, प्राकृतिक चयन, अनुकूलन",
      },
    },
  ],
  // general: [
  //   { id: 20, title: "Natural Resources", description: "Air, water, soil, conservation" },
  //   { id: 21, title: "Environmental Science", description: "Pollution, ecosystem, biodiversity" },
  //   { id: 22, title: "Light and Reflection", description: "Laws of reflection, mirrors, image formation" },
  //   { id: 23, title: "Sound", description: "Production, propagation, characteristics" },
  //   { id: 24, title: "Heat and Temperature", description: "Thermal energy, heat transfer, expansion" },
  //   { id: 25, title: "Electricity and Magnetism", description: "Electric current, circuits, magnets" },
  // ],
  general: [
    {
      id: 20,
      title: {
        english: "Natural Resources",
        hindi: "प्राकृतिक संसाधन",
      },
      description: {
        english: "Air, water, soil, conservation",
        hindi: "वायु, जल, मृदा, संरक्षण",
      },
    },
    {
      id: 21,
      title: {
        english: "Environmental Science",
        hindi: "पर्यावरण विज्ञान",
      },
      description: {
        english: "Pollution, ecosystem, biodiversity",
        hindi: "प्रदूषण, पारितंत्र, जैव विविधता",
      },
    },
    {
      id: 22,
      title: {
        english: "Light and Reflection",
        hindi: "प्रकाश और परावर्तन",
      },
      description: {
        english: "Laws of reflection, mirrors, image formation",
        hindi: "परावर्तन के नियम, दर्पण, प्रतिबिंब निर्माण",
      },
    },
    {
      id: 23,
      title: {
        english: "Sound",
        hindi: "ध्वनि",
      },
      description: {
        english: "Production, propagation, characteristics",
        hindi: "उत्पादन, संचरण, विशेषताएँ",
      },
    },
    {
      id: 24,
      title: {
        english: "Heat and Temperature",
        hindi: "ऊष्मा और तापमान",
      },
      description: {
        english: "Thermal energy, heat transfer, expansion",
        hindi: "ऊष्मीय ऊर्जा, ऊष्मा संचरण, प्रसार",
      },
    },
    {
      id: 25,
      title: {
        english: "Electricity and Magnetism",
        hindi: "विद्युत और चुंबकत्व",
      },
      description: {
        english: "Electric current, circuits, magnets",
        hindi: "विद्युत धारा, परिपथ, चुंबक",
      },
    },
  ],
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get chapters for a language or science category
  app.get("/api/chapters/:subject", (req, res) => {
    const { subject } = req.params;
    const chapters = CHAPTERS[subject.toLowerCase()] || [];
    res.json(chapters);
  });

  // Teacher Registration

  app.post("/api/teacher/register", async (req, res) => {
    try {
      const { fullName, username, password, email, school } = req.body;

      if (!username || !password || !fullName || !email) {
        return res.status(400).json({ error: "All fields required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO teachers (full_name, email, username, password, school)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, username, school`,
        [fullName, email, username, hashedPassword, school],
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to register teacher" });
    }
  });

  app.post("/api/teacher/login", async (req, res) => {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM teachers WHERE username=$1",
      [username],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Teacher not found" });
    }

    const teacher = result.rows[0];

    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({
      id: teacher.id,
      username: teacher.username,
      email: teacher.email,
    });
  });

  // app.post("/api/teacher/register", async (req, res) => {
  //   try {
  //     const { fullName, username, password, email, school } = req.body;

  //     const hashedPassword = await bcrypt.hash(password, 10);

  //     const result = await pool.query(
  //       `INSERT INTO teachers (fullname, username, password, email, school)
  //        VALUES ($1,$2,$3,$4,$5)
  //        RETURNING id, fullname, username, email`,
  //       [fullName, username, hashedPassword, email, school]
  //     );

  //     res.json(result.rows[0]);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: "Failed to register teacher" });
  //   }
  // });

  // Teacher Login

  // app.post("/api/teacher/login", async (req, res) => {
  //   const { username, password } = req.body;

  //   const result = await pool.query(
  //     "SELECT * FROM teachers WHERE username = $1",
  //     [username],
  //   );

  //   if (result.rows.length === 0) {
  //     return res.status(401).json({ error: "Invalid username or password" });
  //   }

  //   const teacher = result.rows[0];

  //   const isMatch = await bcrypt.compare(password, teacher.password);

  //   if (!isMatch) {
  //     return res.status(401).json({ error: "Invalid username or password" });
  //   }

  //   const { password: _, ...teacherData } = teacher;
  //   res.json(teacherData);

  //   // res.json(teacher);
  // });

  // app.post("/api/teacher/login", async (req, res) => {
  //   try {
  //     const { username, password } = req.body;

  //     if (!username || !password) {
  //       return res.status(400).json({ error: "Username and password are required" });
  //     }

  //     const teacher = await storage.getTeacherByUsername(username);

  //     // NOTE: In production, use bcrypt or similar for password hashing!
  //     // if (!teacher || teacher.password !== password) {
  //     //   return res.status(401).json({ error: "Invalid username or password" });
  //     // }

  //     if (!teacher) {
  //       return res.status(401).json({ error: "Invalid username or password" });
  //     }

  //     const isMatch = await bcrypt.compare(password, teacher.password);

  //     if (!isMatch) {
  //       return res.status(401).json({ error: "Invalid username or password" });
  //     }

  //     // Don't send password back
  //     const { password: _, ...teacherData } = teacher;
  //     res.json(teacherData);
  //   } catch (error) {
  //     console.error("Error logging in teacher:", error);
  //     res.status(500).json({ error: "Failed to login" });
  //   }
  // });

  //   // Get all custom tests for a teacher
  //   app.get("/api/teacher/:teacherId/tests", async (req, res) => {
  //     try {
  //       const { teacherId } = req.params;
  //       const tests = await storage.getCustomTestsByTeacher(teacherId);
  //       res.json(tests);
  //     } catch (error) {
  //       console.error("Error fetching tests:", error);
  //       res.status(500).json({ error: "Failed to fetch tests" });
  //     }
  //   });

  //   // Create and generate custom MCQ test
  // app.post("/api/teacher/:teacherId/generate-test", async (req, res) => {
  //   try {
  //     const { teacherId } = req.params;
  //     const {
  //       title,
  //       subject,
  //       classLevel,
  //       language,
  //       difficulty,
  //       syllabus,
  //       numQuestions,
  //       testType,
  //       gptModel,
  //       instructions,
  //     } = req.body;

  //     const topics = syllabus
  //       .split(",")
  //       .map((topic: string) => topic.trim())
  //       .filter((topic: string) => topic.length > 0)
  //       .slice(0, 4);

  //     if (topics.length === 0) {
  //       return res
  //         .status(400)
  //         .json({ error: "At least one topic is required" });
  //     }

  //     console.log(`[CUSTOM TEST] Generating ${numQuestions} questions`);

  //     // Generate share code
  //     const shareCode = Math.random()
  //       .toString(36)
  //       .substring(2, 8)
  //       .toUpperCase();

  //     // Create test
  //     const test = await storage.createCustomTest({
  //       teacherId,
  //       title,
  //       subject,
  //       classLevel,
  //       difficulty,
  //       language: "hi",
  //       syllabus,
  //       numQuestions,
  //       testType: testType || "mcq",
  //       gptModel: gptModel || "gpt-4o",
  //       instructions: instructions || undefined,
  //       status: "draft",
  //     });

  //     // Ensure shareCode present in response
  //     test.shareCode = shareCode;

  //     // Insert mcq_tests
  //     const testInsert = await pool.query(
  //       `INSERT INTO mcq_tests (class_level, subject, total_questions, generated_by)
  //        VALUES ($1, $2, $3, $4)
  //        RETURNING id`,
  //       [classLevel, subject, numQuestions, teacherId],
  //     );

  //     const mcqTestId = testInsert.rows[0].id;

  //     // const questions = [];
  //     // let generatedCount = 0;

  //     // while (generatedCount < numQuestions) {
  //     //   const currentTopic = topics[generatedCount % topics.length];

  //     //   const questionData = await generateQuestion({
  //     //     mode: "science",
  //     //     scienceCategory: subject.toLowerCase(),
  //     //     classLevel,
  //     //     difficulty,
  //     //     chapter: 1,
  //     //     chapterTitle: currentTopic,
  //     //     questionNumber: generatedCount + 1,
  //     //     previousQuestions: [],
  //     //     isMcq: true,
  //     //     gptModel: gptModel || "gpt-4o",
  //     //   });

  //     //   if (!questionData) continue;

  //     //   // Ensure options exist
  //     //   // let options = questionData.options;

  //     //   // if (!options || options.length !== 4) {
  //     //   //   options = ["Option A", "Option B", "Option C", "Option D"];
  //     //   // }

  //     //   let options = Array.isArray(questionData.options)
  //     //     ? questionData.options
  //     //     : [];

  //     //   if (options.length !== 4) {
  //     //     console.warn("⚠️ Invalid options from AI, using fallback");
  //     //     options = ["Option A", "Option B", "Option C", "Option D"];
  //     //   }

  //     //   if (questionData.questionType === "mcq") {
  //     //     await saveMCQ(
  //     //       questionData.question,
  //     //       options,
  //     //       questionData.correctAnswer,
  //     //       mcqTestId
  //     //     );
  //     //   }

  //     //   const question = await storage.createCustomQuestion({
  //     //     testId: test.id,
  //     //     questionNumber: generatedCount + 1,
  //     //     question: questionData.question,
  //     //     questionType: "mcq",
  //     //     options: JSON.stringify(options),
  //     //     correctOption: questionData.correctOption || "A",
  //     //     correctAnswer: questionData.correctAnswer,
  //     //     explanation: questionData.explanation || "",
  //     //   });

  //     //   questions.push(question);
  //     //   generatedCount++;
  //     // }

  //     // await storage.updateCustomTest(test.id, { status: "published" });

  //     // res.json({
  //     //   test: {
  //     //     ...test,
  //     //     shareCode
  //     //   },
  //     //   questionsGenerated: questions.length,
  //     // });

  //     const questions = [];
  //     let generatedCount = 0;
  //     let attempts = 0;

  //     const MAX_ATTEMPTS = numQuestions * 2;

  //     console.log("🚀 Starting test generation...");

  //     while (generatedCount < numQuestions && attempts < MAX_ATTEMPTS) {
  //       attempts++;

  //       try {
  //         const currentTopic = topics[generatedCount % topics.length];

  //         console.log(`👉 Generating Q${generatedCount + 1}`);

  //         const questionData = await generateQuestion({
  //           mode: "science",
  //           scienceCategory: subject.toLowerCase(),
  //           classLevel,
  //           difficulty,
  //           chapter: 1,
  //           chapterTitle: currentTopic,
  //           questionNumber: generatedCount + 1,
  //           previousQuestions: [],
  //           isMcq: true,
  //           gptModel: gptModel || "gpt-4o",
  //         });

  //         if (!questionData || !questionData.question) {
  //           console.warn("⚠️ Invalid questionData, skipping...");
  //           continue;
  //         }

  //         // ✅ OPTIONS FIX
  //         let options = Array.isArray(questionData.options)
  //           ? questionData.options
  //           : [];

  //         if (options.length !== 4) {
  //           console.warn("⚠️ Invalid options from AI, using fallback");
  //           options = ["Option A", "Option B", "Option C", "Option D"];
  //         }

  //         // ✅ CORRECT OPTION FIX
  //         // const validOptions = ["A", "B", "C", "D"];
  //         // const correctOption = validOptions.includes(
  //         //   questionData.correctOption || ""
  //         // )
  //         //   ? questionData.correctOption!
  //         //   : "A";

  //         const validOptions = ["A", "B", "C", "D"];

  //         const correctOption =
  //           typeof questionData.correctOption === "string" &&
  //           validOptions.includes(questionData.correctOption)
  //             ? questionData.correctOption
  //             : "A";

  //         // ✅ CORRECT ANSWER FIX
  //         const correctAnswer = questionData.correctAnswer || options[0];

  //         // ✅ SAVE MCQ (optional)
  //         if (questionData.questionType === "mcq") {
  //           await saveMCQ(
  //             questionData.question,
  //             options,
  //             correctAnswer,
  //             mcqTestId,
  //           );
  //         }

  //         // ✅ SAVE QUESTION
  //         const question = await storage.createCustomQuestion({
  //           testId: test.id,
  //           questionNumber: generatedCount + 1,
  //           question: questionData.question,
  //           questionType: "mcq",
  //           options: JSON.stringify(options),
  //           correctOption,
  //           correctAnswer,
  //           explanation: questionData.explanation || "",
  //         });

  //         questions.push(question);
  //         generatedCount++;
  //       } catch (err) {
  //         console.error("❌ Error generating question:", err);
  //         continue;
  //       }
  //     }

  //     console.log(`✅ Generated ${generatedCount}/${numQuestions} questions`);

  //     if (generatedCount === 0) {
  //       return res.status(500).json({
  //         error: "Failed to generate any questions",
  //       });
  //     }

  //     // ✅ UPDATE STATUS
  //     await storage.updateCustomTest(test.id, { status: "published" });

  //     // ✅ RESPONSE
  //     res.json({
  //       test: {
  //         ...test,
  //         shareCode,
  //       },
  //       questionsGenerated: questions.length,
  //     });
  //   } catch (error) {
  //     console.error("Error generating test:", error);
  //     res.status(500).json({ error: "Failed to generate test" });
  //   }
  // });

  // Create and generate custom MCQ test
  app.post("/api/teacher/:teacherId/generate-test", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const {
        title,
        subject,
        classLevel,
        difficulty,
        syllabus,
        numQuestions,
        language,
        medium,
        testType,
        gptModel,
        instructions,
        currentTopic,
      } = req.body;

      // ✅ Normalize language (accept hi/hindi/en/english + keep other languages intact)
      const normalizedLanguage = (() => {
        const lang = (language || "").toString().trim().toLowerCase();
        if (lang === "hi" || lang === "hindi") return "hindi";
        if (lang === "en" || lang === "english") return "english";
        // For other language strings (e.g., french/german), pass through; default to English if empty
        return lang || "english";
      })();

      console.log("🔥 FINAL LANGUAGE:", normalizedLanguage);

      // Parse multiple topics from comma-separated syllabus input
      const topics = syllabus
        .split(",")
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 0)
        .slice(0, 4); // Limit to maximum 4 topics

      if (topics.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one topic is required" });
      }

      console.log(
        `[CUSTOM TEST] Generating ${numQuestions} ${difficulty} questions for ${subject} - Topics: ${topics.join(", ")} using ${gptModel || "gpt-4o-mini"}`,
      );
      console.log(
        `[CUSTOM TEST] Distribution: ${topics.length} topic(s), ~${Math.ceil(numQuestions / topics.length)} questions per topic`,
      );

      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Create custom test
      const test = await storage.createCustomTest({
        teacherId,
        title,
        subject,
        classLevel,
        difficulty,
        syllabus, // Store original comma-separated input
        numQuestions,
        language,
        testType: testType || "mcq",
        gptModel: gptModel || "gpt-4o-mini",
        instructions: instructions || undefined,
        status: "draft",
      });

      console.log(
        `[CUSTOM TEST] Created test ${test.id} with share code: ${test.shareCode}`,
      );

      // Generate questions using AI
      const questions = [];
      const generatedQuestionTexts = new Set<string>(); // Track exact question texts for deduplication
      const questionEmbeddings: number[][] = []; // Track embeddings for semantic similarity
      const previousQuestionsList: string[] = []; // Track last 5 questions for AI context
      const SIMILARITY_THRESHOLD = 0.9; // Cosine similarity threshold for duplicate detection

      // Determine if this is a science subject or language subject
      const scienceSubjects = ["physics", "chemistry", "biology", "general"];
      const isScience = scienceSubjects.includes(subject.toLowerCase());

      // const totalQuestions = Number(numQuestions);
      const totalQuestions = Number(numQuestions) || 10;

      // Generate exact number of questions using queue-based round-robin retry with deduplication
      // const maxAttemptsPerTopic = 5; // Increased for dedup retries
      const maxAttemptsPerTopic = 2;
      const maxTotalAttempts =
        totalQuestions * topics.length * maxAttemptsPerTopic;
      const perTopicFailures = new Map<string, number>(); // Track failures per topic
      let topicQueue = [...topics]; // Clone topics into a queue
      let totalAttempts = 0;
      let generatedCount = 0;
      const { selectedMedium, selectedScienceCategory } = req.body;

      topics.forEach((topic: string) => perTopicFailures.set(topic, 0));

      const studentId = req.body.studentId || "student-1";

      while (
        generatedCount < totalQuestions &&
        totalAttempts < maxTotalAttempts
      ) {
        const currentQuestionNumber = generatedCount + 1;


        // Check if we have any topics left to try
        if (topicQueue.length === 0) {
          console.error(
            `[CUSTOM TEST] All topics exhausted. Generated ${generatedCount}/${numQuestions}`,
          );
          break;
        }

        let questionGenerated = false;
        let attemptsThisQuestion = 0;

        // Try topics from the queue until we succeed or exhaust queue for this question
        while (
          !questionGenerated &&
          attemptsThisQuestion < topicQueue.length &&
          topicQueue.length > 0
        ) {
          const currentTopic = topicQueue.shift()!; // Pop from front
          const failures = perTopicFailures.get(currentTopic) || 0;

          const questionData = await generateQuestion({
            mode: isScience ? "science" : "language",
            // language: req.body.language || req.body.selectedMedium || "english",
            language: normalizedLanguage,
            scienceCategory: isScience ? subject.toLowerCase() : undefined,
            classLevel,
            difficulty,
            chapter: 1,
            // chapterTitle: currentTopic,
            chapterTitle: currentTopic ?? "General",
            questionNumber: currentQuestionNumber,
            previousQuestions: previousQuestionsList.slice(-5),
            isMcq: testType === "mcq",
            gptModel: gptModel || "gpt-4o-mini",
          });

          if (!questionData) {
            console.warn(
              "[CUSTOM TEST] Question generation returned null, retrying...",
            );
            totalAttempts++;
            continue;
          }

          // Skip permanently exhausted topics
          if (failures >= maxAttemptsPerTopic) {
            console.warn(
              `[CUSTOM TEST] Topic "${currentTopic}" permanently exhausted (${failures} failures)`,
            );
            attemptsThisQuestion++;
            continue;
          }

          try {
            const { classLevel, subject, difficulty, numQuestions } = req.body;
            const studentId = req.body.studentId || "student-1";
            totalAttempts++;
            attemptsThisQuestion++;
            console.log(
              `[CUSTOM TEST] Question ${currentQuestionNumber}/${numQuestions} - Topic "${currentTopic}" (failures: ${failures}/${maxAttemptsPerTopic}, previous questions: ${previousQuestionsList.length})`,
            );
            // Check for exact duplicate
            const questionText = questionData.question.trim().toLowerCase();
            if (generatedQuestionTexts.has(questionText)) {
              console.warn(
                `[CUSTOM TEST] ⚠️  EXACT DUPLICATE DETECTED: Question text already exists. Retrying...`,
              );
              throw new Error("Exact duplicate question detected");
            }

            // Check for semantic similarity (paraphrased duplicates)
            // const embedding = await getEmbedding(questionData.question);
            if (!questionData?.question) {
              throw new Error("Invalid question generated");
            }

            // Save question to database
            const question = await storage.createCustomQuestion({
              testId: test.id,
              questionNumber: currentQuestionNumber,
              question: questionData.question,
              questionType: questionData.questionType,
              options: questionData.options
                ? JSON.stringify(questionData.options)
                : null,
              correctOption: questionData.correctOption || null,
              correctAnswer: questionData.correctAnswer,
              explanation: questionData.explanation || "",
            });

            // Track this question
            // questions.push(question);
            questions.push(questionData);
            generatedQuestionTexts.add(questionText);
            // questionEmbeddings.push(embedding);
            previousQuestionsList.push(questionData.question);
            generatedCount++;

            questionGenerated = true;
            perTopicFailures.set(currentTopic, 0); // Reset failures on success
            topicQueue.push(currentTopic); // Push back to end of queue
            console.log(
              `[CUSTOM TEST] ✓ Question ${currentQuestionNumber}/${numQuestions} generated from topic "${currentTopic}" (unique, semantic check passed)`,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error(
              `[CUSTOM TEST] ✗ Failed question ${currentQuestionNumber} with topic "${currentTopic}":`,
              errorMessage,
            );

            // Increment failure count
            const newFailures = failures + 1;
            perTopicFailures.set(currentTopic, newFailures);

            // Only push back if still has retry budget
            if (newFailures < maxAttemptsPerTopic) {
              topicQueue.push(currentTopic);
            } else {
              console.warn(
                `[CUSTOM TEST] Topic "${currentTopic}" removed from queue (reached ${maxAttemptsPerTopic} failures)`,
              );
            }
          }
        }

        if (!questionGenerated) {
          console.warn("Retrying question generation...");
          continue;
        }
      }

      console.log(
        `[CUSTOM TEST] Generated ${questions.length}/${numQuestions} questions successfully across ${topics.length} topic(s)`,
      );

      // Update test status to published
      await storage.updateCustomTest(test.id, { status: "published" });

      res.json({ test, questionsGenerated: questions.length });
    } catch (error: any) {
      console.error("🔥 FULL ERROR:", error);

      res.status(500).json({
        message: error?.message,
        stack: error?.stack,
      });
    }
  });

  //   app.post("/api/student/generate-custom-test", async (req, res) => {
  //   try {
  //      console.log("🔥 NEW STUDENT ROUTE HIT");
  //     const {
  //       subject,
  //       classLevel,
  //       difficulty,
  //       syllabus,
  //       numQuestions,
  //       testType,
  //       gptModel,
  //       board,
  //       mode,
  //       studentId
  //     } = req.body;

  //     // if (!studentId) {
  //     //   return res.status(400).json({ error: "studentId required" });
  //     // }

  //     const finalStudentId = studentId || "guest-student";

  //     const topics = syllabus
  //       .split(",")
  //       .map((t: string) => t.trim())
  //       .filter((t: string) => t.length > 0)
  //       .slice(0, 4);

  //     if (topics.length === 0) {
  //       return res.status(400).json({ error: "At least one topic required" });
  //     }

  //     // 🔥 INSERT TEST ONLY ONCE (OUTSIDE LOOP)
  //     const testInsert = await pool.query(
  //       `INSERT INTO mcq_tests (class_level, subject, total_questions, generated_by)
  //        VALUES ($1, $2, $3, $4)
  //        RETURNING id`,
  //       [classLevel, subject, numQuestions, finalStudentId]
  //     );

  //     const mcqTestId = testInsert.rows[0].id;

  //     const questions = [];
  //     let generatedCount = 0;

  //     const scienceSubjects = ["physics", "chemistry", "biology", "general"];
  //     const isScience = scienceSubjects.includes(subject.toLowerCase());

  //     while (generatedCount < numQuestions) {
  //       const currentTopic = topics[generatedCount % topics.length];

  //       const questionData = await generateQuestion({
  //         mode: isScience ? "science" : "language",
  //         language: isScience ? undefined : subject,
  //         scienceCategory: isScience ? subject.toLowerCase() : undefined,
  //         classLevel,
  //         difficulty,
  //         chapter: 1,
  //         chapterTitle: currentTopic,
  //         questionNumber: generatedCount + 1,
  //         previousQuestions: [],
  //         isMcq: testType === "mcq",
  //         gptModel: gptModel || "gpt-4o",
  //       });

  //       // 🔥 Save MCQ
  //       if (questionData.questionType === "mcq") {
  //         await saveMCQ(
  //           questionData.question,
  //           questionData.options || [],
  //           questionData.correctAnswer,
  //           mcqTestId
  //         );
  //       }

  //       questions.push({
  //         questionNumber: generatedCount + 1,
  //         question: questionData.question,
  //         questionType: questionData.questionType,
  //         options: questionData.options,
  //       });

  //       generatedCount++;
  //     }

  //     res.json({
  //       testId: mcqTestId,
  //       questions,
  //       questionsGenerated: questions.length,
  //     });

  //   } catch (error) {
  //     console.error("Student test generation error:", error);
  //     res.status(500).json({ error: "Failed to generate test" });
  //   }
  // });

  // Student custom test generation endpoint
  app.post("/api/student/generate-custom-test", async (req, res) => {
    try {
      const {
        subject,
        classLevel,
        difficulty,
        syllabus,
        numQuestions,
        testType,
        subjectLanguage,
        scienceCategory,
        medium,
        gptModel,
        board,
        mode,
      } = req.body;
      const { sessionId } = req.body;
      console.log("numQuestions:", numQuestions);
      console.log("numQuestions raw:", numQuestions);
      console.log("typeof numQuestions:", typeof numQuestions);
      console.log("numQuestions raw:", numQuestions);

      console.log(
        `[STUDENT CUSTOM TEST] Generating ${numQuestions} ${difficulty} questions for ${subject} (${board} board)`,
      );

      // Parse topics from comma-separated syllabus input
      const topics = syllabus
        .split(",")
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 0)
        .slice(0, 4);

      if (topics.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one topic is required" });
      }

      // Create a temporary test session for the student
      const testId = `student-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Store test metadata in memory for this session
      const testSession = {
        id: testId,
        subject,
        classLevel,
        difficulty,
        topics,
        numQuestions,
        testType,
        subjectLanguage,
        medium,
        scienceCategory,
        gptModel: gptModel || "gpt-4o",
        board: board || "CBSE",
        mode,
        questions: [] as any[],
        createdAt: new Date(),
      };
      const totalQuestions = parseInt(numQuestions, 10) || 0;

      if (!totalQuestions || totalQuestions <= 0) {
        return res.status(400).json({ error: "Invalid number of questions" });
      }

      // Generate questions using the same logic as teacher tests
      const scienceSubjects = ["physics", "chemistry", "biology", "general"];
      const isScience = scienceSubjects.includes(subject.toLowerCase());

      const generatedQuestionTexts = new Set<string>();
      const questionEmbeddings: number[][] = [];
      const previousQuestionsList: string[] = [];
      const SIMILARITY_THRESHOLD = 0.8;

      const maxAttemptsPerTopic = 8;
      const maxTotalAttempts =
        totalQuestions * topics.length * maxAttemptsPerTopic;
      const perTopicFailures = new Map<string, number>();
      let topicQueue = [...topics];
      let totalAttempts = 0;
      let generatedCount = 0;

      topics.forEach((topic: string) => perTopicFailures.set(topic, 0));

      // 🔥 INSERT TEST ONCE (BEFORE LOOP)
      const studentId = req.body.studentId || "student-1";

      const testInsert = await pool.query(
        `INSERT INTO mcq_tests 
          (class_level, subject, difficulty, total_questions,medium, generated_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
        [classLevel, subject, difficulty, numQuestions, medium, studentId],
      );

      const mcqTestId = testInsert.rows[0].id;

      const existingTexts = new Set<string>();
      // const existingEmbeddings: number[][] = [];

      let totalGenerated = 0;
      let safetyCounter = 0;
      const MAX_TOTAL_ATTEMPTS = numQuestions * 5;
      const chunkSize = 10;

      async function generateChunk(requestedCount: number) {
        const mediumInstruction =
          // medium === "hindi"
          medium?.toLowerCase() === "hindi"
            ? "Generate all questions strictly in Hindi language."
            : "Generate all questions strictly in English language.";

        // const response = await openai.chat.completions.create({
        //   model: testSession.gptModel,
        //   temperature: 0.8,
        //   messages: [
        //     {
        let raw: string | undefined;

        if (testSession.gptModel?.startsWith("hf-")) {
          // 🤗 HuggingFace
          raw = await generateFromHF(`
        Generate ${requestedCount} unique MCQ questions.

        Subject language: ${subjectLanguage}

        ${mediumInstruction}

        Return strictly in JSON array format.
        `);
        } else {
          // 🤖 OpenAI
          const response = await openai.chat.completions.create({
            model: testSession.gptModel,
            temperature: 0.8,
            messages: [
              {
                role: "user",
                content: `
        // Generate ${requestedCount} unique ${difficulty} ${subject} MCQ questions for Class ${classLevel}.
        // Generate ${chunkSize} ${difficulty} questions for ${subjectLanguage || scienceCategory}.
        // Generate ${numQuestions} ${difficulty} questions for ${subject}.

        Generate ${requestedCount} unique MCQ questions.

        Subject language: ${subjectLanguage}

        ${mediumInstruction}

        IMPORTANT:
        - If language is "hindi", generate all questions, options and correctAnswer strictly in Hindi.
        - If medium is Hindi, DO NOT generate English text. All questions, options and answers MUST be Hindi.
        - If language is "english", generate all questions everything strictly in English.


      Return STRICTLY in JSON array format:

      [
        {
          "question": "...",
          "options": ["A","B","C","D"],
          "correctAnswer": "...",
          "questionType": "mcq"
        }
      ]

      Rules:
      - No duplicate questions
      - All questions must test different concepts
      - No explanation outside JSON
      `,
              },
            ],
          });
          raw = response.choices?.[0]?.message?.content ?? undefined;
        }
        if (!raw) throw new Error("Empty AI response");

        const clean = raw
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const questions = JSON.parse(clean);

        let saved = 0;

        for (const q of questions) {
          const text = q.question.trim().toLowerCase();

          const verification = await verifyAnswer(
            q.question,
            q.correctAnswer,
            "language",
            testSession.gptModel,
          );

          if (!verification.isValid) {
            console.log("❌ Invalid answer detected");
            continue;
          }

          if (existingTexts.has(text)) continue;

          await saveMCQ(
            q.question,
            q.options || [],
            q.correctAnswer.trim(),
            mcqTestId,
          );

          existingTexts.add(text);
          testSession.questions.push(q);

          saved++;
          totalGenerated++;

          console.log(`✅ Progress: ${totalGenerated}/${numQuestions}`);
        }

        return saved;
      }

      // ================================
      // CONTROLLER
      // ================================

      let remaining = totalQuestions;

      while (remaining > 0 && safetyCounter < MAX_TOTAL_ATTEMPTS) {
        const currentChunk = Math.min(chunkSize, remaining);

        console.log(`🚀 Generating chunk of ${currentChunk}`);

        const generatedNow = await generateChunk(currentChunk);

        remaining -= generatedNow;
        safetyCounter++;
      }

      if (totalGenerated < numQuestions) {
        console.error("❌ Could not reach required question count");

        return res.status(500).json({
          error: `Only ${totalGenerated}/${numQuestions} questions generated`,
        });
      }

      console.log("🎉 All questions generated successfully");

      return res.status(200).json({
        testId: testSession.id,
        questions: testSession.questions,
        questionsGenerated: totalGenerated,
      });
    } catch (error: any) {
      console.error("FULL ERROR:", error);

      res.status(500).json({
        error: error?.message || "Server error",
        stack: error?.stack,
      });
    }
  });

  // async function generateChunk(chunkSize: number) {
  //   let generated = 0;
  //   let attempts = 0;
  //   const maxAttempts = chunkSize * 5;

  //   while (generated < chunkSize && attempts < maxAttempts) {
  //     attempts++;

  //         try {
  //           const questionData = await generateQuestion({
  //             mode: isScience ? "science" : "language",
  //             language: isScience ? undefined : subject,
  //             scienceCategory: isScience ? subject.toLowerCase() : undefined,
  //             classLevel,
  //             difficulty,
  //             chapter: 1,
  //             chapterTitle: subject,
  //             questionNumber: generated + 1,
  //             previousQuestions: testSession.questions.slice(-5),
  //             isMcq: testType === "mcq",
  //             gptModel: testSession.gptModel,
  //           });

  //           if (!questionData?.question) continue;

  //           const text = questionData.question.trim().toLowerCase();

  //           // Exact duplicate
  //           if (existingTexts.has(text)) continue;

  //           const embedding = await getEmbedding(questionData.question);

  //           let duplicate = false;
  //           for (let emb of existingEmbeddings) {
  //             if (cosineSimilarity(embedding, emb) > SIMILARITY_THRESHOLD) {
  //               duplicate = true;
  //               break;
  //             }
  //           }

  //           if (duplicate) continue;

  //           // SAVE TO DB
  //           await saveMCQ(
  //             questionData.question,
  //             questionData.options || [],
  //             questionData.correctAnswer,
  //             mcqTestId
  //           );

  //           existingTexts.add(text);
  //           existingEmbeddings.push(embedding);

  //           testSession.questions.push({
  //             question: questionData.question,
  //             questionType: questionData.questionType,
  //             options: questionData.options,
  //             correctAnswer: questionData.correctAnswer,
  //             explanation: questionData.explanation || "",
  //           });

  //           generated++;

  //           console.log(`✅ Chunk progress: ${generated}/${chunkSize}`);

  //             const response = await openai.chat.completions.create({
  //             model: testSession.gptModel,
  //             messages: [
  //               {
  //                 role: "user",
  //                 content: `
  //           Generate ${chunkSize} unique ${difficulty} ${subject} MCQ questions for Class ${classLevel}.

  //           Return strictly in JSON array format like:

  //           [
  //             {
  //               "question": "...",
  //               "options": ["A", "B", "C", "D"],
  //               "correctAnswer": "...",
  //               "questionType": "mcq",
  //               "qualityScore": 8
  //             }
  //           ]

  //           Rules:
  //           - No duplicates.
  //           - Ensure correct answers are accurate.
  //           - Quality score minimum 6.
  //           - No explanation outside JSON.
  //           `
  //               }
  //             ],
  //             temperature: 0.7
  //           });

  //           let content = response.choices[0]?.message?.content?.trim();

  //           content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  //           const questions = JSON.parse(content);

  //           // Controller
  //           const chunkSize = 10;
  //           let remaining = numQuestions;

  //           while (remaining > 0) {
  //             const currentChunk = Math.min(chunkSize, remaining);

  //             console.log(`🚀 Generating chunk of ${currentChunk}`);

  //             await generateChunk(currentChunk);

  //             remaining -= currentChunk;
  //           }

  //     console.log("🎉 All questions generated");

  //     // FINAL RESPONSE
  //     return res.status(200).json({
  //       testId: testSession.id,
  //       questions: testSession.questions,
  //       questionsGenerated: testSession.questions.length,
  //     });

  //       } catch (error) {
  //         console.error(error);
  //         res.status(500).json({ error: "Failed to generate custom test" });
  //       }

  //    }
  //  }
  // });

  //   console.log("🎉 All questions generated");

  //   // FINAL RESPONSE
  //   return res.status(200).json({
  //     testId: testSession.id,
  //     questions: testSession.questions,
  //     questionsGenerated: testSession.questions.length,
  //   });

  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ error: "Failed to generate custom test" });
  // }

  //       const seenQuestions = new Set<string>();

  //         async function generateChunk(
  //         chunkSize: number,
  //         existingTexts: Set<string>,
  //         existingEmbeddings: number[][],
  //         testId: string
  //       ) {
  //         let generatedCount = 0;
  //         let totalAttempts = 0;
  //         const maxTotalAttempts = chunkSize * 4;

  //       while (generatedCount < chunkSize && totalAttempts < maxTotalAttempts) {
  //         const currentQuestionNumber = generatedCount + 1;

  //         if (topicQueue.length === 0) {
  //           console.error(`[STUDENT CUSTOM TEST] All topics exhausted. Generated ${generatedCount}/${numQuestions}`);
  //           break;
  //         }

  //         let questionGenerated = false;
  //         let attemptsThisQuestion = 0;

  //         while (!questionGenerated && attemptsThisQuestion < topicQueue.length && topicQueue.length > 0) {
  //           const currentTopic = topicQueue.shift()!;
  //           const failures = perTopicFailures.get(currentTopic) || 0;

  //           if (failures >= maxAttemptsPerTopic) {
  //             console.warn(`[STUDENT CUSTOM TEST] Topic "${currentTopic}" permanently exhausted`);
  //             attemptsThisQuestion++;
  //             continue;
  //           }

  //           try {
  //             totalAttempts++;
  //             attemptsThisQuestion++;

  //             const questionData = await generateQuestion({
  //               mode: isScience ? "science" : "language",
  //               language: isScience ? undefined : subject,
  //               scienceCategory: isScience ? subject.toLowerCase() : undefined,
  //               classLevel,
  //               difficulty,
  //               chapter: 1,
  //               chapterTitle: currentTopic,
  //               questionNumber: currentQuestionNumber,
  //               previousQuestions: previousQuestionsList.slice(-5),
  //               isMcq: testType === "mcq",
  //               gptModel: testSession.gptModel,
  //             });

  //             if (!questionData || !questionData.question) {
  //               console.warn("⚠ Invalid question structure");
  //               continue;
  //             }

  //             if (existingTexts.has(text)) continue;

  //             const embedding = await getEmbedding(questionData.question);

  //             function simplify(text: string) {
  //               return text
  //                 .toLowerCase()
  //                 .replace(/[^a-z0-9 ]/g, "")
  //                 .replace(/\b(what|is|the|state|define|explain|of|a|an)\b/g, "")
  //                 .replace(/\s+/g, " ")
  //                 .trim();
  //             }

  //             const simplified = simplify(questionData.question);

  //             if (seenQuestions.has(simplified)) {
  //               console.log("⚠ Strong duplicate skipped:", questionData.question.substring(0, 50));
  //               continue;
  //             }

  //             seenQuestions.add(simplified);

  //             // // Check for exact duplicate
  //             // const questionText = questionData.question.trim().toLowerCase();
  //             // if (generatedQuestionTexts.has(questionText)) {
  //             //   console.warn(`[STUDENT CUSTOM TEST] ⚠️  EXACT DUPLICATE DETECTED`);
  //             //   throw new Error("Exact duplicate question detected");
  //             // }

  //               // 🔹 Exact duplicate check
  //               // const questionText = questionData.question.trim().toLowerCase();

  //               // if (generatedQuestionTexts.has(questionText)) {
  //               //   console.warn("⚠ Exact duplicate skipped");
  //               //   continue;
  //               // }

  //               let duplicate = false;
  //               for (let emb of existingEmbeddings) {
  //                 if (cosineSimilarity(embedding, emb) > SIMILARITY_THRESHOLD) {
  //                   duplicate = true;
  //                   break;
  //                 }
  //               }

  //             // // Check for semantic similarity
  //             // const embedding = await getEmbedding(questionData.question);
  //             // for (let i = 0; i < questionEmbeddings.length; i++) {
  //             //   const similarity = cosineSimilarity(embedding, questionEmbeddings[i]);
  //             //   if (similarity > SIMILARITY_THRESHOLD) {
  //             //     console.warn(`[STUDENT CUSTOM TEST] ⚠️  SEMANTIC DUPLICATE DETECTED: Similarity ${similarity.toFixed(3)}`);
  //             //     throw new Error(`Semantic duplicate detected (similarity: ${similarity.toFixed(3)})`);
  //             //   }
  //             // }

  //             // 🔹 Semantic duplicate check (ONLY if exact passed)
  //               // const embedding = await getEmbedding(questionData.question);

  //               let isDuplicate = false;

  //               for (let i = 0; i < questionEmbeddings.length; i++) {
  //                 const similarity = cosineSimilarity(
  //                   embedding,
  //                   questionEmbeddings[i]
  //                 );

  //                 if (similarity > SIMILARITY_THRESHOLD) {
  //                   console.warn(
  //                     `⚠ Semantic duplicate skipped (${similarity.toFixed(3)})`
  //                   );
  //                   isDuplicate = true;
  //                   break;
  //                 }
  //               }

  //               if (isDuplicate) continue;

  //             // 🔥 Save MCQ to database (only if it's MCQ)
  //             if (questionData.questionType === "mcq") {
  //               await saveMCQ(
  //                 questionData.question,
  //                 questionData.options || [],
  //                 questionData.correctAnswer,
  //                 mcqTestId
  //               );
  //             }

  //             existingTexts.add(text);
  //             existingEmbeddings.push(embedding);

  //             // Store question in session
  //             testSession.questions.push({
  //               questionNumber: currentQuestionNumber,
  //               question: questionData.question,
  //               questionType: questionData.questionType,
  //               options: questionData.options,
  //               correctOption: questionData.correctOption,
  //               correctAnswer: questionData.correctAnswer,
  //               explanation: questionData.explanation || "",
  //             });

  //             generatedQuestionTexts.add(questionText);
  //             questionEmbeddings.push(embedding);
  //             previousQuestionsList.push(questionData.question);
  //             generatedCount++;
  //             questionGenerated = true;
  //             perTopicFailures.set(currentTopic, 0);
  //             topicQueue.push(currentTopic);
  //             console.log(`[STUDENT CUSTOM TEST] ✓ Question ${currentQuestionNumber}/${numQuestions} generated (unique)`);
  //           } catch (error) {
  //             const errorMessage = error instanceof Error ? error.message : String(error);
  //             console.error(`[STUDENT CUSTOM TEST] ✗ Failed question ${currentQuestionNumber}:`, errorMessage);

  //             const newFailures = failures + 1;
  //             perTopicFailures.set(currentTopic, newFailures);

  //             if (newFailures < maxAttemptsPerTopic) {
  //               topicQueue.push(currentTopic);
  //             } else {
  //               console.warn(`[STUDENT CUSTOM TEST] Topic "${currentTopic}" removed from queue`);
  //             }
  //           }
  //         }

  //         if (!questionGenerated) {
  //           console.error(`[STUDENT CUSTOM TEST] Could not generate question ${currentQuestionNumber}`);
  //           continue;
  //         }
  //       }

  //             if (generatedCount < totalQuestions) {
  //         return res.status(200).json({
  //           warning: `Only ${generatedCount} questions could be generated`,
  //           questions: testSession.questions,
  //           questionsGenerated: generatedCount,
  //           requested: numQuestions,
  //           partial: true,
  //         });
  //       }

  //       console.log(`✅ Chunk progress: ${generatedCount}/${chunkSize}`);
  //       res.json({
  //         testId: testSession.id,
  //         questions: testSession.questions,
  //         questionsGenerated: generatedCount
  //       });
  //       } catch (error) {
  //         console.error("Error generating student custom test:", error);
  //         res.status(500).json({ error: "Failed to generate custom test" });
  //       }
  //     }
  //   }
  // });

  // Get test details for teacher (with full questions and answers)
  // app.get("/api/teacher/:teacherId/tests/:testId", async (req, res) => {
  //   try {
  //     const { teacherId, testId } = req.params;
  //     const test = await storage.getCustomTest(testId);

  //     if (!test || test.teacherId !== teacherId) {
  //       return res.status(404).json({ error: "Test not found" });
  //     }

  //     const questions = await storage.getCustomQuestions(testId);

  //     // Parse options for teacher view
  //     const questionsWithParsedOptions = questions.map((q) => ({
  //       ...q,
  //       options: q.options ? JSON.parse(q.options) : null,
  //     }));

  //     res.json({ test, questions: questionsWithParsedOptions });
  //   } catch (error) {
  //     console.error("Error fetching test details:", error);
  //     res.status(500).json({ error: "Failed to fetch test details" });
  //   }
  // });

  // app.get("/api/teacher/:teacherId/tests/:testId", async (req, res) => {
  //   try {
  //     const { teacherId, testId } = req.params;

  //     const test = await storage.getCustomTest(testId);

  //     if (!test || test.teacherId !== teacherId) {
  //       return res.status(404).json({ error: "Test not found" });
  //     }

  //     const questions = await storage.getCustomQuestions(testId);

  //     const parsedQuestions = questions.map((q) => ({
  //       ...q,
  //       options: q.options ? JSON.parse(q.options) : null,
  //     }));

  //     res.json({
  //       test,
  //       questions: parsedQuestions,
  //     });

  //   } catch (error) {
  //     console.error("Error fetching test:", error);
  //     res.status(500).json({ error: "Failed to fetch test" });
  //   }
  // });

  app.get("/api/teacher/:teacherId/tests/:testId", async (req, res) => {
    try {
      const { teacherId, testId } = req.params;

      const test = await storage.getCustomTest(testId);

      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      const questions = await storage.getCustomQuestions(testId);

      const parsedQuestions = questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      }));

      res.json({
        test,
        questions: parsedQuestions,
      });
    } catch (error) {
      console.error("Error fetching test questions:", error);

      res.status(500).json({
        error: "Failed to fetch test questions",
      });
    }
  });
  app.get("/api/teacher/:teacherId/tests", async (req, res) => {
    try {
      const { teacherId } = req.params;

      const tests = await storage.getCustomTestsByTeacher(teacherId);

      res.json(tests);
    } catch (error) {
      console.error("Error fetching teacher tests:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  //   app.post("/api/student/generate-custom-test", (req, res) => {
  //   const data = req.body;

  //   res.status(200).json({
  //     msg: "custom test generated",
  //     data,
  //   });
  // });
  // app.post("/api/student/generate-custom-test", async (req, res) => {
  //   try {
  //     // full generation logic
  //   } catch (error) {
  //     res.status(500).json({ error: "Failed to generate custom test" });
  //   }
  // });

  // Manual edit question
  app.patch(
    "/api/teacher/:teacherId/question/:questionId/edit",
    async (req, res) => {
      try {
        const { teacherId, questionId } = req.params;
        const { question, options, correctOption, correctAnswer, explanation } =
          req.body;

        console.log(
          `[QUESTION EDIT] Teacher ${teacherId} editing question ${questionId}`,
        );

        const existingQuestion = await storage.getCustomQuestion(questionId);
        if (!existingQuestion) {
          return res.status(404).json({ error: "Question not found" });
        }

        // Verify teacher owns this question's test
        const test = await storage.getCustomTest(existingQuestion.testId);
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }
        if (test.teacherId !== teacherId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        // Validate inputs
        if (!question || question.trim().length < 5) {
          return res
            .status(400)
            .json({ error: "Question must be at least 5 characters" });
        }
        if (!explanation || explanation.trim().length < 5) {
          return res
            .status(400)
            .json({ error: "Explanation must be at least 5 characters" });
        }

        const updates: Partial<typeof existingQuestion> = {
          question: question.trim(),
          explanation: explanation.trim(),
        };

        if (existingQuestion.questionType === "mcq") {
          // Validate MCQ options
          if (!options || !Array.isArray(options)) {
            return res
              .status(400)
              .json({ error: "MCQ questions must have options array" });
          }

          if (!correctOption || !["A", "B", "C", "D"].includes(correctOption)) {
            return res.status(400).json({
              error: "Must select a valid correct option (A, B, C, or D)",
            });
          }

          // Find which option was marked as correct
          const originalCorrectIndex = correctOption.charCodeAt(0) - 65;
          const correctOptionText = options[originalCorrectIndex];

          if (!correctOptionText || correctOptionText.trim().length === 0) {
            return res
              .status(400)
              .json({ error: "The selected correct option cannot be empty" });
          }

          // Filter out empty options while preserving the correct option
          const validOptions = options
            .map((opt: string, idx: number) => ({
              text: opt?.trim() || "",
              index: idx,
            }))
            .filter((opt) => opt.text.length > 0);

          if (validOptions.length < 2) {
            return res.status(400).json({
              error: "MCQ questions must have at least 2 valid options",
            });
          }

          // Find the new index of the correct option after filtering
          const newCorrectIndex = validOptions.findIndex(
            (opt) => opt.index === originalCorrectIndex,
          );
          if (newCorrectIndex === -1) {
            return res.status(400).json({
              error:
                "The correct option was removed. Please select a different correct option.",
            });
          }

          // Map the new correct option letter
          const newCorrectOption = String.fromCharCode(65 + newCorrectIndex);
          const finalOptions = validOptions.map((opt) => opt.text);

          updates.options = JSON.stringify(finalOptions);
          updates.correctOption = newCorrectOption;
          updates.correctAnswer = finalOptions[newCorrectIndex];
        } else {
          // Open-ended question
          if (!correctAnswer || correctAnswer.trim().length < 5) {
            return res
              .status(400)
              .json({ error: "Correct answer must be at least 5 characters" });
          }
          updates.correctAnswer = correctAnswer.trim();
        }

        const updatedQuestion = await storage.updateCustomQuestion(
          questionId,
          updates,
        );
        if (!updatedQuestion) {
          return res.status(500).json({ error: "Failed to update question" });
        }

        console.log(
          `[QUESTION EDIT] Question ${questionId} updated successfully`,
        );

        res.json({
          ...updatedQuestion,
          options: updatedQuestion.options
            ? JSON.parse(updatedQuestion.options)
            : null,
        });
      } catch (error) {
        console.error("Error editing question:", error);
        res.status(500).json({ error: "Failed to edit question" });
      }
    },
  );

  // AI-assisted edit question
  app.post(
    "/api/teacher/:teacherId/question/:questionId/ai-edit",
    async (req, res) => {
      try {
        const { teacherId, questionId } = req.params;
        const { feedback } = req.body;

        if (!feedback || feedback.trim().length < 10) {
          return res.status(400).json({
            error: "Please provide detailed feedback (at least 10 characters)",
          });
        }

        console.log(
          `[AI QUESTION EDIT] Teacher ${teacherId} requesting AI edit for question ${questionId}`,
        );
        console.log(
          `[AI QUESTION EDIT] Feedback: "${feedback.substring(0, 50)}..."`,
        );

        const existingQuestion = await storage.getCustomQuestion(questionId);
        if (!existingQuestion) {
          return res.status(404).json({ error: "Question not found" });
        }

        // Verify teacher owns this question's test
        const test = await storage.getCustomTest(existingQuestion.testId);
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }
        if (test.teacherId !== teacherId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        // Parse options if MCQ
        const parsedOptions = existingQuestion.options
          ? JSON.parse(existingQuestion.options)
          : undefined;

        // Call AI to improve the question
        const improvedQuestion = await improveQuestion({
          originalQuestion: existingQuestion.question,
          questionType: existingQuestion.questionType,
          options: parsedOptions,
          correctAnswer: existingQuestion.correctAnswer,
          explanation: existingQuestion.explanation,
          teacherFeedback: feedback.trim(),
          subject: test.subject,
          classLevel: test.classLevel,
          difficulty: test.difficulty,
          gptModel: test.gptModel,
        });

        // Validate AI response
        if (
          !improvedQuestion.question ||
          improvedQuestion.question.trim().length < 5
        ) {
          console.error(
            `[AI QUESTION EDIT] Invalid AI response: question too short`,
          );
          return res.status(500).json({
            error:
              "AI generated an invalid question. Please try again with different feedback.",
          });
        }
        if (
          !improvedQuestion.explanation ||
          improvedQuestion.explanation.trim().length < 5
        ) {
          console.error(
            `[AI QUESTION EDIT] Invalid AI response: explanation too short`,
          );
          return res.status(500).json({
            error: "AI generated an invalid explanation. Please try again.",
          });
        }

        const updates: Partial<typeof existingQuestion> = {
          question: improvedQuestion.question.trim(),
          explanation: improvedQuestion.explanation.trim(),
        };

        if (existingQuestion.questionType === "mcq") {
          // Validate MCQ improvements
          if (
            !improvedQuestion.options ||
            !Array.isArray(improvedQuestion.options) ||
            improvedQuestion.options.length < 2
          ) {
            console.error(
              `[AI QUESTION EDIT] Invalid AI response: insufficient options`,
            );
            return res.status(500).json({
              error: "AI generated invalid options. Please try again.",
            });
          }
          if (
            !improvedQuestion.correctOption ||
            !["A", "B", "C", "D"].includes(improvedQuestion.correctOption)
          ) {
            console.error(
              `[AI QUESTION EDIT] Invalid AI response: invalid correct option`,
            );
            return res.status(500).json({
              error:
                "AI generated an invalid correct option. Please try again.",
            });
          }

          const correctIndex =
            improvedQuestion.correctOption.charCodeAt(0) - 65;
          if (correctIndex >= improvedQuestion.options.length) {
            console.error(
              `[AI QUESTION EDIT] Invalid AI response: correct option out of bounds`,
            );
            return res.status(500).json({
              error: "AI generated an inconsistent question. Please try again.",
            });
          }

          // Validate options are non-empty
          const validOptions = improvedQuestion.options.filter(
            (opt: string) => opt && opt.trim().length > 0,
          );
          if (validOptions.length < improvedQuestion.options.length) {
            console.error(`[AI QUESTION EDIT] AI generated empty options`);
            return res
              .status(500)
              .json({ error: "AI generated empty options. Please try again." });
          }

          updates.options = JSON.stringify(improvedQuestion.options);
          updates.correctOption = improvedQuestion.correctOption;
          updates.correctAnswer = improvedQuestion.options[correctIndex];
        } else {
          // Validate open-ended improvements
          if (
            !improvedQuestion.correctAnswer ||
            improvedQuestion.correctAnswer.trim().length < 5
          ) {
            console.error(
              `[AI QUESTION EDIT] Invalid AI response: answer too short`,
            );
            return res.status(500).json({
              error: "AI generated an invalid answer. Please try again.",
            });
          }
          updates.correctAnswer = improvedQuestion.correctAnswer.trim();
          // Clear MCQ-specific fields for open-ended questions
          updates.options = null;
          updates.correctOption = null;
        }

        const updatedQuestion = await storage.updateCustomQuestion(
          questionId,
          updates,
        );
        if (!updatedQuestion) {
          return res
            .status(500)
            .json({ error: "Failed to save improved question" });
        }

        console.log(
          `[AI QUESTION EDIT] Question ${questionId} improved successfully using AI`,
        );

        res.json({
          ...updatedQuestion,
          options: updatedQuestion.options
            ? JSON.parse(updatedQuestion.options)
            : null,
        });
      } catch (error: any) {
        console.error("Error in AI-assisted edit:", error);
        res.status(500).json({
          error: error.message || "Failed to improve question with AI",
        });
      }
    },
  );

  // Get custom test by share code (for students)
  app.get("/api/custom-test/:shareCode", async (req, res) => {
    try {
      const { shareCode } = req.params;

      const test = await storage.getCustomTestByShareCode(shareCode);

      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      const questions = await storage.getCustomQuestions(test.id);

      // Don't send correct answers to students
      const questionsForStudent = questions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        question: q.question,
        questionType: q.questionType,
        options: q.options ? JSON.parse(q.options) : null,
      }));

      res.json({ test, questions: questionsForStudent });
    } catch (error) {
      console.error("Error fetching custom test:", error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  // Submit answer for custom test question
  app.post("/api/custom-test/evaluate", async (req, res) => {
    try {
      const { testId, questionId, studentAnswer } = req.body;

      const test = await storage.getCustomTest(testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      const questions = await storage.getCustomQuestions(testId);
      const question = questions.find((q) => q.id === questionId);

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // For MCQ, check if answer matches
      if (question.questionType === "mcq") {
        const isCorrect =
          studentAnswer.trim().toUpperCase() === question.correctOption;
        res.json({
          isCorrect,
          correctAnswer: question.correctAnswer,
          correctOption: question.correctOption,
          explanation: question.explanation,
          score: isCorrect ? 10 : 0,
        });
      } else {
        // For open-ended, use AI to evaluate
        const evaluation = await evaluateAnswer({
          question: question.question,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          language: test.subject,
          classLevel: test.classLevel,
          difficulty: test.difficulty,
          gptModel: test.gptModel || "gpt-4o-mini",
        });

        res.json({
          ...evaluation,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        });
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
      res.status(500).json({ error: "Failed to evaluate answer" });
    }
  });

  // Start a new test session
  // app.post("/api/test/start", async (req, res) => {
  //   try {
  //     const {
  //       mode,
  //       language,
  //       scienceCategory,
  //       class: classLevel,
  //       difficulty,
  //       medium,
  //       chapter,
  //       testLength,
  //       testType,
  //     } = req.body;

  //     console.log(
  //       `[TEST START] mode=${mode}, language=${language}, scienceCategory=${scienceCategory}, class=${classLevel}, difficulty=${difficulty}`,
  //     );

  //     const session = await storage.createTestSession({
  //       mode,
  //       language: req.body.language || "hindi",
  //       scienceCategory: mode === "science" ? scienceCategory : null,
  //       classLevel,
  //       difficulty,
  //       testType: testType || "mcq-only", // Science tests are MCQ-only by default
  //       chapter,
  //       testLength: testLength || 10,
  //       currentQuestion: 0,
  //       totalScore: 0,
  //       correctAnswers: 0,
  //       conversationHistory: "[]",
  //     });

  //     console.log(
  //       `[SESSION CREATED] mode=${session.mode}, language=${session.language}, scienceCategory=${session.scienceCategory}`,
  //     );

  //     res.json(session);
  //   } catch (error) {
  //     console.error("Error starting test:", error);
  //     res.status(500).json({ error: "Failed to start test" });
  //   }
  // });

  app.post("/api/test/start", async (req, res) => {
    try {
      console.log("REQ BODY:", req.body); // 🔥 debug

      const {
        mode,
        language,
        scienceCategory,
        classLevel, // ✅ FIXED (no more class:)
        class: legacyClass,
        difficulty,
        medium,
        selectedMedium,
        subjectLanguage,
        languagePreference,
        chapter,
        chapterId,
        testLength,
        testType,
      } = req.body;

      const resolvedClassLevel = Number(classLevel ?? legacyClass);
      const safeClassLevel =
        Number.isFinite(resolvedClassLevel) && resolvedClassLevel > 0
          ? resolvedClassLevel
          : 6;

      const resolvedChapter = Number(
        (chapter as any)?.id ?? chapter ?? chapterId,
      );
      const safeChapter =
        Number.isFinite(resolvedChapter) && resolvedChapter > 0
          ? resolvedChapter
          : 1;

      const safeDifficulty = difficulty || "easy";

      const normalizeLanguage = (value?: string | null) => {
        const lang = (value || "").toString().trim().toLowerCase();
        if (["hi", "hin", "hindi"].includes(lang)) return "hindi";
        if (["en", "eng", "english"].includes(lang)) return "english";
        return lang || null;
      };

      const resolvedLanguage =
        normalizeLanguage(language) ??
        normalizeLanguage(selectedMedium) ??
        normalizeLanguage(medium) ??
        normalizeLanguage(subjectLanguage) ??
        normalizeLanguage(languagePreference) ??
        "english";

      // const resolvedMode = mode;
      const resolvedMode = mode ?? req.body?.selectedMode ?? req.body?.testMode;

      console.log(
        `[TEST START] mode=${resolvedMode}, language=${resolvedLanguage}, scienceCategory=${scienceCategory}, class=${safeClassLevel}, difficulty=${safeDifficulty}`,
      );

      // ✅ SAFETY CHECK
      if (!resolvedMode) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      const session = await storage.createTestSession({
        // mode,
        mode: resolvedMode,

        // ✅ fallback fix
        language: resolvedLanguage,

        scienceCategory:
          resolvedMode === "science"
            ? (scienceCategory ?? "physics") // 🔥 important
            : null,

        classLevel: safeClassLevel,
        difficulty: safeDifficulty,

        testType: testType || "mcq-only",
        chapter: safeChapter,
        testLength: testLength || 10,

        currentQuestion: 0,
        totalScore: 0,
        correctAnswers: 0,
        conversationHistory: "[]",
      });

      console.log(
        `[SESSION CREATED] mode=${session.mode}, language=${session.language}, scienceCategory=${session.scienceCategory}`,
      );

      res.json(session);
    } catch (error) {
      console.error("Error starting test:", error);
      res.status(500).json({ error: "Failed to start test" });
    }
  });

  // app.post("/api/test/start", async (req, res) => {
  //   try {
  //     const { mode, language, scienceCategory, class: classLevel, difficulty, medium, chapter, testLength, testType } = req.body;

  //     // Yahan ensure karein ki language "hindi" ya "english" sahi se pick ho rahi hai
  //     // Agar body mein medium hai toh usse le, varna language ko
  //     const finalLanguage = language || medium || "hindi";

  //     const session = await storage.createTestSession({
  //       mode,
  //       language: finalLanguage, // Fix: Use the computed language
  //       scienceCategory: mode === "science" ? scienceCategory : null,
  //       classLevel,
  //       difficulty,
  //       testType: testType || "mcq-only",
  //       chapter,
  //       testLength: testLength || 10,
  //       currentQuestion: 0,
  //       totalScore: 0,
  //       correctAnswers: 0,
  //       conversationHistory: "[]",
  //     });

  //     res.json(session);
  //   } catch (error) {
  //     res.status(500).json({ error: "Failed to start test" });
  //   }
  // });
  // app.post("/api/test/:sessionId/question", async (req, res) => {
  //   try {
  //     const { sessionId } = req.params;
  //     const session = await storage.getTestSession(sessionId);

  //     if (!session) {
  //       return res.status(404).json({ error: "Session not found" });
  //     }

  //     console.log("SESSION DATA:", session);

  //     const subjectKey =
  //       session.mode === "science"
  //         ? (session.scienceCategory ?? "physics").toLowerCase()
  //         : (session.language ?? "english").toLowerCase();

  //     const chapters = CHAPTERS[subjectKey] || [];
  //     const chapter = chapters.find((c) => c.id === session.chapter);

  //     if (!chapter) {
  //       return res.status(400).json({ error: "Invalid chapter" });
  //     }

  //     const history = JSON.parse(session.conversationHistory || "[]");
  //     const previousQuestions = history
  //     .map((h: any) => h.question)
  //     .filter(Boolean);

  //     const isMcq =
  //       session.testType === "mcq-only" ? true : history.length % 2 === 0;

  //     const questionData = await generateQuestion({
  //       mode: session.mode,

  //       // ✅ fallback fix
  //       language: session.language ?? "english",
  //       scienceCategory: session.scienceCategory ?? "physics",

  //       classLevel: session.classLevel ?? 6,
  //       difficulty: session.difficulty ?? "easy",

  //       chapter: session.chapter,
  //       chapterTitle:
  //         session.language === "hindi"
  //           ? chapter.title.hindi || chapter.title.english
  //           : chapter.title.english || chapter.title.hindi,

  //       questionNumber: (session.currentQuestion ?? 0) + 1, // 🔥 FIX NaN
  //       previousQuestions,
  //       isMcq,
  //     });

  //     if (!questionData) {
  //       return res.status(500).json({
  //         error: "AI could not generate question",
  //       });
  //     }

  //     history.push({
  //       questionNumber: (session.currentQuestion ?? 0) + 1,
  //       question: questionData.question,
  //       correctAnswer: questionData.correctAnswer,
  //       questionType: questionData.questionType,
  //       options: questionData.options,
  //       correctOption: questionData.correctOption,
  //       explanation: questionData.explanation,
  //     });

  //     await storage.updateTestSession(sessionId, {
  //       conversationHistory: JSON.stringify(history),
  //       currentQuestion: (session.currentQuestion ?? 0) + 1,
  //     });

  //     res.json({
  //       question: questionData.question,
  //       questionType: questionData.questionType,
  //       options: questionData.options,
  //       questionNumber: (session.currentQuestion ?? 0) + 1,
  //       totalQuestions: session.testLength,
  //     });
  //   } catch (error) {
  //     console.error("Error generating question:", error);
  //     res.status(500).json({ error: "Failed to generate question" });
  //   }
  // });

  // // Generate next question
  // app.post("/api/test/:sessionId/question", async (req, res) => {
  //   try {
  //     const { sessionId } = req.params;
  //     const session = await storage.getTestSession(sessionId);

  //     if (!session) {
  //       return res.status(404).json({ error: "Session not found" });
  //     }

  //     // Get subject key based on mode
  //     const subjectKey = session.mode === "science"
  //       ? (session.scienceCategory || "general").toLowerCase()
  //       : (session.language || "french").toLowerCase();

  //     const chapters = CHAPTERS[subjectKey] || [];
  //     const chapter = chapters.find(c => c.id === session.chapter);

  //     if (!chapter) {
  //       return res.status(400).json({ error: "Invalid chapter" });
  //     }

  //     // Determine adaptive context based on previous performance
  //     const history = JSON.parse(session.conversationHistory || "[]");
  //     let previousPerformance = "";

  //     if (history.length > 0) {
  //       const recentScores = history.slice(-3).map((h: any) => h.score);
  //       const avgScore = recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length;

  //       if (avgScore >= 8) {
  //         previousPerformance = "The student is performing excellently. Increase difficulty slightly.";
  //       } else if (avgScore <= 4) {
  //         previousPerformance = "The student is finding it challenging. Make the next question slightly easier.";
  //       }
  //     }

  //     // Get test type from session
  //     const testType = session.testType || "mixed";

  //     // Get all previously asked questions to avoid duplicates
  //     const previousQuestions = history.map((h: any) => h.question).filter(Boolean);
  //     console.log(`[AI] Already asked ${previousQuestions.length} question(s) in this test`);

  //     // Determine if this should be MCQ based on test type
  //     let isMcq = false;
  //     if (testType === "mcq-only") {
  //       isMcq = true; // Always MCQ for MCQ-only tests
  //     } else {
  //       isMcq = (history.length % 2) === 0; // Alternate for mixed tests (even = MCQ, odd = open-ended)
  //     }

  //       // // 🔥 Create MCQ Test Entry
  //       // const testInsert = await pool.query(
  //       //   `INSERT INTO mcq_tests (class_level, subject, total_questions, generated_by)
  //       //    VALUES ($1, $2, $3, $4)
  //       //    RETURNING id`,
  //       //   [classLevel, subject, numQuestions, teacherId]
  //       // );
  //     const testInsert = await pool.query(
  //       `INSERT INTO mcq_tests
  //       (class_level, subject, difficulty, total_questions, generated_by)
  //       VALUES ($1, $2, $3, $4, $5)
  //       RETURNING id`,
  //       [
  //         session.classLevel,
  //         subjectKey,
  //         session.difficulty,
  //         session.testLength
  //       ]
  //     );
  //       const mcqTestId = testInsert.rows[0].id;

  //       await pool.query(
  //         `UPDATE test_sessions SET mcq_test_id = $1 WHERE id = $2`,
  //         [mcqTestId, sessionId]
  //       );

  //     const questionData = await generateQuestion({
  //       mode: session.mode,
  //       language: session.language || undefined,
  //       scienceCategory: session.scienceCategory || undefined,
  //       classLevel: session.classLevel,
  //       difficulty: session.difficulty,
  //       chapter: session.chapter,
  //       chapterTitle:
  //       session.language === "hindi"
  //         ? chapter.title.hindi
  //         : chapter.title.english,
  //       questionNumber: session.currentQuestion + 1,
  //       previousPerformance,
  //       previousQuestions,
  //       isMcq,
  //     });

  //     if (!questionData) {
  //       console.error("Question generation returned null");

  //       return res.status(500).json({
  //         error: "AI failed to generate question. Please try again.",
  //       });
  //     }

  //     const sessionResult = await pool.query(
  //       `SELECT mcq_test_id FROM test_sessions WHERE id = $1`,
  //       [sessionId]
  //     );

  //     // 🔥 Save MCQ to database (only if it's MCQ)
  //           if (questionData.questionType === "mcq") {
  //             await saveMCQ(
  //               questionData.question,
  //               questionData.options || [],
  //               questionData.correctAnswer,
  //               mcqTestId
  //             );
  //           }

  //     // Store correct answer in session for later evaluation
  //     history.push({
  //       questionNumber: session.currentQuestion + 1,
  //       question: questionData.question,
  //       correctAnswer: questionData.correctAnswer,
  //       questionType: questionData.questionType,
  //       options: questionData.options,
  //       correctOption: questionData.correctOption,
  //       explanation: questionData.explanation,
  //     });

  //     // await storage.updateTestSession(sessionId, {
  //     //   conversationHistory: JSON.stringify(history),
  //     // });

  //     await storage.updateTestSession(sessionId, {
  //       conversationHistory: JSON.stringify(history),
  //       currentQuestion: session.currentQuestion + 1,
  //     });

  //     res.json({
  //       question: questionData.question,
  //       questionType: questionData.questionType,
  //       options: questionData.options,
  //       questionNumber: session.currentQuestion + 1,
  //       totalQuestions: session.testLength,
  //     });
  //   } catch (error) {
  //     console.error("Error generating question:", error);
  //     res.status(500).json({ error: "Failed to generate question" });
  //   }
  // });

   app.post("/api/test/:sessionId/question", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getTestSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const subjectKey =
        session.mode === "science"
          ? (session.scienceCategory || "general").toLowerCase()
          : (session.language || "french").toLowerCase();

      const chapters = CHAPTERS[subjectKey] || [];
      const chapter = chapters.find((c) => c.id === session.chapter);

      if (!chapter) {
        return res.status(400).json({ error: "Invalid chapter" });
      }

      const history = JSON.parse(session.conversationHistory || "[]");
      const previousQuestions = history.map((h: any) => h.question).filter(Boolean);

      const isMcq =
        session.testType === "mcq-only"
          ? true
          : history.length % 2 === 0;

      // const questionData = await generateQuestion({
      //   mode: session.mode,
      //   language: session.language || undefined,
      //   scienceCategory: session.scienceCategory || undefined,
      //   classLevel: session.classLevel,
      //   difficulty: session.difficulty,
      //   chapter: session.chapter,
      //   // chapterTitle: chapter.title,
      //   chapterTitle:
      //   session.language === "hindi"
      //     ? chapter.title.hindi
      //     : chapter.title.english,
      //   questionNumber: session.currentQuestion + 1,
      //   previousQuestions,
      //   isMcq,
      // });

      const chapterTitle =
        session.language === "hindi"
          ? (chapter.title?.hindi || chapter.title?.english)
          : (chapter.title?.english || chapter.title?.hindi);

      const buildFallbackQuestion = () => {
        const isHindi = (session.language || "").toLowerCase().startsWith("hi");
        const safeTitle = chapterTitle || (isHindi ? "इस अध्याय" : "this chapter");

        if (isMcq) {
          const question = isHindi
            ? `निम्न में से कौन सा "${safeTitle}" से सीधे संबंधित है?`
            : `Which of the following is most directly related to "${safeTitle}"?`;

          const options = isHindi
            ? [
                `A. ${safeTitle}`,
                "B. असंबंधित अवधारणा",
                "C. अलग विषय",
                "D. उपरोक्त में से कोई नहीं",
              ]
            : [
                `A. ${safeTitle}`,
                "B. An unrelated concept",
                "C. A different topic",
                "D. None of the above",
              ];

          return {
            question,
            options,
            correctOption: "A",
            correctAnswer: safeTitle,
            explanation: isHindi
              ? "यह एक बेसिक fallback प्रश्न है ताकि टेस्ट आगे बढ़ सके।"
              : "This is a basic fallback question to keep the test flowing.",
            questionType: "mcq",
          };
        }

        return {
          question: isHindi
            ? `"${safeTitle}" को संक्षेप में समझाइए।`
            : `Briefly explain "${safeTitle}".`,
          correctAnswer: isHindi
            ? `"${safeTitle}" इस अध्याय का मुख्य विषय है।`
            : `"${safeTitle}" is the main topic of this chapter.`,
          explanation: isHindi
            ? "यह एक बेसिक fallback उत्तर है।"
            : "This is a basic fallback answer.",
          questionType: "open-ended",
        };
      };

      // const questionData = await generateQuestion({
      //   mode: session.mode,
      //   language: session.language ?? "english",
      //   scienceCategory:
      //     session.mode === "science"
      //       ? (session.scienceCategory ?? "physics")
      //       : undefined,
      //   classLevel: session.classLevel ?? 6,
      //   difficulty: session.difficulty ?? "easy",
      //   chapter: session.chapter,
      //   chapterTitle,
      //   questionNumber: (session.currentQuestion ?? 0) + 1,
      //   previousQuestions: previousQuestions ?? [],
      //   isMcq: !!isMcq,
      // });

      let questionData;
      try {
        questionData = await generateQuestion({
          mode: session.mode,
          // ✅ ALWAYS SAFE LANGUAGE
          language: session.language ?? "english",
          // ✅ SAFE SUBJECT HANDLING
          scienceCategory:
            session.mode === "science"
              ? (session.scienceCategory ?? "physics")
              : undefined,
          // ✅ SAFE CLASS + DIFFICULTY
          classLevel: session.classLevel ?? 6,
          difficulty: session.difficulty ?? "easy",
          chapter: session.chapter,
          // ✅ UNIVERSAL TITLE FIX
          chapterTitle,
          // ✅ NaN FIX
          questionNumber: (session.currentQuestion ?? 0) + 1,
          previousQuestions: previousQuestions ?? [],
          // ✅ BOOLEAN SAFETY
          isMcq: !!isMcq,
        });
      } catch (error) {
        console.error("AI question generation failed. Using fallback.", error);
        questionData = buildFallbackQuestion();
      }



      // 🔥 Get mcq_test_id from session
      // const result = await pool.query(
      //   `SELECT mcq_test_id FROM test_sessions WHERE id = $1`,
      //   [sessionId]
      // );
      // const mcqTestId = result.rows[0]?.mcq_test_id;

      let mcqTestId: number | null = null;
      try {
        const result = await pool.query(
          `SELECT mcq_test_id FROM test_sessions WHERE id = $1`,
          [sessionId]
        );
        mcqTestId = result.rows[0]?.mcq_test_id ?? null;
      } catch (error: any) {
        if (error?.code === "42703") {
          console.warn(
            "[DB] mcq_test_id column missing in test_sessions. Skipping MCQ save."
          );
        } else {
          throw error;
        }
      }

      if (!questionData) {
        console.warn("Question generation returned null. Using fallback.");
        questionData = buildFallbackQuestion();
      }

      const q = questionData;


      // 🔥 Save MCQ (only if test linked)
      if (questionData.questionType === "mcq" && mcqTestId) {
        await saveMCQ(
          questionData.question,
          questionData.options || [],
          questionData.correctAnswer,
          mcqTestId
        );
      }

      // const nextQuestionNumber = session.currentQuestion + 1;
      const currentQuestionNumber = Number(session.currentQuestion);
      const nextQuestionNumber = Number.isFinite(currentQuestionNumber)
        ? currentQuestionNumber + 1
        : 1;

      history.push({
        questionNumber: nextQuestionNumber,
        question: questionData.question,
        correctAnswer: questionData.correctAnswer,
        questionType: questionData.questionType,
        options: questionData.options,
        correctOption: questionData.correctOption,
        explanation: questionData.explanation,
      });

      await storage.updateTestSession(sessionId, {
        conversationHistory: JSON.stringify(history),
        currentQuestion: nextQuestionNumber,
      });

      res.json({
        question: questionData.question,
        questionType: questionData.questionType,
        options: questionData.options,
        questionNumber: nextQuestionNumber,
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
      const conversationHistory = JSON.parse(
        session.conversationHistory || "[]",
      );
      const currentQuestionData =
        conversationHistory[conversationHistory.length - 1];

      if (!currentQuestionData) {
        return res
          .status(400)
          .json({ error: "No question found for evaluation" });
      }

      let evaluation;

      // For MCQ, evaluate instantly by comparing options
      if (currentQuestionData.questionType === "mcq") {
        const isCorrect = answer === currentQuestionData.correctOption;
        const score = isCorrect ? 10 : 0;

        evaluation = {
          score,
          feedback: isCorrect
            ? `Correct! ${currentQuestionData.explanation}`
            : `Incorrect. The correct answer is ${currentQuestionData.correctOption}: ${currentQuestionData.correctAnswer}. ${currentQuestionData.explanation}`,
          isCorrect,
          encouragement: isCorrect
            ? "Excellent work! You got it right!"
            : "Keep practicing! You'll get the next one!",
        };

        console.log(
          `[MCQ] Answer: ${answer}, Correct: ${currentQuestionData.correctOption}, Score: ${score}/10`,
        );
      } else {
        // For open-ended questions, use AI evaluation
        evaluation = await evaluateAnswer({
          question: currentQuestionData.question,
          correctAnswer: currentQuestionData.correctAnswer,
          studentAnswer: answer,
          language: session.language || "english",
          classLevel: session.classLevel,
          difficulty: session.difficulty,
        });
      }

      // Update the last question entry with student's answer and score
      currentQuestionData.studentAnswer = answer;
      currentQuestionData.score = evaluation.score;
      currentQuestionData.isCorrect = evaluation.isCorrect;

      const newTotalScore = session.totalScore + evaluation.score;
      const newCorrectAnswers =
        session.correctAnswers + (evaluation.isCorrect ? 1 : 0);
      // Question counter is incremented when a question is served.
      // Keep it unchanged here to avoid skipping numbers (e.g., jumping to 3 instead of 2).
      const newCurrentQuestion = session.currentQuestion;

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

  // Answer Sheet Evaluation endpoint - evaluate uploaded answer sheet images
  app.post("/api/evaluate-answer-sheet", async (req, res) => {
    try {
      const { images, studentName, classLevel, subject, gptModel } = req.body;

      // Validate input
      if (!images || !Array.isArray(images) || images.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one image is required" });
      }

      if (images.length > 20) {
        return res.status(400).json({ error: "Maximum 20 images allowed" });
      }

      console.log(
        `[ANSWER SHEET EVAL] Processing ${images.length} images for ${studentName || "Anonymous"}`,
      );

      // Import the evaluation function
      // const { evaluateAnswerSheet } = await import("./answerSheetEvaluator");
      // Import the evaluation function
      const module = await import("./answerSheetEvaluator");
      const evaluateAnswerSheet = module.evaluateAnswerSheet;

      if (typeof evaluateAnswerSheet !== "function") {
        throw new Error(
          "evaluateAnswerSheet is not exported correctly from the module",
        );
      }

      const evaluationResult = await evaluateAnswerSheet({
        images,
        studentName: studentName || "Anonymous",
        classLevel,
        subject,
        gptModel: gptModel || "gpt-4o",
      });

      // Save evaluation to database (optional, for history tracking)
      const evaluationRecord = await storage.saveAnswerSheetEvaluation({
        studentName: studentName || null,
        classLevel: classLevel || null,
        subject: subject || null,
        totalImages: images.length,
        evaluationSummary: JSON.stringify(evaluationResult),
        gptModel: gptModel || "gpt-4o",
      });

      console.log(
        `[ANSWER SHEET EVAL] ✓ Evaluation completed. ID: ${evaluationRecord.id}`,
      );

      res.json({
        id: evaluationRecord.id,
        ...evaluationResult,
      });
    } catch (error: any) {
      console.error("[ANSWER SHEET EVAL ERROR]", error.message);
      res
        .status(500)
        .json({ error: error.message || "Failed to evaluate answer sheet" });
    }
  });

  app.post("/api/download-evaluation-pdf", generateEvaluationPDF);

  // Get evaluation history
  app.get("/api/evaluations/history", async (req, res) => {
    try {
      const evaluations = await storage.getRecentEvaluations(10);
      res.json(evaluations);
    } catch (error: any) {
      console.error("[EVAL HISTORY ERROR]", error.message);
      res.status(500).json({ error: "Failed to fetch evaluation history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
