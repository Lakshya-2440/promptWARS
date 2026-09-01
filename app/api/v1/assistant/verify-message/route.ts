import { NextRequest, NextResponse } from "next/server";
import { classifyMisinformation } from "@/lib/services/hf-client";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { VerifyMessageSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate Limiting
  const rateLimit = checkRateLimit(ip, "AI_INFERENCE");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many message checks. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = VerifyMessageSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid message format." }, { status: 400 });
    }

    const { text } = parsed.data;

    const result = await classifyMisinformation(text);

    return NextResponse.json({
      success: true,
      analyzedTextSnippet: text.slice(0, 120),
      ...result,
      officialPortals: [
        { name: "Official Census Portal", url: "https://censusindia.gov.in" },
        { name: "National Cyber Crime Reporting", url: "https://cybercrime.gov.in" },
        { name: "PIB Fact Check", url: "https://factcheck.pib.gov.in" },
      ],
      helpline: "Toll-Free Helpline: 1800-11-2027 (Census) / 1930 (Cyber Helpline)",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to classify message." }, { status: 500 });
  }
}
