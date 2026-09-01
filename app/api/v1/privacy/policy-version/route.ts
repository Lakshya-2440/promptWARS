import { NextRequest, NextResponse } from "next/server";
import { privacyService } from "@/lib/services/privacy-service";

export async function GET(req: NextRequest) {
  const policy = privacyService.getPolicyVersion();
  return NextResponse.json(policy);
}
