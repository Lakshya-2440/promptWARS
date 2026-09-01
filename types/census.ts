/**
 * Strongly-Typed Census Domain Models & API Contracts
 * Digital Census 2027 (Jan Ganana AI)
 */

import { StateWithComputedStatus } from "@/lib/services/schedule-status";
import { AuditLogItem, EnumerationDraft } from "@/lib/db/store";

export type IndianStateCode =
  | "AN" | "AP" | "AR" | "AS" | "BR" | "CH" | "CG" | "DN" | "DL" | "GA"
  | "GJ" | "HR" | "HP" | "JK" | "JH" | "KA" | "KL" | "LA" | "LD" | "MP"
  | "MH" | "MN" | "ML" | "MZ" | "NL" | "OD" | "PB" | "PY" | "RJ" | "SK"
  | "TN" | "TG" | "TR" | "UP" | "UK" | "WB";

export type ScheduleStatusType =
  | "active_self_enum"
  | "active_hlo"
  | "active_pe"
  | "upcoming"
  | "completed";

export interface TodayStatusResponse {
  referenceDate: string;
  snowBoundReferenceDate?: string;
  counts: {
    totalStatesAndUTs: number;
    activeSelfEnumCount: number;
    activeHloCount: number;
    activePeCount: number;
    snowBoundCount: number;
  };
  activeStates: {
    selfEnumeration: Array<{ code: string; name: string; daysRemaining?: number }>;
    houseListing: Array<{ code: string; name: string; daysRemaining?: number }>;
    populationEnumeration: Array<{ code: string; name: string; daysRemaining?: number }>;
  };
  selectedState: StateWithComputedStatus | null;
}

export interface QuickVerifyResult {
  isScam: boolean;
  verdict: string;
  confidenceScore: number;
  explanation: string;
  redFlags?: string[];
  officialAdvice: string;
  source?: string;
}

export interface HouseholdAmenityMetric {
  name: string;
  icon?: string;
  yourHousehold?: string;
  stateAverage?: string;
  nationalAverage?: string;
  status?: "above" | "below" | "matching";
}

export interface HouseholdComparisonResponse {
  stateCode: string;
  stateName: string;
  metrics: HouseholdAmenityMetric[];
  summary: {
    matchingOrAboveCount: number;
    totalMetrics: number;
    overallStanding: string;
  };
}

export interface InconsistencyWarning {
  field: string;
  type: "warning" | "error" | "info";
  message: string;
}

export interface PracticeSubmissionResult {
  success: boolean;
  draft: EnumerationDraft;
  practiceReferenceId: string;
  summary: {
    state: string;
    headOfHousehold: string;
    totalPersons: number;
    dwellingRooms: number;
    submittedAt: string;
  };
}

export interface AdminMetricsResponse {
  timestamp: string;
  systemStatus: string;
  environment: string;
  hfInferenceMode: string;
  metrics: {
    totalStatesConfigured: number;
    activeSelfEnumStates: number;
    activeHloStates: number;
    snowBoundStates: number;
    ragFaqCorpusSize: number;
    totalAuditEvents: number;
    citizenSatisfactionScore: number;
    totalFeedbackSubmissions: number;
  };
}

export type AdminAuditLogItem = AuditLogItem;
