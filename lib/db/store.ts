import fs from "fs";
import path from "path";
import postgres from "postgres";
import { ALL_STATES, FAQ_KNOWLEDGE_BASE, StateData, FAQItem } from "./seed-data";

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

function asJson(value: unknown): postgres.JSONValue {
  return value as postgres.JSONValue;
}

let memoryDb: DbSchema | null = null;
let sql: postgres.Sql | null = null;
let postgresReady: Promise<void> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, { max: 3, prepare: false });
  }
  return sql;
}

async function ensurePostgres() {
  const client = getSql();
  if (!client) return;
  if (!postgresReady) {
    postgresReady = (async () => {
      await client`create table if not exists states (code text primary key, data jsonb not null)`;
      await client`create table if not exists drafts (id text primary key, user_id text not null, data jsonb not null, updated_at timestamptz not null default now())`;
      await client`create index if not exists drafts_user_id_idx on drafts (user_id)`;
      await client`create table if not exists faqs (id text primary key, data jsonb not null)`;
      await client`create table if not exists consents (id text primary key, user_id text not null, data jsonb not null)`;
      await client`create index if not exists consents_user_id_idx on consents (user_id)`;
      await client`create table if not exists audit_logs (id text primary key, actor_id text not null, data jsonb not null, created_at timestamptz not null default now())`;
      await client`create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc)`;
      await client`create table if not exists feedback (id text primary key, user_id text not null, data jsonb not null, created_at timestamptz not null default now())`;

      const stateCount = await client`select count(*)::int as count from states`;
      if (stateCount[0].count === 0) {
        for (const state of ALL_STATES) {
          await client`insert into states (code, data) values (${state.code}, ${client.json(asJson(state))})`;
        }
      }

      const faqCount = await client`select count(*)::int as count from faqs`;
      if (faqCount[0].count === 0) {
        for (const faq of FAQ_KNOWLEDGE_BASE) {
          await client`insert into faqs (id, data) values (${faq.id}, ${client.json(asJson(faq))})`;
        }
      }
    })();
  }
  await postgresReady;
}

function initializeMemoryDb(): DbSchema {
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
        details: "Pre-seeded 36 States/UTs, 40+ Grounded FAQs, Census 2011 stats.",
      },
    ],
    feedback: [],
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write db.json, using in-memory only:", e);
  }

  return freshDb;
}

function getMemoryDb(): DbSchema {
  if (!memoryDb) {
    memoryDb = initializeMemoryDb();
  }
  return memoryDb;
}

