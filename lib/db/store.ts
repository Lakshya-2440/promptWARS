import fs from "fs";
import path from "path";
import { ALL_STATES, FAQ_KNOWLEDGE_BASE, MYTHS_AND_FACTS, HLO_31_QUESTIONS, StateData, FAQItem } from "./seed-data";

export interface EnumerationDraft {
  id: string;
  userId: string;
  stateCode: string;
  phase: 1 | 2;
  step: number;
  status: "draft" | "submitted";
  referenceId?: string;
  submittedAt?: string;
  updatedAt: string;
  createdAt: string;
  payload: Record<string, any>;
}

export interface ConsentLog {
  id: string;
  userId: string;
  policyVersion: string;
  consentedAt: string;
  ipHash: string;
  purposes: string[];
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: string;
}

export interface DbSchema {
  states: StateData[];
  drafts: EnumerationDraft[];
  faqs: FAQItem[];
  consents: ConsentLog[];
  auditLogs: AuditLogItem[];
  feedback: Array<{ id: string; userId: string; query: string; answer: string; rating: number; timestamp: string }>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let memoryDb: DbSchema | null = null;

function initializeDb(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileData = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(fileData);
      return {
        states: parsed.states && parsed.states.length > 0 ? parsed.states : ALL_STATES,
        drafts: parsed.drafts || [],
        faqs: parsed.faqs && parsed.faqs.length > 0 ? parsed.faqs : FAQ_KNOWLEDGE_BASE,
        consents: parsed.consents || [],
        auditLogs: parsed.auditLogs || [],
        feedback: parsed.feedback || [],
      };
    } catch (e) {
      console.warn("Could not read db.json, re-seeding with defaults:", e);
    }
  }

  const freshDb: DbSchema = {
    states: ALL_STATES,
    drafts: [],
    faqs: FAQ_KNOWLEDGE_BASE,
    consents: [],
    auditLogs: [
      {
        id: "audit-init",
        actorId: "system",
        action: "DATABASE_INITIALIZED",
        resource: "db.json",
        timestamp: new Date().toISOString(),
        details: "Pre-seeded 36 States/UTs, 40+ Grounded FAQs, Census 2011 stats."
      }
    ],
    feedback: []
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write db.json, using in-memory only:", e);
  }

  return freshDb;
}

function getDb(): DbSchema {
  if (!memoryDb) {
    memoryDb = initializeDb();
  }
  return memoryDb;
}

function saveDb(): void {
  if (!memoryDb) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to persist db to disk:", e);
  }
}

export const db = {
  // State Schedule CRUD
  getStates(): StateData[] {
    return getDb().states;
  },
  getState(code: string): StateData | undefined {
    return getDb().states.find((s) => s.code.toUpperCase() === code.toUpperCase());
  },
  updateState(code: string, updates: Partial<StateData>): StateData | null {
    const database = getDb();
    const index = database.states.findIndex((s) => s.code.toUpperCase() === code.toUpperCase());
    if (index === -1) return null;
    database.states[index] = { ...database.states[index], ...updates };
    saveDb();
    this.addAuditLog("admin", "UPDATE_STATE_SCHEDULE", `state:${code}`, JSON.stringify(updates));
    return database.states[index];
  },

  // Drafts CRUD
  getDraft(id: string): EnumerationDraft | undefined {
    return getDb().drafts.find((d) => d.id === id);
  },
  getUserDrafts(userId: string): EnumerationDraft[] {
    return getDb().drafts.filter((d) => d.userId === userId);
  },
  saveDraft(draft: EnumerationDraft): EnumerationDraft {
    const database = getDb();
    const index = database.drafts.findIndex((d) => d.id === draft.id);
    if (index >= 0) {
      database.drafts[index] = { ...draft, updatedAt: new Date().toISOString() };
    } else {
      database.drafts.push(draft);
    }
    saveDb();
    return draft;
  },
  deleteDraft(id: string, userId: string): boolean {
    const database = getDb();
    const initialLen = database.drafts.length;
    database.drafts = database.drafts.filter((d) => !(d.id === id && d.userId === userId));
    const deleted = database.drafts.length < initialLen;
    if (deleted) {
      saveDb();
      this.addAuditLog(userId, "DELETE_DRAFT", `draft:${id}`);
    }
    return deleted;
  },
  eraseUserData(userId: string): { draftsErased: number; consentsErased: number } {
    const database = getDb();
    const initialDrafts = database.drafts.length;
    const initialConsents = database.consents.length;
    database.drafts = database.drafts.filter((d) => d.userId !== userId);
    database.consents = database.consents.filter((c) => c.userId !== userId);
    const draftsErased = initialDrafts - database.drafts.length;
    const consentsErased = initialConsents - database.consents.length;
    saveDb();
    this.addAuditLog(userId, "DPDP_RIGHT_TO_ERASURE_EXECUTED", `user:${userId}`);
    return { draftsErased, consentsErased };
  },

  // FAQs
  getFaqs(): FAQItem[] {
    return getDb().faqs;
  },
  addFaq(faq: Omit<FAQItem, "id">): FAQItem {
    const database = getDb();
    const newFaq: FAQItem = {
      ...faq,
      id: `faq-${Date.now()}`
    };
    database.faqs.push(newFaq);
    saveDb();
    this.addAuditLog("admin", "ADD_FAQ", newFaq.id);
    return newFaq;
  },

  // Consents (DPDP Act)
  addConsent(consent: Omit<ConsentLog, "id" | "consentedAt">): ConsentLog {
    const database = getDb();
    const newConsent: ConsentLog = {
      ...consent,
      id: `consent-${Date.now()}`,
      consentedAt: new Date().toISOString()
    };
    database.consents.push(newConsent);
    saveDb();
    return newConsent;
  },
  getUserConsents(userId: string): ConsentLog[] {
    return getDb().consents.filter((c) => c.userId === userId);
  },

  // Audit Logs
  getAuditLogs(): AuditLogItem[] {
    return getDb().auditLogs;
  },
  addAuditLog(actorId: string, action: string, resource: string, details?: string): void {
    const database = getDb();
    database.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      details
    });
    if (database.auditLogs.length > 500) {
      database.auditLogs = database.auditLogs.slice(0, 500);
    }
    saveDb();
  },

  // Feedback
  addFeedback(userId: string, query: string, answer: string, rating: number): void {
    const database = getDb();
    database.feedback.push({
      id: `fb-${Date.now()}`,
      userId,
      query,
      answer,
      rating,
      timestamp: new Date().toISOString(),
    });
    saveDb();
  },
  getFeedbackStats(): { total: number; averageRating: number } {
    const fb = getDb().feedback;
    if (fb.length === 0) return { total: 0, averageRating: 5.0 };
    const avg = fb.reduce((acc, curr) => acc + curr.rating, 0) / fb.length;
    return { total: fb.length, averageRating: parseFloat(avg.toFixed(2)) };
  }
};
