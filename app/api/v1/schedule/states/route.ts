import { NextRequest, NextResponse } from "next/server";
import { scheduleService } from "@/lib/services/schedule-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get("zone");
  const snowBound = searchParams.get("snowBound");
  const status = searchParams.get("status");

  let states = await scheduleService.getAllStates();

  if (zone) {
    states = states.filter((s) => s.zone.toLowerCase() === zone.toLowerCase());
  }
  if (snowBound !== null && snowBound !== undefined && snowBound !== "") {
    const isSnow = snowBound === "true" || snowBound === "1";
    states = states.filter((s) => s.is_snow_bound === isSnow);
  }
  if (status) {
    states = states.filter((s) => s.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json({
    count: states.length,
    states,
  });
}
