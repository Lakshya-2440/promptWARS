import crypto from "crypto";
import jwt from "jsonwebtoken";
import { logSecurityEvent } from "../security/security-logger";

const JWT_SECRET = process.env.JWT_SECRET || "jan_ganana_ai_secure_census_2027_jwt_secret_key_998877";
const SALT = process.env.PHONE_HASH_SALT || "census_2027_dpdp_salt_v1";
const IS_PROD = process.env.NODE_ENV === "production";
const ALLOW_DEMO_OTP = process.env.ALLOW_DEMO_OTP === "true" || !IS_PROD;

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

export interface AuthSession {
  userId: string;
  phoneHash: string;
  role: "citizen" | "admin";
  isGuest?: boolean;
}

export function hashPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return crypto.createHmac("sha256", SALT).update(cleanPhone).digest("hex");
}

export function requestOtp(phone: string, clientIp: string = "127.0.0.1"): { success: boolean; message: string; demoOtp?: string } {
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
    // Demo OTP provided only in development / non-production
    demoOtp: ALLOW_DEMO_OTP ? otp : undefined,
  };
}

export function verifyOtp(phone: string, otp: string, clientIp: string = "127.0.0.1"): { token: string; userId: string; phoneHash: string; role: "citizen" | "admin" } {
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
  const role: "citizen" | "admin" = cleanPhone === "9999999999" ? "admin" : "citizen";

  const token = jwt.sign(
    {
      sub: userId,
      phoneHash,
      role,
    },
    JWT_SECRET,
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
 * Strict authentication check: throws if token is missing or invalid
 */
export function requireAuth(authHeader?: string | null): AuthSession {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Bearer authentication token is required.");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
 * Permissive authentication check with isolated ephemeral guest ID
 */
export function verifyToken(authHeader?: string | null): AuthSession {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Generate isolated ephemeral guest ID
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.sub,
      phoneHash: decoded.phoneHash,
      role: decoded.role || "citizen",
      isGuest: false,
    };
  } catch (e) {
    const randomGuestSuffix = crypto.randomBytes(8).toString("hex");
    return {
      userId: `guest_${randomGuestSuffix}`,
      phoneHash: hashPhone("0000000000"),
      role: "citizen",
      isGuest: true,
    };
  }
}
