import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/services/analytics-service";

export async function GET(req: NextRequest, props: { params: Promise<{ stateCode: string }> }) {
  const params = await props.params;
  const { stateCode } = params;
  const analytics = analyticsService.getStateAnalytics(stateCode);

  if (!analytics) {
    return NextResponse.json({ error: `State '${stateCode}' not found.` }, { status: 404 });
  }

  return NextResponse.json(analytics);
}
