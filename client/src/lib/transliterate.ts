/**
 * Transliteration utility for converting English phonetic input to Indian scripts
 * Supports: Hindi, Marathi (Devanagari), and Kannada
 */

// Devanagari (Hindi/Marathi) transliteration map
const devanagariMap: Record<string, string> = {
  // Vowels
  'a': 'अ', 'aa': 'आ', 'A': 'आ',
  'i': 'इ', 'ii': 'ई', 'I': 'ई',
  'u': 'उ', 'uu': 'ऊ', 'U': 'ऊ',
  'e': 'ए', 'ai': 'ऐ',
  'o': 'ओ', 'au': 'औ',
  
  // Consonants
  'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
  'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'nya': 'ञ',
  'Ta': 'ट', 'Tha': 'ठ', 'Da': 'ड', 'Dha': 'ढ', 'Na': 'ण',
  'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
  'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
  'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व', 'wa': 'व',
  'sha': 'श', 'shha': 'ष', 'sa': 'स', 'ha': 'ह',
  
  // Special characters
  'ksha': 'क्ष', 'tra': 'त्र', 'gya': 'ज्ञ',
  
  // Standalone consonants
  'k': 'क्', 'kh': 'ख्', 'g': 'ग्', 'gh': 'घ्',
  'ch': 'च्', 'chh': 'छ्', 'j': 'ज्', 'jh': 'झ्',
  'T': 'ट्', 'Th': 'ठ्', 'D': 'ड्', 'Dh': 'ढ्',
  't': 'त्', 'th': 'थ्', 'd': 'द्', 'dh': 'ध्', 'n': 'न्',
  'p': 'प्', 'ph': 'फ्', 'b': 'ब्', 'bh': 'भ्', 'm': 'म्',
  'y': 'य्', 'r': 'र्', 'l': 'ल्', 'v': 'व्', 'w': 'व्',
  'sh': 'श्', 'shh': 'ष्', 's': 'स्', 'h': 'ह्',
  
  // Matras (vowel signs)
  'ā': 'ा', 'ī': 'ी', 'ū': 'ू', 'ē': 'े', 'ō': 'ो',
  
  // Numbers
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

// Kannada transliteration map
const kannadaMap: Record<string, string> = {
  // Vowels
  'a': 'ಅ', 'aa': 'ಆ', 'A': 'ಆ',
  'i': 'ಇ', 'ii': 'ಈ', 'I': 'ಈ',
  'u': 'ಉ', 'uu': 'ಊ', 'U': 'ಊ',
  'e': 'ಎ', 'ee': 'ಏ', 'E': 'ಏ',
  'o': 'ಒ', 'oo': 'ಓ', 'O': 'ಓ',
  'ai': 'ಐ', 'au': 'ಔ',
  
  // Consonants
  'ka': 'ಕ', 'kha': 'ಖ', 'ga': 'ಗ', 'gha': 'ಘ', 'nga': 'ಙ',
  'cha': 'ಚ', 'chha': 'ಛ', 'ja': 'ಜ', 'jha': 'ಝ', 'nya': 'ಞ',
  'Ta': 'ಟ', 'Tha': 'ಠ', 'Da': 'ಡ', 'Dha': 'ಢ', 'Na': 'ಣ',
  'ta': 'ತ', 'tha': 'ಥ', 'da': 'ದ', 'dha': 'ಧ', 'na': 'ನ',
  'pa': 'ಪ', 'pha': 'ಫ', 'ba': 'ಬ', 'bha': 'ಭ', 'ma': 'ಮ',
  'ya': 'ಯ', 'ra': 'ರ', 'la': 'ಲ', 'va': 'ವ', 'wa': 'ವ',
  'sha': 'ಶ', 'shha': 'ಷ', 'sa': 'ಸ', 'ha': 'ಹ',
  'La': 'ಳ',
  
  // Standalone consonants
  'k': 'ಕ್', 'kh': 'ಖ್', 'g': 'ಗ್', 'gh': 'ಘ್',
  'ch': 'ಚ್', 'chh': 'ಛ್', 'j': 'ಜ್', 'jh': 'ಝ್',
  'T': 'ಟ್', 'Th': 'ಠ್', 'D': 'ಡ್', 'Dh': 'ಢ್',
  't': 'ತ್', 'th': 'ಥ್', 'd': 'ದ್', 'dh': 'ಧ್', 'n': 'ನ್',
  'p': 'ಪ್', 'ph': 'ಫ್', 'b': 'ಬ್', 'bh': 'ಭ್', 'm': 'ಮ್',
  'y': 'ಯ್', 'r': 'ರ್', 'l': 'ಲ್', 'v': 'ವ್', 'w': 'ವ್',
  'sh': 'ಶ್', 'shh': 'ಷ್', 's': 'ಸ್', 'h': 'ಹ್',
  
  // Numbers
  '0': '೦', '1': '೧', '2': '೨', '3': '೩', '4': '೪',
  '5': '೫', '6': '೬', '7': '೭', '8': '೮', '9': '೯',
};

/**
 * Transliterate English text to Indian script
 */
export function transliterate(text: string, language: string): string {
  const lang = language.toLowerCase();
  
  // Select appropriate map
  let map: Record<string, string>;
  if (lang === 'kannada') {
    map = kannadaMap;
  } else if (lang === 'hindi' || lang === 'marathi') {
    map = devanagariMap;
  } else {
    return text; // No transliteration needed
  }
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    let matched = false;
    
    // Try to match longer sequences first (3 chars, then 2, then 1)
    for (let len = 4; len >= 1; len--) {
      const substr = text.substr(i, len);
      if (map[substr]) {
        result += map[substr];
        i += len;
        matched = true;
        break;
      }
    }
    
    // If no match found, keep original character
    if (!matched) {
      result += text[i];
      i++;
    }
  }
  
  return result;
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
