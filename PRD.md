# Product Requirements Document
## Census 2027 & Digital Enumeration — "Jan Ganana AI" (GenAI Citizen Assistant for India's First Digital Census)

**Version:** 1.0
**Vertical:** GovTech / Civic-Tech — Public Data Collection & Citizen Assistance
**Status:** Hackathon Submission-Ready PRD

---

## 0. Grounding Facts (verified, used throughout this PRD)

Census 2027 is real and already underway at the time of writing. The app is a **citizen-facing companion**, not a replacement for the official ORGI (Office of the Registrar General & Census Commissioner of India) systems. Key facts baked into the product logic:

| Fact | Detail |
|---|---|
| Legal basis | Conducted under the Census Act, 1948, by ORGI, Ministry of Home Affairs |
| Nature | India's **16th Census**, 8th since Independence, **first fully digital** census (no paper forms) |
| Budget | ₹11,718.24 crore approved outlay |
| Phase I | **House Listing & Housing Census (HLO)** — housing conditions, amenities, assets. Conducted state-wise in a 30-day window between **1 April – 30 September 2026** |
| Self-Enumeration | A **15-day online window immediately before** each state's HLO period, where citizens submit household data themselves via a secure portal, in **16 languages**, and receive a **Self-Enumeration ID** for enumerator verification |
| Phase II | **Population Enumeration (PE)**, including India's **first caste census since 1931** — mainly **February 2027**; snow-bound regions (Ladakh, J&K, Uttarakhand, Himachal Pradesh) complete it in **Sep–Oct 2026** |
| Reference date | **1 March 2027** (1 October 2026 for snow-bound areas) |
| Data collection mode | Mobile apps for enumerators/supervisors (their own devices), web portal for self-enumeration, GPS/geo-tagging of structures, cloud-based real-time monitoring |
| State rollout | Staggered — e.g., Goa/Karnataka/Odisha/Sikkim/A&N/Delhi(NDMC)/Lakshadweep/Mizoram start earliest (self-enumeration 1–15 Apr 2026, HLO 16 Apr–15 May 2026); other states follow on a published schedule through September 2026 |

**Assumption stated explicitly (also to go in README):** the *exact* day-wise state schedule changes as ORGI issues updates. The product therefore treats state-wise dates as **configurable data**, not hard-coded values — fetched from an admin-editable schedule store, with the current known official rollout seeded as default content. This is a deliberate architecture decision, not an oversight.

---

## 1. Problem Statement

Census 2027 is a massive behavior-change exercise: ~1.4 billion citizens must understand *what* is being collected, *when* it applies to them, *how* to self-enumerate correctly, and *why* their data is safe — while misinformation (fake apps, phishing "census" calls/SMS, fee-collection scams) is already circulating. Digital literacy and language diversity make this harder outside metro India.

## 2. Product Vision

A lightweight, installable, low-bandwidth web app that acts as **every citizen's personal Census guide**: explains the process in their language, tells them exactly when self-enumeration opens for their state, walks them through the form field-by-field with a GenAI assistant, flags misinformation, and turns published census data into visuals anyone can understand — without ever collecting or storing real citizen PII itself (it is an **awareness + guidance + visualization layer**, not the official enumeration system of record).

## 3. Goals & Non-Goals

**Goals**
- G1: Explain Phase I (HLO) vs Phase II (PE) clearly, with what each phase collects.
- G2: Show accurate, state-wise self-enumeration + HLO/PE date windows.
- G3: Guide a user end-to-end through the self-enumeration flow with an AI assistant that adapts to their answers.
- G4: Educate on data privacy protections and actively counter misinformation.
- G5: Visualize census concepts/historical & mock live data meaningfully.
- G6: Support at least the **16 languages** the official portal supports (Hindi, English + 14 scheduled languages, expandable).

**Non-Goals**
- NG1: This app does **not** submit data to ORGI's actual Census systems (no real government API access exists publicly) — it is a **simulated/sandboxed self-enumeration experience** that produces a shareable summary/ID the user can cross-check against the real portal.
- NG2: No collection of Aadhaar numbers, biometric data, or real caste/religion data is persisted — see §9 Privacy.

---

## 4. Users & Personas

