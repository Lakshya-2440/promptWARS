import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics-service";
import { CompareHouseholdSchema } from "@/lib/security/validation-schemas";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { extractClientIp } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  const rateLimit = checkRateLimit(ip, "GENERAL_API");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const rawBody = await req.json();
    const parsed = CompareHouseholdSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid comparison inputs." }, { status: 400 });
    }

    const { stateCode, householdData } = parsed.data;
    const comparison = analyticsService.compareHouseholdWithAverages(stateCode, householdData);

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to compare household." }, { status: 400 });
  }
}
