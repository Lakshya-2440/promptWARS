import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { OtpVerifySchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);

  // Rate limiting by IP
  const rateLimit = checkRateLimit(ip, "AUTH_VERIFY");
  if (!rateLimit.allowed) {
    logSecurityEvent({
      eventType: "RATE_LIMIT_BLOCKED",
      actorId: `ip:${ip}`,
      ip,
      endpoint: "/api/v1/auth/otp/verify",
      details: "Rate limit exceeded on OTP verification",
    });
    return NextResponse.json(
      { error: `Too many verification attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = OtpVerifySchema.safeParse(rawBody);

    if (!parsed.success) {
      logSecurityEvent({
        eventType: "INVALID_INPUT_ATTEMPT",
        actorId: `ip:${ip}`,
        ip,
        endpoint: "/api/v1/auth/otp/verify",
        details: parsed.error.issues[0]?.message,
      });
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid phone or OTP code format." },
        { status: 400 }
      );
    }

    const { phone, otp } = parsed.data;
    const session = verifyOtp(phone, otp, ip);

    return NextResponse.json({
      success: true,
      message: "Authentication successful.",
      ...session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid or expired OTP code." }, { status: 401 });
  }
}
