# MCQGyaan AI Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Duolingo's playful, gamified learning interface combined with Material Design's component structure. The design balances educational functionality with a fun, engaging aesthetic that appeals to middle school students.

**Key Design Principles**:
- Playful yet purposeful: Every element supports learning while maintaining student engagement
- Clear visual hierarchy: Students should instantly understand what to do next
- Encouraging atmosphere: Positive reinforcement through visuals and micro-interactions

---

## Color Palette & Visual Treatment

**Primary Colors** (as specified):
- Soft Blue (#4A90E2 - #60A5FA): Primary actions, headers, progress indicators
- Bright Yellow (#FCD34D - #FBBF24): Accents, success states, highlights
- Clean White (#FFFFFF): Backgrounds, cards, text areas
- Supporting Colors: Soft pink for French (#FCA5A5), mint green for German (#86EFAC), warm orange for Spanish (#FDBA74)

**Surface Treatment**:
- White card backgrounds with subtle shadows (shadow-lg)
- Rounded corners throughout (rounded-xl for cards, rounded-full for buttons)
- Soft gradients for hero sections and feature areas

---

## Typography System

**Font Stack**:
- Primary: 'Poppins' (Google Fonts) - friendly, rounded, highly readable for young students
- Secondary: 'Inter' for body text and smaller UI elements

**Type Scale**:
- App Title/Hero: text-5xl font-bold (48px)
- Section Headers: text-3xl font-semibold (30px)
- Question Text: text-2xl font-medium (24px)
- Body/Feedback: text-lg (18px)
- UI Labels: text-base font-medium (16px)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, and 16 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Gap between elements: gap-4 to gap-6

**Grid Structure**:
- Mobile: Single column, full width with px-4 padding
- Tablet/Desktop: max-w-4xl centered container for question flow, max-w-6xl for home screen

---

## Component Library

### Navigation & Branding
**Top Bar**: Fixed header with "MCQGyaan AI" logo (playful font treatment), minimal navigation, session progress indicator in top-right corner. Background: white with subtle shadow-md.

### Home Screen
**Language Selection Cards**: Three large, tappable cards in a grid (grid-cols-1 md:grid-cols-3), each with:
- Large animated icon (flag or culturally relevant illustration)
- Language name in bold text
- Soft colored background corresponding to each language
- Hover state: slight lift effect (transform scale)

### Test Flow Screens

**Chapter/Topic Selection**: 
- Vertical list of expandable accordions or card grid showing available chapters
- Each item shows chapter number, title, and brief description
- Checkmark icons for previously completed topics

**Question Display Card**:
- Large white card (rounded-xl, shadow-xl) centered on page
- Question number and progress at top (e.g., "Question 3 of 10")
- Question text in large, readable font
- Large textarea for answer input (min-h-32, rounded-lg border)
- Prominent "Submit Answer" button (full width on mobile, auto width on desktop)

**Feedback Section**:
- Appears below question card with smooth fade-in animation
- Color-coded background: soft green for correct, soft yellow for partial, soft red for needs improvement
- Score display with large numbers
- AI feedback text in conversational, encouraging tone
- Correction/suggestion in highlighted box
- Two action buttons: "Next Question" (primary) and "End Test" (secondary)

### Progress Tracking
**Progress Bar**: Colorful gradient bar at top of test screen showing completion (e.g., 30% with animated fill). Include fraction text "3/10 completed".

**Session Summary Card**:
- Displays at test end with total score, correct/incorrect breakdown
- Encouraging message based on performance
- "Try Again" and "New Test" buttons
- Local leaderboard table showing top 5 session scores

### Interactive Elements

**Buttons**:
- Primary: Gradient blue-to-purple, white text, rounded-full, py-3 px-8
- Secondary: White background, blue border, blue text, rounded-full
- All buttons: font-semibold, shadow-md, smooth hover lift

**Input Fields**:
- Large text areas with rounded-lg corners
- Light gray border (border-2) that becomes blue on focus
- Placeholder text in friendly tone ("Type your answer here...")

---

## Images

**Hero Image**: Yes - Cheerful illustration of diverse students studying languages together with books, flags, and speech bubbles. Place in home screen hero section spanning full width, with subtle gradient overlay. Image should be bright, colorful, and welcoming.

**Language Icons**: Custom illustrations or clean icons representing each language (French beret/Eiffel Tower, German pretzel/castle, Spanish flamenco dancer/guitar). Use as large focal points in language selection cards.

**Empty States**: Friendly illustrations for when no test is in progress or no scores available yet.

---

## Animations & Interactions

**Micro-interactions**:
- Card hover: Subtle lift (translateY(-4px)) with shadow increase
- Button press: Scale down slightly (scale-95)
- Feedback reveal: Slide up from bottom with fade-in (duration-300)
- Progress bar: Smooth width animation when updating

**Page Transitions**: Subtle fade between screens (duration-200)

**Celebration Effects**: Confetti or sparkle animation for high scores (80%+ correct)

---

## Accessibility & Student-Friendly Features

- High contrast text (WCAG AAA where possible)
- Large tap targets (min 44px height) for mobile users
- Clear focus states with thick colored outlines
- Error messages in simple, supportive language
- Font size minimum of 16px to prevent mobile zoom

---

## Responsive Behavior

**Mobile (base)**: Single column, full-width cards, stacked buttons, larger touch targets
**Tablet (md:)**: Wider cards (max-w-2xl), side-by-side buttons where appropriate
**Desktop (lg:)**: Optimal reading width (max-w-4xl), more generous spacing, hover effects enabled