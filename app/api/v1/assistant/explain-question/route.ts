import { NextRequest, NextResponse } from "next/server";
import { HLO_31_QUESTIONS } from "@/lib/db/seed-data";
import { askCensusAssistant } from "@/lib/services/hf-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, language = "en" } = body;

    const question = HLO_31_QUESTIONS.find((q) => q.id === questionId || String(q.number) === String(questionId));
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const prompt = `Explain Question #${question.number} ("${question.label}"): ${question.description}. Why does the census collect this, and how should a citizen answer accurately?`;
    const aiResponse = await askCensusAssistant({
      message: prompt,
      language,
      context: { questionId: question.id },
    });

    return NextResponse.json({
      questionId: question.id,
      number: question.number,
      label: question.label,
      whyAsked: question.whyAsked,
      explanation: aiResponse.answer,
      isConfidential: question.isConfidential,
      legalNote: "Protected under Section 15 of Census Act 1948.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to explain question." }, { status: 500 });
  }
}
