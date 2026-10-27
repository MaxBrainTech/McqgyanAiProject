import crypto from "crypto";
import {
  sendTeacherVerificationEmail,
  sendPasswordResetEmail,
} from "./services/emailService";
import { sendTestEmail } from "./services/emailService";
import { buildServerAppUrl, getServerAppUrl } from "./lib/appUrl";
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
  import {
    buildInvalidTopicsMessage,
    validateTopicsAgainstChapters,
  } from "@shared/topicValidation";

  // import { Request, Response } from "express";

  const router = Router();

import pool from "./db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { openai } from "./openai";
import { registerAdminAuthRoutes } from "./adminAuth";
import { registerAdminTeacherRoutes } from "./adminTeachers";
import { registerAdminGeneratedTestRoutes } from "./adminGeneratedTests";

console.log("ROUTES FILE LOADED");

const normalizeTeacherProfile = (teacher: any = {}) => ({
  id: teacher.id,
  username: teacher.username,
  email: teacher.email,
  fullName: teacher.fullName ?? teacher.full_name ?? teacher.name ?? "",
  school: teacher.school ?? "",
  verified: teacher.isVerified === "true" || teacher.is_verified === true,
  approved: teacher.isApproved === "true" || teacher.is_approved === true,
});

const buildGoogleTeacherUsername = (email: string) => {
  const localPart = String(email || "")
    .trim()
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  return localPart || `teacher_${randomUUID().slice(0, 8)}`;
};

async function getAvailableTeacherUsername(email: string) {
  const baseUsername = buildGoogleTeacherUsername(email);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? baseUsername : `${baseUsername}_${attempt + 1}`;
    const existingTeacher = await storage.getTeacherByUsername(candidate);
    if (!existingTeacher) {
      return candidate;
    }
  }

  return `${baseUsername}_${randomUUID().slice(0, 8)}`;
}

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

function serializeCustomTest(customTest: any) {
  return {
    id: customTest.id,
    teacherId:
      customTest.teacher_id ?? customTest.teacherId ?? customTest.teacherID ?? null,
    title: customTest.title ?? "",
    subject: customTest.subject ?? "",
    classLevel: customTest.class_level ?? customTest.classLevel ?? null,
    difficulty: customTest.difficulty ?? "",
    durationMinutes: customTest.duration_minutes ?? customTest.durationMinutes ?? null,
    numQuestions: customTest.num_questions ?? customTest.numQuestions ?? 0,
    language: customTest.language ?? "english",
    testType: customTest.test_type ?? customTest.testType ?? "mixed",
    shareCode: customTest.share_code ?? customTest.shareCode ?? null,
    createdAt: customTest.created_at ?? customTest.createdAt,
  };
}

