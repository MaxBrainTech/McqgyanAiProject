# LangBuddy - AI-Powered Language Learning Platform

## Overview

LangBuddy is a smart mock test application designed for CBSE school students (Class 6-10) learning languages (French, German, Spanish, Hindi, Marathi, and Kannada). The platform provides AI-generated interactive questions that adapt to student performance, offering instant feedback and personalized learning experiences. The app features a vibrant, gamified interface with gradient backgrounds and glassmorphism effects, making language learning engaging and effective for young students.

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

**Routing:**
- Single-page application with component-based navigation
- State-driven page transitions between Home and TestPage

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

**Session Management:**
- In-memory storage for test sessions during development
- Session tracking with unique IDs for multi-question tests
- Conversation history stored within session for adaptive difficulty

**AI Integration:**
- OpenAI API integration via Replit AI Integrations service (GPT-4o model)
- Advanced prompt engineering for question generation based on:
  - CBSE curriculum guidelines
  - Student class level (6-10)
  - Difficulty level (Easy/Medium/Hard)
  - Chapter/topic selection
  - Previous performance for adaptive learning
- Language-specific quality controls for Indian languages (Hindi, Marathi, Kannada):
  - Enforces complete sentences in proper Devanagari/Kannada script
  - Validates question completeness before displaying to students
  - Provides detailed examples and formatting rules
  - Rejects incomplete or placeholder content
- Answer evaluation with detailed feedback in simple English
- Encouraging personality designed for young learners

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
- **OpenAI API** (via Replit AI Integrations): GPT models for question generation and answer evaluation
  - Base URL: `process.env.AI_INTEGRATIONS_OPENAI_BASE_URL`
  - API Key: `process.env.AI_INTEGRATIONS_OPENAI_API_KEY`

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
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API authentication key
- `NODE_ENV`: Environment mode (development/production)