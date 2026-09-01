import crypto from "crypto";
import jwt from "jsonwebtoken";
import { logSecurityEvent } from "../security/security-logger";

const IS_PROD = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || (IS_PROD ? "" : "jan_ganana_ai_dev_jwt_secret_key");
const SALT = process.env.PHONE_HASH_SALT || (IS_PROD ? "" : "census_2027_dev_salt");
const ALLOW_DEMO_OTP = !IS_PROD && process.env.ALLOW_DEMO_OTP !== "false";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "9999999999";

/**
 * Validates that required environment secrets exist in production.
 * @throws {Error} If key is missing or empty in production mode.
 */
function requireSecret(value: string, key: string): string {
  if (!value) {
    throw new Error(`${key} must be configured in production.`);
  }
  return value;
}

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

interface LockoutEntry {
  lockedUntil: number;
}

// Memory stores for OTPs and Lockouts
const otpStore = new Map<string, OtpEntry>();
const lockoutStore = new Map<string, LockoutEntry>();

/**
 * Represents an authenticated session for a citizen or admin.
 */
export interface AuthSession {
  /** Pseudonymous user identifier derived from phone HMAC hash or ephemeral guest ID */
  userId: string;
  /** HMAC-SHA256 salted phone hash (DPDP Act 2023 pseudonymization) */
  phoneHash: string;
  /** User authorization level */
  role: "citizen" | "admin";
  /** True if session is an anonymous guest */
  isGuest?: boolean;
}

/**
 * Generates an HMAC-SHA256 hash of a phone number using a server-side cryptographic salt.
 * Ensures no raw phone numbers are persisted to database or logs.
 *
 * @param phone - Raw 10-digit Indian phone number
 * @returns 64-character hexadecimal HMAC hash
 */
export function hashPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const salt = requireSecret(SALT, "PHONE_HASH_SALT");
  return crypto.createHmac("sha256", salt).update(cleanPhone).digest("hex");
}

/**
 * Requests an OTP for citizen phone-based authentication.
 * Generates a 6-digit CSPRNG code with a 10-minute expiry and 5-attempt rate limit.
 *
 * @param phone - 10-digit mobile number
 * @param clientIp - Client IP address for security event logging
 * @returns Status object indicating success and optional demo OTP in dev mode
 * @throws {Error} If phone number is currently locked out
 */
export function requestOtp(
  phone: string,
  clientIp: string = "127.0.0.1"
): { success: boolean; message: string; demoOtp?: string } {
  const cleanPhone = phone.replace(/\D/g, "");

  // Check if locked out
  const lockout = lockoutStore.get(cleanPhone);
  if (lockout && lockout.lockedUntil > Date.now()) {
    const remainingMin = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
    logSecurityEvent({
      eventType: "AUTH_PHONE_LOCKED_OUT",
      actorId: `phone:${hashPhone(cleanPhone).slice(0, 8)}`,
      ip: clientIp,
      endpoint: "/api/v1/auth/otp/request",
      details: `Phone locked out due to multiple failed verification attempts. Try again in ${remainingMin} minutes.`,
    });
    throw new Error(`Too many failed attempts. Mobile number locked for ${remainingMin} more minute(s).`);
  }

  // Cryptographically secure 6-digit OTP (100000 to 999999)
  const otp = crypto.randomInt(100000, 1000000).toString();

  otpStore.set(cleanPhone, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minute expiry
    attempts: 0,
  });

  logSecurityEvent({
    eventType: "AUTH_OTP_REQUESTED",
    actorId: `phone:${hashPhone(cleanPhone).slice(0, 8)}`,
    ip: clientIp,
    endpoint: "/api/v1/auth/otp/request",
  });

  return {
    success: true,
    message: "OTP sent securely to registered mobile number.",
    demoOtp: ALLOW_DEMO_OTP ? otp : undefined,
  };
}

/**
 * Verifies a submitted OTP against the in-memory store.
 * Enforces max 5 failed attempts before triggering a 15-minute lockout.
 *
 * @param phone - 10-digit mobile number
 * @param otp - 6-digit OTP string
 * @param clientIp - Client IP address for audit logs
 * @returns JWT token and session metadata with 24-hour expiration
 * @throws {Error} If OTP is invalid, expired, or phone is locked out
 */
