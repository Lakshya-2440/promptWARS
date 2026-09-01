import { z } from "zod";

// List of all 36 valid Indian State and UT codes
export const VALID_STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DN", "DL", "GA",
  "GJ", "HR", "HP", "JK", "JH", "KA", "KL", "LA", "LD", "MP",
  "MH", "MN", "ML", "MZ", "NL", "OD", "PB", "PY", "RJ", "SK",
  "TN", "TG", "TR", "UP", "UK", "WB"
] as const;

/**
 * Strips dangerous HTML tags and script injections
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .replace(/onclick\s*=/gi, "")
    .trim();
}

/**
 * Recursively sanitizes objects and guards against prototype pollution
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizeString(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    // Prevent prototype pollution attacks
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean as T;
}

// 1. Auth Schemas
export const OtpRequestSchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    }),
});

export const OtpVerifySchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Must be a valid 10-digit Indian mobile number.",
    }),
  otp: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => /^\d{6}$/.test(val), {
      message: "OTP must be a 6-digit numeric code.",
    }),
});

// 2. Assistant Schemas
export const AskAssistantSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(1500, "Message cannot exceed 1500 characters.")
    .transform(sanitizeString),
  language: z.string().max(50).default("English").transform(sanitizeString),
  context: z
    .object({
      step: z.number().int().min(1).max(5).optional(),
      questionId: z.string().max(50).optional(),
      stateCode: z.string().max(5).optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000).transform(sanitizeString),
      })
    )
    .max(10)
    .optional(),
});

export const ExplainQuestionSchema = z.object({
  questionId: z.string().min(1).max(50).transform(sanitizeString),
  language: z.string().max(50).default("English").transform(sanitizeString),
});

export const VerifyMessageSchema = z.object({
  text: z
    .string()
    .min(1, "Message text cannot be empty.")
    .max(3000, "Message text cannot exceed 3000 characters.")
    .transform(sanitizeString),
});

export const AssistantFeedbackSchema = z.object({
  query: z.string().max(1000).optional().transform((v) => sanitizeString(v || "")),
  answer: z.string().max(3000).optional().transform((v) => sanitizeString(v || "")),
  rating: z.number().min(0).max(5).default(5),
});

// 3. Enumeration Schemas
export const CreateDraftSchema = z.object({
  stateCode: z
    .string()
    .transform((v) => v.toUpperCase().trim())
    .refine((v) => (VALID_STATE_CODES as readonly string[]).includes(v), {
      message: "Invalid Indian State or UT code.",
    }),
  phase: z.union([z.literal(1), z.literal(2)]).default(1),
});

export const PatchDraftSchema = z.object({
  step: z.number().int().min(1).max(5),
  payload: z.record(z.any()).transform(sanitizeObject),
});

// 4. Privacy Schemas
export const PrivacyConsentSchema = z.object({
  purposes: z
    .array(z.string().max(100).transform(sanitizeString))
    .min(1, "At least one purpose must be specified.")
    .max(10),
});

// 5. Admin Schemas
export const AdminUpdateStateSchema = z.object({
  name: z.string().min(2).max(100).optional().transform((v) => (v ? sanitizeString(v) : undefined)),
  regionalName: z.string().max(100).optional().transform((v) => (v ? sanitizeString(v) : undefined)),
  self_enum_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
  self_enum_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
  hlo_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
  hlo_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
  pe_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
  pe_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional(),
  is_snow_bound: z.boolean().optional(),
});

export const AdminAddFaqSchema = z.object({
  category: z.enum([
    "General",
    "Phase1_HLO",
    "Phase2_PE",
    "Self_Enumeration",
    "Privacy_Legal",
    "Caste_Census",
    "Security_Scams",
  ]),
  question: z.string().min(5).max(300).transform(sanitizeString),
  answer: z.string().min(5).max(3000).transform(sanitizeString),
  legalReference: z.string().max(200).optional().transform((v) => (v ? sanitizeString(v) : "")),
  keywords: z.union([
    z.string().transform((v) => v.split(",").map((k) => sanitizeString(k.trim())).filter(Boolean)),
    z.array(z.string().transform(sanitizeString)),
  ]),
});

// 6. Citizen Feedback Schema
export const CitizenFeedbackSchema = z.object({
  message: z.string().min(3).max(2000).transform(sanitizeString),
  category: z.string().max(50).default("general").transform(sanitizeString),
  rating: z.number().min(1).max(5).default(5),
});

// 7. Household Comparison Schema
export const CompareHouseholdSchema = z.object({
  stateCode: z
    .string()
    .transform((v) => v.toUpperCase().trim())
    .refine((v) => (VALID_STATE_CODES as readonly string[]).includes(v), {
      message: "Invalid Indian State or UT code.",
    }),
  householdData: z.record(z.any()).transform(sanitizeObject),
});
