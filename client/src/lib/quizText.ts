import type { TFunction } from "i18next";

export type LocalizedValue =
  | string
  | {
      en?: string;
      hi?: string;
      [key: string]: string | undefined;
    }
  | null
  | undefined;

export function getLocalizedText(
  value: LocalizedValue,
  language: string = "en",
): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  const langKey = language.startsWith("hi") ? "hi" : "en";
  return value[langKey] || value.en || value.hi || "";
}

export function getSubjectLabel(
  subject: string | undefined,
  t: TFunction,
): string {
  if (!subject) return t("quiz");

  const normalized = subject
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "_");

  const nestedKey = `subjects.${normalized}`;
  const translated = t(nestedKey);
  if (translated !== nestedKey) {
    return translated;
  }

  const directKey = `subject_${normalized}`;
  const directTranslation = t(directKey);
  if (directTranslation !== directKey) {
    return directTranslation;
  }

  return subject;
}

export function getSubjectTestTitle(
  subject: string | undefined,
  t: TFunction,
): string {
  return t("subject_test_title", {
    subject: getSubjectLabel(subject, t),
  });
}
