import { db } from "../db/store";

export const privacyService = {
  getPolicyVersion() {
    return {
      version: "2027.1.0-DPDP",
      effectiveDate: "2026-04-01",
      governingActs: [
        "Census Act, 1948 (Section 15 Confidentiality of Individual Records)",
        "Digital Personal Data Protection Act, 2023 (DPDP Act)",
      ],
      legalProtections: [
        "No Aadhaar or biometric data is ever collected or stored.",
        "Mobile numbers are stored as one-way salted SHA-256 hashes.",
        "Individual responses cannot be used in court or shared with tax/police agencies.",
        "Right to Erasure: Citizens can delete all stored session drafts with a single click.",
      ],
    };
  },

  recordConsent(userId: string, ipHash: string, purposes: string[] = ["census_awareness_and_practice"]) {
    return db.addConsent({
      userId,
      policyVersion: "2027.1.0-DPDP",
      ipHash,
      purposes,
    });
  },

  getMyData(userId: string) {
    const drafts = db.getUserDrafts(userId);
    const consents = db.getUserConsents(userId);

    return {
      userId,
      totalDraftsStored: drafts.length,
      piiStored: "None (Zero Aadhaar, Zero Biometrics, Zero Plaintext Bank Info)",
      drafts: drafts.map((d) => ({
        draftId: d.id,
        stateCode: d.stateCode,
        status: d.status,
        step: d.step,
        referenceId: d.referenceId || "Not submitted",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      consents: consents.map((c) => ({
        consentId: c.id,
        policyVersion: c.policyVersion,
        consentedAt: c.consentedAt,
      })),
      rightsAvailable: [
        "Right to Data Access (Viewing this summary)",
        "Right to Correction (Edit any draft field)",
        "Right to Erasure (Delete all data below)",
      ],
    };
  },

  eraseUserData(userId: string) {
    return db.eraseUserData(userId);
  },
};
