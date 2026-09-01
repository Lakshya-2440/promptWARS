import { NextRequest, NextResponse } from "next/server";
import { enumerationService } from "@/lib/services/enumeration-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phaseParam = searchParams.get("phase");
  const phase = phaseParam === "2" ? 2 : 1;
  const lang = searchParams.get("lang") || "en";

  const result = enumerationService.getQuestions(phase, lang);
  return NextResponse.json(result);
}
