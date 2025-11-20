# MCQGyaan AI - AI-Powered Language Learning Platform

## Overview

MCQGyaan AI is a smart mock test application designed for CBSE school students (Class 6-10) with three distinct modes:

1. **Language Learning Mode**: French, German, Spanish, Hindi, Marathi, and Kannada with pre-defined chapters or custom topics
2. **General Science Quiz Mode**: Physics, Chemistry, Biology, and General Science categories with chapter selection or custom topics
3. **Custom MCQ Generator Mode**: Both teachers and students can create personalized tests by specifying topics, difficulty, and AI model

The platform provides AI-generated interactive questions with anti-duplication controls, instant feedback, downloadable PDFs, and comprehensive results tracking. Students can now create custom tests by entering their own topics (1 mandatory, 3 optional), selecting GPT model, difficulty level, and educational board (CBSE, ICSE, IB, RBSE, State Board).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- TanStack Query (React Query) for server state management and API communication
- Tailwind CSS for utility-first styling with custom design system

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library (New York variant) for pre-built, customizable components
- Custom component library including:
  - `LanguageCard`: Language selection cards with icons
  - `ChapterList`: Chapter selection interface
  - `QuestionCard`: Interactive question display with answer input
  - `FeedbackSection`: AI feedback display with text-to-speech support
  - `ProgressBar`: Test progress tracking
  - `TestSummary`: Final test results and statistics
  - `LeaderboardCard`: Score history and achievements
  - **Student Custom Test Form** (November 2025): 4 topic inputs (1 required, 3 optional), GPT model selector, educational board selector

**Design System:**
- Custom color palette with soft blues (#4A90E2), bright yellows (#FCD34D), and language-specific accent colors
- Typography using Poppins (primary) and Inter (secondary) fonts
- Rounded corners (rounded-xl for cards, rounded-full for buttons)
- Elevation system using shadow utilities and hover effects
- Responsive design with mobile-first approach

**State Management:**
- Local state with React hooks (useState, useEffect)
- Client-side persistence using localStorage for leaderboard scores
- Query client for API data caching and synchronization
- **Dual-mode TestPage** (November 2025): Supports both session-based (chapter tests) and pre-generated (custom tests) modes
  - Session-based: Questions generated on-demand via API calls
  - Pre-generated: All questions generated upfront, evaluated locally

**Routing:**
- Single-page application with component-based navigation
- State-driven page transitions between Home and TestPage
- Test mode selection: "Pre-defined Chapters" vs "Custom Topics"

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for type-safe API development
- RESTful API design pattern
- Middleware for JSON parsing, request logging, and error handling

**API Endpoints:**
- `POST /api/test/start`: Initialize a new test session
- `GET /api/test/question/:sessionId`: Generate next question using AI
- `POST /api/test/answer`: Evaluate student answer and provide feedback
- `GET /api/chapters/:language`: Retrieve chapter list for selected language
- **`POST /api/student/generate-custom-test`** (November 2025): Generate complete custom test for students with anti-duplication controls

**Session Management:**
- In-memory storage for test sessions during development
- Session tracking with unique IDs for multi-question tests
- Conversation history stored within session for adaptive difficulty

**AI Integration:**
- OpenAI API integration using user's own API key via environment variables
- **GPT Model Selection** (November 2025 Update):
  - Teachers can select GPT model per test: gpt-4o, gpt-4o-mini, or gpt-3.5-turbo
  - Default model: gpt-4o-mini for optimal cost efficiency (~$0.15 per million tokens)
  - Per-test cost estimates: ~$0.005-$0.01 for 10 questions depending on model
  - Model configuration stored with each test in database
  - Flexible model switching allows quality vs cost optimization
- **Retry Logic for Reliable Question Generation** (November 2025 Update):
  - Automatic retry up to 3 attempts for failed question generation
  - Ensures exact question count matches teacher's selection
  - Prevents partial test generation due to transient AI errors
- **Multi-Stage AI Quality Control System** (November 2025 Update):
  - **CBSE Blueprint Metadata**: Class-specific guidelines (6-10) with Bloom's Taxonomy levels, age-appropriate vocabulary, and cognitive skill requirements
  - **Answer Verification**: Independent re-solving of questions to cross-check correctness before presenting to students
  - **Quality Assessment**: Automated scoring of questions on curriculum alignment, clarity, difficulty matching, and age-appropriateness
  - **Science Fact-Checking**: Numerical answer verification with step-by-step calculation validation
  - **Threshold-Based Filtering**: Questions below quality threshold (6/10) are flagged and logged
- **Question Type Support** (November 2025 Update):
  - Both MCQ and open-ended questions supported for all subjects
  - Science questions properly respect testType parameter
  - Open-ended questions include detailed model answers
  - Language questions support translation, grammar, vocabulary formats
- Advanced prompt engineering for question generation based on:
  - CBSE/NCERT curriculum patterns and terminology
  - Bloom's Taxonomy cognitive levels (Remember → Create)
  - Student class level (6-10) with age-appropriate vocabulary
  - Difficulty level (Easy/Medium/Hard) mapped to question complexity
  - Chapter/topic selection with subject-specific guidelines
  - Previous performance for adaptive learning
- Language-specific quality controls for Indian languages (Hindi, Marathi, Kannada):
  - Enforces complete sentences in proper Devanagari/Kannada script
  - Validates question completeness (minimum 30 characters, no trailing "...")
  - Rejects questions ending with incomplete placeholders or ellipses
  - Provides detailed examples showing complete vs incomplete questions
  - Strict validation against placeholder patterns (___+, TODO, incomplete)
- Answer evaluation with detailed feedback in simple English
- Encouraging personality designed for young learners (ages 11-16)

**Data Models:**
- `User`: User authentication (username, password)
- `TestSession`: Active test tracking (language, class, difficulty, chapter, progress, score)
- Storage abstraction layer with in-memory implementation (`MemStorage`)

### Database Schema

**ORM and Database:**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the production database (via Neon serverless)
- Schema defined in TypeScript with Zod validation

**Tables:**
- `users`: User accounts with unique usernames
- `test_sessions`: Test state persistence including conversation history stored as JSON

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Migration files stored in `/migrations` directory
- Push-based deployment with `db:push` command

### External Dependencies

**AI Services:**
- **OpenAI API**: GPT models for question generation and answer evaluation
  - API Key: `process.env.OPENAI_API_KEY` (user's own OpenAI API key)
  - Models available: gpt-4o, gpt-4o-mini (default), gpt-3.5-turbo
  - Per-test model selection for quality vs cost optimization

**Database:**
- **Neon Serverless PostgreSQL**: Cloud-hosted database
  - Connection: `process.env.DATABASE_URL`
  - Driver: `@neondatabase/serverless`

**Third-Party Libraries:**
- **Radix UI**: Accessible component primitives (18+ packages)
- **Framer Motion**: Animation library for transitions and micro-interactions
- **React Hook Form**: Form state management with Zod validation
- **date-fns**: Date formatting and manipulation
- **embla-carousel-react**: Carousel/slider functionality
- **cmdk**: Command menu component

**Development Tools:**
- **Replit Vite Plugins**: Runtime error overlay, cartographer, dev banner
- **TypeScript**: Type checking and IntelliSense
- **ESBuild**: Server-side bundling for production

**Environment Variables Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication key (user's own key)
- `NODE_ENV`: Environment mode (development/production)