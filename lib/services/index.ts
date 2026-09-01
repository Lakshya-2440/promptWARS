/**
 * Barrel export for business logic & AI services:
 * - Auth & session management
 * - Practice self-enumeration lifecycle
 * - State timeline & schedule computation
 * - Privacy & DPDP compliance
 * - HuggingFace & Gemini inference clients
 * - Analytics & demographic comparisons
 * - Dynamic regional translation engine
 */

export {
  hashPhone,
  requestOtp,
  verifyOtp,
  requireAuth,
  verifyToken,
} from "./auth-service";
export type { AuthSession } from "./auth-service";

export {
  enumerationService,
  IdorSecurityError,
} from "./enumeration-service";
export type { InconsistencyWarning } from "./enumeration-service";

export {
  computeStateStatus,
} from "./schedule-status";
export type { PhaseStatus, StateWithComputedStatus } from "./schedule-status";

export {
  scheduleService,
} from "./schedule-service";

export { privacyService } from "./privacy-service";

export {
  askCensusAssistant,
  classifyMisinformation,
  translateText,
} from "./hf-client";
export type { AssistantResponse, ScamClassificationResult } from "./hf-client";

export {
  analyticsService,
  HISTORICAL_CENSUS_TRENDS,
} from "./analytics-service";

export {
  dynamicTranslateText,
  dynamicTranslateBatch,
} from "./translation-engine";
export type { TranslationResult, BatchTranslationResult } from "./translation-engine";
