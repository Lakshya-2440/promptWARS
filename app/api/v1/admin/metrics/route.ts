import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { scheduleService } from "@/lib/services/schedule-service";

export async function GET(req: NextRequest) {
  const states = scheduleService.getAllStates();
  const faqs = db.getFaqs();
  const auditLogs = db.getAuditLogs();
  const feedbackStats = db.getFeedbackStats();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    systemStatus: "HEALTHY",
    environment: process.env.NODE_ENV || "development",
    hfInferenceMode: process.env.HF_TOKEN ? "CLOUD_HF_API (meta-llama / bart / indictrans2)" : "LOCAL_INTELLIGENT_RAG_FALLBACK",
    metrics: {
      totalStatesConfigured: states.length,
      activeSelfEnumStates: states.filter((s) => s.status === "active_self_enum").length,
      activeHloStates: states.filter((s) => s.status === "active_hlo").length,
      snowBoundStates: states.filter((s) => s.is_snow_bound).length,
      ragFaqCorpusSize: faqs.length,
      totalAuditEvents: auditLogs.length,
      citizenSatisfactionScore: feedbackStats.averageRating,
      totalFeedbackSubmissions: feedbackStats.total,
    },
  });
}
