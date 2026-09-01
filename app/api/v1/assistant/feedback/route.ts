import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { verifyToken } from "@/lib/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const session = verifyToken(authHeader);

    const body = await req.json();
    const { query = "", answer = "", rating = 5 } = body;

    await db.addFeedback(session.userId, query, answer, Number(rating));

    return NextResponse.json({
      success: true,
      message: "Feedback recorded successfully. Thank you for helping improve Jan Ganana AI!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record feedback." }, { status: 400 });
  }
}