const CHAPTERS: Record<
  string,
  Array<{
    id: number;
      title: { english: string; hindi: string };
      description: { english: string; hindi: string };
    }>
  > = {
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
    school_english: [
      {
        id: 1,
        title: {
          english: "Grammar Basics",
          hindi: "व्याकरण की मूल बातें",
        },
        description: {
          english: "Parts of speech, sentences, and punctuation",
          hindi: "पद-भेद, वाक्य और विराम चिह्न",
        },
      },
      {
        id: 2,
        title: {
          english: "Reading Comprehension",
          hindi: "पठन-बोध",
        },
        description: {
          english: "Passage reading and understanding",
          hindi: "गद्यांश पढ़ना और समझना",
        },
      },
      {
        id: 3,
        title: {
          english: "Vocabulary Building",
          hindi: "शब्द भंडार",
        },
        description: {
          english: "Synonyms, antonyms, and word meanings",
          hindi: "पर्यायवाची, विलोम और शब्दार्थ",
        },
      },
      {
        id: 4,
        title: {
          english: "Sentence Formation",
          hindi: "वाक्य निर्माण",
        },
        description: {
          english: "Correct sentence structure and ordering",
          hindi: "सही वाक्य संरचना और क्रम",
        },
      },
      {
        id: 5,
        title: {
          english: "Tenses",
          hindi: "काल",
        },
        description: {
          english: "Present, past, and future tense usage",
          hindi: "वर्तमान, भूत और भविष्य काल का उपयोग",
        },
      },
      {
        id: 6,
        title: {
          english: "Creative Writing",
          hindi: "रचनात्मक लेखन",
        },
        description: {
          english: "Paragraph writing and short compositions",
          hindi: "अनुच्छेद लेखन और लघु रचनाएँ",
        },
      },
      {
        id: 7,
        title: {
          english: "Poetry and Prose",
          hindi: "कविता और गद्य",
        },
        description: {
          english: "Understanding poems and short prose pieces",
          hindi: "कविताओं और लघु गद्य अंशों को समझना",
        },
      },
      {
        id: 8,
        title: {
          english: "Speaking and Listening",
          hindi: "बोलना और सुनना",
        },
        description: {
          english: "Conversation, pronunciation, and oral skills",
          hindi: "संवाद, उच्चारण और मौखिक कौशल",
        },
      },
    ],
    school_hindi: [
      {
        id: 1,
        title: {
          english: "वर्णमाला",
          hindi: "वर्णमाला",
        },
        description: {
          english: "Hindi vowels, consonants, and their order",
          hindi: "हिंदी स्वर, व्यंजन और उनका क्रम",
        },
      },
      {
        id: 2,
        title: {
          english: "शब्द और वाक्य",
          hindi: "शब्द और वाक्य",
        },
        description: {
          english: "Word formation and simple sentences",
          hindi: "शब्द निर्माण और सरल वाक्य",
        },
      },
      {
        id: 3,
        title: {
          english: "संज्ञा और सर्वनाम",
          hindi: "संज्ञा और सर्वनाम",
        },
        description: {
          english: "Nouns and pronouns in Hindi",
          hindi: "हिंदी में संज्ञा और सर्वनाम",
        },
      },
      {
        id: 4,
        title: {
          english: "क्रिया और काल",
          hindi: "क्रिया और काल",
        },
        description: {
          english: "Verb forms and tense usage",
          hindi: "क्रिया रूप और काल का उपयोग",
        },
      },
      {
        id: 5,
        title: {
          english: "मुहावरे और लोकोक्तियाँ",
          hindi: "मुहावरे और लोकोक्तियाँ",
        },
        description: {
          english: "Common idioms and proverbs",
          hindi: "प्रचलित मुहावरे और लोकोक्तियाँ",
        },
      },
      {
        id: 6,
        title: {
          english: "अपठित गद्यांश",
          hindi: "अपठित गद्यांश",
        },
        description: {
          english: "Reading and answering comprehension passages",
          hindi: "गद्यांश पढ़कर प्रश्नों के उत्तर देना",
        },
      },
      {
        id: 7,
        title: {
          english: "पत्र लेखन",
          hindi: "पत्र लेखन",
        },
        description: {
          english: "Formal and informal letter writing",
          hindi: "औपचारिक और अनौपचारिक पत्र लेखन",
        },
      },
      {
        id: 8,
        title: {
          english: "अनुच्छेद लेखन",
          hindi: "अनुच्छेद लेखन",
        },
        description: {
          english: "Short paragraph writing on familiar topics",
          hindi: "परिचित विषयों पर संक्षिप्त अनुच्छेद लेखन",
        },
      },
    ],
    school_mathematics: [
      {
        id: 1,
        title: {
          english: "Number System",
          hindi: "संख्या पद्धति",
        },
        description: {
          english: "Whole numbers, integers, and place value",
          hindi: "पूर्ण संख्याएँ, पूर्णांक और स्थान मान",
        },
      },
      {
        id: 2,
        title: {
          english: "Fractions and Decimals",
          hindi: "भिन्न और दशमलव",
        },
        description: {
          english: "Operations with fractions and decimals",
          hindi: "भिन्न और दशमलव पर संक्रियाएँ",
        },
      },
      {
        id: 3,
        title: {
          english: "Ratio and Proportion",
          hindi: "अनुपात और समानुपात",
        },
        description: {
          english: "Comparing quantities and solving proportions",
          hindi: "राशियों की तुलना और समानुपात हल करना",
        },
      },
      {
        id: 4,
        title: {
          english: "Geometry Basics",
          hindi: "ज्यामिति की मूल बातें",
        },
        description: {
          english: "Lines, angles, triangles, and shapes",
          hindi: "रेखाएँ, कोण, त्रिभुज और आकृतियाँ",
        },
      },
      {
        id: 5,
        title: {
          english: "Measurement",
          hindi: "मापन",
        },
        description: {
          english: "Length, mass, capacity, and time",
          hindi: "लंबाई, द्रव्यमान, क्षमता और समय",
        },
      },
      {
        id: 6,
        title: {
          english: "Data Handling",
          hindi: "आँकड़ों का प्रबंधन",
        },
        description: {
          english: "Tables, charts, and simple interpretation",
          hindi: "सारणी, चार्ट और सरल व्याख्या",
        },
      },
      {
        id: 7,
        title: {
          english: "Algebra Basics",
          hindi: "बीजगणित की मूल बातें",
        },
        description: {
          english: "Variables, expressions, and simple equations",
          hindi: "चर, व्यंजक और सरल समीकरण",
        },
      },
      {
        id: 8,
        title: {
          english: "Mensuration",
          hindi: "क्षेत्रमिति",
        },
        description: {
          english: "Perimeter, area, and volume basics",
          hindi: "परिमाप, क्षेत्रफल और आयतन की मूल बातें",
        },
      },
    ],
    school_science: [
      {
        id: 1,
        title: {
          english: "Food and Nutrition",
          hindi: "भोजन और पोषण",
        },
        description: {
          english: "Sources of food, nutrients, and balanced diet",
          hindi: "भोजन के स्रोत, पोषक तत्व और संतुलित आहार",
        },
      },
      {
        id: 2,
        title: {
          english: "Plants and Animals",
          hindi: "पौधे और जानवर",
        },
        description: {
          english: "Living organisms, habitats, and adaptation",
          hindi: "जीव, आवास और अनुकूलन",
        },
      },
      {
        id: 3,
        title: {
          english: "Materials Around Us",
          hindi: "हमारे आसपास की वस्तुएँ",
        },
        description: {
          english: "Properties and uses of common materials",
          hindi: "सामान्य पदार्थों के गुण और उपयोग",
        },
      },
      {
        id: 4,
        title: {
          english: "Motion and Measurement",
          hindi: "गति और मापन",
        },
        description: {
          english: "Types of motion and measurement tools",
          hindi: "गति के प्रकार और मापन के उपकरण",
        },
      },
      {
        id: 5,
        title: {
          english: "Light and Sound",
          hindi: "प्रकाश और ध्वनि",
        },
        description: {
          english: "Shadows, reflection, and sound properties",
          hindi: "छाया, परावर्तन और ध्वनि के गुण",
        },
      },
      {
        id: 6,
        title: {
          english: "Heat and Temperature",
          hindi: "ऊष्मा और तापमान",
        },
        description: {
          english: "Heat transfer and temperature basics",
          hindi: "ऊष्मा का स्थानांतरण और तापमान की मूल बातें",
        },
      },
      {
        id: 7,
        title: {
          english: "Electricity and Magnetism",
          hindi: "विद्युत और चुंबकत्व",
        },
        description: {
          english: "Simple circuits, current, and magnets",
          hindi: "सरल परिपथ, विद्युत धारा और चुंबक",
        },
      },
      {
        id: 8,
        title: {
          english: "Our Environment",
          hindi: "हमारा पर्यावरण",
        },
        description: {
          english: "Air, water, pollution, and conservation",
          hindi: "वायु, जल, प्रदूषण और संरक्षण",
        },
      },
    ],
    school_social_science: [
      {
        id: 1,
        title: {
          english: "Our Surroundings",
          hindi: "हमारा परिवेश",
        },
        description: {
          english: "Family, neighborhood, and community",
          hindi: "परिवार, पड़ोस और समुदाय",
        },
      },
      {
        id: 2,
        title: {
          english: "Maps and Directions",
          hindi: "मानचित्र और दिशाएँ",
        },
        description: {
          english: "Reading maps and understanding directions",
          hindi: "मानचित्र पढ़ना और दिशाओं को समझना",
        },
      },
      {
        id: 3,
        title: {
          english: "Indian Heritage",
          hindi: "भारतीय विरासत",
        },
        description: {
          english: "Monuments, culture, and traditions",
          hindi: "स्मारक, संस्कृति और परंपराएँ",
        },
      },
      {
        id: 4,
        title: {
          english: "Government and Civic Life",
          hindi: "सरकार और नागरिक जीवन",
        },
        description: {
          english: "Local government and citizenship",
          hindi: "स्थानीय सरकार और नागरिकता",
        },
      },
      {
        id: 5,
        title: {
          english: "Indian Geography",
          hindi: "भारतीय भूगोल",
        },
        description: {
          english: "Landforms, climate, and resources",
          hindi: "स्थलरूप, जलवायु और संसाधन",
        },
      },
      {
        id: 6,
        title: {
          english: "History and Time",
          hindi: "इतिहास और समय",
        },
        description: {
          english: "Past, present, and historical sources",
          hindi: "अतीत, वर्तमान और ऐतिहासिक स्रोत",
        },
      },
      {
        id: 7,
        title: {
          english: "Economy and Resources",
          hindi: "अर्थव्यवस्था और संसाधन",
        },
        description: {
          english: "Work, resources, and production",
          hindi: "कार्य, संसाधन और उत्पादन",
        },
      },
      {
        id: 8,
        title: {
          english: "Environment and Society",
          hindi: "पर्यावरण और समाज",
        },
        description: {
          english: "Conservation, society, and responsibility",
          hindi: "संरक्षण, समाज और जिम्मेदारी",
        },
      },
    ],
    school_computer: [
      {
        id: 1,
        title: {
          english: "Computer Basics",
          hindi: "कंप्यूटर की मूल बातें",
        },
        description: {
          english: "Parts of a computer and uses",
          hindi: "कंप्यूटर के भाग और उपयोग",
        },
      },
      {
        id: 2,
        title: {
          english: "Input and Output Devices",
          hindi: "इनपुट और आउटपुट उपकरण",
        },
        description: {
          english: "Keyboard, mouse, monitor, printer, and more",
          hindi: "कीबोर्ड, माउस, मॉनिटर, प्रिंटर आदि",
        },
      },
      {
        id: 3,
        title: {
          english: "Operating System",
          hindi: "ऑपरेटिंग सिस्टम",
        },
        description: {
          english: "Windows basics and desktop management",
          hindi: "विंडोज़ की मूल बातें और डेस्कटॉप प्रबंधन",
        },
      },
      {
        id: 4,
        title: {
          english: "File and Folder Management",
          hindi: "फाइल और फोल्डर प्रबंधन",
        },
        description: {
          english: "Creating, saving, and organizing files",
          hindi: "फाइल बनाना, सहेजना और व्यवस्थित करना",
        },
      },
      {
        id: 5,
        title: {
          english: "Typing Skills",
          hindi: "टाइपिंग कौशल",
        },
        description: {
          english: "Keyboard typing and shortcut basics",
          hindi: "कीबोर्ड टाइपिंग और शॉर्टकट की मूल बातें",
        },
      },
      {
        id: 6,
        title: {
          english: "Internet and Safety",
          hindi: "इंटरनेट और सुरक्षा",
        },
        description: {
          english: "Web browsing and cyber safety basics",
          hindi: "वेब ब्राउज़िंग और साइबर सुरक्षा की मूल बातें",
        },
      },
      {
        id: 7,
        title: {
          english: "Programming Basics",
          hindi: "प्रोग्रामिंग की मूल बातें",
        },
        description: {
          english: "Sequences, instructions, and logic",
          hindi: "क्रम, निर्देश और तर्क",
        },
      },
      {
        id: 8,
        title: {
          english: "Digital Applications",
          hindi: "डिजिटल अनुप्रयोग",
        },
        description: {
          english: "Word processing, presentations, and spreadsheets",
          hindi: "वर्ड प्रोसेसिंग, प्रस्तुतियाँ और स्प्रेडशीट",
        },
      },
    ],
  };

  function getCustomTopicValidationError(params: {
    classLevel?: number | string;
    subject?: string;
    topics: string[];
  }): string | null {
    const { classLevel, subject, topics } = params;
    const subjectKey = resolveChapterSubjectKey((subject || "").toString());
    const chapters = CHAPTERS[subjectKey] || [];

    if (topics.length === 0 || chapters.length === 0) {
      return null;
    }

    const validationResult = validateTopicsAgainstChapters(topics, chapters);
    if (validationResult.isValid) {
      return null;
    }

    return buildInvalidTopicsMessage({
      classLevel,
      subject,
      invalidTopics: validationResult.invalidTopics,
    });
  }

  function normalizeQuestionForComparison(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f\s]/g, " ")
      .replace(/\b(what|which|who|when|where|why|how|define|state|identify|choose|correct|following|option|best|most|is|are|was|were|the|a|an|of|for|in|on|to)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function getPastQuestionsForChapter(
    chapterId: number | string | null | undefined,
    subjectKey?: string | null,
    classLevel?: number | null,
    excludeSessionId?: string | null,
    limit: number = 30
  ): Promise<string[]> {
    const pastQuestions: string[] = [];
    if (!chapterId && !subjectKey) return pastQuestions;

    try {
      const sessionRes = await pool.query(
        `SELECT conversation_history FROM test_sessions 
         WHERE ($1::int IS NULL OR chapter = $1)
           AND ($2::text IS NULL OR science_category = $2 OR language = $2 OR subject_language = $2)
           AND ($3::int IS NULL OR class_level = $3)
           AND ($4::text IS NULL OR id != $4)
         ORDER BY created_at DESC LIMIT 15`,
        [
          Number(chapterId) || null,
          subjectKey ? String(subjectKey).toLowerCase() : null,
          Number(classLevel) || null,
          excludeSessionId || null,
        ]
      );

      for (const row of sessionRes.rows) {
        try {
          const hist = JSON.parse(row.conversation_history || "[]");
          if (Array.isArray(hist)) {
            for (const item of hist) {
              if (item?.question && typeof item.question === "string") {
                const q = item.question.trim();
                if (q && !pastQuestions.includes(q)) {
                  pastQuestions.push(q);
                }
              }
            }
          }
        } catch (err) {
          // ignore parse error
        }
      }

      const mcqRes = await pool.query(
        `SELECT m.question FROM mcqs m
         JOIN mcq_tests mt ON m.test_id = mt.id
         WHERE ($1::int IS NULL OR mt.class_level = $1)
           AND ($2::text IS NULL OR mt.subject ILIKE '%' || $2 || '%')
         ORDER BY m.id DESC LIMIT 25`,
        [
          Number(classLevel) || null,
          subjectKey ? String(subjectKey).toLowerCase() : null,
        ]
      );

      for (const row of mcqRes.rows) {
        if (row.question && typeof row.question === "string") {
          const q = row.question.trim();
          if (q && !pastQuestions.includes(q)) {
            pastQuestions.push(q);
          }
        }
      }
    } catch (err) {
      console.warn("[PAST QUESTIONS] Error fetching past questions for chapter:", err);
    }

    return pastQuestions.slice(0, limit);
  }

  async function getPastQuestionsForTopics(
    topics: string[],
    subject?: string | null,
    classLevel?: number | null,
    excludeTestId?: string | null,
    limit: number = 40
  ): Promise<string[]> {
    const pastQuestions: string[] = [];

    try {
      const customRes = await pool.query(
        `SELECT cq.question FROM custom_questions cq
         JOIN custom_tests ct ON cq.test_id = ct.id
         WHERE ($1::text IS NULL OR ct.subject ILIKE '%' || $1 || '%')
           AND ($2::int IS NULL OR ct.class_level = $2)
           AND ($3::text IS NULL OR ct.id != $3)
         ORDER BY cq.id DESC LIMIT 50`,
        [
          subject ? String(subject).trim() : null,
          Number(classLevel) || null,
          excludeTestId || null,
        ]
      );

      for (const row of customRes.rows) {
        if (row.question && typeof row.question === "string") {
          const q = row.question.trim();
          if (q && !pastQuestions.includes(q)) {
            pastQuestions.push(q);
          }
        }
      }

      if (topics && topics.length > 0) {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        for (const topic of topics.slice(0, 4)) {
          const cleanTopic = topic.trim();
          if (cleanTopic.length > 2) {
            conditions.push(`m.question ILIKE '%' || $${paramIdx} || '%'`);
            params.push(cleanTopic);
            paramIdx++;
          }
        }

        if (conditions.length > 0) {
          const queryStr = `SELECT m.question FROM mcqs m WHERE ${conditions.join(" OR ")} ORDER BY m.id DESC LIMIT 30`;
          const topicRes = await pool.query(queryStr, params);
          for (const row of topicRes.rows) {
            if (row.question && typeof row.question === "string") {
              const q = row.question.trim();
              if (q && !pastQuestions.includes(q)) {
                pastQuestions.push(q);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("[PAST QUESTIONS] Error fetching past questions for topics:", err);
    }

    return pastQuestions.slice(0, limit);
  }

  function normalizeSubmissionAnswers(answers: any): Record<string, string> {
    if (!answers) return {};
    if (typeof answers === "string") {
      try {
        const parsed = JSON.parse(answers);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch {
        return {};
      }
    }
    if (typeof answers === "object") return answers;
    return {};
  }

  function normalizeTextForComparison(value?: string) {
    return (value ?? "")
      .toString()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeQuestionType(value?: string) {
    const normalized = normalizeTextForComparison(value);
    if (
      normalized === "mcq" ||
      normalized === "multiple_choice" ||
      normalized === "multiple-choice" ||
      normalized === "multiple choice"
    ) {
      return "mcq";
    }
    return normalized || "open-ended";
  }

  function normalizeTestLanguage(value?: string) {
    const normalized = normalizeTextForComparison(value);
    return normalized.startsWith("hi") ? "hindi" : "english";
  }

  function findQuestionById<T extends { id: string }>(questions: T[], questionId: unknown) {
    const targetId = (questionId ?? "").toString();
    return questions.find((question) => question.id.toString() === targetId);
  }

  async function evaluateCustomTestQuestion(
    test: any,
    question: any,
    studentAnswer: string,
  ) {
    if (normalizeQuestionType(question.questionType) === "mcq") {
      const normalizedAnswer = normalizeTextForComparison(studentAnswer);
      const normalizedCorrectOption = normalizeTextForComparison(question.correctOption);
      const normalizedCorrectAnswer = normalizeTextForComparison(question.correctAnswer);
      const isCorrect =
        normalizedAnswer === normalizedCorrectOption ||
        normalizedAnswer === normalizedCorrectAnswer;

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        correctOption: question.correctOption,
        explanation: question.explanation,
        score: isCorrect ? 10 : 0,
      };
    }

    const evaluation = await evaluateAnswer({
      question: question.question,
      studentAnswer,
      correctAnswer: question.correctAnswer,
      language: test.language || test.subject || "english",
      classLevel: test.classLevel,
      difficulty: test.difficulty,
      gptModel: test.gptModel || "gpt-4o-mini",
    });

    return {
      ...evaluation,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  function getAllowedChapterSubjectKeys(classLevel: number, board?: string) {
    if (!Number.isInteger(classLevel) || classLevel < 6) {
      return [];
    }

    const languageSubjectKeys = ["french", "german", "spanish", "hindi", "marathi", "kannada"];
    const scienceSubjectKeys =
      classLevel >= 9
        ? ["physics", "chemistry", "biology", "general"]
        : [
            "school_english",
            "english",
            "school_hindi",
            "hindi",
            "school_mathematics",
            "mathematics",
            "school_science",
            "science",
            "school_social_science",
            "social_science",
            "school_computer",
            "computer",
          ];

    return [...languageSubjectKeys, ...scienceSubjectKeys];
  }

  function normalizeSchoolScienceSubjectKey(subjectKey: string): string {
    return subjectKey.replace(/^school_/, "");
  }

  const SCHOOL_SUBJECT_KEY_ALIASES: Record<string, string> = {
    english: "school_english",
    hindi: "school_hindi",
    mathematics: "school_mathematics",
    science: "school_science",
    social_science: "school_social_science",
    computer: "school_computer",
  };

  function resolveChapterSubjectKey(subjectKey: string): string {
    const normalizedKey = subjectKey.toString().trim().toLowerCase();
    return SCHOOL_SUBJECT_KEY_ALIASES[normalizedKey] || normalizedKey;
  }

  function filterChaptersByClassAndBoard(
    subjectKey: string,
    classLevel: number,
    board?: string
  ) {
    const normalizedKey = resolveChapterSubjectKey(subjectKey);
    const normalizedBoard = String(board || "").trim().toLowerCase();
    const availableSubjectKeys = getAllowedChapterSubjectKeys(classLevel, normalizedBoard);
    const numericClassLevel = Number(classLevel);
    const chapters = CHAPTERS[normalizedKey] || [];

    if (chapters.length === 0) {
      return [];
    }

    if (!Number.isFinite(numericClassLevel) || numericClassLevel <= 0) {
      return chapters;
    }

    if (availableSubjectKeys.includes(normalizedKey)) {
      return chapters;
    }

    const isSchoolSubject = normalizedKey.startsWith("school_");
    if (numericClassLevel >= 6 && numericClassLevel <= 8 && isSchoolSubject) {
      return chapters;
    }

    return [];
  }

  export async function registerRoutes(app: Express): Promise<Server> {
    registerAdminAuthRoutes(app);
    registerAdminTeacherRoutes(app);
    registerAdminGeneratedTestRoutes(app);

    app.get("/api/test-email", async (req, res) => {
      try {

        await sendTestEmail(process.env.EMAIL_USER!);

        res.json({
          success: true,
          message: "Email Sent Successfully",
        });

      } catch (err) {

        console.error(err);

        res.status(500).json({
          success: false,
          message: "Email Failed",
        });

      }
    });
    // Get chapters for a language or science category
    app.get("/api/chapters/:subject", (req, res) => {
      const { subject } = req.params;
      const classLevel = Number(req.query.classLevel);
      const board = String(req.query.board || "").trim();
      const chapters = filterChaptersByClassAndBoard(subject, classLevel, board);
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

        const teacher = result.rows[0];
        res.json({
          id: teacher.id,
          username: teacher.username,
          email: teacher.email,
          fullName: (teacher as any).full_name ?? teacher.fullName ?? "",
          school: teacher.school ?? "",
          verified: false,
          approved: false,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to register teacher" });
      }
    });

    app.post("/api/teacher/google-login", async (req, res) => {
      console.log("========== GOOGLE LOGIN API HIT ==========");
      console.log(req.body);
      try {
        const email = String(req.body?.email ?? "").trim().toLowerCase();
        const displayName = String(req.body?.fullName ?? req.body?.displayName ?? "").trim();
        const school = String(req.body?.school ?? "").trim() || null;

        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        const existingTeacher = await storage.getTeacherByEmail(email);
       if (existingTeacher) {

        if (existingTeacher.isVerified !== "true") {

          console.log("Existing Teacher:", existingTeacher.email);

            const token = crypto.randomBytes(32).toString("hex");
            console.log("Generated Token:", token);

            await storage.updateTeacherVerificationToken(existingTeacher.id, token);
            console.log("Token Saved");

            const appUrl = getServerAppUrl(req);

            await sendTeacherVerificationEmail(
              existingTeacher.email,
              existingTeacher.fullName,
              token,
              appUrl
            );

            console.log("Verification Email Sent");
        }

       return res.json({
          ...normalizeTeacherProfile(existingTeacher),
          verified: existingTeacher.isVerified === "true",
          approved: existingTeacher.isApproved === "true",
        });
      }

        const username = await getAvailableTeacherUsername(email);
        const password = await bcrypt.hash(randomUUID(), 10);
        const fullName = displayName || email.split("@")[0] || "Teacher";

        const createdTeacher = await storage.createTeacher({
          username,
          password,
          fullName,
          email,
          school: school ?? undefined,
        });
        
        // Generate verification token
        console.log("New Teacher Created:", createdTeacher.email);

          const token = crypto.randomBytes(32).toString("hex");
          console.log("Generated Token:", token);

          await storage.updateTeacherVerificationToken(createdTeacher.id, token);
          console.log("Token Saved");

          const appUrl = getServerAppUrl(req);

          await sendTeacherVerificationEmail(
            createdTeacher.email,
            createdTeacher.fullName,
            token,
            appUrl
          );

          console.log("Verification Email Sent");

        return res.status(201).json({
          ...normalizeTeacherProfile(createdTeacher),
          verified: false,
          approved: false,
          message: "Verification email sent successfully.",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to authenticate teacher with Google" });
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

      const token = crypto.randomBytes(32).toString("hex");

      await storage.updateTeacherVerificationToken(
        teacher.id,
        token
      );

      const appUrl = getServerAppUrl(req);

      await sendTeacherVerificationEmail(
        teacher.email,
        teacher.full_name,
        token,
        appUrl
      );

      const isMatch = await bcrypt.compare(password, teacher.password);

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      res.json({
        id: teacher.id,
        username: teacher.username,
        email: teacher.email,
        fullName: teacher.full_name,
        school: teacher.school ?? "",
        verified: teacher.is_verified === "true",
        approved: teacher.is_approved === "true",
        message: "Verification email sent successfully.",
      });
    });

     app.post("/api/teacher/forgot-password", async (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({
            message: "Email is required",
          });
        }

        const teacher = await storage.getTeacherByEmail(email);

        // Security:
        if (!teacher) {
          return res.json({
            message:
              "If this email exists, a password reset link has been sent.",
          });
        }

        const token = crypto.randomBytes(32).toString("hex");

        const expires = new Date(
          Date.now() + 1000 * 60 * 60
        ); // 1 hour

        await storage.updateTeacherResetToken(
          teacher.id,
          token,
          expires
        );

        const appUrl = getServerAppUrl(req);

        await sendPasswordResetEmail(
          teacher.email,
          teacher.fullName,
          token,
          "teacher",
          appUrl
        );

        return res.json({
          message:
            "If this email exists, a password reset link has been sent.",
        });

      } catch (error) {

        console.error(error);

        return res.status(500).json({
          message: "Something went wrong",
        });

      }
    });

    app.post("/api/teacher/reset-password", async (req, res) => {
      try {

        const { token, password } = req.body;

        if (!token || !password) {
          return res.status(400).json({
            message: "Token and password are required",
          });
        }

        const teacher =
          await storage.getTeacherByResetToken(token);

        if (!teacher) {
          return res.status(400).json({
            message: "Invalid or expired reset link.",
          });
        }

        const hashedPassword =
          await bcrypt.hash(password, 10);

        await storage.updateTeacherPassword(
          teacher.id,
          hashedPassword
        );

        await storage.clearTeacherResetToken(
          teacher.id
        );

        return res.json({
          message: "Password reset successfully.",
        });

      } catch (error) {

        console.error(error);

        return res.status(500).json({
          message: "Something went wrong.",
        });

      }
    });

    app.post("/api/teacher/resend-verification", async (req, res) => {
      try {
        const email = String(req.body?.email ?? "").trim().toLowerCase();

        if (!email) {
          return res.status(400).json({
            error: "Email is required",
          });
        }

        // 1. Teacher find karo
        const teacher = await storage.getTeacherByEmail(email);

        if (!teacher) {
          return res.status(404).json({
            error: "Teacher not found",
          });
        }

        // 2. Agar already verified hai
        if (teacher.isVerified === "true") {
          return res.status(400).json({
            error: "Teacher is already verified",
          });
        }

        // 3. Naya token banao
        const token = crypto.randomBytes(32).toString("hex");

        // 4. Database me save karo
        await storage.updateTeacherVerificationToken(
          teacher.id,
          token
        );

        const appUrl = getServerAppUrl(req);

        // 5. Email bhejo
        await sendTeacherVerificationEmail(
          teacher.email,
          teacher.fullName,
          token,
          appUrl
        );

        // 6. Success response
        return res.json({
          success: true,
          message: "Verification email sent successfully.",
        });

      } catch (error) {
        console.error("Resend Verification Error:", error);

        return res.status(500).json({
          error: "Failed to resend verification email",
        });
      }
    });

    app.get("/api/teacher/email-verify", async (req, res) => {
      try {
        const token = String(req.query.token ?? "").trim();

        console.log("VERIFY TOKEN:", token);

        const teacher = await storage.verifyTeacher(token);

        console.log("VERIFY RESULT:", teacher);

        if (!teacher) {
          return res.status(400).send(`
            <h2>Verification Failed</h2>
            <p>This verification link is invalid or has already been used.</p>
          `);
        }

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Teacher Verified</title>
            <style>
              body{
                font-family:Arial,sans-serif;
                background:#f5f7fb;
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
              }
              .card{
                background:white;
                padding:40px;
                border-radius:12px;
                box-shadow:0 8px 25px rgba(0,0,0,.1);
                text-align:center;
                max-width:500px;
              }
              h1{
                color:#16a34a;
              }
              a{
                display:inline-block;
                margin-top:20px;
                background:#2563eb;
                color:white;
                padding:12px 24px;
                border-radius:8px;
                text-decoration:none;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>✅ Teacher Verified Successfully</h1>

              <p>Your teacher account has been verified successfully.</p>

              <p>Your account is now waiting for admin approval before Teacher Dashboard access is enabled.</p>

              <a href="${buildServerAppUrl(req, "/teacher-auth")}">
                Return to Teacher Login
              </a>

            </div>
          </body>
          </html>
        `);

      }  catch (err) {
          console.error("VERIFY ERROR:", err);
          return res.status(500).send("Internal Error");
        }
    });

    app.get("/api/teacher/:teacherId", async (req, res) => {
      try {
        const { teacherId } = req.params;
        const teacher = await storage.getTeacher(teacherId);

        if (!teacher) {
          return res.status(404).json({ error: "Teacher not found" });
        }

        res.json({
          id: teacher.id,
          username: teacher.username,
          email: teacher.email,
          fullName: teacher.fullName ?? "",
          school: teacher.school ?? "",
          verified: teacher.isVerified === "true",
          approved: teacher.isApproved === "true",
        });
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
        res.status(500).json({ error: "Failed to fetch teacher profile" });
      }
    });

    app.patch("/api/teacher/:teacherId/approval", async (req, res) => {
      try {
        const { teacherId } = req.params;
        const approvedValue = req.body?.isApproved;
        const isApproved =
          approvedValue === true ||
          approvedValue === "true" ||
          approvedValue === 1 ||
          approvedValue === "1";

        const teacher = await storage.updateTeacherApproval(teacherId, isApproved);

        if (!teacher) {
          return res.status(404).json({ error: "Teacher not found" });
        }

        return res.json({
          ...normalizeTeacherProfile(teacher),
          verified: teacher.isVerified === "true",
          approved: teacher.isApproved === "true",
        });
      } catch (error) {
        console.error("Error updating teacher approval:", error);
        return res.status(500).json({ error: "Failed to update teacher approval" });
      }
    });
    

    // Create and generate custom MCQ test
    app.post("/api/teacher/:teacherId/generate-test", async (req, res) => {
      try {
        const { teacherId } = req.params;
        const {
          title,
          subject,
          classLevel,
          difficulty,
          durationMinutes,
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

        const topicValidationError = getCustomTopicValidationError({
          classLevel,
          subject,
          topics,
        });

        if (topicValidationError) {
          return res.status(400).json({ error: topicValidationError });
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
          durationMinutes: Number(durationMinutes) || 30,
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

        // Load past questions from previous tests for these topics to prevent repeats
        const pastTopicQuestions = await getPastQuestionsForTopics(
          topics,
          subject,
          classLevel,
          test.id,
          30
        );

        // Generate questions using AI
        const questions = [];
        const generatedQuestionTexts = new Set<string>(); // Track exact question texts for deduplication
        const generatedQuestionSkeletons = new Set<string>();
        const questionEmbeddings: number[][] = []; // Track embeddings for semantic similarity
        const previousQuestionsList: string[] = [...pastTopicQuestions]; // Seed with past questions
        const SIMILARITY_THRESHOLD = 0.82; // Cosine similarity threshold for duplicate detection

        for (const pastQ of pastTopicQuestions) {
          generatedQuestionTexts.add(pastQ.trim().toLowerCase());
          const skel = normalizeQuestionForComparison(pastQ);
          if (skel) generatedQuestionSkeletons.add(skel);
        }

        // Determine if this is a science subject or language subject
        const scienceSubjects = [
          "physics",
          "chemistry",
          "biology",
          "general",
          "school_english",
          "school_hindi",
          "school_mathematics",
          "school_science",
          "school_social_science",
          "school_computer",
        ];
        const isScience = scienceSubjects.includes(subject.toLowerCase());
        const aiSubjectLabel = normalizeSchoolScienceSubjectKey(subject);

        // const totalQuestions = Number(numQuestions);
        const totalQuestions = Number(numQuestions) || 10;

        // Generate exact number of questions using queue-based round-robin retry with deduplication
        const maxAttemptsPerTopic = 5; // Increased for dedup retries
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
              scienceCategory: isScience ? normalizeSchoolScienceSubjectKey(subject.toLowerCase()) : undefined,
              classLevel,
              difficulty,
              chapter: 1,
              // chapterTitle: currentTopic,
              chapterTitle: currentTopic ?? "General",
              questionNumber: currentQuestionNumber,
              previousQuestions: previousQuestionsList.slice(-15),
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

              if (!questionData?.question) {
                throw new Error("Invalid question generated");
              }

              const questionSkeleton = normalizeQuestionForComparison(questionData.question);
              if (questionSkeleton && generatedQuestionSkeletons.has(questionSkeleton)) {
                throw new Error("Pattern duplicate question detected");
              }

              const embedding = await getEmbedding(questionData.question);
              for (const existingEmbedding of questionEmbeddings) {
                const similarity = cosineSimilarity(embedding, existingEmbedding);
                if (similarity >= SIMILARITY_THRESHOLD) {
                  throw new Error(`Semantic duplicate detected (${similarity.toFixed(3)})`);
                }
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
              generatedQuestionSkeletons.add(questionSkeleton);
              questionEmbeddings.push(embedding);
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
          testLanguage,
          gptModel,
          board,
          mode,
        } = req.body;

        const studentId = String(req.body.userId || req.body.studentId || "").trim();
        const studentProfile = studentId ? await storage.getStudentProfile(studentId) : undefined;

        const resolvedClassLevel = Number(studentProfile?.classLevel ?? classLevel);
        const resolvedBoard = String(studentProfile?.board ?? board ?? "").trim() || "CBSE";
        const resolvedTestLanguage = normalizeTestLanguage(
          testLanguage ?? medium ?? req.body.language ?? "english",
        );
        const resolvedSubjectLanguage = String(
          subjectLanguage ?? req.body.subjectLanguage ?? "",
        ).trim();

        console.log(
          `[STUDENT CUSTOM TEST] Generating ${numQuestions} ${difficulty} questions for ${subject} (${resolvedBoard} board, ${resolvedTestLanguage} test language)`,
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

        const topicValidationError = getCustomTopicValidationError({
          classLevel: resolvedClassLevel,
          subject,
          topics,
        });

        if (topicValidationError) {
          return res.status(400).json({ error: topicValidationError });
        }

        // Create a temporary test session for the student
        const testId = `student-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Store test metadata in memory for this session
        const testSession = {
          id: testId,
          subject,
          classLevel: resolvedClassLevel,
          difficulty,
          topics,
          numQuestions,
          testType,
          subjectLanguage: resolvedSubjectLanguage || null,
          medium: resolvedTestLanguage,
          testLanguage: resolvedTestLanguage,
          scienceCategory,
          gptModel: gptModel || "gpt-4o",
          board: resolvedBoard,
          mode,
          questions: [] as any[],
          createdAt: new Date(),
        };
        const totalQuestions = parseInt(numQuestions, 10) || 0;

        if (!totalQuestions || totalQuestions <= 0) {
          return res.status(400).json({ error: "Invalid number of questions" });
        }

        // Generate questions using the same logic as teacher tests
        const scienceSubjects = [
          "physics",
          "chemistry",
          "biology",
          "general",
          "school_english",
          "school_hindi",
          "school_mathematics",
          "school_science",
          "school_social_science",
          "school_computer",
        ];
        const isScience = scienceSubjects.includes(subject.toLowerCase());
        const aiSubjectLabel = normalizeSchoolScienceSubjectKey(subject);

        // Load past questions from previous tests for these topics to prevent repeats
        const pastStudentTopicQuestions = await getPastQuestionsForTopics(
          topics,
          subject,
          resolvedClassLevel,
          null,
          30
        );

        const generatedQuestionTexts = new Set<string>();
        const generatedQuestionSkeletons = new Set<string>();
        const questionEmbeddings: number[][] = [];
        const previousQuestionsList: string[] = [...pastStudentTopicQuestions];
        const SIMILARITY_THRESHOLD = 0.82;

        const maxAttemptsPerTopic = 8;
        const maxTotalAttempts =
          totalQuestions * topics.length * maxAttemptsPerTopic;
        const perTopicFailures = new Map<string, number>();
        let topicQueue = [...topics];
        let totalAttempts = 0;
        let generatedCount = 0;

        topics.forEach((topic: string) => perTopicFailures.set(topic, 0));

        // 🔥 INSERT TEST ONCE (BEFORE LOOP)
        // const studentId = req.body.studentId || "student-1";

        const testInsert = await pool.query(
          `INSERT INTO mcq_tests 
            (class_level, subject, difficulty, total_questions,medium, generated_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
          [resolvedClassLevel, subject, difficulty, numQuestions, resolvedTestLanguage, studentId || null],
        );

        const mcqTestId = testInsert.rows[0].id;

        const existingTexts = new Set<string>();
        const existingQuestionSkeletons = new Set<string>();
        const existingEmbeddings: number[][] = [];

        // Pre-populate sets with historical questions from DB so new test won't duplicate them
        for (const pastQ of pastStudentTopicQuestions) {
          existingTexts.add(pastQ.trim().toLowerCase());
          const skel = normalizeQuestionForComparison(pastQ);
          if (skel) existingQuestionSkeletons.add(skel);
        }

        let totalGenerated = 0;
        let safetyCounter = 0;
        const MAX_TOTAL_ATTEMPTS = numQuestions * 5;
        const chunkSize = 10;

        async function generateChunk(requestedCount: number) {
          const mediumInstruction =
            resolvedTestLanguage === "hindi"
              ? "Generate all questions strictly in Hindi language."
              : "Generate all questions strictly in English language.";

          // const response = await openai.chat.completions.create({
          //   model: testSession.gptModel,
          //   temperature: 0.8,
          //   messages: [
          //     {
          let raw: string | undefined;

          const randomSeedToken = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

          if (testSession.gptModel?.startsWith("hf-")) {
            // 🤗 HuggingFace
            raw = await generateFromHF(`
          Generate ${requestedCount} unique MCQ questions.

          Subject language: ${resolvedSubjectLanguage || aiSubjectLabel}

          Topics to cover: ${topics.join(", ")}

          Previously generated questions (DO NOT REPEAT):
          ${previousQuestionsList.length > 0 ? previousQuestionsList.slice(-20).join("\n") : "None"}

          ${mediumInstruction}

          Generation Seed: ${randomSeedToken}

          Rules:
          - Every question must be unique
          - Do not repeat or paraphrase previous questions
          - Each question should test a different concept or sub-topic
          - Avoid using the same question opening pattern repeatedly

          Return strictly in JSON array format.
          `);
          } else {
            // 🤖 OpenAI
          const response = await openai.chat.completions.create({
            model: testSession.gptModel,
            temperature: 0.85,
            messages: [
              {
                  role: "user",
                  content: `
          Generate ${requestedCount} unique MCQ questions.

          Subject language: ${resolvedSubjectLanguage || aiSubjectLabel}

          Topics to cover: ${topics.join(", ")}

          ${mediumInstruction}

          Previously generated questions (DO NOT REPEAT OR REWORD ANY OF THESE):
          ${previousQuestionsList.length > 0 ? previousQuestionsList.slice(-25).join("\n") : "None"}

          Unique Random Seed: ${randomSeedToken}

          IMPORTANT:
          - Cover diverse cognitive angles: practical real-world application, reasoning/cause-effect, comparisons, numerical calculation, and common exceptions.
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
        - Do not paraphrase or slightly reword previously generated questions
        - Change the framing style across questions
        - Prefer application, comparison, reasoning, example-based, or cause-effect questions
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
            const skeleton = normalizeQuestionForComparison(q.question);

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
            if (skeleton && existingQuestionSkeletons.has(skeleton)) continue;

            const embedding = await getEmbedding(q.question);
            let isSemanticDuplicate = false;
            for (const existingEmbedding of existingEmbeddings) {
              const similarity = cosineSimilarity(embedding, existingEmbedding);
              if (similarity >= SIMILARITY_THRESHOLD) {
                isSemanticDuplicate = true;
                break;
              }
            }

            if (isSemanticDuplicate) continue;

            await saveMCQ(
              q.question,
              q.options || [],
              q.correctAnswer.trim(),
              mcqTestId,
            );

            existingTexts.add(text);
            existingQuestionSkeletons.add(skeleton);
            existingEmbeddings.push(embedding);
            testSession.questions.push(q);
            previousQuestionsList.push(q.question);

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

    app.get("/api/teacher/:teacherId/tests/:testId", async (req, res) => {
      try {
        const { teacherId, testId } = req.params;

        const test = await storage.getCustomTest(testId);

        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }

        const questions = await storage.getCustomQuestions(testId);
        const submissions = await storage.getCustomTestSubmissionsByTestId(testId);

        const parsedQuestions = questions.map((q) => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : null,
        }));

        const completedSubmissions = submissions
          .filter((submission: any) => submission.end_time || submission.endTime)
          .map((submission: any) => ({
            ...submission,
            studentName: submission.student_name ?? submission.studentName ?? "Anonymous",
            score: submission.score ?? 0,
            totalQuestions: submission.total_questions ?? submission.totalQuestions ?? 0,
            startTime: submission.start_time ?? submission.startTime,
            endTime: submission.end_time ?? submission.endTime,
            timeTakenSeconds:
              submission.time_taken_seconds ?? submission.timeTakenSeconds ?? 0,
            submissionType:
              submission.submission_type ?? submission.submissionType ?? "manual",
          }));

        res.json({
          test: serializeCustomTest({
            ...test,
            numQuestions: questions.length,
          }),
          questions: parsedQuestions,
          submissions: completedSubmissions,
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

        res.json(tests.map(serializeCustomTest));
      } catch (error) {
        console.error("Error fetching teacher tests:", error);
        res.status(500).json({ error: "Failed to fetch tests" });
      }
    });


    const handleManualEditQuestion = async (req: Request, res: Response) => {
      try {
        const { teacherId, testId: routeTestId, questionId } = req.params;
        const { testId: requestedTestId } = req.body;
        const { question, options, correctOption, correctAnswer, explanation } =
          req.body;

        if (!teacherId || !questionId) {
          return res.status(400).json({ error: "Missing teacherId or questionId" });
        }
        if (!routeTestId && !requestedTestId) {
          return res.status(400).json({ error: "Missing testId" });
        }

        console.log(
          `[QUESTION EDIT] Teacher ${teacherId} editing question ${questionId} for routeTestId=${routeTestId || "none"}`,
        );

        const existingQuestion = await storage.getCustomQuestion(questionId);
        if (!existingQuestion) {
          return res.status(404).json({ error: "Question not found" });
        }

        const resolvedTestId =
          routeTestId || requestedTestId || existingQuestion.testId;
        console.log(
          `[QUESTION EDIT] questionId=${questionId}, routeTestId=${routeTestId || "none"}, requestedTestId=${requestedTestId || "none"}, storedTestId=${existingQuestion.testId}, resolvedTestId=${resolvedTestId}`,
        );

        let test = await storage.getCustomTest(resolvedTestId);
        if (!test && resolvedTestId !== existingQuestion.testId) {
          test = await storage.getCustomTest(existingQuestion.testId);
        }
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }
        const normalizedTeacherId = String(teacherId);
        const normalizedTestTeacherId = String(
          test.teacherId ?? (test as any).teacher_id ?? "",
        );
        console.log(
          `[QUESTION EDIT] ownership check teacherId=${normalizedTeacherId} (${typeof teacherId}), test.teacherId=${normalizedTestTeacherId} (${typeof test.teacherId})`,
        );

        if (normalizedTestTeacherId !== normalizedTeacherId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

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

          const originalCorrectIndex = correctOption.charCodeAt(0) - 65;
          const correctOptionText = options[originalCorrectIndex];

          if (!correctOptionText || correctOptionText.trim().length === 0) {
            return res
              .status(400)
              .json({ error: "The selected correct option cannot be empty" });
          }

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

          const newCorrectIndex = validOptions.findIndex(
            (opt) => opt.index === originalCorrectIndex,
          );
          if (newCorrectIndex === -1) {
            return res.status(400).json({
              error:
                "The correct option was removed. Please select a different correct option.",
            });
          }

          const newCorrectOption = String.fromCharCode(65 + newCorrectIndex);
          const finalOptions = validOptions.map((opt) => opt.text);

          updates.options = JSON.stringify(finalOptions);
          updates.correctOption = newCorrectOption;
          updates.correctAnswer = finalOptions[newCorrectIndex];
        } else {
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
          options: updatedQuestion.options ? JSON.parse(updatedQuestion.options) : null,
        });
      } catch (error) {
        console.error("Error editing question:", error);
        res.status(500).json({ error: "Failed to edit question" });
      }
    };

    const handleAiEditQuestion = async (req: Request, res: Response) => {
      try {
        const { teacherId, testId: routeTestId, questionId } = req.params;
        const { feedback, testId: requestedTestId } = req.body;

        if (!teacherId || !questionId) {
          return res.status(400).json({ error: "Missing teacherId or questionId" });
        }
        if (!routeTestId && !requestedTestId) {
          return res.status(400).json({ error: "Missing testId" });
        }

        if (!feedback || feedback.trim().length < 10) {
          return res.status(400).json({
            error: "Please provide detailed feedback (at least 10 characters)",
          });
        }

        console.log(
          `[AI QUESTION EDIT] Teacher ${teacherId} requesting AI edit for question ${questionId} for routeTestId=${routeTestId || "none"}`,
        );
        console.log(
          `[AI QUESTION EDIT] Feedback: "${feedback.substring(0, 50)}..."`,
        );

        const existingQuestion = await storage.getCustomQuestion(questionId);
        if (!existingQuestion) {
          return res.status(404).json({ error: "Question not found" });
        }

        const resolvedTestId =
          routeTestId || requestedTestId || existingQuestion.testId;
        console.log(
          `[AI QUESTION EDIT] questionId=${questionId}, routeTestId=${routeTestId || "none"}, requestedTestId=${requestedTestId || "none"}, storedTestId=${existingQuestion.testId}, resolvedTestId=${resolvedTestId}`,
        );

        let test = await storage.getCustomTest(resolvedTestId);
        if (!test && resolvedTestId !== existingQuestion.testId) {
          test = await storage.getCustomTest(existingQuestion.testId);
        }
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }
        const normalizedTeacherId = String(teacherId);
        const normalizedTestTeacherId = String(
          test.teacherId ?? (test as any).teacher_id ?? "",
        );
        console.log(
          `[AI QUESTION EDIT] ownership check teacherId=${normalizedTeacherId} (${typeof teacherId}), test.teacherId=${normalizedTestTeacherId} (${typeof test.teacherId})`,
        );

        if (normalizedTestTeacherId !== normalizedTeacherId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const parsedOptions = existingQuestion.options
          ? JSON.parse(existingQuestion.options)
          : undefined;

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
    };

    app.patch(
      "/api/teacher/:teacherId/tests/:testId/question/:questionId/edit",
      handleManualEditQuestion,
    );
    app.patch(
      "/api/teacher/:teacherId/question/:questionId/edit",
      handleManualEditQuestion,
    );

    app.post(
      "/api/teacher/:teacherId/tests/:testId/question/:questionId/ai-edit",
      handleAiEditQuestion,
    );
    app.post(
      "/api/teacher/:teacherId/question/:questionId/ai-edit",
      handleAiEditQuestion,
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

        res.json({ test: serializeCustomTest(test), questions: questionsForStudent });
      } catch (error) {
        console.error("Error fetching custom test:", error);
        res.status(500).json({ error: "Failed to fetch test" });
      }
    });

    // Start a timed custom test session
    app.post("/api/custom-test/start", async (req, res) => {
      try {
        const { testId, studentName } = req.body;

        if (!testId || !studentName?.trim()) {
          return res.status(400).json({ error: "Test ID and student name are required" });
        }

        const test = await storage.getCustomTest(testId);
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }

        const existingActive = (await storage.getCustomTestSubmissionsByTestId(testId)).find(
          (submission: any) =>
            submission.student_name === studentName.trim() && !submission.end_time && !submission.endTime,
        );

        if (existingActive) {
          return res.json({
            submissionId: existingActive.id,
            startTime: existingActive.start_time ?? existingActive.startTime,
            durationMinutes: test.durationMinutes,
          });
        }

        const startTime = new Date();
        const submission = await storage.createCustomTestSubmission({
          testId,
          studentName: studentName.trim(),
          score: 0,
          totalQuestions: test.numQuestions,
          timeTakenSeconds: 0,
          submissionType: null as any,
          startTime,
          endTime: null as any,
          answers: "{}",
        });

        res.json({
          submissionId: submission.id,
          startTime: submission.startTime,
          durationMinutes: test.durationMinutes,
        });
      } catch (error) {
        console.error("Error starting custom test:", error);
        res.status(500).json({ error: "Failed to start test" });
      }
    });

    // Submit answer for custom test question
    app.post("/api/custom-test/evaluate", async (req, res) => {
      try {
        const { testId, questionId, studentAnswer } = req.body;
        console.log("[CUSTOM TEST][EVALUATE] payload:", {
          testId,
          questionId,
          studentAnswer,
        });

        const test = await storage.getCustomTest(testId);
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }

        const questions = await storage.getCustomQuestions(testId);
        const question = findQuestionById(questions, questionId);

        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        const evaluation = await evaluateCustomTestQuestion(
          test,
          question,
          studentAnswer,
        );
        console.log("[CUSTOM TEST][EVALUATE] result:", {
          questionId,
          questionType: question.questionType,
          correctOption: question.correctOption,
          correctAnswer: question.correctAnswer,
          studentAnswer,
          isCorrect: evaluation.isCorrect,
        });

        res.json(evaluation);
      } catch (error) {
        console.error("Error evaluating answer:", error);
        res.status(500).json({ error: "Failed to evaluate answer" });
      }
    });

    // Final timed test submission for manual/auto submit
    app.post("/api/custom-test/submit", async (req, res) => {
      try {
        const {
          submissionId,
          testId,
          studentName,
          answers,
          submissionType,
          startTime,
          endTime,
        } = req.body;
        console.log("[CUSTOM TEST][SUBMIT] payload:", {
          submissionId,
          testId,
          studentName,
          submissionType,
          startTime,
          endTime,
          answerCount: answers && typeof answers === "object" ? Object.keys(answers).length : 0,
        });

        const test = await storage.getCustomTest(testId);
        if (!test) {
          return res.status(404).json({ error: "Test not found" });
        }

        const questions = await storage.getCustomQuestions(testId);
        const answerMap = normalizeSubmissionAnswers(answers);
        const submissionStart = startTime ? new Date(startTime) : new Date();
        const submissionEnd = endTime ? new Date(endTime) : new Date();
        const normalizedSubmissionType = submissionType === "auto" ? "auto" : "manual";
        const testDurationMinutes = test.durationMinutes ?? (test as any).duration_minutes ?? 0;
        const elapsedSeconds =
          normalizedSubmissionType === "auto"
            ? Math.max(0, Math.round(testDurationMinutes * 60))
            : Math.max(0, Math.round((submissionEnd.getTime() - submissionStart.getTime()) / 1000));

        let totalScore = 0;
        let correctAnswers = 0;
        const perQuestionResults = [];

        for (const question of questions) {
          const studentAnswer = (answerMap[question.id.toString()] || "").toString();
          const evaluation = await evaluateCustomTestQuestion(
            test,
            question,
            studentAnswer,
          );
          console.log("[CUSTOM TEST][SUBMIT] compare:", {
            questionId: question.id,
            questionType: question.questionType,
            studentAnswer,
            correctOption: question.correctOption,
            correctAnswer: question.correctAnswer,
            isCorrect: evaluation.isCorrect,
          });

          totalScore += Number(evaluation.score || 0);
          if (evaluation.isCorrect) {
            correctAnswers += 1;
          }

          perQuestionResults.push({
            questionId: question.id,
            questionNumber: question.questionNumber,
            ...evaluation,
            studentAnswer,
          });
        }

        const finalSubmission = submissionId
          ? await storage.updateCustomTestSubmission(submissionId, {
              testId,
              studentName: studentName?.trim() || "Anonymous",
              score: totalScore,
              totalQuestions: questions.length,
              timeTakenSeconds: elapsedSeconds,
              submissionType: normalizedSubmissionType,
              startTime: submissionStart,
              endTime: submissionEnd,
              answers: JSON.stringify(answerMap),
            })
          : await storage.createCustomTestSubmission({
              testId,
              studentName: studentName?.trim() || "Anonymous",
              score: totalScore,
              totalQuestions: questions.length,
              timeTakenSeconds: elapsedSeconds,
              submissionType: normalizedSubmissionType,
              startTime: submissionStart,
              endTime: submissionEnd,
              answers: JSON.stringify(answerMap),
            });

        res.json({
          submission: finalSubmission,
          totalScore,
          correctAnswers,
          totalQuestions: questions.length,
          timeTakenSeconds: elapsedSeconds,
          results: perQuestionResults,
        });
      } catch (error) {
        console.error("Error submitting custom test:", error);
        res.status(500).json({ error: "Failed to submit test" });
      }
    });

    app.post("/api/test/start", async (req, res) => {
      try {
        console.log("REQ BODY:", req.body); // 🔥 debug

        const {
          mode,
          language,
          testLanguage,
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

        const resolvedTestLanguage =
          normalizeLanguage(testLanguage) ??
          normalizeLanguage(language) ??
          normalizeLanguage(selectedMedium) ??
          normalizeLanguage(medium) ??
          normalizeLanguage(languagePreference) ??
          "english";

        // const resolvedMode = mode;
        const resolvedMode = mode ?? req.body?.selectedMode ?? req.body?.testMode;

        const resolvedSubjectLanguage =
          normalizeLanguage(subjectLanguage) ??
          (resolvedMode === "language"
            ? normalizeLanguage(req.body?.subject) ??
              normalizeLanguage(req.body?.selectedSubjectLanguage) ??
              (typeof language === "string" ? language.toLowerCase() : null)
            : null);

        console.log(
          `[TEST START] mode=${resolvedMode}, language=${resolvedTestLanguage}, subjectLanguage=${resolvedSubjectLanguage}, scienceCategory=${scienceCategory}, class=${safeClassLevel}, difficulty=${safeDifficulty}`,
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
          language: resolvedTestLanguage,
          subjectLanguage: resolvedSubjectLanguage,

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
          `[SESSION CREATED] mode=${session.mode}, language=${session.language}, subjectLanguage=${session.subjectLanguage}, scienceCategory=${session.scienceCategory}`,
        );

        res.json(session);
      } catch (error) {
        console.error("Error starting test:", error);
        res.status(500).json({ error: "Failed to start test" });
      }
    });

     app.post("/api/test/:sessionId/question", async (req, res) => {
      try {
        const { sessionId } = req.params;
        const session = await storage.getTestSession(sessionId);

        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        const subjectKey =
          session.mode === "science"
            ? resolveChapterSubjectKey(session.scienceCategory || "general")
            : (session.subjectLanguage || session.language || "french").toLowerCase();

        const chapters = CHAPTERS[subjectKey] || [];
        const chapter = chapters.find((c) => c.id === session.chapter);

        if (!chapter) {
          return res.status(400).json({ error: "Invalid chapter" });
        }

        const history = JSON.parse(session.conversationHistory || "[]");
        const currentSessionQuestions = history.map((h: any) => h.question).filter(Boolean);

        // Fetch past questions from previous test sessions and mcqs database for this chapter
        const pastChapterQuestions = await getPastQuestionsForChapter(
          session.chapter,
          session.scienceCategory || session.subjectLanguage || session.language,
          session.classLevel,
          sessionId,
          25
        );

        // Combined previous questions: current session questions first, then historical questions
        const combinedPreviousQuestions = [
          ...currentSessionQuestions,
          ...pastChapterQuestions,
        ];

        const isMcq =
          session.testType === "mcq-only"
            ? true
            : history.length % 2 === 0;

        const chapterTitle =
          session.language === "hindi"
            ? (chapter.title?.hindi || chapter.title?.english)
            : (chapter.title?.english || chapter.title?.hindi);

        const buildFallbackQuestion = () => {
          const isHindi = (session.language || "").toLowerCase().startsWith("hi");
          const safeTitle = chapterTitle || (isHindi ? "इस अध्याय" : "this chapter");
          const qNum = (session.currentQuestion ?? 0) + 1;

          if (isMcq) {
            const hindiTemplates = [
              {
                q: `निम्न में से कौन सी अवधारणा "${safeTitle}" के अध्ययन का मुख्य आधार है?`,
                opts: [`A. ${safeTitle} के मूल सिद्धांत`, "B. असंबंधित अवधारणा", "C. अन्य विषय", "D. इनमें से कोई नहीं"],
                ans: `${safeTitle} के मूल सिद्धांत`,
              },
              {
                q: `दैनिक जीवन में "${safeTitle}" का प्रमुख अनुप्रयोग क्या है?`,
                opts: [`A. ${safeTitle} से जुड़े व्यावहारिक कार्य`, "B. प्रकाश संश्लेषण", "C. ध्वनि संचरण", "D. इनमें से कोई नहीं"],
                ans: `${safeTitle} से जुड़े व्यावहारिक कार्य`,
              },
              {
                q: `"${safeTitle}" के संबंध में कौन सा कथन सबसे उपयुक्त है?`,
                opts: [`A. यह NCERT पाठ्यक्रम का एक महत्वपूर्ण भाग है`, "B. इसका कोई व्यावहारिक महत्व नहीं है", "C. यह केवल सिद्धांत है", "D. उपरोक्त सभी गलत हैं"],
                ans: "यह NCERT पाठ्यक्रम का एक महत्वपूर्ण भाग है",
              },
              {
                q: `निम्न में से कौन सा "${safeTitle}" से सीधे संबंधित है?`,
                opts: [`A. ${safeTitle}`, "B. असंबंधित अवधारणा", "C. अलग विषय", "D. उपरोक्त में से कोई नहीं"],
                ans: safeTitle,
              },
            ];

            const englishTemplates = [
              {
                q: `Which of the following is most directly related to the core concepts of "${safeTitle}"?`,
                opts: [`A. Fundamental principles of ${safeTitle}`, "B. An unrelated concept", "C. A different topic", "D. None of the above"],
                ans: `Fundamental principles of ${safeTitle}`,
              },
              {
                q: `What is a primary practical application related to "${safeTitle}"?`,
                opts: [`A. Practical scenarios involving ${safeTitle}`, "B. Unrelated industrial process", "C. Random physical phenomenon", "D. None of the above"],
                ans: `Practical scenarios involving ${safeTitle}`,
              },
              {
                q: `Which statement best describes an important aspect of "${safeTitle}"?`,
                opts: [`A. It forms a key part of the NCERT curriculum`, "B. It has no physical significance", "C. It applies only in vacuum", "D. All options are incorrect"],
                ans: "It forms a key part of the NCERT curriculum",
              },
              {
                q: `Which of the following is most directly related to "${safeTitle}"?`,
                opts: [`A. ${safeTitle}`, "B. An unrelated concept", "C. A different topic", "D. None of the above"],
                ans: safeTitle,
              },
            ];

            const templates = isHindi ? hindiTemplates : englishTemplates;
            const chosen = templates[(qNum - 1) % templates.length];

            return {
              question: chosen.q,
              options: chosen.opts,
              correctOption: "A",
              correctAnswer: chosen.ans,
              explanation: isHindi
                ? "यह एक बेसिक fallback प्रश्न है ताकि टेस्ट आगे बढ़ सके।"
                : "This is a basic fallback question to keep the test flowing.",
              questionType: "mcq",
            };
          }

          return {
            question: isHindi
              ? `"${safeTitle}" के मुख्य सिद्धांतों को संक्षेप में समझाइए।`
              : `Briefly explain the key concepts of "${safeTitle}".`,
            correctAnswer: isHindi
              ? `"${safeTitle}" इस अध्याय का मुख्य विषय है।`
              : `"${safeTitle}" is the main topic of this chapter.`,
            explanation: isHindi
              ? "यह एक बेसिक fallback उत्तर है।"
              : "This is a basic fallback answer.",
            questionType: "open-ended",
          };
        };

        let questionData: any = null;
        let attempts = 0;
        const maxGenerationAttempts = 3;

        while (attempts < maxGenerationAttempts) {
          attempts++;
          try {
            const candidate = await generateQuestion({
              mode: session.mode,
              // ✅ ALWAYS SAFE LANGUAGE
              language: session.language ?? "english",
              // ✅ SAFE SUBJECT HANDLING
              scienceCategory:
                session.mode === "science"
                  ? normalizeSchoolScienceSubjectKey(session.scienceCategory ?? "physics")
                  : undefined,
              // ✅ SAFE CLASS + DIFFICULTY
              classLevel: session.classLevel ?? 6,
              difficulty: session.difficulty ?? "easy",
              chapter: session.chapter,
              // ✅ UNIVERSAL TITLE FIX
              chapterTitle,
              // ✅ NaN FIX
              questionNumber: (session.currentQuestion ?? 0) + 1,
              previousQuestions: combinedPreviousQuestions,
              // ✅ BOOLEAN SAFETY
              isMcq: !!isMcq,
            });

            if (!candidate || !candidate.question) {
              continue;
            }

            const candidateText = candidate.question.trim().toLowerCase();
            const candidateSkeleton = normalizeQuestionForComparison(candidate.question);

            const isExactMatch = combinedPreviousQuestions.some(
              (prev) => prev.trim().toLowerCase() === candidateText
            );
            const isSkeletonMatch =
              candidateSkeleton.length > 10 &&
              combinedPreviousQuestions.some((prev) => {
                const prevSkel = normalizeQuestionForComparison(prev);
                return prevSkel.length > 10 && prevSkel === candidateSkeleton;
              });

            if (isExactMatch || isSkeletonMatch) {
              console.warn(
                `[TEST SESSION] Duplicate detected on attempt ${attempts} ("${candidate.question.substring(0, 50)}..."), regenerating...`
              );
              combinedPreviousQuestions.push(candidate.question);
              continue;
            }

            questionData = candidate;
            break;
          } catch (error) {
            console.error(`[TEST SESSION] AI generation attempt ${attempts} failed:`, error);
          }
        }

        if (!questionData) {
          console.warn("[TEST SESSION] AI question generation attempts exhausted or failed. Using fallback.");
          questionData = buildFallbackQuestion();
        }
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
        console.log("[TEST][EVALUATE] payload:", { sessionId, answer });

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
        if (normalizeQuestionType(currentQuestionData.questionType) === "mcq") {
          const normalizedAnswer = normalizeTextForComparison(answer);
          const normalizedCorrectOption = normalizeTextForComparison(currentQuestionData.correctOption);
          const normalizedCorrectAnswer = normalizeTextForComparison(currentQuestionData.correctAnswer);
          const isCorrect =
            normalizedAnswer === normalizedCorrectOption ||
            normalizedAnswer === normalizedCorrectAnswer;
          console.log("[TEST][EVALUATE] compare:", {
            questionType: currentQuestionData.questionType,
            answer,
            normalizedAnswer,
            correctOption: currentQuestionData.correctOption,
            normalizedCorrectOption,
            correctAnswer: currentQuestionData.correctAnswer,
            normalizedCorrectAnswer,
            isCorrect,
          });
          const score = isCorrect ? 10 : 0;
          const isHindiSession = (session.language || "")
            .toString()
            .toLowerCase()
            .startsWith("hindi");
          const correctFeedback = isHindiSession
            ? `सही! ${currentQuestionData.explanation}`
            : `Correct! ${currentQuestionData.explanation}`;
          const incorrectFeedback = isHindiSession
            ? `गलत। सही उत्तर ${currentQuestionData.correctOption}: ${currentQuestionData.correctAnswer} है। ${currentQuestionData.explanation}`
            : `Incorrect. The correct answer is ${currentQuestionData.correctOption}: ${currentQuestionData.correctAnswer}. ${currentQuestionData.explanation}`;

          evaluation = {
            score,
            feedback: isCorrect ? correctFeedback : incorrectFeedback,
            isCorrect,
            encouragement: isCorrect
              ? isHindiSession
                ? "शानदार! आपका उत्तर सही है।"
                : "Excellent work! You got it right!"
              : isHindiSession
                ? "अभ्यास जारी रखें! अगला प्रश्न आप बेहतर करेंगे।"
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
          correctOption: currentQuestionData.correctOption,
          explanation: currentQuestionData.explanation || evaluation.feedback,
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

    app.get("/api/student-score-history", async (req, res) => {
      try {
        const userId = String(req.query.userId || "").trim();
        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        const history = await storage.getStudentScoreHistory(userId);
        res.json(history);
      } catch (error: any) {
        console.error("[SCORE HISTORY GET ERROR]", error.message);
        res.status(500).json({ error: "Failed to fetch score history" });
      }
    });

    app.post("/api/student-score-history", async (req, res) => {
      try {
        const {
          id,
          userId,
          userEmail,
          subject,
          mode,
          difficulty,
          language,
          score,
          maxScore,
          percentage,
          totalQuestions,
          correctAnswers,
          classLevel,
          insights,
        } = req.body || {};

        if (!userId || !subject) {
          return res.status(400).json({ error: "userId and subject are required" });
        }

        let parsedInsights = insights;
        if (typeof parsedInsights === "string") {
          try {
            parsedInsights = JSON.parse(parsedInsights);
          } catch {}
        }

        const rawClass = classLevel ?? req.body?.class_level ?? req.body?.class ?? parsedInsights?.classLevel ?? parsedInsights?.questionPaper?.classLevel ?? null;
        const parsedClass = rawClass != null && !Number.isNaN(Number(rawClass)) && Number(rawClass) > 0 ? Number(rawClass) : null;

        const entry = await storage.upsertStudentScoreHistory({
          id,
          userId,
          userEmail,
          subject,
          mode,
          difficulty,
          language: language || "english",
          classLevel: parsedClass,
          score: Number(score) || 0,
          maxScore: Number(maxScore) || 0,
          percentage: Number(percentage) || 0,
          totalQuestions: Number(totalQuestions) || 0,
          correctAnswers: Number(correctAnswers) || 0,
          insights: parsedInsights ?? {},
        } as any);

        // Auto save to generated_tests & generated_test_questions centrally
        autoSaveScoreHistoryToGeneratedTests({
          userId,
          userEmail,
          subject,
          mode,
          difficulty,
          language,
          classLevel: parsedClass,
          insights: parsedInsights,
        });

        res.json(entry);
      } catch (error: any) {
        console.error("[SCORE HISTORY SAVE ERROR]", error.message);
        res.status(500).json({ error: "Failed to save score history" });
      }
    });

function cleanOptionText(text: string): string {
  return String(text || "").replace(/^[A-D][.)]?\s*/i, "").trim();
}

function parseQuestionOptionsAndAnswers(q: any) {
  let optionA = "";
  let optionB = "";
  let optionC = "";
  let optionD = "";

  const opts = Array.isArray(q.options)
    ? q.options
    : typeof q.options === "string"
    ? (function() { try { return JSON.parse(q.options); } catch { return []; } })()
    : [];

  if (Array.isArray(opts)) {
    optionA = opts[0] ? cleanOptionText(opts[0]) : "";
    optionB = opts[1] ? cleanOptionText(opts[1]) : "";
    optionC = opts[2] ? cleanOptionText(opts[2]) : "";
    optionD = opts[3] ? cleanOptionText(opts[3]) : "";
  } else if (opts && typeof opts === "object") {
    optionA = cleanOptionText(opts.optionA || opts.A || "");
    optionB = cleanOptionText(opts.optionB || opts.B || "");
    optionC = cleanOptionText(opts.optionC || opts.C || "");
    optionD = cleanOptionText(opts.optionD || opts.D || "");
  }

  let correctOption = (q.correctOption || q.correct_option || "").toString().trim().toUpperCase();
  if (correctOption.startsWith("OPTION ")) {
    correctOption = correctOption.replace("OPTION ", "").trim();
  }
  if (!["A", "B", "C", "D"].includes(correctOption)) {
    const rawAnswer = cleanOptionText(q.correctAnswer || q.correct_answer || "");
    if (rawAnswer && optionA && rawAnswer.toLowerCase() === optionA.toLowerCase()) correctOption = "A";
    else if (rawAnswer && optionB && rawAnswer.toLowerCase() === optionB.toLowerCase()) correctOption = "B";
    else if (rawAnswer && optionC && rawAnswer.toLowerCase() === optionC.toLowerCase()) correctOption = "C";
    else if (rawAnswer && optionD && rawAnswer.toLowerCase() === optionD.toLowerCase()) correctOption = "D";
  }

  let correctAnswer = cleanOptionText(q.correctAnswer || q.correct_answer || "");
  if (!correctAnswer && correctOption) {
    if (correctOption === "A") correctAnswer = optionA;
    else if (correctOption === "B") correctAnswer = optionB;
    else if (correctOption === "C") correctAnswer = optionC;
    else if (correctOption === "D") correctAnswer = optionD;
  }

  return {
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption: correctOption || null,
    correctAnswer: correctAnswer || "",
  };
}

async function autoSaveScoreHistoryToGeneratedTests(payload: any) {
  try {
    const { userId, userEmail, subject, mode, difficulty, language, classLevel, insights } = payload;
    const qPaper = insights?.questionPaper || insights;
    const questions = qPaper?.questions || insights?.questions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
      return;
    }

    let studentName = "Student";
    let studentEmail = userEmail || null;
    let board = "CBSE";
    let medium = language || "English";

    if (userId) {
      const profile = await storage.getStudentProfile(userId);
      if (profile) {
        if (profile.fullName) studentName = profile.fullName;
        if (profile.emailAddress) studentEmail = profile.emailAddress;
        if (profile.board) board = profile.board;
        if (profile.medium) medium = profile.medium;
      }
    }

    const formattedQuestions = questions.map((q: any, idx: number) => {
      const parsed = parseQuestionOptionsAndAnswers(q);
      return {
        questionNumber: q.questionNumber || idx + 1,
        question: q.question || "",
        optionA: parsed.optionA,
        optionB: parsed.optionB,
        optionC: parsed.optionC,
        optionD: parsed.optionD,
        correctOption: parsed.correctOption,
        correctAnswer: parsed.correctAnswer,
        explanation: q.explanation || "",
      };
    });

    await storage.createGeneratedTest({
      studentId: userId || "student-anonymous",
      studentName,
      studentEmail,
      classLevel: classLevel ? Number(classLevel) : null,
      subject: subject || "General",
      chapterTopic: qPaper?.topic || qPaper?.chapterTitle || insights?.chapterTitle || null,
      medium,
      board,
      difficulty: difficulty || "Medium",
      testType: "MCQ",
      testMode: mode || "Practice",
    }, formattedQuestions);
  } catch (err) {
    console.error("[AUTO SAVE GENERATED TEST FROM SCORE HISTORY ERROR]", err);
  }
}

    app.delete("/api/student-score-history", async (req, res) => {
      try {
        const userId = String(req.query.userId || req.body?.userId || "").trim();
        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        await storage.deleteStudentScoreHistory(userId);
        res.json({ success: true });
      } catch (error: any) {
        console.error("[SCORE HISTORY DELETE ERROR]", error.message);
        res.status(500).json({ error: "Failed to reset score history" });
      }
    });

    const handleGetStudentProfile = async (req: Request, res: Response) => {
      try {
        const userId = String(req.query.userId || req.headers["x-user-id"] || "").trim();
        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        const profile = await storage.getStudentProfile(userId);

        if (!profile) {
          return res.status(404).json({ error: "Profile not found" });
        }

        res.json(profile);
      } catch (error: any) {
        console.error("[STUDENT PROFILE GET ERROR]", error?.stack || error?.message || error);
        res.status(500).json({ error: error?.message || "Failed to fetch student profile" });
      }
    };

    const handlePostStudentProfile = async (req: Request, res: Response) => {
      try {
        const {
          userId,
          fullName,
          displayName,
          classLevel,
          school,
          medium,
          board,
          country,
          state,
          city,
        } = req.body || {};

        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        const resolvedFullName = String(fullName ?? displayName ?? "").trim();
        const resolvedSchool = String(school ?? "").trim() || null;
        const resolvedMedium = String(medium ?? "").trim() || null;
        const resolvedBoard = String(board ?? "").trim() || null;
        const resolvedCountry = String(country ?? "").trim() || null;
        const resolvedState = String(state ?? "").trim() || null;
        const resolvedCity = String(city ?? "").trim() || null;

        let resolvedClassLevel: number | null = null;
        if (classLevel !== undefined && classLevel !== null && classLevel !== "") {
          if (typeof classLevel === "number" && Number.isFinite(classLevel) && classLevel > 0) {
            resolvedClassLevel = Math.floor(classLevel);
          } else {
            const digits = String(classLevel).replace(/\D+/g, "");
            if (digits) {
              const parsed = parseInt(digits, 10);
              if (Number.isFinite(parsed) && parsed > 0) {
                resolvedClassLevel = parsed;
              }
            }
          }
        }

        if (!resolvedFullName) {
          return res.status(400).json({ error: "Full name is required" });
        }

        const profile = await storage.upsertStudentProfile({
          userId,
          fullName: resolvedFullName,
          displayName: resolvedFullName,
          emailAddress: null,
          classLevel: resolvedClassLevel,
          school: resolvedSchool,
          medium: resolvedMedium,
          board: resolvedBoard,
          country: resolvedCountry,
          state: resolvedState,
          city: resolvedCity,
        });

        res.json(profile);
      } catch (error: any) {
        console.error("[STUDENT PROFILE SAVE ERROR]", error?.stack || error?.message || error);
        res.status(500).json({ error: error?.message || "Failed to save student profile" });
      }
    };

    app.get("/api/student-profile", handleGetStudentProfile);
    app.get("/api/student/profile", handleGetStudentProfile);
    app.post("/api/student-profile", handlePostStudentProfile);
    app.post("/api/student/profile", handlePostStudentProfile);

    const httpServer = createServer(app);
    return httpServer;
  }
