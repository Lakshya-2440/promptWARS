import { db } from "../db/store";

export type SecurityEventType =
  | "AUTH_OTP_REQUESTED"
  | "AUTH_OTP_VERIFIED"
  | "AUTH_OTP_FAILED"
  | "AUTH_PHONE_LOCKED_OUT"
  | "IDOR_ACCESS_DENIED"
  | "RATE_LIMIT_BLOCKED"
  | "INVALID_INPUT_ATTEMPT"
  | "ADMIN_UNAUTHORIZED"
  | "DPDP_CONSENT_RECORDED"
  | "DPDP_ERASURE_TRIGGERED"
  | "SUSPICIOUS_PAYLOAD_DETECTED";

export interface SecurityEvent {
  eventType: SecurityEventType;
  actorId: string;
  ip: string;
  endpoint: string;
  details?: string;
}

export function logSecurityEvent(event: SecurityEvent): void {
  const ipHash = Buffer.from(event.ip || "unknown").toString("base64").slice(0, 8);
  const timestamp = new Date().toISOString();

  // Write to audit log store for governance & compliance
  void db.addAuditLog(
    event.actorId || `ip:${ipHash}`,
    `[SECURITY] ${event.eventType}`,
    event.endpoint,
    `IP:${ipHash} | ${event.details || ""}`
  ).catch((error) => {
    console.warn("Failed to persist security audit event:", error);
  });

  // Structured console logging for SIEM / observability
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      JSON.stringify({
        level: event.eventType.includes("DENIED") || event.eventType.includes("LOCKED") || event.eventType.includes("BLOCKED") ? "WARN" : "INFO",
        timestamp,
        securityEvent: event.eventType,
        actor: event.actorId,
        endpoint: event.endpoint,
        ipHash,
        details: event.details,
      })
    );
  }
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}
