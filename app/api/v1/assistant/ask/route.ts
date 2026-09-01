import { NextRequest, NextResponse } from "next/server";
import { askCensusAssistant } from "@/lib/services/hf-client";
import { verifyToken } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { AskAssistantSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate Limiting on AI generation
  const rateLimit = checkRateLimit(ip, "AI_INFERENCE");
  if (!rateLimit.allowed) {
    logSecurityEvent({
      eventType: "RATE_LIMIT_BLOCKED",
      actorId: `ip:${ip}`,
      ip,
      endpoint: "/api/v1/assistant/ask",
      details: `Exceeded AI generation rate limit. Retry after ${rateLimit.retryAfterSeconds}s`,
    });
    return NextResponse.json(
      { error: `Too many questions in a short period. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }

  try {
    const authHeader = req.headers.get("authorization");
    verifyToken(authHeader);

    const rawBody = await req.json();
    const parsed = AskAssistantSchema.safeParse(rawBody);

    if (!parsed.success) {
      logSecurityEvent({
        eventType: "INVALID_INPUT_ATTEMPT",
        actorId: `ip:${ip}`,
        ip,
        endpoint: "/api/v1/assistant/ask",
        details: parsed.error.issues[0]?.message,
      });
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid question input." }, { status: 400 });
    }

    const { message, language, context, conversationHistory } = parsed.data;

    const response = await askCensusAssistant({
      message,
      language,
      context,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process question." }, { status: 500 });
  }
}
