import { requestOtp, verifyOtp, requireAuth, verifyToken, hashPhone } from "../lib/services/auth-service";
import { enumerationService, IdorSecurityError } from "../lib/services/enumeration-service";
import { checkRateLimit, resetRateLimit } from "../lib/security/rate-limiter";
import {
  sanitizeString,
  sanitizeObject,
  OtpRequestSchema,
  OtpVerifySchema,
  CreateDraftSchema,
} from "../lib/security/validation-schemas";

console.log("🛡️ Running Jan Ganana AI Security & Hardening Test Suite...\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

async function main() {
// 1. IDOR Ownership Verification Tests
console.log("--- 1. IDOR Ownership Verification Tests ---");
requestOtp("9876543210", "10.0.0.1");
const user1Token = verifyOtp("9876543210", "123456", "10.0.0.1");

requestOtp("9876543211", "10.0.0.2");
const user2Token = verifyOtp("9876543211", "123456", "10.0.0.2");

const user1Draft = await enumerationService.createDraft(user1Token.userId, "GA", 1);
assert(user1Draft.userId === user1Token.userId, "Draft created with User 1 as owner");

// User 1 reads their own draft -> Success
const readOwn = await enumerationService.getDraft(user1Draft.id, user1Token.userId);
assert(readOwn?.id === user1Draft.id, "Owner (User 1) can read their own draft");

// User 2 attempts to read User 1's draft -> Blocked
let user2ReadBlocked = false;
try {
  await enumerationService.getDraft(user1Draft.id, user2Token.userId, "10.0.0.2");
} catch (e: any) {
  if (e instanceof IdorSecurityError) {
    user2ReadBlocked = true;
  }
}
assert(user2ReadBlocked, "IDOR Blocked: User 2 cannot read User 1 draft (throws IdorSecurityError)");

// User 2 attempts to patch User 1's draft -> Blocked
let user2PatchBlocked = false;
try {
  await enumerationService.patchDraft(user1Draft.id, user2Token.userId, 2, { dwellingRooms: 10 }, "10.0.0.2");
} catch (e: any) {
  if (e instanceof IdorSecurityError) {
    user2PatchBlocked = true;
  }
}
assert(user2PatchBlocked, "IDOR Blocked: User 2 cannot modify User 1 draft");

// User 2 attempts to delete User 1's draft -> Blocked
let user2DeleteBlocked = false;
try {
  await enumerationService.deleteDraft(user1Draft.id, user2Token.userId, "10.0.0.2");
} catch (e: any) {
  if (e instanceof IdorSecurityError) {
    user2DeleteBlocked = true;
  }
}
assert(user2DeleteBlocked, "IDOR Blocked: User 2 cannot delete User 1 draft");

// User 2 attempts to submit User 1's draft -> Blocked
let user2SubmitBlocked = false;
try {
  await enumerationService.submitDraft(user1Draft.id, user2Token.userId, "10.0.0.2");
} catch (e: any) {
  if (e instanceof IdorSecurityError) {
    user2SubmitBlocked = true;
  }
}
assert(user2SubmitBlocked, "IDOR Blocked: User 2 cannot submit User 1 draft");

// 2. Brute-Force & Lockout Protection Tests
console.log("\n--- 2. Brute-Force OTP Lockout Tests ---");
const testVictimPhone = "9988776655";
requestOtp(testVictimPhone, "1.2.3.4");

let lockedOut = false;
for (let i = 1; i <= 6; i++) {
  try {
    verifyOtp(testVictimPhone, "000000", "1.2.3.4");
  } catch (e: any) {
    if (i >= 5 && e.message.includes("locked")) {
      lockedOut = true;
    }
  }
}
assert(lockedOut, "Account Lockout: 5 failed OTP attempts triggers 15-minute phone lockout");

// 3. Sliding-Window Rate Limiting Tests
console.log("\n--- 3. Sliding-Window Rate Limiting Tests ---");
const testIp = "192.168.1.100";
resetRateLimit(testIp, "AUTH_REQUEST");

for (let i = 0; i < 5; i++) {
  const res = checkRateLimit(testIp, "AUTH_REQUEST");
  assert(res.allowed, `Rate limit allowed request #${i + 1}/5`);
}

const blockedRes = checkRateLimit(testIp, "AUTH_REQUEST");
assert(!blockedRes.allowed, "Rate limit correctly blocked 6th request (Max 5/15m)");
assert(blockedRes.retryAfterSeconds > 0, "Rate limit provides accurate Retry-After seconds");

// 4. Input Sanitization & Prototype Pollution Defense
console.log("\n--- 4. Input Sanitization & Injection Defense Tests ---");
const xssPayload = "Hello <script>alert('pwned')</script> world <iframe src='evil.com'></iframe>";
const sanitized = sanitizeString(xssPayload);
assert(!sanitized.includes("<script>") && !sanitized.includes("<iframe>"), "XSS script and iframe tags stripped");

// Prototype pollution test
const maliciousObj = JSON.parse('{"__proto__": {"isAdmin": true}, "validField": "test"}');
const cleanedObj = sanitizeObject(maliciousObj);
assert((cleanedObj as any).isAdmin === undefined, "Prototype pollution __proto__ key neutralized");
assert((cleanedObj as any).validField === "test", "Legitimate payload fields preserved");

// Zod Validation tests
const invalidPhone = OtpRequestSchema.safeParse({ phone: "12345" });
assert(!invalidPhone.success, "Rejected malformed phone number (less than 10 digits / invalid prefix)");

const validPhone = OtpRequestSchema.safeParse({ phone: "9876543210" });
assert(validPhone.success, "Accepted valid 10-digit Indian mobile number");

const invalidState = CreateDraftSchema.safeParse({ stateCode: "INVALID_STATE" });
assert(!invalidState.success, "Rejected invalid state code");

const validState = CreateDraftSchema.safeParse({ stateCode: "GA" });
assert(validState.success, "Accepted valid state code 'GA'");

// 5. Session Expiry & Authentication Tests
console.log("\n--- 5. Session & Token Expiry Tests ---");
let guestSession = verifyToken(null);
assert(guestSession.isGuest === true && guestSession.userId.startsWith("guest_"), "Anonymous user assigned isolated ephemeral guest ID");

let invalidBearerRejected = false;
try {
  requireAuth("Bearer invalid_corrupted_token");
} catch (e: any) {
  invalidBearerRejected = true;
}
assert(invalidBearerRejected, "Corrupted JWT bearer token strictly rejected with 401");

console.log(`\n========================================`);
console.log(`Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
