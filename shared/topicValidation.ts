export interface LocalizedTopicText {
  english?: string | null;
  hindi?: string | null;
}

export interface TopicValidationChapter {
  title?: string | LocalizedTopicText | null;
  description?: string | LocalizedTopicText | null;
}

export interface TopicValidationResult {
  isValid: boolean;
  invalidTopics: string[];
  validTopics: string[];
}

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "into",
  "about",
  "chapter",
  "topic",
  "class",
  "lesson",
  "unit",
]);

const KEYBOARD_SEQUENCES = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "poiuytrewq",
  "lkjhgfdsa",
  "mnbvcxz",
];

const GENERIC_TOPIC_HINTS = new Set([
  "matter",
  "material",
  "materials",
  "substance",
  "substances",
  "change",
  "changes",
  "water",
  "air",
  "force",
  "motion",
  "light",
  "sound",
  "electricity",
  "magnetism",
  "metal",
  "metals",
  "nonmetal",
  "nonmetals",
  "atom",
  "atoms",
  "molecule",
  "molecules",
  "cell",
  "cells",
  "tissue",
  "plant",
  "plants",
  "animal",
  "animals",
  "food",
  "nutrition",
  "fiber",
  "fibre",
  "fabric",
  "separation",
  "sorting",
  "group",
  "groups",
  "pure",
  "mixture",
  "mixtures",
  "solution",
  "solutions",
  "acid",
  "acids",
  "base",
  "bases",
  "salt",
  "salts",
  "reaction",
  "reactions",
  "grammar",
  "tense",
  "tenses",
  "verb",
  "verbs",
  "noun",
  "nouns",
  "pronoun",
  "pronouns",
  "adjective",
  "adjectives",
  "sentence",
  "sentences",
  "algebra",
  "geometry",
  "fraction",
  "fractions",
  "equation",
  "equations",
  "number",
  "numbers",
  "history",
  "geography",
  "civics",
  "economics",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toVariants(value?: string | LocalizedTopicText | null): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
  }

  return [value.english, value.hindi]
    .map((entry) => (entry ? normalizeText(entry) : ""))
    .filter(Boolean);
}

function tokenize(value: string): string[] {
  return value
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function normalizeToken(token: string): string {
  let normalized = normalizeText(token);

  if (normalized.endsWith("ies") && normalized.length > 4) {
    normalized = `${normalized.slice(0, -3)}y`;
  } else if (normalized.endsWith("ing") && normalized.length > 5) {
    normalized = normalized.slice(0, -3);
  } else if (normalized.endsWith("ed") && normalized.length > 4) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith("es") && normalized.length > 4) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith("s") && normalized.length > 3) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function buildChapterTokenSet(chapters: TopicValidationChapter[]): Set<string> {
  const tokenSet = new Set<string>();

  for (const chapter of chapters) {
    const variants = [...toVariants(chapter.title), ...toVariants(chapter.description)];
    for (const variant of variants) {
      for (const token of tokenize(variant)) {
        const normalizedToken = normalizeToken(token);
        if (normalizedToken.length >= 3) {
          tokenSet.add(normalizedToken);
        }
      }
    }
  }

  return tokenSet;
}

function hasFuzzyTokenOverlap(topicTokens: string[], chapterTokenSet: Set<string>): boolean {
  return topicTokens.some((rawToken) => {
    const token = normalizeToken(rawToken);
    if (token.length < 3) return false;
    if (chapterTokenSet.has(token)) return true;

    for (const chapterToken of chapterTokenSet) {
      if (chapterToken.includes(token) || token.includes(chapterToken)) {
        return true;
      }

      if (token.length >= 5 && chapterToken.length >= 5) {
        const sharedPrefix = token.slice(0, 4) === chapterToken.slice(0, 4);
        if (sharedPrefix) {
          return true;
        }
      }
    }

    return false;
  });
}

function hasGenericTopicHint(topicTokens: string[]): boolean {
  return topicTokens.some((token) => GENERIC_TOPIC_HINTS.has(normalizeToken(token)));
}

function isKeyboardMashToken(token: string): boolean {
  const normalized = normalizeText(token).replace(/\s+/g, "");
  if (!normalized || normalized.length < 4) return false;

  return KEYBOARD_SEQUENCES.some((sequence) => sequence.includes(normalized));
}

function getKeyboardAdjacencyScore(token: string): number {
  const normalized = normalizeText(token).replace(/\s+/g, "");
  if (normalized.length < 4) return 0;

  let score = 0;

  for (const sequence of KEYBOARD_SEQUENCES) {
    for (let index = 0; index < normalized.length - 1; index++) {
      const pair = normalized.slice(index, index + 2);
      if (sequence.includes(pair)) {
        score++;
      }
    }
  }

  return score;
}

