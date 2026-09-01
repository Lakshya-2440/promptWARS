import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics-service";

export async function GET(req: NextRequest) {
  const summary = analyticsService.getNationalSummary();
  return NextResponse.json(summary);
}
