import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { verifyToken } from "@/lib/services/auth-service";
import { AdminAddFaqSchema } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";
import { isAdminAuthorized } from "@/lib/security/admin-auth";

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const authHeader = req.headers.get("authorization");
  const adminSecret = req.headers.get("x-admin-key");

  const session = verifyToken(authHeader);
  const isAuthorized = isAdminAuthorized(session, adminSecret);

  if (!isAuthorized) {
    logSecurityEvent({
      eventType: "ADMIN_UNAUTHORIZED",
      actorId: session.userId,
      ip,
      endpoint: "/api/v1/admin/faq",
      details: "Unauthorized attempt to add FAQ item",
    });
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const rawBody = await req.json();
    const parsed = AdminAddFaqSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid FAQ payload." }, { status: 400 });
    }

    const { category, question, answer, legalReference, keywords } = parsed.data;

    const newFaq = {
      id: `faq_dyn_${Date.now()}`,
      category,
      question,
      answer,
      legalReference: legalReference || "Census Act 1948 / ORGI Notifications",
      keywords,
    };

    await db.addFaq(newFaq);
    await db.addAuditLog(session.userId, "ADD_RAG_FAQ_ITEM", `faq:${newFaq.id}`);

    return NextResponse.json({
      success: true,
      message: "FAQ knowledge chunk added to RAG corpus.",
      faq: newFaq,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add FAQ." }, { status: 400 });
  }
}
