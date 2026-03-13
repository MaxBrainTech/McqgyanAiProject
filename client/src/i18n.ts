import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      hero_title: "Smart AI-Based Practice & Evaluation Tool for Students",
      hero_desc:
        "Free AI-powered mock tests for CBSE students. Learn 6 languages, master 4 science subjects, and achieve your academic goals.",
      features_title: "Powerful Features for Smarter Learning",
      pricing_title: "Simple, Transparent Pricing",
      contact_title: "Get In Touch",
      get_started: "Get Started Free",
    },
  },
  hi: {
    translation: {
      hero_title: "छात्रों के लिए स्मार्ट AI आधारित प्रैक्टिस और मूल्यांकन टूल",
      hero_desc:
        "CBSE छात्रों के लिए मुफ्त AI आधारित मॉक टेस्ट। 6 भाषाएँ सीखें, 4 विज्ञान विषयों में महारत हासिल करें और अपने शैक्षणिक लक्ष्य प्राप्त करें।",
      features_title: "बेहतर सीखने के लिए शक्तिशाली फीचर्स",
      pricing_title: "सरल और पारदर्शी प्राइसिंग",
      contact_title: "संपर्क करें",
      get_started: "मुफ्त शुरू करें",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;