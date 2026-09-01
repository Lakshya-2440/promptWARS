import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    totalLanguages: SUPPORTED_LANGUAGES.length,
    languages: SUPPORTED_LANGUAGES,
    constitutionalBasis: "Eighth Schedule to the Constitution of India",
  });
}
