import { db, EnumerationDraft } from "../db/store";
import { HLO_31_QUESTIONS } from "../db/seed-data";
import { logSecurityEvent } from "../security/security-logger";

export interface InconsistencyWarning {
  fieldId: string;
  type: "warning" | "error";
  message: string;
  recommendation: string;
}

export class IdorSecurityError extends Error {
  constructor(message: string = "Access denied. You do not own this resource.") {
    super(message);
    this.name = "IdorSecurityError";
  }
}

export const enumerationService = {
  getQuestions(phase: 1 | 2 = 1, lang: string = "en") {
    if (phase === 1) {
      return {
        phase: 1,
        title: "House Listing & Housing Census (HLO)",
        totalQuestions: HLO_31_QUESTIONS.length,
        questions: HLO_31_QUESTIONS,
      };
    }
    return {
      phase: 2,
      title: "Population Enumeration & Caste Census (PE)",
      totalQuestions: 14,
      questions: [],
    };
  },

  createDraft(userId: string, stateCode: string, phase: 1 | 2 = 1): EnumerationDraft {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newDraft: EnumerationDraft = {
      id: draftId,
      userId,
      stateCode: stateCode.toUpperCase(),
      phase,
      step: 1,
      status: "draft",
      payload: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveDraft(newDraft);
    db.addAuditLog(userId, "CREATE_DRAFT", `draft:${draftId}`);
    return newDraft;
  },

  /**
   * Enforces zero-trust ownership: caller must own draft
   */
  getDraft(id: string, userId: string, clientIp: string = "127.0.0.1"): EnumerationDraft | null {
    const draft = db.getDraft(id);
    if (!draft) return null;

    if (draft.userId !== userId) {
      logSecurityEvent({
        eventType: "IDOR_ACCESS_DENIED",
        actorId: userId,
        ip: clientIp,
        endpoint: `/api/v1/enumeration/drafts/${id}`,
        details: `Unauthorized attempt to access draft belonging to user '${draft.userId}'`,
      });
      throw new IdorSecurityError(`Access denied: You do not have permission to view draft '${id}'.`);
    }

    return draft;
  },

  /**
   * Enforces zero-trust ownership: caller must own draft
   */
  patchDraft(
    id: string,
    userId: string,
    step: number,
    partialPayload: Record<string, any>,
    clientIp: string = "127.0.0.1"
  ): EnumerationDraft | null {
    const draft = db.getDraft(id);
    if (!draft) return null;

    if (draft.userId !== userId) {
      logSecurityEvent({
        eventType: "IDOR_ACCESS_DENIED",
        actorId: userId,
        ip: clientIp,
        endpoint: `/api/v1/enumeration/drafts/${id}`,
        details: `Unauthorized attempt to modify draft belonging to user '${draft.userId}'`,
      });
      throw new IdorSecurityError(`Access denied: You do not have permission to modify draft '${id}'.`);
    }

    draft.step = step;
    draft.payload = { ...draft.payload, ...partialPayload };
    draft.updatedAt = new Date().toISOString();

    db.saveDraft(draft);
    return draft;
  },

  /**
   * Enforces zero-trust ownership: caller must own draft
   */
  deleteDraft(id: string, userId: string, clientIp: string = "127.0.0.1"): boolean {
    const draft = db.getDraft(id);
    if (!draft) return false;

    if (draft.userId !== userId) {
      logSecurityEvent({
        eventType: "IDOR_ACCESS_DENIED",
        actorId: userId,
        ip: clientIp,
        endpoint: `/api/v1/enumeration/drafts/${id}`,
        details: `Unauthorized attempt to delete draft belonging to user '${draft.userId}'`,
      });
      throw new IdorSecurityError(`Access denied: You do not have permission to delete draft '${id}'.`);
    }

    return db.deleteDraft(id, userId);
  },

  /**
   * Enforces zero-trust ownership: caller must own draft
   */
  submitDraft(
    id: string,
    userId: string,
    clientIp: string = "127.0.0.1"
  ): { draft: EnumerationDraft; practiceReferenceId: string; summary: any } | null {
    const draft = db.getDraft(id);
    if (!draft) return null;

    if (draft.userId !== userId) {
      logSecurityEvent({
        eventType: "IDOR_ACCESS_DENIED",
        actorId: userId,
        ip: clientIp,
        endpoint: `/api/v1/enumeration/drafts/${id}/submit`,
        details: `Unauthorized attempt to submit draft belonging to user '${draft.userId}'`,
      });
      throw new IdorSecurityError(`Access denied: You do not have permission to submit draft '${id}'.`);
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const stateCode = draft.stateCode || "IN";
    const practiceReferenceId = `CEN27-${stateCode}-${randomSuffix}`;

    draft.status = "submitted";
    draft.referenceId = practiceReferenceId;
    draft.submittedAt = new Date().toISOString();
    draft.updatedAt = new Date().toISOString();

    db.saveDraft(draft);
    db.addAuditLog(userId, "SUBMIT_PRACTICE_SELF_ENUMERATION", `draft:${id}`, `ref:${practiceReferenceId}`);

    return {
      draft,
      practiceReferenceId,
      summary: {
        referenceId: practiceReferenceId,
        stateCode: draft.stateCode,
        submissionDate: draft.submittedAt,
        headOfHousehold: draft.payload.headName || "Practice Respondent",
        totalMembers: draft.payload.totalPersons || 1,
        isSimulation: true,
        verificationNotice:
          "This is a simulated Practice Reference ID for awareness. Share this ID with your enumerator or use it on censusindia.gov.in.",
      },
    };
  },

  validateConsistency(payload: Record<string, any>): InconsistencyWarning[] {
    const warnings: InconsistencyWarning[] = [];

    // Check 1: Age vs Marital Status
    if (payload.members && Array.isArray(payload.members)) {
      payload.members.forEach((m: any, idx: number) => {
        const memberName = m.name || `Member #${idx + 1}`;
        if (m.age !== undefined && Number(m.age) < 18 && m.maritalStatus === "currently_married") {
          warnings.push({
            fieldId: `member_${idx}_maritalStatus`,
            type: "warning",
            message: `${memberName} is listed as age ${m.age} with marital status 'Currently Married'.`,
            recommendation: "Please verify if the age or marital status was entered by mistake (Legal marriage age is 18/21).",
          });
        }
        if (m.age !== undefined && Number(m.age) < 5 && m.isLiterate === "yes") {
          warnings.push({
            fieldId: `member_${idx}_literacy`,
            type: "warning",
            message: `${memberName} is under 5 years old and marked as Literate.`,
            recommendation: "Per Census guidelines, children under age 7 are enumerated without formal literacy status.",
          });
        }
      });
    }

    // Check 2: Head of Household Age
    if (payload.headAge !== undefined && Number(payload.headAge) < 18) {
      warnings.push({
        fieldId: "headAge",
        type: "warning",
        message: `Head of household is listed as ${payload.headAge} years old (minor).`,
        recommendation: "Ensure this is an independent household headed by an adult or an unaccompanied minor.",
      });
    }

    // Check 3: Total Persons vs Married Couples
    if (payload.totalPersons && payload.marriedCouples) {
      const total = Number(payload.totalPersons);
      const couples = Number(payload.marriedCouples);
      if (couples * 2 > total) {
        warnings.push({
          fieldId: "marriedCouples",
          type: "error",
          message: `${couples} married couples requires at least ${couples * 2} persons, but total persons is ${total}.`,
          recommendation: "Adjust total persons or count of married couples living together.",
        });
      }
    }

    // Check 4: Cooking inside without ventilation/fuel match
    if (payload.kitchenStatus === "cooking_inside_lpg" && payload.cookingFuel === "firewood") {
      warnings.push({
        fieldId: "cookingFuel",
        type: "warning",
        message: "You selected LPG kitchen connection but listed Firewood as primary cooking fuel.",
        recommendation: "If LPG is primary, select 'LPG / PNG' as the main fuel.",
      });
    }

    return warnings;
  },
};
