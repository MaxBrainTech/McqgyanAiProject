import { useTranslation } from "react-i18next";

type LanguageCode = "en" | "hi";

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.language || "en").toLowerCase();
  const isHindi = currentLanguage.startsWith("hi");

  const setLanguage = (language: LanguageCode) => {
    localStorage.setItem("lang", language);
    localStorage.setItem("i18nextLng", language);
    void i18n.changeLanguage(language);
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-muted/70 p-0.5 shadow-sm sm:p-1 ${className}`}
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-sm ${
          !isHindi
            ? "bg-primary text-primary-foreground shadow"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {t("language_english")}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-sm ${
          isHindi
            ? "bg-primary text-primary-foreground shadow"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {t("language_hindi")}
      </button>
    </div>
  );
}