function looksLikeGibberish(topic: string): boolean {
  const normalized = normalizeText(topic);
  if (!normalized) return true;

  const compact = normalized.replace(/\s+/g, "");
  if (compact.length >= 4 && isKeyboardMashToken(compact)) {
    return true;
  }

  const keyboardAdjacencyScore = getKeyboardAdjacencyScore(compact);
  if (compact.length >= 8 && keyboardAdjacencyScore >= Math.max(3, compact.length / 3)) {
    return true;
  }

  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length >= 2) {
    return false;
  }

  if (compact.length <= 3) {
    return false;
  }

  if (/^[a-z]+$/.test(compact) && compact.length >= 8) {
    const vowelMatches = compact.match(/[aeiou]/g) || [];
    const vowelRatio = vowelMatches.length / compact.length;
    const longConsonantCluster = /[bcdfghjklmnpqrstvwxyz]{5,}/.test(compact);

    if (longConsonantCluster || vowelRatio < 0.22) {
      return true;
    }
  }

  if (/[aeiou]/.test(compact) === false && /[aeiou]/.test(compact.slice(1)) === false) {
    return true;
  }

  const uniqueChars = new Set(compact);
  if (compact.length >= 6 && uniqueChars.size <= 3) {
    return true;
  }

  return false;
}

function looksLikeIrrelevantNamePhrase(topic: string, chapterTokenSet: Set<string>): boolean {
  const topicTokens = tokenize(topic);
  if (topicTokens.length === 0 || topicTokens.length > 4) {
    return false;
  }

  const allAlphabetic = topicTokens.every((token) => /^[a-z]+$/i.test(token));
  if (!allAlphabetic) {
    return false;
  }

  if (hasGenericTopicHint(topicTokens)) {
    return false;
  }

  if (hasFuzzyTokenOverlap(topicTokens, chapterTokenSet)) {
    return false;
  }

  const commonHonorifics = new Set(["sir", "madam", "maam", "mam", "miss", "mr", "mrs"]);
  if (topicTokens.some((token) => commonHonorifics.has(token))) {
    return true;
  }

  return topicTokens.length >= 2;
}

function topicMatchesChapter(topic: string, chapter: TopicValidationChapter): boolean {
  const normalizedTopic = normalizeText(topic);
  if (!normalizedTopic) return false;

  const topicTokens = tokenize(normalizedTopic);
  const chapterVariants = [
    ...toVariants(chapter.title),
    ...toVariants(chapter.description),
  ];

  return chapterVariants.some((variant) => {
    if (!variant) return false;

    if (variant.includes(normalizedTopic) || normalizedTopic.includes(variant)) {
      return true;
    }

    if (topicTokens.length === 0) {
      return false;
    }

    const variantTokens = new Set(tokenize(variant));
    const matchedTokens = topicTokens.filter((token) => variantTokens.has(token));

    if (matchedTokens.length === topicTokens.length) {
      return true;
    }

    return matchedTokens.length >= 1;
  });
}

export function validateTopicsAgainstChapters(
  topics: string[],
  chapters: TopicValidationChapter[],
): TopicValidationResult {
  if (topics.length === 0 || chapters.length === 0) {
    return {
      isValid: true,
      invalidTopics: [],
      validTopics: topics,
    };
  }

  const validTopics: string[] = [];
  const invalidTopics: string[] = [];
  const chapterTokenSet = buildChapterTokenSet(chapters);

  for (const topic of topics) {
    const hasLooseChapterMatch = chapters.some((chapter) => topicMatchesChapter(topic, chapter));
    const isClearlyGibberish = looksLikeGibberish(topic);
    const topicTokens = tokenize(topic);
    const hasSubjectHint =
      hasGenericTopicHint(topicTokens) || hasFuzzyTokenOverlap(topicTokens, chapterTokenSet);
    const isLikelyNamePhrase = looksLikeIrrelevantNamePhrase(topic, chapterTokenSet);

    if (hasLooseChapterMatch || (!isClearlyGibberish && !isLikelyNamePhrase && hasSubjectHint)) {
      validTopics.push(topic);
    } else {
      invalidTopics.push(topic);
    }
  }

  return {
    isValid: invalidTopics.length === 0,
    invalidTopics,
    validTopics,
  };
}

export function buildInvalidTopicsMessage(params: {
  classLevel?: number | string | null;
  subject?: string | null;
  invalidTopics: string[];
}): string {
  const { classLevel, subject, invalidTopics } = params;
  const syllabusLabel = [classLevel ? `Class ${classLevel}` : "", subject || ""]
    .filter(Boolean)
    .join(" ");

  const topicList = invalidTopics.join(", ");

  if (syllabusLabel) {
    return `These topics do not match the ${syllabusLabel} syllabus: ${topicList}. Please enter valid chapter or syllabus topics only.`;
  }

  return `These topics are not valid for the selected syllabus: ${topicList}. Please enter valid chapter or syllabus topics only.`;
}
