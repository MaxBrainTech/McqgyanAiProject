import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import hi from "./hi.json";

const resources = {
  en: {
    translation: en
  },
  hi: {
    translation: hi
  }
};


i18n
.use(LanguageDetector)   // 🔥 add this
.use(initReactI18next)
.init({
  resources,

  fallbackLng: "en",
  supportedLngs: ["en", "hi"],

  detection: {
    order: ["localStorage", "navigator"], // priority
    lookupLocalStorage: "lang",
    caches: ["localStorage"]              // save here
  },

  interpolation: {
    escapeValue: false
  }
});

const syncDocumentLanguage = (language: string) => {
  if (typeof document === "undefined") return;

  const isHindi = language.toLowerCase().startsWith("hi");
  document.documentElement.lang = isHindi ? "hi" : "en";
  document.documentElement.classList.toggle("lang-hi", isHindi);
};

syncDocumentLanguage(i18n.language || "en");
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;

// i18n
//   .use(initReactI18next)
//   .init({
//     resources,
//     lng: "en", // default language
//     fallbackLng: "en",

//     interpolation: {
//       escapeValue: false
//     }
//   });

// export default i18n;
