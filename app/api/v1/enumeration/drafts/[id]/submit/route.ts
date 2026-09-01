import { NextRequest, NextResponse } from "next/server";
import { enumerationService, IdorSecurityError } from "@/lib/services/enumeration-service";
import { verifyToken } from "@/lib/services/auth-service";
import { extractClientIp } from "@/lib/security/security-logger";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const result = await enumerationService.submitDraft(id, session.userId, ip);
    if (!result) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Practice Self-Enumeration finalized successfully.",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof IdorSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "Failed to finalize practice submission." }, { status: 500 });
  }
}