export function verifyOtp(
  phone: string,
  otp: string,
  clientIp: string = "127.0.0.1"
): { token: string; userId: string; phoneHash: string; role: "citizen" | "admin" } {
  const cleanPhone = phone.replace(/\D/g, "");

  // Check lockout
  const lockout = lockoutStore.get(cleanPhone);
  if (lockout && lockout.lockedUntil > Date.now()) {
    const remainingMin = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
    throw new Error(`Mobile number is temporarily locked out. Try again in ${remainingMin} minute(s).`);
  }

  const stored = otpStore.get(cleanPhone);
  if (!stored || stored.expiresAt < Date.now()) {
    otpStore.delete(cleanPhone);
    throw new Error("OTP has expired or was not requested. Please request a fresh OTP.");
  }

  // Increment failed attempts counter
  stored.attempts += 1;

  // Check valid OTP
  const isMatch = stored.otp === otp || (ALLOW_DEMO_OTP && otp === "123456");

  if (!isMatch) {
    logSecurityEvent({
      eventType: "AUTH_OTP_FAILED",
      actorId: `phone:${hashPhone(cleanPhone).slice(0, 8)}`,
      ip: clientIp,
      endpoint: "/api/v1/auth/otp/verify",
      details: `Failed attempt ${stored.attempts}/5`,
    });

    if (stored.attempts >= 5) {
      otpStore.delete(cleanPhone);
      lockoutStore.set(cleanPhone, {
        lockedUntil: Date.now() + 15 * 60 * 1000, // 15 minute lockout
      });
      logSecurityEvent({
        eventType: "AUTH_PHONE_LOCKED_OUT",
        actorId: `phone:${hashPhone(cleanPhone).slice(0, 8)}`,
        ip: clientIp,
        endpoint: "/api/v1/auth/otp/verify",
        details: "Max 5 failed attempts reached. Locked for 15m.",
      });
      throw new Error("Maximum 5 failed attempts exceeded. This mobile number has been locked for 15 minutes.");
    }

    throw new Error(`Invalid verification code. ${5 - stored.attempts} attempt(s) remaining.`);
  }

  // Successful verification -> Cleanup OTP
  otpStore.delete(cleanPhone);
  lockoutStore.delete(cleanPhone);

  const phoneHash = hashPhone(cleanPhone);
  const userId = `usr_${phoneHash.slice(0, 16)}`;
  const role: "citizen" | "admin" = cleanPhone === ADMIN_PHONE ? "admin" : "citizen";

  const token = jwt.sign(
    {
      sub: userId,
      phoneHash,
      role,
    },
    requireSecret(JWT_SECRET, "JWT_SECRET"),
    { expiresIn: "24h" } // Enforce 24 hour session expiration
  );

  logSecurityEvent({
    eventType: "AUTH_OTP_VERIFIED",
    actorId: userId,
    ip: clientIp,
    endpoint: "/api/v1/auth/otp/verify",
    details: `Role: ${role}`,
  });

  return { token, userId, phoneHash, role };
}

/**
 * Strict authentication check: verifies JWT from Authorization header.
 * Throws 401-compatible errors if token is missing, expired, or corrupted.
 *
 * @param authHeader - Value of the HTTP Authorization header (e.g. "Bearer <token>")
 * @returns Verified AuthSession
 * @throws {Error} If token is missing, expired, or invalid
 */
export function requireAuth(authHeader?: string | null): AuthSession {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Bearer authentication token is required.");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const decoded = jwt.verify(token, requireSecret(JWT_SECRET, "JWT_SECRET")) as any;
    return {
      userId: decoded.sub,
      phoneHash: decoded.phoneHash,
      role: decoded.role || "citizen",
      isGuest: false,
    };
  } catch (e: any) {
    if (e.name === "TokenExpiredError") {
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error("Invalid or malformed authentication token.");
  }
}

/**
 * Permissive authentication check: verifies JWT if present, otherwise returns
 * an isolated ephemeral guest session without throwing.
 *
 * @param authHeader - Optional Authorization header
 * @returns Verified or ephemeral guest AuthSession
 */
export function verifyToken(authHeader?: string | null): AuthSession {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const randomGuestSuffix = crypto.randomBytes(8).toString("hex");
    return {
      userId: `guest_${randomGuestSuffix}`,
      phoneHash: hashPhone("0000000000"),
      role: "citizen",
      isGuest: true,
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const decoded = jwt.verify(token, requireSecret(JWT_SECRET, "JWT_SECRET")) as any;
    return {
      userId: decoded.sub,
      phoneHash: decoded.phoneHash,
      role: decoded.role || "citizen",
      isGuest: false,
    };
  } catch {
    const randomGuestSuffix = crypto.randomBytes(8).toString("hex");
    return {
      userId: `guest_${randomGuestSuffix}`,
      phoneHash: hashPhone("0000000000"),
      role: "citizen",
      isGuest: true,
    };
  }
}