| Persona | Need | Key feature used |
|---|---|---|
| Rural citizen, low digital literacy, regional-language only | Understand what's happening & when | Language switcher, voice narration, simplified explainer |
| Urban citizen, wants to self-enumerate quickly | Fast, correct, guided form fill | AI-guided self-enumeration wizard |
| Skeptical citizen (misinformation-exposed) | Verify legitimacy, protect data | Myth-buster / verify-a-message tool |
| Policy student / journalist / analyst | Understand historical/demographic trends | Data visualization dashboard |
| NGO / civic volunteer | Help others enumerate | Multi-profile / assisted mode |

---

## 5. Feature Set (mapped to challenge requirements)

### F1 — Two-Phase Explainer
Interactive timeline component: Phase I (HLO) card (houses, amenities, assets, geo-tagging) vs Phase II (PE) card (individuals, demographics, caste enumeration in 2027). Includes reference-date callouts and snow-bound-region exceptions.

### F2 — State-wise Schedule Viewer
Searchable/filterable table + map: pick a state → see Self-Enumeration window, HLO window, PE window. Backed by an editable "Schedule" data store (§10) so hackathon judges can see it isn't hard-coded HTML.

### F3 — Guided Self-Enumeration Wizard
Multi-step form (household → members → housing conditions → amenities) with:
- An **LLM-powered assistant panel** that explains each question in plain language and the user's chosen Indian language, answers "why do you ask this?", and validates answers for consistency (e.g., flags "age 5, marital status: married" as likely a typo) — but never overrides the user's actual answer.
- Save-as-draft, resume later, and a final **mock Self-Enumeration Reference ID** (clearly labeled as a *practice/demo ID*, since this app is not the government's own system).

### F4 — Privacy & Misinformation Hub
- Plain-language explainer of legal safeguards (Census Act 1948 confidentiality clause — individual data is never shared, only aggregates; DPDP Act 2023 principles).
- "Verify a Census Message" tool: user pastes a suspicious SMS/link/call description → GenAI classifies likely-scam patterns (asks for money, asks for OTP/Aadhaar number, external non-gov domain, urgency language) and returns a plain verdict + reasoning + official channels to verify with.
- Static myth-vs-fact list, always shown even if AI is unavailable (defense in depth).

### F5 — Data Visualization Dashboard
Charts (population growth, sex ratio, literacy, urban/rural split, historic census-to-census comparisons using **public, already-released Census 2011 data** as the real backing dataset, since 2027 live data doesn't exist yet — clearly labeled "illustrative / most-recent-available official data"). Includes a "your submitted mock data vs state averages" personalization view (using only session-local wizard data, never stored server-side against an identity).

### F6 — Multi-Language Support
i18n framework covering UI strings + AI-assistant responses + on-demand translation of any explainer text into 16 languages.

### F7 — AI Assistant (cross-cutting)
A single GenAI-backed assistant, context-aware of: current wizard step, selected state/dates, selected language, and conversation history — reused across F1–F5 rather than being a bolt-on chatbot.

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (React/Next.js PWA, installable, offline-shell via SW)  │
│  - i18next (16 locales)  - Chart.js/Recharts  - Leaflet map     │
│  - Wizard state machine (XState)  - Voice input (Web Speech API)│
└───────────────┬───────────────────────────────────────────────┘
                │ HTTPS (TLS1.3) + JWT
┌───────────────▼───────────────────────────────────────────────┐
│  API Gateway (Node.js/Express or FastAPI) — rate limited,       │
│  input-validated, OWASP-hardened                                 │
├──────────────┬───────────────┬───────────────┬─────────────────┤
│ Auth Service │ Schedule Svc  │ Enumeration Svc│ Analytics Svc   │
│ (OTP/JWT)    │ (state dates) │ (draft/submit) │ (viz endpoints) │
├──────────────┴───────────────┴───────────────┴─────────────────┤
│               GenAI Orchestration Layer (server-side)           │
│  - Prompt templates + guardrails  - RAG over Census FAQ corpus  │
│  - Language router  - Misinformation classifier                 │
├───────────────────────────────────────────────────────────────┤
│   HuggingFace Inference API (hosted, via HF access token)       │
│  - Chat/Instruct LLM   - Translation (IndicTrans2)               │
│  - Zero-shot classifier (scam/misinfo)  - Embeddings (RAG)       │
├───────────────────────────────────────────────────────────────┤
│  Data Layer: PostgreSQL (schedule, drafts, consent logs)         │
│  Redis (rate limits, OTP, cache) | Object storage (static viz)  │
└───────────────────────────────────────────────────────────────┘
```

**Why this shape wins on the evaluation rubric:**
- *Security*: all inference calls are server-side — the HF token never touches the browser.
- *Efficiency*: Redis caching + response caching for translation/FAQ answers (identical queries hit cache, not the model) minimizes token spend and API latency.
- *Testing*: each service is independently unit-testable; orchestration layer is mockable.
- *Accessibility*: PWA + voice input + offline shell for low-connectivity/low-literacy users.

---

## 7. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind | SSR for SEO/perf, strong typing, fast styling |
| State | Zustand + XState (wizard) | predictable, testable wizard flow |
| i18n | `i18next` + `react-i18next` | mature, supports lazy-loaded locale bundles |
| Backend | Node.js + Express (or FastAPI if team prefers Python for ML glue) | simple REST, good HF SDK support either way |
| DB | PostgreSQL | relational integrity for schedule/consent data |
| Cache/Queue | Redis | OTP store, rate limiting, LLM response cache |
| Auth | Phone-OTP (via any SMS gateway sandbox) + JWT | no Aadhaar handling in this demo app |
| AI Inference | **Hugging Face Inference API** (`huggingface_hub` / `@huggingface/inference` SDK) using **user-supplied HF access token** stored server-side as an env secret | matches stated constraint |
| Charts | Recharts / Chart.js | quick, accessible SVG charts |
| Maps | Leaflet + OpenStreetMap tiles | free, no vendor lock-in |
| Testing | Jest + React Testing Library (unit), Supertest (API), Playwright (E2E), axe-core (a11y) | full pyramid |
| CI | GitHub Actions | lint → test → build → (optional) deploy |
| Hosting | Vercel (frontend) + Render/Railway (API) or single Docker Compose for judges to run locally | easy local reproduction for evaluators |

---

## 8. HuggingFace Inference Integration (uses your HF access token)

All calls are made **server-side only**, token read from `process.env.HF_TOKEN`, never exposed to the client bundle.

### 8.1 Suggested Models

| Task | Model (HF Hub id) | Notes |
|---|---|---|
| Assistant / guided Q&A | `meta-llama/Llama-3.1-8B-Instruct` or `mistralai/Mistral-7B-Instruct-v0.3` | instruction-tuned, good multilingual grounding when prompted in-language |
| Indic translation (16 languages) | `ai4bharat/indictrans2-en-indic-1B` | purpose-built for English↔Indic; far better quality than generic MT for Indian scheduled languages |
| Misinformation / scam classification | `facebook/bart-large-mnli` (zero-shot) | no fine-tuning needed for hackathon timeline; labels: `["phishing/scam", "genuine government info", "unclear"]` |
| RAG embeddings (Census FAQ corpus) | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | multilingual, small, fast for retrieval over FAQ/myth-fact corpus |
| (Optional) Speech-to-text for voice input | `openai/whisper-small` via HF Inference | supports low-literacy users; can be swapped for browser Web Speech API to save inference cost |

### 8.2 Sample server-side call pattern (Node.js)

```javascript
// server/services/hfClient.js
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

export async function askCensusAssistant({ messages, language }) {
  const systemPrompt = `You are a neutral, factual assistant for India's Census 2027.
Only answer using the provided Census FAQ context. Respond in ${language}.
Never ask for or store Aadhaar numbers, OTPs, or bank details.`;

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 512,
    temperature: 0.3, // low temp: factual/government context, not creative
  });

  return response.choices[0].message.content;
}

