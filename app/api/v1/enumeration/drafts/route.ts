import { NextRequest, NextResponse } from "next/server";
import { enumerationService } from "@/lib/services/enumeration-service";
import { verifyToken } from "@/lib/services/auth-service";
import { db } from "@/lib/db/store";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { CreateDraftSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function GET(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const rateLimit = checkRateLimit(ip, "GENERAL_API");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  // Strictly return ONLY drafts belonging to this authenticated user
  const drafts = db.getUserDrafts(session.userId);
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const rateLimit = checkRateLimit(ip, "GENERAL_API");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const rawBody = await req.json();
    const parsed = CreateDraftSchema.safeParse(rawBody);

    if (!parsed.success) {
      logSecurityEvent({
        eventType: "INVALID_INPUT_ATTEMPT",
        actorId: session.userId,
        ip,
        endpoint: "/api/v1/enumeration/drafts",
        details: parsed.error.issues[0]?.message,
      });
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid state code." }, { status: 400 });
    }

    const { stateCode, phase } = parsed.data;
    const draft = enumerationService.createDraft(session.userId, stateCode, phase);

    return NextResponse.json({
      success: true,
      message: "New household enumeration draft initialized.",
      draft,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create draft." }, { status: 400 });
  }
}
