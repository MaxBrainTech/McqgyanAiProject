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

  detection: {
    order: ["localStorage", "navigator"], // priority
    caches: ["localStorage"]              // save here
  },

  interpolation: {
    escapeValue: false
  }
});

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