export async function translateText({ text, targetLangCode }) {
  const cacheKey = `t:${targetLangCode}:${hash(text)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const result = await hf.translation({
    model: "ai4bharat/indictrans2-en-indic-1B",
    inputs: text,
    parameters: { src_lang: "eng_Latn", tgt_lang: targetLangCode },
  });

  await redis.set(cacheKey, result.translation_text, "EX", 60 * 60 * 24);
  return result.translation_text;
}

export async function classifyMisinformation({ text }) {
  const result = await hf.zeroShotClassification({
    model: "facebook/bart-large-mnli",
    inputs: text,
    parameters: {
      candidate_labels: ["phishing or scam attempt", "genuine census information", "unclear or needs verification"],
    },
  });
  return result; // { labels, scores }
}
```

### 8.3 Cost/Efficiency Controls (Efficiency scoring)
- **Response caching** in Redis for translation and FAQ-style assistant answers (identical/near-identical queries keyed by hash of normalized input).
- **RAG-first, LLM-second**: retrieve top-k FAQ chunks via embeddings before calling the chat model — keeps prompts short and answers grounded (reduces hallucination + token cost).
- **Streaming responses** (`hf.chatCompletion({ stream: true })`) for perceived latency improvement in the UI.
- **Token budget guard**: server enforces `max_tokens` and truncates conversation history to last N turns.
- **Graceful degradation**: if `HF_TOKEN` is missing/rate-limited, the app falls back to static FAQ content and the static myth/fact list — the app must never hard-fail because inference is unavailable.

---

## 9. API Specification

All endpoints under `/api/v1`. JSON in/out. Auth via `Authorization: Bearer <JWT>` except where marked public.

### 9.1 Auth Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/otp/request` | public, rate-limited | `{ phone }` → sends OTP (sandboxed SMS) |
| POST | `/auth/otp/verify` | public | `{ phone, otp }` → returns JWT + refresh token |
| POST | `/auth/refresh` | refresh token | rotates access token |
| POST | `/auth/logout` | JWT | invalidates refresh token |

### 9.2 Schedule Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/schedule/states` | public | list of states/UTs with current phase status |
| GET | `/schedule/states/:stateCode` | public | self-enumeration/HLO/PE window for a state |
| PUT | `/schedule/states/:stateCode` | admin JWT | update dates as ORGI issues revisions |
| GET | `/schedule/today-status?stateCode=` | public | "what's active today for this state" — drives homepage banner |

### 9.3 Self-Enumeration Wizard Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/enumeration/drafts` | JWT | create a new household draft |
| GET | `/enumeration/drafts/:id` | JWT, owner-only | fetch draft to resume |
| PATCH | `/enumeration/drafts/:id` | JWT, owner-only | save step progress (partial update) |
| POST | `/enumeration/drafts/:id/submit` | JWT, owner-only | finalize → returns mock Reference ID |
| DELETE | `/enumeration/drafts/:id` | JWT, owner-only | user-initiated erasure (DPDP right to erasure) |
| GET | `/enumeration/questions?phase=1|2&lang=` | public | phase-specific question schema, localized |

### 9.4 AI Assistant Service (wraps HF inference)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/assistant/ask` | JWT | `{ message, context: {step, stateCode}, language }` → grounded answer |
| POST | `/assistant/explain-question` | JWT | `{ questionId, language }` → plain-language explanation |
| POST | `/assistant/verify-message` | public, rate-limited | `{ text }` → misinformation classification + guidance |
| POST | `/assistant/feedback` | JWT | thumbs up/down on an AI answer (quality telemetry) |

### 9.5 Translation Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/i18n/translate` | internal/public | `{ text, targetLangCode }` → cached translation |
| GET | `/i18n/languages` | public | supported 16-language list with codes + native names |

### 9.6 Analytics / Visualization Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics/national-summary` | public | headline stats (from public Census 2011 dataset, labeled as most-recent official) |
| GET | `/analytics/state/:stateCode` | public | state-level breakdown for charts |
| GET | `/analytics/trends?metric=population\|literacy\|sexratio` | public | time series across past census years |
| GET | `/analytics/self-enumeration-progress` | public | mock/aggregated adoption progress (never individual-level) |

### 9.7 Consent & Privacy Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/privacy/my-data` | JWT | list of what's stored for this user (data-transparency, DPDP) |
| POST | `/privacy/consent` | JWT | records explicit consent event with timestamp + version of policy shown |
| DELETE | `/privacy/erase-me` | JWT | full account + draft erasure |
| GET | `/privacy/policy-version` | public | current privacy policy version/hash |

### 9.8 Admin Service
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/audit-logs` | admin JWT | access/audit trail for compliance |
| POST | `/admin/faq` | admin JWT | manage RAG knowledge base entries |
| GET | `/admin/metrics` | admin JWT | usage, latency, error-rate dashboard data |

### 9.9 Feedback / Grievance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/feedback` | JWT or public | general feedback / bug reports |
| POST | `/grievance` | JWT | route to official grievance channel info (no data forwarded automatically) |

---

## 10. Data Model (core tables)

```
users(id, phone_hash, preferred_language, created_at)
states(code, name, self_enum_start, self_enum_end, hlo_start, hlo_end, pe_start, pe_end, is_snow_bound)
enumeration_drafts(id, user_id, state_code, status[draft|submitted], payload_json, reference_id, created_at, updated_at)
consent_events(id, user_id, policy_version, consented_at, ip_hash)
faq_documents(id, question, answer, embedding_vector, language, source_url)
audit_logs(id, actor_id, action, resource, timestamp, ip_hash)
ai_feedback(id, user_id, query_hash, rating, created_at)
```
`payload_json` deliberately stores **no** Aadhaar number, no biometric data, and caste/religion fields are optional + clearly marked "for demo purposes, not transmitted anywhere official."

---

## 11. Security & Privacy (High Impact)

- **Data minimization**: only phone number is ever linked to an identity; it's stored as a salted hash, never plaintext, alongside JWT-based sessions.
- **No real government data submission**: explicit UI disclaimers on every wizard screen — this is a **learning/demo self-enumeration**, with a link out to the real portal for the official submission.
- **Encryption**: TLS 1.3 in transit; AES-256 at rest for `enumeration_drafts.payload_json`.
- **AuthZ**: every draft/consent/privacy endpoint checks `owner-only` (JWT `sub` must match resource `user_id`).
- **Rate limiting**: Redis-backed sliding window on OTP, `/assistant/*`, and `/i18n/translate` to prevent abuse and control HF inference cost.
- **Input validation & sanitization**: schema validation (Zod/Joi) on every request body; output encoding to prevent stored/reflected XSS in AI-generated text before rendering.
- **Prompt-injection defense**: assistant system prompt explicitly instructs the model to ignore instructions embedded in user text that try to change its role, and server strips/escapes any HTML from LLM output before render.
- **Secrets management**: `HF_TOKEN`, DB credentials, JWT secret all via environment variables / secret manager — never committed, `.env.example` provided instead.
- **DPDP Act 2023 alignment**: explicit consent capture before data collection, purpose limitation (data used only for this demo), right to erasure implemented (`DELETE /privacy/erase-me`), data-transparency endpoint (`GET /privacy/my-data`).
- **Dependency hygiene**: `npm audit` / `pip-audit` in CI; Dependabot enabled.

---

## 12. Accessibility (High Impact)

- WCAG 2.1 **AA** target: semantic HTML, ARIA labels on wizard steps, focus management between steps, color-contrast-checked design tokens.
- Full keyboard navigability; screen-reader tested with NVDA/VoiceOver.
- **Voice input & output** (Web Speech API primary, Whisper-small via HF as enhancement) for low-literacy users.
- **Low-bandwidth mode**: text-only toggle, image lazy-loading, PWA offline shell caches the explainer/FAQ content for no-network areas.
- Font scaling and a dyslexia-friendly font toggle.
- All 16 languages available for both **UI chrome and AI assistant responses**, not just UI strings.
- `axe-core` automated accessibility checks wired into CI (fails build on new violations).

---

## 13. Testing Strategy (High Impact)

| Level | Tooling | Coverage target |
|---|---|---|
| Unit | Jest (services, reducers, HF client with mocked responses) | ≥80% on business logic |
| Component | React Testing Library | wizard steps, language switcher, chart components |
| API/Integration | Supertest + test DB (Dockerized Postgres) | every endpoint in §9, happy + error paths |
| E2E | Playwright | full self-enumeration flow in 2 languages, misinformation-check flow |
| Accessibility | axe-core + manual screen-reader pass | zero critical violations |
| Load | k6 (basic script) | `/assistant/ask` and `/schedule/*` under concurrent load, verifying cache hit rate |
| AI-quality regression | Golden-set of Q/A pairs replayed against the assistant, scored for factual grounding (no hallucinated dates) | catch regressions when swapping models/prompts |

CI pipeline (GitHub Actions): `lint → typecheck → unit+integration tests → build → axe scan → (optional) Playwright smoke suite`.

---

## 14. Non-Functional Requirements

- **Performance**: LCP < 2.5s on 3G-simulated profile; API p95 < 400ms excluding LLM calls; LLM calls streamed so first token appears < 1.5s.
- **Scalability**: stateless API instances behind a load balancer; Redis/Postgres externalized so horizontal scaling is trivial.
- **Reliability**: graceful degradation when HF inference is down/rate-limited (static content fallback, §8.3).
- **Observability**: structured logging (pino/winston), request tracing IDs, `/admin/metrics` dashboard.
- **Internationalization completeness**: no hard-coded English strings in components; all copy through i18n keys.

---

## 15. Suggested Repository Structure

```
census2027-app/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express/FastAPI backend
├── packages/
│   ├── ui/                  # shared design-system components
│   └── i18n/                # locale JSON bundles (16 languages)
├── services/
│   └── ai-orchestrator/     # HF inference wrappers, RAG, caching
├── infra/
│   ├── docker-compose.yml   # one-command local run for judges
│   └── github-actions/
├── tests/
│   ├── unit/  integration/  e2e/
├── docs/
│   ├── PRD.md                # this document
│   ├── API_REFERENCE.md
│   └── ARCHITECTURE.md
├── .env.example
└── README.md
```

---

## 16. README Outline (deliverable #5 in the challenge brief)

1. **Chosen vertical**: GovTech / Civic-Tech — Census 2027 citizen guidance & self-enumeration assistant.
2. **Approach and logic**: awareness-first, AI-guided, privacy-by-design; treat official schedule as configurable data, not hardcoded; simulate self-enumeration rather than integrate with non-public government systems.
3. **How the solution works**: architecture diagram walkthrough (§6), the wizard flow, the AI assistant grounding via RAG, the language pipeline via IndicTrans2.
4. **Assumptions made**:
   - State-wise dates reflect the most recently published official schedule at build time and are stored as editable seed data, since ORGI updates them over time.
   - This app does not have access to, and does not claim to integrate with, ORGI's actual production Census systems; all "submission" flows are clearly labeled demo/practice.
   - Users are assumed to have at minimum a low-end smartphone with a browser; no native app is required.
   - HuggingFace hosted Inference API is assumed reachable; a local/self-hosted model swap is documented as a fallback for offline judging environments.
5. **Setup instructions**: `docker-compose up`, set `HF_TOKEN` in `.env`, seed script for schedule data, `npm run dev`.
6. **Demo script**: recommended 3-minute walkthrough order for judges (Home → Two-Phase Explainer → State Schedule → Self-Enumeration Wizard with AI assistant panel open → Verify-a-Message tool → Data Visualization dashboard → Language switch demo).

---

## 17. Evaluation-Criteria Alignment (self-check before submission)

| Criterion | How this PRD/architecture addresses it |
|---|---|
| Code Quality | TypeScript everywhere, modular services, shared UI package, lint+typecheck in CI |
| Security | Server-side-only inference calls, token secrecy, input validation, prompt-injection defense, DPDP-aligned consent/erasure |
| Efficiency | Redis caching for translation/FAQ, RAG-before-LLM, streaming, token budget guard |
| Testing | Full pyramid: unit → integration → E2E → accessibility → load → AI-quality regression |
| Accessibility | WCAG AA target, voice I/O, low-bandwidth PWA mode, 16-language AI + UI |

---

## 18. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| HF hosted model rate-limited/unavailable during judging | Static fallback content; document local model swap (e.g., `transformers` pipeline) |
| Official schedule changes after submission | Schedule stored as editable data + admin endpoint, not hardcoded |
| LLM hallucinating a wrong date/rule | RAG grounding restricted to a maintained FAQ corpus; system prompt forbids inventing dates; UI always shows a "verify on the official portal" link |
| Users mistaking demo submission for official one | Persistent, unmissable "This is a practice tool" banner + link to real portal on every wizard screen |
| Language coverage gaps for low-resource dialects | IndicTrans2 chosen specifically for its Indic-language strength over generic MT; fallback to English + Hindi guaranteed |

---

*End of PRD.*