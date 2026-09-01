import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { verifyToken } from "@/lib/services/auth-service";
import { CitizenFeedbackSchema } from "@/lib/security/validation-schemas";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { extractClientIp } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate limiting feedback submissions
  const rateLimit = checkRateLimit(ip, "GENERAL_API");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many feedback submissions. Please slow down." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const rawBody = await req.json();
    const parsed = CitizenFeedbackSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid feedback payload." }, { status: 400 });
    }

    const { message, category, rating } = parsed.data;

    db.addFeedback(session.userId, message, category, rating);

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully. Thank you for helping improve Jan Ganana AI!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit feedback." }, { status: 400 });
  }
}
