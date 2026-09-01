import { NextRequest, NextResponse } from "next/server";
import { enumerationService, IdorSecurityError } from "@/lib/services/enumeration-service";
import { verifyToken } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { PatchDraftSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const draft = await enumerationService.getDraft(id, session.userId, ip);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    const warnings = enumerationService.validateConsistency(draft.payload);

    return NextResponse.json({
      draft,
      warnings,
    });
  } catch (err: any) {
    if (err instanceof IdorSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to retrieve draft." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const rawBody = await req.json();
    const parsed = PatchDraftSchema.safeParse(rawBody);

    if (!parsed.success) {
      logSecurityEvent({
        eventType: "INVALID_INPUT_ATTEMPT",
        actorId: session.userId,
        ip,
        endpoint: `/api/v1/enumeration/drafts/${id}`,
        details: parsed.error.issues[0]?.message,
      });
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload." }, { status: 400 });
    }

    const { step, payload } = parsed.data;

    const updated = await enumerationService.patchDraft(id, session.userId, step, payload, ip);
    if (!updated) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    const warnings = enumerationService.validateConsistency(updated.payload);

    return NextResponse.json({
      success: true,
      message: "Step progress saved securely.",
      draft: updated,
      warnings,
    });
  } catch (err: any) {
    if (err instanceof IdorSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "Failed to update draft." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  try {
    const deleted = await enumerationService.deleteDraft(id, session.userId, ip);
    if (!deleted) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Draft successfully erased per DPDP Act right to erasure.",
    });
  } catch (err: any) {
    if (err instanceof IdorSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || "Failed to delete draft." }, { status: 500 });
  }
}
