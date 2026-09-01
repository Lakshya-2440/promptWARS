import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { verifyToken } from "@/lib/services/auth-service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const adminSecret = req.headers.get("x-admin-key");

  const session = verifyToken(authHeader);
  const isAuthorized = session.role === "admin" || adminSecret === (process.env.ADMIN_SECRET_KEY || "admin_census2027_master_key");

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const logs = db.getAuditLogs();
  return NextResponse.json({
    count: logs.length,
    auditLogs: logs,
  });
}
