export const PRODUCTION_APP_URL = "https://mocktest.maxbraintech.com";

export function normalizeAppUrl(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export function resolveAppUrl(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const normalized = normalizeAppUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return PRODUCTION_APP_URL;
}

export function buildAppUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = normalizeAppUrl(baseUrl) || PRODUCTION_APP_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(normalizedPath, `${normalizedBaseUrl}/`).toString();
}
