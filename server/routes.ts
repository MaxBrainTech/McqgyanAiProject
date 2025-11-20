import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestion, evaluateAnswer, improveQuestion, getEmbedding, cosineSimilarity } from "./openai";

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
  hindi: [
    { id: 1, title: "अभिवादन (Abhivadan)", description: "Greetings and basic expressions" },
    { id: 2, title: "आत्म परिचय (Parichay)", description: "Self introduction and personal details" },
    { id: 3, title: "संख्याएँ (Sankhyaen)", description: "Numbers 1-100" },
    { id: 4, title: "परिवार (Parivar)", description: "Family members and relationships" },
    { id: 5, title: "रंग (Rang)", description: "Colors and descriptions" },
    { id: 6, title: "वर्णमाला (Varnmala)", description: "Hindi alphabet (Swar and Vyanjan)" },
    { id: 7, title: "क्रिया (Kriya)", description: "Basic verbs and present tense" },
    { id: 8, title: "भोजन (Bhojan)", description: "Food, fruits, and vegetables" },
    { id: 9, title: "वस्त्र (Vastra)", description: "Clothing and accessories" },
    { id: 10, title: "घर (Ghar)", description: "House, rooms, and household items" },
    { id: 11, title: "विद्यालय (Vidyalaya)", description: "School subjects and activities" },
    { id: 12, title: "पशु-पक्षी (Pashu-Pakshi)", description: "Animals and birds" },
    { id: 13, title: "मौसम (Mausam)", description: "Weather and seasons" },
    { id: 14, title: "दिन और महीने (Din aur Mahine)", description: "Days, months, and calendar" },
    { id: 15, title: "समय (Samay)", description: "Telling time" },
    { id: 16, title: "शौक (Shauk)", description: "Hobbies and interests" },
    { id: 17, title: "शरीर के अंग (Sharir ke Ang)", description: "Body parts and health" },
    { id: 18, title: "शहर (Shahar)", description: "City, places, and directions" },
    { id: 19, title: "यातायात (Yatayat)", description: "Transportation and travel" },
    { id: 20, title: "भूतकाल (Bhootkaal)", description: "Past tense formation" },
    { id: 21, title: "भविष्यकाल (Bhavishyakaal)", description: "Future tense" },
    { id: 22, title: "सर्वनाम (Sarvnam)", description: "Pronouns" },
    { id: 23, title: "संबंध सूचक (Sambandh Suchak)", description: "Prepositions and postpositions" },
    { id: 24, title: "निषेध वाक्य (Nishedh Vakya)", description: "Negative sentences" },
    { id: 25, title: "प्रश्नवाचक शब्द (Prashnvachak Shabd)", description: "Question words and formation" },
  ],
  marathi: [
    { id: 1, title: "अभिवादन (Abhivadan)", description: "Greetings and basic expressions" },
    { id: 2, title: "स्वत:चा परिचय (Parichay)", description: "Self introduction and personal details" },
    { id: 3, title: "संख्या (Sankhya)", description: "Numbers 1-100" },
    { id: 4, title: "कुटुंब (Kutumb)", description: "Family members and relationships" },
    { id: 5, title: "रंग (Rang)", description: "Colors and descriptions" },
    { id: 6, title: "वर्णमाला (Varnmala)", description: "Marathi alphabet" },
    { id: 7, title: "क्रियापद (Kriyapad)", description: "Basic verbs and present tense" },
    { id: 8, title: "अन्न (Anna)", description: "Food, fruits, and vegetables" },
    { id: 9, title: "कपडे (Kapde)", description: "Clothing and accessories" },
    { id: 10, title: "घर (Ghar)", description: "House, rooms, and furniture" },
    { id: 11, title: "शाळा (Shala)", description: "School subjects and activities" },
    { id: 12, title: "प्राणी-पक्षी (Prani-Pakshi)", description: "Animals and birds" },
    { id: 13, title: "हवामान (Havaman)", description: "Weather and seasons" },
    { id: 14, title: "दिवस आणि महिने (Divas ani Mahine)", description: "Days, months, and dates" },
    { id: 15, title: "वेळ (Vel)", description: "Telling time" },
    { id: 16, title: "छंद (Chhanda)", description: "Hobbies and leisure activities" },
    { id: 17, title: "शरीराचे अवयव (Shariraache Avayav)", description: "Body parts and health" },
    { id: 18, title: "शहर (Shahar)", description: "City, places, and directions" },
    { id: 19, title: "वाहतूक (Vahatuk)", description: "Transportation and travel" },
    { id: 20, title: "भूतकाळ (Bhootkaal)", description: "Past tense formation" },
    { id: 21, title: "भविष्यकाळ (Bhavishyakaal)", description: "Future tense" },
    { id: 22, title: "सर्वनाम (Sarvnam)", description: "Pronouns" },
    { id: 23, title: "शब्दयोगी अव्यय (Shabdayogi Avyay)", description: "Prepositions and postpositions" },
    { id: 24, title: "नकारार्थी वाक्य (Nakaarthi Vakya)", description: "Negative sentences" },
    { id: 25, title: "प्रश्नार्थक शब्द (Prashnarthak Shabd)", description: "Question words and formation" },
  ],
  kannada: [
    { id: 1, title: "ನಮಸ್ಕಾರ (Namaskara)", description: "Greetings and basic expressions" },
    { id: 2, title: "ಪರಿಚಯ (Parichaya)", description: "Self introduction and personal details" },
    { id: 3, title: "ಸಂಖ್ಯೆಗಳು (Sankhyegalu)", description: "Numbers 1-100" },
    { id: 4, title: "ಕುಟುಂಬ (Kutumba)", description: "Family members and relationships" },
    { id: 5, title: "ಬಣ್ಣಗಳು (Bannagalu)", description: "Colors and descriptions" },
    { id: 6, title: "ವರ್ಣಮಾಲೆ (Varnamale)", description: "Kannada alphabet (Swaras and Vyanjanagalu)" },
    { id: 7, title: "ಕ್ರಿಯಾಪದಗಳು (Kriyapadagalu)", description: "Basic verbs and present tense" },
    { id: 8, title: "ಆಹಾರ (Aahara)", description: "Food, fruits, and vegetables" },
    { id: 9, title: "ಬಟ್ಟೆಗಳು (Battegalu)", description: "Clothing and accessories" },
    { id: 10, title: "ಮನೆ (Mane)", description: "House, rooms, and furniture" },
    { id: 11, title: "ಶಾಲೆ (Shaale)", description: "School subjects and activities" },
    { id: 12, title: "ಪ್ರಾಣಿ-ಪಕ್ಷಿಗಳು (Prani-Pakshigalu)", description: "Animals and birds" },
    { id: 13, title: "ಹವಾಮಾನ (Havamaana)", description: "Weather and seasons" },
    { id: 14, title: "ದಿನ ಮತ್ತು ತಿಂಗಳು (Dina mattu Tingalu)", description: "Days, months, and dates" },
    { id: 15, title: "ಸಮಯ (Samaya)", description: "Telling time" },
    { id: 16, title: "ಹವ್ಯಾಸಗಳು (Havyasagalu)", description: "Hobbies and leisure activities" },
    { id: 17, title: "ದೇಹದ ಅಂಗಗಳು (Dehada Angagalu)", description: "Body parts and health" },
    { id: 18, title: "ನಗರ (Nagara)", description: "City, places, and directions" },
    { id: 19, title: "ಸಾರಿಗೆ (Sarige)", description: "Transportation and travel" },
    { id: 20, title: "ಭೂತಕಾಲ (Bhootakaala)", description: "Past tense formation" },
    { id: 21, title: "ಭವಿಷ್ಯಕಾಲ (Bhavishyakaala)", description: "Future tense" },
    { id: 22, title: "ಸರ್ವನಾಮ (Sarvanama)", description: "Pronouns" },
    { id: 23, title: "ಪೂರ್ವಸರ್ಗಗಳು (Poorvasargagalu)", description: "Prepositions and postpositions" },
    { id: 24, title: "ನಿರಾಕರಣೆ ವಾಕ್ಯಗಳು (Nirakarane Vakyagalu)", description: "Negative sentences" },
    { id: 25, title: "ಪ್ರಶ್ನಾರ್ಥಕ ಪದಗಳು (Prashnarthaka Padagalu)", description: "Question words and formation" },
  ],
  // General Science chapters across four categories
  physics: [
    { id: 1, title: "Measurement and Units", description: "Physical quantities, SI units, measurement tools" },
    { id: 2, title: "Motion", description: "Types of motion, speed, velocity, distance-time graphs" },
    { id: 3, title: "Force and Pressure", description: "Types of forces, pressure, atmospheric pressure" },
    { id: 4, title: "Work and Energy", description: "Work, energy forms, law of conservation of energy" },
    { id: 5, title: "Simple Machines", description: "Levers, pulleys, inclined planes, mechanical advantage" },
    { id: 6, title: "Gravity", description: "Universal gravitation, weight, free fall" },
  ],
  chemistry: [
    { id: 7, title: "Matter and Its States", description: "Solid, liquid, gas, changes of state" },
    { id: 8, title: "Elements and Compounds", description: "Pure substances, mixtures, separation techniques" },
    { id: 9, title: "Atoms and Molecules", description: "Atomic structure, ions, chemical formulae" },
    { id: 10, title: "Acids, Bases and Salts", description: "Properties, pH scale, neutralization" },
    { id: 11, title: "Chemical Reactions", description: "Types of reactions, balancing equations" },
    { id: 12, title: "Metals and Non-metals", description: "Properties, reactivity series, corrosion" },
  ],
  biology: [
    { id: 13, title: "Cell - Basic Unit of Life", description: "Cell structure, organelles, prokaryotic vs eukaryotic" },
    { id: 14, title: "Tissues", description: "Plant and animal tissues, functions" },
    { id: 15, title: "Life Processes", description: "Nutrition, respiration, transportation, excretion" },
    { id: 16, title: "Diversity in Living Organisms", description: "Classification, five kingdoms" },
    { id: 17, title: "Human Body Systems", description: "Digestive, circulatory, respiratory, nervous systems" },
    { id: 18, title: "Reproduction", description: "Asexual and sexual reproduction, human reproduction" },
    { id: 19, title: "Heredity and Evolution", description: "Genes, DNA, natural selection, adaptation" },
  ],
  general: [
    { id: 20, title: "Natural Resources", description: "Air, water, soil, conservation" },
    { id: 21, title: "Environmental Science", description: "Pollution, ecosystem, biodiversity" },
    { id: 22, title: "Light and Reflection", description: "Laws of reflection, mirrors, image formation" },
    { id: 23, title: "Sound", description: "Production, propagation, characteristics" },
    { id: 24, title: "Heat and Temperature", description: "Thermal energy, heat transfer, expansion" },
    { id: 25, title: "Electricity and Magnetism", description: "Electric current, circuits, magnets" },
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
      const { username, password, fullName, email, school } = req.body;
      
      // Validate required fields
      if (!username || !password || !fullName || !email) {
        return res.status(400).json({ error: "All fields except school are required" });
      }
      
      // Check if username or email already exists
      const existingUsername = await storage.getTeacherByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getTeacherByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
      
      // For security, you'd normally hash the password here
      // For simplicity, we'll store it as-is (NOT recommended for production)
      const teacher = await storage.createTeacher({
        username,
        password,
        fullName,
        email,
        school: school || undefined,
      });
      
      // Don't send password back
      const { password: _, ...teacherData } = teacher;
      res.json(teacherData);
    } catch (error) {
      console.error("Error registering teacher:", error);
      res.status(500).json({ error: "Failed to register teacher" });
    }
  });

  // Teacher Login
  app.post("/api/teacher/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const teacher = await storage.getTeacherByUsername(username);
      
      // NOTE: In production, use bcrypt or similar for password hashing!
      if (!teacher || teacher.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Don't send password back
      const { password: _, ...teacherData } = teacher;
      res.json(teacherData);
    } catch (error) {
      console.error("Error logging in teacher:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get all custom tests for a teacher
  app.get("/api/teacher/:teacherId/tests", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const tests = await storage.getCustomTestsByTeacher(teacherId);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  // Create and generate custom MCQ test
  app.post("/api/teacher/:teacherId/generate-test", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { title, subject, classLevel, difficulty, syllabus, numQuestions, testType, gptModel, instructions } = req.body;
      
      // Parse multiple topics from comma-separated syllabus input
      const topics = syllabus
        .split(',')
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 0)
        .slice(0, 4); // Limit to maximum 4 topics
      
      if (topics.length === 0) {
        return res.status(400).json({ error: "At least one topic is required" });
      }
      
      console.log(`[CUSTOM TEST] Generating ${numQuestions} ${difficulty} questions for ${subject} - Topics: ${topics.join(', ')} using ${gptModel || 'gpt-4o-mini'}`);
      console.log(`[CUSTOM TEST] Distribution: ${topics.length} topic(s), ~${Math.ceil(numQuestions / topics.length)} questions per topic`);
      
      // Create custom test
      const test = await storage.createCustomTest({
        teacherId,
        title,
        subject,
        classLevel,
        difficulty,
        syllabus, // Store original comma-separated input
        numQuestions,
        testType: testType || "mcq",
        gptModel: gptModel || "gpt-4o",
        instructions: instructions || undefined,
        status: "draft",
      });
      
      console.log(`[CUSTOM TEST] Created test ${test.id} with share code: ${test.shareCode}`);
      
      // Generate questions using AI
      const questions = [];
      const generatedQuestionTexts = new Set<string>(); // Track exact question texts for deduplication
      const questionEmbeddings: number[][] = []; // Track embeddings for semantic similarity
      const previousQuestionsList: string[] = []; // Track last 5 questions for AI context
      const SIMILARITY_THRESHOLD = 0.9; // Cosine similarity threshold for duplicate detection
      
      // Determine if this is a science subject or language subject
      const scienceSubjects = ['physics', 'chemistry', 'biology', 'general'];
      const isScience = scienceSubjects.includes(subject.toLowerCase());
      
      // Generate exact number of questions using queue-based round-robin retry with deduplication
      const maxAttemptsPerTopic = 5; // Increased for dedup retries
      const maxTotalAttempts = numQuestions * topics.length * maxAttemptsPerTopic;
      const perTopicFailures = new Map<string, number>(); // Track failures per topic
      let topicQueue = [...topics]; // Clone topics into a queue
      let totalAttempts = 0;
      let generatedCount = 0;
      
      // Initialize failure counts
      topics.forEach((topic: string) => perTopicFailures.set(topic, 0));
      
      while (generatedCount < numQuestions && totalAttempts < maxTotalAttempts) {
        const currentQuestionNumber = generatedCount + 1;
        
        // Check if we have any topics left to try
        if (topicQueue.length === 0) {
          console.error(`[CUSTOM TEST] All topics exhausted. Generated ${generatedCount}/${numQuestions}`);
          break;
        }
        
        let questionGenerated = false;
        let attemptsThisQuestion = 0;
        
        // Try topics from the queue until we succeed or exhaust queue for this question
        while (!questionGenerated && attemptsThisQuestion < topicQueue.length && topicQueue.length > 0) {
          const currentTopic = topicQueue.shift()!; // Pop from front
          const failures = perTopicFailures.get(currentTopic) || 0;
          
          // Skip permanently exhausted topics
          if (failures >= maxAttemptsPerTopic) {
            console.warn(`[CUSTOM TEST] Topic "${currentTopic}" permanently exhausted (${failures} failures)`);
            attemptsThisQuestion++;
            continue;
          }
          
          try {
            totalAttempts++;
            attemptsThisQuestion++;
            console.log(`[CUSTOM TEST] Question ${currentQuestionNumber}/${numQuestions} - Topic "${currentTopic}" (failures: ${failures}/${maxAttemptsPerTopic}, previous questions: ${previousQuestionsList.length})`);
            
            // Pass last 5 questions to AI to avoid repetition
            const questionData = await generateQuestion({
              mode: isScience ? "science" : "language",
              language: isScience ? undefined : subject,
              scienceCategory: isScience ? subject.toLowerCase() : undefined,
              classLevel,
              difficulty,
              chapter: 1,
              chapterTitle: currentTopic,
              questionNumber: currentQuestionNumber,
              previousQuestions: previousQuestionsList.slice(-5), // Last 5 questions
              isMcq: testType === "mcq",
              gptModel: gptModel || "gpt-4o", // Default to GPT-4o for better quality
            });
            
            // Check for exact duplicate
            const questionText = questionData.question.trim().toLowerCase();
            if (generatedQuestionTexts.has(questionText)) {
              console.warn(`[CUSTOM TEST] ⚠️  EXACT DUPLICATE DETECTED: Question text already exists. Retrying...`);
              throw new Error("Exact duplicate question detected");
            }
            
            // Check for semantic similarity (paraphrased duplicates)
            const embedding = await getEmbedding(questionData.question);
            for (let i = 0; i < questionEmbeddings.length; i++) {
              const similarity = cosineSimilarity(embedding, questionEmbeddings[i]);
              if (similarity > SIMILARITY_THRESHOLD) {
                console.warn(`[CUSTOM TEST] ⚠️  SEMANTIC DUPLICATE DETECTED:`);
                console.warn(`  → New question: "${questionData.question.substring(0, 80)}..."`);
                console.warn(`  → Similar to Q${i + 1}: "${previousQuestionsList[i].substring(0, 80)}..."`);
                console.warn(`  → Similarity score: ${similarity.toFixed(3)} (threshold: ${SIMILARITY_THRESHOLD}). Retrying...`);
                throw new Error(`Semantic duplicate detected (similarity: ${similarity.toFixed(3)})`);
              }
            }
            
            // Save question to database
            const question = await storage.createCustomQuestion({
              testId: test.id,
              questionNumber: currentQuestionNumber,
              question: questionData.question,
              questionType: questionData.questionType,
              options: questionData.options ? JSON.stringify(questionData.options) : null,
              correctOption: questionData.correctOption || null,
              correctAnswer: questionData.correctAnswer,
              explanation: questionData.explanation || "",
            });
            
            // Track this question
            questions.push(question);
            generatedQuestionTexts.add(questionText);
            questionEmbeddings.push(embedding);
            previousQuestionsList.push(questionData.question);
            generatedCount++;
            questionGenerated = true;
            perTopicFailures.set(currentTopic, 0); // Reset failures on success
            topicQueue.push(currentTopic); // Push back to end of queue
            console.log(`[CUSTOM TEST] ✓ Question ${currentQuestionNumber}/${numQuestions} generated from topic "${currentTopic}" (unique, semantic check passed)`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[CUSTOM TEST] ✗ Failed question ${currentQuestionNumber} with topic "${currentTopic}":`, errorMessage);
            
            // Increment failure count
            const newFailures = failures + 1;
            perTopicFailures.set(currentTopic, newFailures);
            
            // Only push back if still has retry budget
            if (newFailures < maxAttemptsPerTopic) {
              topicQueue.push(currentTopic);
            } else {
              console.warn(`[CUSTOM TEST] Topic "${currentTopic}" removed from queue (reached ${maxAttemptsPerTopic} failures)`);
            }
          }
        }
        
        if (!questionGenerated) {
          console.error(`[CUSTOM TEST] Could not generate question ${currentQuestionNumber} - all topics exhausted or failed`);
          break;
        }
      }
      
      // If we didn't get the full count, return error
      if (generatedCount < numQuestions) {
        console.error(`[CUSTOM TEST] ERROR: Only generated ${generatedCount}/${numQuestions} questions after ${totalAttempts} total attempts`);
        return res.status(503).json({ 
          error: `Could only generate ${generatedCount} out of ${numQuestions} questions after multiple attempts. Please try again with simpler topics or reduce the question count.`,
          questionsGenerated: generatedCount,
          requested: numQuestions
        });
      }
      
      console.log(`[CUSTOM TEST] Generated ${questions.length}/${numQuestions} questions successfully across ${topics.length} topic(s)`);
      
      // Update test status to published
      await storage.updateCustomTest(test.id, { status: "published" });
      
      res.json({ test, questionsGenerated: questions.length });
    } catch (error) {
      console.error("Error generating test:", error);
      res.status(500).json({ error: "Failed to generate test" });
    }
  });

  // Get test details for teacher (with full questions and answers)
  app.get("/api/teacher/:teacherId/tests/:testId", async (req, res) => {
    try {
      const { teacherId, testId } = req.params;
      const test = await storage.getCustomTest(testId);
      
      if (!test || test.teacherId !== teacherId) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      const questions = await storage.getCustomQuestions(testId);
      
      // Parse options for teacher view
      const questionsWithParsedOptions = questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      }));
      
      res.json({ test, questions: questionsWithParsedOptions });
    } catch (error) {
      console.error("Error fetching test details:", error);
      res.status(500).json({ error: "Failed to fetch test details" });
    }
  });

  // Manual edit question
  app.patch("/api/teacher/:teacherId/question/:questionId/edit", async (req, res) => {
    try {
      const { teacherId, questionId } = req.params;
      const { question, options, correctOption, correctAnswer, explanation } = req.body;
      
      console.log(`[QUESTION EDIT] Teacher ${teacherId} editing question ${questionId}`);
      
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
        return res.status(400).json({ error: "Question must be at least 5 characters" });
      }
      if (!explanation || explanation.trim().length < 5) {
        return res.status(400).json({ error: "Explanation must be at least 5 characters" });
      }
      
      const updates: Partial<typeof existingQuestion> = {
        question: question.trim(),
        explanation: explanation.trim(),
      };
      
      if (existingQuestion.questionType === "mcq") {
        // Validate MCQ options
        if (!options || !Array.isArray(options)) {
          return res.status(400).json({ error: "MCQ questions must have options array" });
        }
        
        if (!correctOption || !["A", "B", "C", "D"].includes(correctOption)) {
          return res.status(400).json({ error: "Must select a valid correct option (A, B, C, or D)" });
        }
        
        // Find which option was marked as correct
        const originalCorrectIndex = correctOption.charCodeAt(0) - 65;
        const correctOptionText = options[originalCorrectIndex];
        
        if (!correctOptionText || correctOptionText.trim().length === 0) {
          return res.status(400).json({ error: "The selected correct option cannot be empty" });
        }
        
        // Filter out empty options while preserving the correct option
        const validOptions = options
          .map((opt: string, idx: number) => ({ text: opt?.trim() || "", index: idx }))
          .filter(opt => opt.text.length > 0);
        
        if (validOptions.length < 2) {
          return res.status(400).json({ error: "MCQ questions must have at least 2 valid options" });
        }
        
        // Find the new index of the correct option after filtering
        const newCorrectIndex = validOptions.findIndex(opt => opt.index === originalCorrectIndex);
        if (newCorrectIndex === -1) {
          return res.status(400).json({ error: "The correct option was removed. Please select a different correct option." });
        }
        
        // Map the new correct option letter
        const newCorrectOption = String.fromCharCode(65 + newCorrectIndex);
        const finalOptions = validOptions.map(opt => opt.text);
        
        updates.options = JSON.stringify(finalOptions);
        updates.correctOption = newCorrectOption;
        updates.correctAnswer = finalOptions[newCorrectIndex];
      } else {
        // Open-ended question
        if (!correctAnswer || correctAnswer.trim().length < 5) {
          return res.status(400).json({ error: "Correct answer must be at least 5 characters" });
        }
        updates.correctAnswer = correctAnswer.trim();
      }
      
      const updatedQuestion = await storage.updateCustomQuestion(questionId, updates);
      if (!updatedQuestion) {
        return res.status(500).json({ error: "Failed to update question" });
      }
      
      console.log(`[QUESTION EDIT] Question ${questionId} updated successfully`);
      
      res.json({
        ...updatedQuestion,
        options: updatedQuestion.options ? JSON.parse(updatedQuestion.options) : null,
      });
    } catch (error) {
      console.error("Error editing question:", error);
      res.status(500).json({ error: "Failed to edit question" });
    }
  });

  // AI-assisted edit question
  app.post("/api/teacher/:teacherId/question/:questionId/ai-edit", async (req, res) => {
    try {
      const { teacherId, questionId } = req.params;
      const { feedback } = req.body;
      
      if (!feedback || feedback.trim().length < 10) {
        return res.status(400).json({ error: "Please provide detailed feedback (at least 10 characters)" });
      }
      
      console.log(`[AI QUESTION EDIT] Teacher ${teacherId} requesting AI edit for question ${questionId}`);
      console.log(`[AI QUESTION EDIT] Feedback: "${feedback.substring(0, 50)}..."`);
      
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
      const parsedOptions = existingQuestion.options ? JSON.parse(existingQuestion.options) : undefined;
      
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
      if (!improvedQuestion.question || improvedQuestion.question.trim().length < 5) {
        console.error(`[AI QUESTION EDIT] Invalid AI response: question too short`);
        return res.status(500).json({ error: "AI generated an invalid question. Please try again with different feedback." });
      }
      if (!improvedQuestion.explanation || improvedQuestion.explanation.trim().length < 5) {
        console.error(`[AI QUESTION EDIT] Invalid AI response: explanation too short`);
        return res.status(500).json({ error: "AI generated an invalid explanation. Please try again." });
      }
      
      const updates: Partial<typeof existingQuestion> = {
        question: improvedQuestion.question.trim(),
        explanation: improvedQuestion.explanation.trim(),
      };
      
      if (existingQuestion.questionType === "mcq") {
        // Validate MCQ improvements
        if (!improvedQuestion.options || !Array.isArray(improvedQuestion.options) || improvedQuestion.options.length < 2) {
          console.error(`[AI QUESTION EDIT] Invalid AI response: insufficient options`);
          return res.status(500).json({ error: "AI generated invalid options. Please try again." });
        }
        if (!improvedQuestion.correctOption || !["A", "B", "C", "D"].includes(improvedQuestion.correctOption)) {
          console.error(`[AI QUESTION EDIT] Invalid AI response: invalid correct option`);
          return res.status(500).json({ error: "AI generated an invalid correct option. Please try again." });
        }
        
        const correctIndex = improvedQuestion.correctOption.charCodeAt(0) - 65;
        if (correctIndex >= improvedQuestion.options.length) {
          console.error(`[AI QUESTION EDIT] Invalid AI response: correct option out of bounds`);
          return res.status(500).json({ error: "AI generated an inconsistent question. Please try again." });
        }
        
        // Validate options are non-empty
        const validOptions = improvedQuestion.options.filter((opt: string) => opt && opt.trim().length > 0);
        if (validOptions.length < improvedQuestion.options.length) {
          console.error(`[AI QUESTION EDIT] AI generated empty options`);
          return res.status(500).json({ error: "AI generated empty options. Please try again." });
        }
        
        updates.options = JSON.stringify(improvedQuestion.options);
        updates.correctOption = improvedQuestion.correctOption;
        updates.correctAnswer = improvedQuestion.options[correctIndex];
      } else {
        // Validate open-ended improvements
        if (!improvedQuestion.correctAnswer || improvedQuestion.correctAnswer.trim().length < 5) {
          console.error(`[AI QUESTION EDIT] Invalid AI response: answer too short`);
          return res.status(500).json({ error: "AI generated an invalid answer. Please try again." });
        }
        updates.correctAnswer = improvedQuestion.correctAnswer.trim();
        // Clear MCQ-specific fields for open-ended questions
        updates.options = null;
        updates.correctOption = null;
      }
      
      const updatedQuestion = await storage.updateCustomQuestion(questionId, updates);
      if (!updatedQuestion) {
        return res.status(500).json({ error: "Failed to save improved question" });
      }
      
      console.log(`[AI QUESTION EDIT] Question ${questionId} improved successfully using AI`);
      
      res.json({
        ...updatedQuestion,
        options: updatedQuestion.options ? JSON.parse(updatedQuestion.options) : null,
      });
    } catch (error: any) {
      console.error("Error in AI-assisted edit:", error);
      res.status(500).json({ error: error.message || "Failed to improve question with AI" });
    }
  });

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
      const questionsForStudent = questions.map(q => ({
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
      const question = questions.find(q => q.id === questionId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // For MCQ, check if answer matches
      if (question.questionType === "mcq") {
        const isCorrect = studentAnswer.trim().toUpperCase() === question.correctOption;
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
  app.post("/api/test/start", async (req, res) => {
    try {
      const { mode, language, scienceCategory, class: classLevel, difficulty, chapter, testLength, testType } = req.body;
      
      console.log(`[TEST START] mode=${mode}, language=${language}, scienceCategory=${scienceCategory}, class=${classLevel}, difficulty=${difficulty}`);
      
      const session = await storage.createTestSession({
        mode: mode || "language",
        language: mode === "language" ? language : null,
        scienceCategory: mode === "science" ? scienceCategory : null,
        classLevel,
        difficulty,
        testType: testType || "mcq-only", // Science tests are MCQ-only by default
        chapter,
        testLength: testLength || 10,
        currentQuestion: 0,
        totalScore: 0,
        correctAnswers: 0,
        conversationHistory: "[]",
      });

      console.log(`[SESSION CREATED] mode=${session.mode}, language=${session.language}, scienceCategory=${session.scienceCategory}`);
      
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

      // Get subject key based on mode
      const subjectKey = session.mode === "science" 
        ? (session.scienceCategory || "general").toLowerCase() 
        : (session.language || "french").toLowerCase();
      
      const chapters = CHAPTERS[subjectKey] || [];
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

      // Get test type from session
      const testType = session.testType || "mixed";
      
      // Get all previously asked questions to avoid duplicates
      const previousQuestions = history.map((h: any) => h.question).filter(Boolean);
      console.log(`[AI] Already asked ${previousQuestions.length} question(s) in this test`);

      // Determine if this should be MCQ based on test type
      let isMcq = false;
      if (testType === "mcq-only") {
        isMcq = true; // Always MCQ for MCQ-only tests
      } else {
        isMcq = (history.length % 2) === 0; // Alternate for mixed tests (even = MCQ, odd = open-ended)
      }

      const questionData = await generateQuestion({
        mode: session.mode,
        language: session.language || undefined,
        scienceCategory: session.scienceCategory || undefined,
        classLevel: session.classLevel,
        difficulty: session.difficulty,
        chapter: session.chapter,
        chapterTitle: chapter.title,
        questionNumber: session.currentQuestion + 1,
        previousPerformance,
        previousQuestions,
        isMcq,
      });

      // Store correct answer in session for later evaluation
      history.push({
        questionNumber: session.currentQuestion + 1,
        question: questionData.question,
        correctAnswer: questionData.correctAnswer,
        questionType: questionData.questionType,
        options: questionData.options,
        correctOption: questionData.correctOption,
        explanation: questionData.explanation,
      });
      
      await storage.updateTestSession(sessionId, {
        conversationHistory: JSON.stringify(history),
      });

      res.json({ 
        question: questionData.question,
        questionType: questionData.questionType,
        options: questionData.options,
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
        
        console.log(`[MCQ] Answer: ${answer}, Correct: ${currentQuestionData.correctOption}, Score: ${score}/10`);
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
