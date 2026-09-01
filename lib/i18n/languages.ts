export interface Language {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  indicTransCode: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin", indicTransCode: "eng_Latn" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari", indicTransCode: "hin_Deva" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali", indicTransCode: "ben_Beng" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", script: "Telugu", indicTransCode: "tel_Telu" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari", indicTransCode: "mar_Deva" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil", indicTransCode: "tam_Taml" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati", indicTransCode: "guj_Gujr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", script: "Perso-Arabic", indicTransCode: "urd_Arab" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada", indicTransCode: "kan_Knda" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", script: "Odia", indicTransCode: "ory_Orya" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", script: "Malayalam", indicTransCode: "mal_Mlym" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi", indicTransCode: "pan_Guru" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", script: "Bengali-Assamese", indicTransCode: "asm_Beng" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", script: "Devanagari", indicTransCode: "mai_Deva" },
  { code: "sat", name: "Santali", nativeName: "संताली (Ol Chiki)", script: "Ol Chiki / Devanagari", indicTransCode: "sat_Olck" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", script: "Devanagari", indicTransCode: "san_Deva" },
];

export function getLanguage(code: string): Language {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
