import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const metric = (searchParams.get("metric") as any) || "population";

  const trends = analyticsService.getTrends(metric);
  return NextResponse.json(trends);
}
