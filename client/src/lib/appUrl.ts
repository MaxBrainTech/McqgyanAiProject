import { PRODUCTION_APP_URL, resolveAppUrl } from "@shared/appUrl";

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_URL?: string;
    readonly VITE_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export function getClientAppUrl(): string {
  const runtimeOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  return resolveAppUrl(
    import.meta.env.VITE_APP_URL,
    import.meta.env.VITE_BASE_URL,
    runtimeOrigin,
    PRODUCTION_APP_URL,
  );
}
