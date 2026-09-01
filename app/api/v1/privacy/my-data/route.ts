import { NextRequest, NextResponse } from "next/server";
import { privacyService } from "@/lib/services/privacy-service";
import { verifyToken } from "@/lib/services/auth-service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  const myData = await privacyService.getMyData(session.userId);
  return NextResponse.json(myData);
}
