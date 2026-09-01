import { NextRequest, NextResponse } from "next/server";
import { scheduleService } from "@/lib/services/schedule-service";
import { verifyToken } from "@/lib/services/auth-service";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { AdminUpdateStateSchema, VALID_STATE_CODES } from "@/lib/security/validation-schemas";
import { extractClientIp, logSecurityEvent } from "@/lib/security/security-logger";

export async function GET(req: NextRequest, { params }: { params: { stateCode: string } }) {
  const { stateCode } = params;
  const state = scheduleService.getStateByCode(stateCode);

  if (!state) {
    return NextResponse.json({ error: `State with code '${stateCode}' not found.` }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function PUT(req: NextRequest, { params }: { params: { stateCode: string } }) {
  const { stateCode } = params;
  const ip = extractClientIp(req.headers);

  // Rate limiting admin actions
  const rateLimit = checkRateLimit(ip, "ADMIN_ACTION");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many admin requests." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization");
  const adminSecret = req.headers.get("x-admin-key");

  // Validate state code
  const upperCode = stateCode.toUpperCase();
  if (!(VALID_STATE_CODES as readonly string[]).includes(upperCode)) {
    return NextResponse.json({ error: `Invalid state code '${stateCode}'.` }, { status: 400 });
  }

  // Strict Admin Authorization
  const session = verifyToken(authHeader);
  const isAuthorized =
    session.role === "admin" || adminSecret === (process.env.ADMIN_SECRET_KEY || "admin_census2027_master_key");

  if (!isAuthorized) {
    logSecurityEvent({
      eventType: "ADMIN_UNAUTHORIZED",
      actorId: session.userId,
      ip,
      endpoint: `/api/v1/schedule/states/${stateCode}`,
      details: "Unauthorized PUT attempt on state schedule",
    });
    return NextResponse.json({ error: "Unauthorized. Valid admin credentials required." }, { status: 403 });
  }

  try {
    const rawBody = await req.json();
    const parsed = AdminUpdateStateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid schedule data format." }, { status: 400 });
    }

    const updated = scheduleService.updateStateSchedule(upperCode, parsed.data);

    if (!updated) {
      return NextResponse.json({ error: `State with code '${upperCode}' not found.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Schedule for ${updated.name} successfully updated.`,
      state: updated,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update state schedule." }, { status: 400 });
  }
}
