import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { verifyToken } from "@/lib/services/auth-service";
import { isAdminAuthorized } from "@/lib/security/admin-auth";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const adminSecret = req.headers.get("x-admin-key");

  const session = verifyToken(authHeader);
  const isAuthorized = isAdminAuthorized(session, adminSecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const logs = await db.getAuditLogs();
  return NextResponse.json({
    count: logs.length,
    auditLogs: logs,
  });
}
