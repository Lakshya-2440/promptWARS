import { NextRequest, NextResponse } from "next/server";
import { dynamicTranslateText, dynamicTranslateBatch } from "@/lib/services/translation-engine";
import { getLanguage } from "@/lib/i18n/languages";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, dictionary, targetLangCode = "hi" } = body;

    const lang = getLanguage(targetLangCode);

    // Batch dictionary translation mode
    if (dictionary && typeof dictionary === "object") {
      const result = await dynamicTranslateBatch(dictionary, targetLangCode);
      return NextResponse.json({
        success: true,
        targetLanguage: lang.name,
        targetLangCode: lang.code,
        source: result.source,
        latencyMs: result.latencyMs,
        translations: result.translations,
      });
    }

    // Single text translation mode
    if (text && typeof text === "string") {
      const result = await dynamicTranslateText(text, targetLangCode);
      return NextResponse.json({
        success: true,
        originalText: text,
        targetLanguage: lang.name,
        targetLangCode: lang.code,
        source: result.source,
        latencyMs: result.latencyMs,
        translatedText: result.translatedText,
      });
    }

    return NextResponse.json(
      { error: "Provide either 'text' or 'dictionary' for translation." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Translation failed." },
      { status: 500 }
    );
  }
}
