import { NextRequest, NextResponse } from "next/server";
import { requestOtp } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { OtpRequestSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // 1. Rate limiting by IP
  const rateLimit = checkRateLimit(ip, "AUTH_REQUEST");
  if (!rateLimit.allowed) {
    logSecurityEvent({
      eventType: "RATE_LIMIT_BLOCKED",
      actorId: `ip:${ip}`,
      ip,
      endpoint: "/api/v1/auth/otp/request",
      details: `Exceeded rate limit for OTP requests. Retry in ${rateLimit.retryAfterSeconds}s`,
    });
    return NextResponse.json(
      { error: `Too many OTP requests. Please wait ${rateLimit.retryAfterSeconds} seconds before retrying.` },
      {
        status: 429,
        headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() },
      }
    );
  }

  try {
    const rawBody = await req.json();
    // 2. Strict Input Validation
    const parsed = OtpRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      logSecurityEvent({
        eventType: "INVALID_INPUT_ATTEMPT",
        actorId: `ip:${ip}`,
        ip,
        endpoint: "/api/v1/auth/otp/request",
        details: parsed.error.issues[0]?.message,
      });
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid mobile number format." },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;

    // 3. Rate limit per phone number
    const phoneRateLimit = checkRateLimit(phone, "AUTH_REQUEST");
    if (!phoneRateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests for this mobile number. Please retry after ${phoneRateLimit.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": phoneRateLimit.retryAfterSeconds.toString() } }
      );
    }

    const result = requestOtp(phone, ip);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send OTP." }, { status: 400 });
  }
}
