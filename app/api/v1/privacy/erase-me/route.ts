import { NextRequest, NextResponse } from "next/server";
import { privacyService } from "@/lib/services/privacy-service";
import { verifyToken } from "@/lib/services/auth-service";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function DELETE(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const report = await privacyService.eraseUserData(session.userId);

    logSecurityEvent({
      eventType: "DPDP_ERASURE_TRIGGERED",
      actorId: session.userId,
      ip,
      endpoint: "/api/v1/privacy/erase-me",
      details: `Erased ${report.draftsErased} drafts and ${report.consentsErased} consent records.`,
    });

    return NextResponse.json({
      success: true,
      message: "Right to Erasure executed under Section 12 of the DPDP Act 2023.",
      report,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to execute right to erasure." }, { status: 500 });
  }
}
