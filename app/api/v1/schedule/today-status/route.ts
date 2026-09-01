import { NextRequest, NextResponse } from "next/server";
import { scheduleService } from "@/lib/services/schedule-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stateCode = searchParams.get("stateCode") || undefined;

  const status = scheduleService.getTodayStatus(stateCode);
  return NextResponse.json(status);
}
