/**
 * Barrel export for security layer primitives:
 * - Rate limiting (sliding-window)
 * - Validation & sanitization schemas (Zod + XSS + prototype pollution defense)
 * - Security audit logger & IP extractor
 * - Admin authorization guards
 */

export { checkRateLimit, resetRateLimit } from "./rate-limiter";
export type { RateLimitTier, RateLimitResult } from "./rate-limiter";

export {
  VALID_STATE_CODES,
  sanitizeString,
  sanitizeObject,
  OtpRequestSchema,
  OtpVerifySchema,
  AskAssistantSchema,
  ExplainQuestionSchema,
  VerifyMessageSchema,
  AssistantFeedbackSchema,
  CreateDraftSchema,
  PatchDraftSchema,
  PrivacyConsentSchema,
  AdminUpdateStateSchema,
  AdminAddFaqSchema,
  CitizenFeedbackSchema,
  CompareHouseholdSchema,
} from "./validation-schemas";

export { logSecurityEvent, extractClientIp } from "./security-logger";
export type { SecurityEvent } from "./security-logger";

export { isAdminAuthorized } from "./admin-auth";
