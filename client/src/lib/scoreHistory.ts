import { getAuth } from "firebase/auth";

export const SCORE_HISTORY_STORAGE_KEY = "langbuddy_scores";

export interface ScoreHistoryEntry {
  id: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  language: string;
  classLevel?: number | null;
  timestamp: string;
  date: string;
  mode?: string;
  difficulty?: string;
  insights?: ScoreInsightSnapshot;
}

export interface ScoreHistorySummary {
  attempts: number;
  averagePercentage: number;
  bestPercentage: number;
  latestPercentage: number;
  latestClassLevel: number | null;
  improvement: number;
  latestSubject: string;
  weakestSubject: string;
  strongestSubject: string;
  trendLabel: string;
}

export interface ScoreSubjectBreakdown {
  subject: string;
  attempts: number;
  averagePercentage: number;
  bestPercentage: number;
  latestPercentage: number;
}

export interface ScoreInsightSnapshot {
  recommendations: string[];
  weaknesses: string[];
  subjectBreakdown: ScoreSubjectBreakdown[];
  classLevel?: number | null;
  questionPaper?: ScoreQuestionPaperSnapshot;
}

export interface ScoreQuestionPaperItem {
  questionNumber: number;
  question: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  questionType?: string;
}

export interface ScoreQuestionPaperSnapshot {
  title: string;
  subject: string;
  classLevel: number | null;
  difficulty?: string;
  language?: string;
  questions: ScoreQuestionPaperItem[];
}

