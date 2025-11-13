/**
 * Transliteration utility for converting English phonetic input to Indian scripts
 * Uses Sanscript library for accurate ITRANS transliteration
 * Supports: Hindi, Marathi (Devanagari), and Kannada
 */
import Sanscript from '@indic-transliteration/sanscript';

/**
 * Transliterate English text to Indian script using ITRANS
 */
export function transliterate(text: string, language: string): string {
  const lang = language.toLowerCase();
  
  // Only transliterate for Indian languages
  if (!['hindi', 'marathi', 'kannada'].includes(lang)) {
    return text;
  }
  
  // Map language to script
  const scriptMap: Record<string, string> = {
    'hindi': 'devanagari',
    'marathi': 'devanagari',
    'kannada': 'kannada'
  };
  
  const targetScript = scriptMap[lang];
  
  try {
    // Use Sanscript to transliterate from ITRANS to target script
    // syncope: true helps with Hindi-style transliteration
    return Sanscript.t(text, 'itrans', targetScript, { syncope: true });
  } catch (error) {
    // If transliteration fails, return original text
    console.error('Transliteration error:', error);
    return text;
  }
}

/**
 * Check if transliteration is available for a language
 */
export function isTransliterationAvailable(language: string): boolean {
  const lang = language.toLowerCase();
  return ['hindi', 'marathi', 'kannada'].includes(lang);
}

/**
 * Get display name for transliteration toggle
 */
export function getTransliterationLabel(language: string): string {
  const lang = language.toLowerCase();
  if (lang === 'kannada') return 'Type in English → ಕನ್ನಡ';
  if (lang === 'hindi') return 'Type in English → हिंदी';
  if (lang === 'marathi') return 'Type in English → मराठी';
  return 'Transliterate';
}
