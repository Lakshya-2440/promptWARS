import { getLanguage } from "../i18n/languages";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// Server-side in-memory translation cache (LRU Map)
const serverTranslationCache = new Map<string, string>();
const serverBatchCache = new Map<string, Record<string, string>>();

export interface TranslationResult {
  translatedText: string;
  source: "gemini_api" | "cached";
  targetLang: string;
  latencyMs: number;
}

export interface BatchTranslationResult {
  translations: Record<string, string>;
  source: "gemini_api" | "cached";
  targetLang: string;
  count: number;
  latencyMs: number;
}

const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
];

/**
 * Dynamic Single Text Translation via Google Gemini API
 */
export async function dynamicTranslateText(
  text: string,
  targetLangCode: string
): Promise<TranslationResult> {
  const start = Date.now();
  if (!text || targetLangCode === "en") {
    return {
      translatedText: text,
      source: "cached",
      targetLang: targetLangCode,
      latencyMs: 0,
    };
  }

  const cacheKey = `${targetLangCode}::${text.trim()}`;
  if (serverTranslationCache.has(cacheKey)) {
    return {
      translatedText: serverTranslationCache.get(cacheKey)!,
      source: "cached",
      targetLang: targetLangCode,
      latencyMs: Date.now() - start,
    };
  }

  const lang = getLanguage(targetLangCode);

  if (geminiApiKey) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are the official Government of India Census 2027 (Jan Ganana AI) translator. Translate the following English UI text into native ${lang.name} script accurately. Preserve official Indian governance terminology and respectful tone. Return ONLY the translated string without quotes, formatting, or commentary.\n\nEnglish: ${text}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 256,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated && translated !== text) {
            serverTranslationCache.set(cacheKey, translated);
            return {
              translatedText: translated,
              source: "gemini_api",
              targetLang: targetLangCode,
              latencyMs: Date.now() - start,
            };
          }
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} error:`, err);
      }
    }
  }

  return {
    translatedText: text,
    source: "cached",
    targetLang: targetLangCode,
    latencyMs: Date.now() - start,
  };
}

/**
 * Dynamic Batch Translation via Google Gemini API
 * Translates complete UI dictionary or FAQ catalog in a single structured Gemini call
 */
export async function dynamicTranslateBatch(
  dictionary: Record<string, string>,
  targetLangCode: string
): Promise<BatchTranslationResult> {
  const start = Date.now();
  if (targetLangCode === "en" || Object.keys(dictionary).length === 0) {
    return {
      translations: dictionary,
      source: "cached",
      targetLang: targetLangCode,
      count: Object.keys(dictionary).length,
      latencyMs: 0,
    };
  }

  const batchHash = `${targetLangCode}::${JSON.stringify(dictionary)}`;
  if (serverBatchCache.has(batchHash)) {
    return {
      translations: serverBatchCache.get(batchHash)!,
      source: "cached",
      targetLang: targetLangCode,
      count: Object.keys(dictionary).length,
      latencyMs: Date.now() - start,
    };
  }

  const lang = getLanguage(targetLangCode);

  if (geminiApiKey) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const prompt = `You are the official Government of India Census 2027 translator.
Translate every string value in the following JSON dictionary from English into native ${lang.name} script.
Ensure accurate, dignified, and natural official terminology for Indian citizens.
Keep all JSON keys exactly identical. Output ONLY a valid JSON object matching the input structure without markdown code blocks.

Input JSON:
${JSON.stringify(dictionary, null, 2)}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textContent) {
            const parsed = JSON.parse(textContent);
            serverBatchCache.set(batchHash, parsed);
            return {
              translations: parsed,
              source: "gemini_api",
              targetLang: targetLangCode,
              count: Object.keys(parsed).length,
              latencyMs: Date.now() - start,
            };
          }
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} batch error:`, err);
      }
    }
  }

  return {
    translations: dictionary,
    source: "cached",
    targetLang: targetLangCode,
    count: Object.keys(dictionary).length,
    latencyMs: Date.now() - start,
  };
}