export interface SaveScoreHistoryAttemptParams {
  subject: string;
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  language?: string;
  classLevel?: number | null;
  difficulty?: string;
  mode?: string;
  questionPaperTitle?: string;
  questionReview?: ScoreQuestionPaperItem[];
}

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `score-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeQuestionItem = (
  item: any,
  fallbackQuestionNumber: number
): ScoreQuestionPaperItem => ({
  questionNumber: Math.max(1, toNumber(item?.questionNumber, fallbackQuestionNumber)),
  question: normalizeText(item?.question),
  options: Array.isArray(item?.options)
    ? item.options.map((option: unknown) => normalizeText(option)).filter(Boolean)
    : [],
  userAnswer: normalizeText(item?.userAnswer),
  correctAnswer: normalizeText(item?.correctAnswer),
  isCorrect: Boolean(item?.isCorrect),
  explanation: normalizeText(item?.explanation) || undefined,
  questionType: normalizeText(item?.questionType) || undefined,
});

const normalizeQuestionPaper = (raw: any): ScoreQuestionPaperSnapshot | undefined => {
  if (!raw || typeof raw !== "object") return undefined;

  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map((item: any, index: number) => normalizeQuestionItem(item, index + 1))
        .filter((item: ScoreQuestionPaperItem) => item.question.length > 0)
    : Array.isArray((raw as any).questionReview)
      ? (raw as any).questionReview
          .map((item: any, index: number) => normalizeQuestionItem(item, index + 1))
          .filter((item: ScoreQuestionPaperItem) => item.question.length > 0)
    : [];

  return {
    title: normalizeText(raw.title) || "Question Paper",
    subject: normalizeText(raw.subject) || "quiz",
    classLevel: raw.classLevel == null ? null : toNumber(raw.classLevel, 0),
    difficulty: normalizeText(raw.difficulty) || undefined,
    language: normalizeText(raw.language) || undefined,
    questions,
  };
};

const safeTimestamp = (input?: string) => {
  if (!input) return new Date().toISOString();

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

export function normalizeScoreEntry(raw: any): ScoreHistoryEntry {
  const score = toNumber(raw?.score);
  const maxScore = Math.max(1, toNumber(raw?.maxScore ?? raw?.totalQuestions * 10, 10));
  const percentage = Number.isFinite(raw?.percentage)
    ? toNumber(raw.percentage)
    : Math.round((score / maxScore) * 100);
  const timestamp =
    typeof raw?.timestamp === "string" && raw.timestamp.trim().length > 0
      ? safeTimestamp(raw.timestamp)
      : typeof raw?.date === "string" && raw.date.trim().length > 0
        ? safeTimestamp(raw.date)
        : new Date().toISOString();

  return {
    id: typeof raw?.id === "string" && raw.id.trim().length > 0 ? raw.id : makeId(),
    subject: typeof raw?.subject === "string" && raw.subject.trim().length > 0 ? raw.subject : "quiz",
    score,
    maxScore,
    percentage,
    totalQuestions: Math.max(1, toNumber(raw?.totalQuestions ?? raw?.maxScore / 10, 1)),
    correctAnswers: Math.max(0, toNumber(raw?.correctAnswers, Math.round(score / 10))),
    language: typeof raw?.language === "string" && raw.language.trim().length > 0 ? raw.language : "en",
    classLevel:
      raw?.classLevel == null
        ? raw?.insights?.classLevel == null
          ? undefined
          : toNumber(raw.insights.classLevel, 0)
        : toNumber(raw.classLevel, 0),
    timestamp,
    date:
      typeof raw?.date === "string" && raw.date.trim().length > 0
        ? raw.date
        : new Date(timestamp).toLocaleString(),
    mode: typeof raw?.mode === "string" ? raw.mode : undefined,
    difficulty: typeof raw?.difficulty === "string" ? raw.difficulty : undefined,
    insights:
      raw?.insights && typeof raw.insights === "object"
        ? {
            recommendations: Array.isArray(raw.insights.recommendations)
              ? raw.insights.recommendations.filter((item: unknown) => typeof item === "string")
              : [],
            weaknesses: Array.isArray(raw.insights.weaknesses)
              ? raw.insights.weaknesses.filter((item: unknown) => typeof item === "string")
              : [],
            subjectBreakdown: Array.isArray(raw.insights.subjectBreakdown)
              ? raw.insights.subjectBreakdown
                  .map((item: any) => ({
                    subject: String(item?.subject ?? "quiz"),
                    attempts: toNumber(item?.attempts, 0),
                    averagePercentage: toNumber(item?.averagePercentage, 0),
                    bestPercentage: toNumber(item?.bestPercentage, 0),
                    latestPercentage: toNumber(item?.latestPercentage, 0),
                  }))
              : [],
            classLevel:
              raw.insights.classLevel == null ? undefined : toNumber(raw.insights.classLevel, 0),
            questionPaper: normalizeQuestionPaper(raw.insights.questionPaper),
          }
        : undefined,
  };
}

export function loadScoreHistory(): ScoreHistoryEntry[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(SCORE_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeScoreEntry).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.warn("Failed to load score history", error);
    return [];
  }
}

export function saveScoreHistoryEntry(entry: Omit<ScoreHistoryEntry, "id"> & { id?: string }) {
  if (!isBrowser()) return [];

  const history = loadScoreHistory();
  const normalized = normalizeScoreEntry({
    ...entry,
    id: entry.id || makeId(),
  });

  const nextHistory = [normalized, ...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  window.localStorage.setItem(SCORE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export async function saveScoreHistoryAttempt({
  subject,
  totalScore,
  totalQuestions,
  correctAnswers,
  language,
  classLevel = null,
  difficulty,
  mode,
  questionPaperTitle,
  questionReview = [],
}: SaveScoreHistoryAttemptParams) {
  const timestamp = new Date();
  const maxScore = Math.max(1, totalQuestions * 10);
  const percentage = Math.round((totalScore / maxScore) * 100);
  const formattedDate = timestamp.toLocaleString();
  const normalizedSubject = normalizeText(subject) || "quiz";
  const questionPaper: ScoreQuestionPaperSnapshot = {
    title: normalizeText(questionPaperTitle) || "Question Paper",
    subject: normalizedSubject,
    classLevel,
    difficulty: normalizeText(difficulty) || undefined,
    language: normalizeText(language) || undefined,
    questions: questionReview.map((item, index) => normalizeQuestionItem(item, index + 1)),
  };

  const newEntry = normalizeScoreEntry({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    subject: normalizedSubject,
    score: totalScore,
    maxScore,
    percentage,
    totalQuestions,
    correctAnswers,
    language: normalizeText(language) || "en",
    classLevel,
    timestamp: timestamp.toISOString(),
    date: formattedDate,
    mode,
    difficulty,
    insights: {
      recommendations: [],
      weaknesses: [],
      subjectBreakdown: [],
      classLevel,
      questionPaper,
    },
  });

  const existingHistory = loadScoreHistory();
  const combinedHistory = [newEntry, ...existingHistory];
  const insights = buildLearningInsights(newEntry, combinedHistory);
  const subjectBreakdown = buildSubjectBreakdown(combinedHistory);
  const snapshot = {
    recommendations: insights.recommendations,
    weaknesses: insights.weaknesses,
    subjectBreakdown,
    classLevel,
    questionPaper,
  };

  const savedEntry = normalizeScoreEntry({
    ...newEntry,
    insights: snapshot,
  });

  saveScoreHistoryEntry(savedEntry);

  const user = getAuth().currentUser;
  if (user) {
    void syncScoreHistoryEntry(savedEntry, {
      userId: user.uid,
      userEmail: user.email,
    }, snapshot).catch((error) => {
      console.warn("Score history sync failed", error);
    });
  }

  return savedEntry;
}

export function resetScoreHistory() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SCORE_HISTORY_STORAGE_KEY);
}

export function mergeScoreHistoryEntries(
  primary: ScoreHistoryEntry[],
  fallback: ScoreHistoryEntry[],
) {
  const merged = new Map<string, ScoreHistoryEntry>();

  [...fallback, ...primary].forEach((entry) => {
    const normalized = normalizeScoreEntry(entry);
    merged.set(normalized.id, normalized);
  });

  return [...merged.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

const formatDelta = (delta: number) => `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`;

export function buildScoreSummary(entries: ScoreHistoryEntry[]): ScoreHistorySummary {
  if (entries.length === 0) {
    return {
      attempts: 0,
      averagePercentage: 0,
      bestPercentage: 0,
      latestPercentage: 0,
      latestClassLevel: null,
      improvement: 0,
      latestSubject: "",
      weakestSubject: "",
      strongestSubject: "",
      trendLabel: "No history yet",
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const latest = sorted[sorted.length - 1];
  const best = sorted.reduce((max, item) => (item.percentage > max.percentage ? item : max), sorted[0]);
  const averagePercentage = Math.round(
    sorted.reduce((sum, item) => sum + item.percentage, 0) / sorted.length
  );
  const improvement = latest.percentage - sorted[0].percentage;

  const subjectBuckets = new Map<string, { total: number; count: number }>();
  sorted.forEach((entry) => {
    const key = entry.subject || "quiz";
    const current = subjectBuckets.get(key) ?? { total: 0, count: 0 };
    current.total += entry.percentage;
    current.count += 1;
    subjectBuckets.set(key, current);
  });

  const subjectAverages = [...subjectBuckets.entries()].map(([subject, value]) => ({
    subject,
    average: value.total / value.count,
  }));

  const strongestSubject =
    subjectAverages.length > 0
      ? subjectAverages.sort((a, b) => b.average - a.average)[0].subject
      : latest.subject;
  const weakestSubject =
    subjectAverages.length > 0
      ? [...subjectAverages].sort((a, b) => a.average - b.average)[0].subject
      : latest.subject;

  const trendLabel =
    improvement >= 15
      ? `Strong upward trend (${formatDelta(improvement)} overall)`
      : improvement >= 5
        ? `Steady improvement (${formatDelta(improvement)} overall)`
        : improvement > -5
          ? `Stable performance (${formatDelta(improvement)} overall)`
          : `Needs attention (${formatDelta(improvement)} overall)`;

  return {
    attempts: sorted.length,
    averagePercentage,
    bestPercentage: best.percentage,
    latestPercentage: latest.percentage,
    latestClassLevel: latest.classLevel ?? latest.insights?.classLevel ?? null,
    improvement,
    latestSubject: latest.subject,
    weakestSubject,
    strongestSubject,
    trendLabel,
  };
}

export function buildLearningInsights(entry: ScoreHistoryEntry, history: ScoreHistoryEntry[]) {
  const summary = buildScoreSummary(history);
  const recentEntries = [...history]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-5);

  const recommendations: string[] = [];
  const weaknesses: string[] = [];

  if (entry.percentage >= 85) {
    recommendations.push("Keep the same revision rhythm and try harder mixed-topic tests.");
  } else if (entry.percentage >= 60) {
    recommendations.push("Revise the weak chapter once, then retake a fresh test after practice.");
  } else {
    recommendations.push("Focus on basics first: read the concept, solve 5 examples, then retry.");
  }

  if (history.length >= 2) {
    const previous = recentEntries[recentEntries.length - 2];
    if (previous) {
      const delta = entry.percentage - previous.percentage;
      if (delta >= 10) {
        recommendations.push("Nice jump in performance. You are learning faster now.");
      } else if (delta <= -10) {
        weaknesses.push("Your latest attempt dropped compared to the previous one. Revisit the last weak topic.");
      }
    }
  } else {
    weaknesses.push("Add a few more attempts to unlock stronger trend analysis.");
  }

  if (summary.weakestSubject && summary.weakestSubject === entry.subject) {
    weaknesses.push(`This subject is currently your weakest area: ${entry.subject}.`);
  }

  if (entry.percentage < 40) {
    weaknesses.push("Concept clarity is low right now. Start with theory notes before speed practice.");
  } else if (entry.percentage < 70) {
    weaknesses.push("Accuracy needs work. Slow down and verify each answer before submitting.");
  }

  if (weaknesses.length === 0) {
    weaknesses.push("No major weakness detected from this result. Keep building consistency.");
  }

  return {
    summary,
    recommendations,
    weaknesses,
  };
}

export function buildSubjectBreakdown(entries: ScoreHistoryEntry[]): ScoreSubjectBreakdown[] {
  const subjectMap = new Map<
    string,
    { total: number; count: number; best: number; latest: number; latestAt: number }
  >();

  [...entries]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((entry) => {
      const key = entry.subject || "quiz";
      const current = subjectMap.get(key) ?? {
        total: 0,
        count: 0,
        best: 0,
        latest: 0,
        latestAt: 0,
      };
      current.total += entry.percentage;
      current.count += 1;
      current.best = Math.max(current.best, entry.percentage);
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime >= current.latestAt) {
        current.latest = entry.percentage;
        current.latestAt = entryTime;
      }
      subjectMap.set(key, current);
    });

  return [...subjectMap.entries()]
    .map(([subject, value]) => ({
      subject,
      attempts: value.count,
      averagePercentage: Math.round(value.total / value.count),
      bestPercentage: value.best,
      latestPercentage: value.latest,
    }))
    .sort((a, b) => b.averagePercentage - a.averagePercentage);
}

type RemoteHistoryUser = {
  userId: string;
  userEmail?: string | null;
};

const normalizeRemotePath = () => "/api/student-score-history";

export async function loadRemoteScoreHistory(userId: string) {
  if (!userId) return [];

  const response = await fetch(`${normalizeRemotePath()}?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error("Failed to load score history");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeScoreEntry) : [];
}

export async function syncScoreHistoryEntry(
  entry: ScoreHistoryEntry,
  user: RemoteHistoryUser,
  insights?: ScoreInsightSnapshot
) {
  if (!user.userId) return null;

  const response = await fetch(normalizeRemotePath(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...entry,
      userId: user.userId,
      userEmail: user.userEmail ?? null,
      insights: insights ?? {},
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to sync score history");
  }

  return response.json();
}

export async function resetRemoteScoreHistory(userId: string) {
  if (!userId) return null;

  const response = await fetch(`${normalizeRemotePath()}?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to reset score history");
  }

  return response.json();
}
