import { NextRequest, NextResponse } from "next/server";
import { privacyService } from "@/lib/services/privacy-service";
import { verifyToken } from "@/lib/services/auth-service";
import { PrivacyConsentSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const rawBody = await req.json();
    const parsed = PrivacyConsentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid consent payload." }, { status: 400 });
    }

    const { purposes } = parsed.data;
    const consent = await privacyService.recordConsent(session.userId, ip, purposes);

    logSecurityEvent({
      eventType: "DPDP_CONSENT_RECORDED",
      actorId: session.userId,
      ip,
      endpoint: "/api/v1/privacy/consent",
    });

    return NextResponse.json({
      success: true,
      message: "DPDP 2023 consent record created.",
      consent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record consent." }, { status: 400 });
  }
}
