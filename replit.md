# LangAI / MCQGyaan AI

## Overview
An AI-powered CBSE educational platform for students in Classes 6-12. Provides interactive mock tests for languages (French, German, Spanish, Hindi, Marathi, Kannada) and sciences (Physics, Chemistry, Biology), with AI evaluation, teacher dashboards, and answer sheet analysis.

## Architecture
- **Frontend**: React 18 + TypeScript, React Router v7, TanStack Query v5, shadcn/ui, Tailwind CSS
- **Backend**: Express.js + TypeScript, running via `tsx`
- **Database**: PostgreSQL (Replit built-in) with Drizzle ORM
- **AI**: OpenAI GPT-4o/GPT-4o-mini for question generation and evaluation
- **Server Port**: 5000 (serves both API and frontend via Vite dev middleware)

## Project Structure
```
├── client/src/         - React frontend
│   ├── pages/          - All application pages
│   ├── components/     - Reusable UI components
│   ├── hooks/          - Custom hooks
│   └── lib/            - Utilities
├── server/             - Express backend
│   ├── index.ts        - Entry point
│   ├── routes.ts       - API routes
│   ├── openai.ts       - AI logic
│   ├── storage.ts      - Database layer
│   ├── db.ts           - Drizzle DB connection
│   └── vite.ts         - Vite dev middleware
├── shared/
│   └── schema.ts       - Drizzle schema + types
├── vite.config.ts      - Vite configuration
├── tailwind.config.ts  - Tailwind CSS configuration
├── drizzle.config.ts   - Drizzle migration config
└── tsconfig.json       - TypeScript configuration
```

## Database Tables
- `users` - User accounts
- `test_sessions` - Active test sessions
- `teachers` - Teacher accounts
- `custom_tests` - Teacher-created tests
- `custom_questions` - Questions for custom tests
- `answer_sheet_evaluations` - Image-based answer sheet results

## Running
- **Dev**: `tsx server/index.ts` (via workflow "Start application")
- **DB push**: `./node_modules/.bin/drizzle-kit push --config=drizzle.config.ts`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `OPENAI_API_KEY` - OpenAI API key for AI features
