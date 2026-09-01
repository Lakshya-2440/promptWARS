import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/services/auth-service";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const session = verifyToken(authHeader);

  return NextResponse.json({
    success: true,
    message: "Session refreshed.",
    user: session,
  });
}