function saveMemoryDb(): void {
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
  async getStates(): Promise<StateData[]> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from states order by code`;
      return rows.map((row) => row.data as StateData);
    }
    return getMemoryDb().states;
  },

  async getState(code: string): Promise<StateData | undefined> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from states where code = ${code.toUpperCase()} limit 1`;
      return rows[0]?.data as StateData | undefined;
    }
    return getMemoryDb().states.find((s) => s.code.toUpperCase() === code.toUpperCase());
  },

  async updateState(code: string, updates: Partial<StateData>): Promise<StateData | null> {
    const existing = await this.getState(code);
    if (!existing) return null;
    const updated = { ...existing, ...updates, code: existing.code };

    const client = getSql();
    if (client) {
      await ensurePostgres();
      await client`
        insert into states (code, data)
        values (${updated.code}, ${client.json(asJson(updated))})
        on conflict (code) do update set data = excluded.data
      `;
    } else {
      const database = getMemoryDb();
      const index = database.states.findIndex((s) => s.code.toUpperCase() === code.toUpperCase());
      database.states[index] = updated;
      saveMemoryDb();
    }

    await this.addAuditLog("admin", "UPDATE_STATE_SCHEDULE", `state:${code}`, JSON.stringify(updates));
    return updated;
  },

  async getDraft(id: string): Promise<EnumerationDraft | undefined> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from drafts where id = ${id} limit 1`;
      return rows[0]?.data as EnumerationDraft | undefined;
    }
    return getMemoryDb().drafts.find((d) => d.id === id);
  },

  async getUserDrafts(userId: string): Promise<EnumerationDraft[]> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from drafts where user_id = ${userId} order by updated_at desc`;
      return rows.map((row) => row.data as EnumerationDraft);
    }
    return getMemoryDb().drafts.filter((d) => d.userId === userId);
  },

  async saveDraft(draft: EnumerationDraft): Promise<EnumerationDraft> {
    const updatedDraft = { ...draft, updatedAt: new Date().toISOString() };
    const client = getSql();
    if (client) {
      await ensurePostgres();
      await client`
        insert into drafts (id, user_id, data, updated_at)
        values (${updatedDraft.id}, ${updatedDraft.userId}, ${client.json(asJson(updatedDraft))}, ${updatedDraft.updatedAt})
        on conflict (id) do update set user_id = excluded.user_id, data = excluded.data, updated_at = excluded.updated_at
      `;
      return updatedDraft;
    }

    const database = getMemoryDb();
    const index = database.drafts.findIndex((d) => d.id === updatedDraft.id);
    if (index >= 0) {
      database.drafts[index] = updatedDraft;
    } else {
      database.drafts.push(updatedDraft);
    }
    saveMemoryDb();
    return updatedDraft;
  },

  async deleteDraft(id: string, userId: string): Promise<boolean> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`delete from drafts where id = ${id} and user_id = ${userId} returning id`;
      const deleted = rows.length > 0;
      if (deleted) await this.addAuditLog(userId, "DELETE_DRAFT", `draft:${id}`);
      return deleted;
    }

    const database = getMemoryDb();
    const initialLen = database.drafts.length;
    database.drafts = database.drafts.filter((d) => !(d.id === id && d.userId === userId));
    const deleted = database.drafts.length < initialLen;
    if (deleted) {
      saveMemoryDb();
      await this.addAuditLog(userId, "DELETE_DRAFT", `draft:${id}`);
    }
    return deleted;
  },

  async eraseUserData(userId: string): Promise<{ draftsErased: number; consentsErased: number }> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const draftRows = await client`delete from drafts where user_id = ${userId} returning id`;
      const consentRows = await client`delete from consents where user_id = ${userId} returning id`;
      await this.addAuditLog(userId, "DPDP_RIGHT_TO_ERASURE_EXECUTED", `user:${userId}`);
      return { draftsErased: draftRows.length, consentsErased: consentRows.length };
    }

    const database = getMemoryDb();
    const initialDrafts = database.drafts.length;
    const initialConsents = database.consents.length;
    database.drafts = database.drafts.filter((d) => d.userId !== userId);
    database.consents = database.consents.filter((c) => c.userId !== userId);
    const draftsErased = initialDrafts - database.drafts.length;
    const consentsErased = initialConsents - database.consents.length;
    saveMemoryDb();
    await this.addAuditLog(userId, "DPDP_RIGHT_TO_ERASURE_EXECUTED", `user:${userId}`);
    return { draftsErased, consentsErased };
  },

  async getFaqs(): Promise<FAQItem[]> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from faqs order by id`;
      return rows.map((row) => row.data as FAQItem);
    }
    return getMemoryDb().faqs;
  },

  async addFaq(faq: Omit<FAQItem, "id"> | FAQItem): Promise<FAQItem> {
    const newFaq: FAQItem = {
      ...faq,
      id: "id" in faq && faq.id ? faq.id : `faq-${Date.now()}`,
    };

    const client = getSql();
    if (client) {
      await ensurePostgres();
      await client`
        insert into faqs (id, data)
        values (${newFaq.id}, ${client.json(asJson(newFaq))})
        on conflict (id) do update set data = excluded.data
      `;
    } else {
      getMemoryDb().faqs.push(newFaq);
      saveMemoryDb();
    }

    await this.addAuditLog("admin", "ADD_FAQ", newFaq.id);
    return newFaq;
  },

  async addConsent(consent: Omit<ConsentLog, "id" | "consentedAt">): Promise<ConsentLog> {
    const newConsent: ConsentLog = {
      ...consent,
      id: `consent-${Date.now()}`,
      consentedAt: new Date().toISOString(),
    };

    const client = getSql();
    if (client) {
      await ensurePostgres();
      await client`
        insert into consents (id, user_id, data)
        values (${newConsent.id}, ${newConsent.userId}, ${client.json(asJson(newConsent))})
      `;
      return newConsent;
    }

    getMemoryDb().consents.push(newConsent);
    saveMemoryDb();
    return newConsent;
  },

  async getUserConsents(userId: string): Promise<ConsentLog[]> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from consents where user_id = ${userId}`;
      return rows.map((row) => row.data as ConsentLog);
    }
    return getMemoryDb().consents.filter((c) => c.userId === userId);
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select data from audit_logs order by created_at desc limit 500`;
      return rows.map((row) => row.data as AuditLogItem);
    }
    return getMemoryDb().auditLogs;
  },

  async addAuditLog(actorId: string, action: string, resource: string, details?: string): Promise<void> {
    const item: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId,
      action,
      resource,
      timestamp: new Date().toISOString(),
      details,
    };

    const client = getSql();
    if (client) {
      await ensurePostgres();
      await client`
        insert into audit_logs (id, actor_id, data, created_at)
        values (${item.id}, ${actorId}, ${client.json(asJson(item))}, ${item.timestamp})
      `;
      return;
    }

    const database = getMemoryDb();
    database.auditLogs.unshift(item);
    if (database.auditLogs.length > 500) {
      database.auditLogs = database.auditLogs.slice(0, 500);
    }
    saveMemoryDb();
  },

  async addFeedback(userId: string, query: string, answer: string, rating: number): Promise<void> {
    const item = {
      id: `fb-${Date.now()}`,
      userId,
      query,
      answer,
      rating,
      timestamp: new Date().toISOString(),
    };

    const client = getSql();
    if (client) {
      await ensurePostgres();
      await client`
        insert into feedback (id, user_id, data, created_at)
        values (${item.id}, ${userId}, ${client.json(asJson(item))}, ${item.timestamp})
      `;
      return;
    }

    getMemoryDb().feedback.push(item);
    saveMemoryDb();
  },

  async getFeedbackStats(): Promise<{ total: number; averageRating: number }> {
    const client = getSql();
    if (client) {
      await ensurePostgres();
      const rows = await client`select count(*)::int as total, coalesce(avg((data->>'rating')::numeric), 5)::float as average_rating from feedback`;
      return { total: rows[0].total, averageRating: Number(rows[0].average_rating.toFixed(2)) };
    }

    const fb = getMemoryDb().feedback;
    if (fb.length === 0) return { total: 0, averageRating: 5.0 };
    const avg = fb.reduce((acc, curr) => acc + curr.rating, 0) / fb.length;
    return { total: fb.length, averageRating: parseFloat(avg.toFixed(2)) };
  },
};
