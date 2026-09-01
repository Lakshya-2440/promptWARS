import assert from "node:assert/strict";
import fs from "node:fs";

const originalNodeEnv = process.env.NODE_ENV;
const originalDemo = process.env.ALLOW_DEMO_OTP;
process.env.NODE_ENV = "production";
process.env.JWT_SECRET = "production-test-jwt-secret";
process.env.PHONE_HASH_SALT = "production-test-phone-salt";
delete process.env.ALLOW_DEMO_OTP;

const { requestOtp } = await import(`../lib/services/auth-service.ts?hardening=${Date.now()}`);

const otpResult = requestOtp("9876543210", "127.0.0.1");
assert.equal(otpResult.demoOtp, undefined, "production OTP responses must not expose demoOtp");

const adminPage = fs.readFileSync(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
assert.ok(!adminPage.includes("admin_census2027_master_key"), "admin secret must not be bundled into client code");

const authModal = fs.readFileSync(new URL("../components/AuthModal.tsx", import.meta.url), "utf8");
assert.ok(!authModal.includes('data.demoOtp || "123456"'), "client must not fall back to sandbox OTP in production");
assert.ok(authModal.includes('process.env.NODE_ENV !== "production"'), "sandbox demo UI must be gated by build environment");

const auditRoute = fs.readFileSync(new URL("../app/api/v1/admin/audit-logs/route.ts", import.meta.url), "utf8");
const faqRoute = fs.readFileSync(new URL("../app/api/v1/admin/faq/route.ts", import.meta.url), "utf8");
const scheduleRoute = fs.readFileSync(new URL("../app/api/v1/schedule/states/[stateCode]/route.ts", import.meta.url), "utf8");

for (const source of [auditRoute, faqRoute, scheduleRoute]) {
  assert.ok(!source.includes("|| \"admin_census2027_master_key\""), "admin API must not accept fallback default secret");
}

process.env.NODE_ENV = originalNodeEnv;
if (originalDemo === undefined) {
  delete process.env.ALLOW_DEMO_OTP;
} else {
  process.env.ALLOW_DEMO_OTP = originalDemo;
}

console.log("Production hardening tests passed");
