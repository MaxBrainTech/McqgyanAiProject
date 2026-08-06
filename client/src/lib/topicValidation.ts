import {
  buildInvalidTopicsMessage,
  validateTopicsAgainstChapters,
} from "@shared/topicValidation";

interface ValidateTopicsParams {
  classLevel?: number | string;
  subject: string;
  topics: string[];
}

export async function getTopicValidationMessage({
  classLevel,
  subject,
  topics,
}: ValidateTopicsParams): Promise<string | null> {
  if (!subject || topics.length === 0) {
    return null;
  }

  try {
    const response = await fetch(`/api/chapters/${encodeURIComponent(subject)}`);
    if (!response.ok) {
      return null;
    }

    const chapters = await response.json();
    if (!Array.isArray(chapters) || chapters.length === 0) {
      return null;
    }

    const result = validateTopicsAgainstChapters(topics, chapters);
    if (result.isValid) {
      return null;
    }

    return buildInvalidTopicsMessage({
      classLevel,
      subject,
      invalidTopics: result.invalidTopics,
    });
  } catch {
    return null;
  }
}
