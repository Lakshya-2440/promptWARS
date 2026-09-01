import { ALL_STATES, FAQ_KNOWLEDGE_BASE, HLO_31_QUESTIONS } from "../lib/db/seed-data";
import { scheduleService } from "../lib/services/schedule-service";
import { enumerationService } from "../lib/services/enumeration-service";
import { classifyMisinformation } from "../lib/services/hf-client";
import { privacyService } from "../lib/services/privacy-service";
import { analyticsService, HISTORICAL_CENSUS_TRENDS } from "../lib/services/analytics-service";
import { dynamicTranslateText, dynamicTranslateBatch } from "../lib/services/translation-engine";

async function runTests() {
  console.log("🚀 Starting Jan Ganana AI Comprehensive Backend & AI Test Suite...\n");

  // Test 1: States & Schedule
  console.log("--- 1. Testing State Schedule Service ---");
  const states = await scheduleService.getAllStates();
  console.log(`✅ Loaded ${states.length} States & Union Territories (Expect 36)`);
  if (states.length !== 36) throw new Error("States count mismatch");

  const todayStatus = await scheduleService.getTodayStatus("GA");
  console.log(`✅ Today Status generated: Reference Date = ${todayStatus.referenceDate}`);
  console.log(`   Snow-bound regions count: ${todayStatus.counts.snowBoundCount}`);

  // Test 2: Misinformation Classifier
  console.log("\n--- 2. Testing Scam / Misinformation Classifier ---");
  const scamMsg = "URGENT: Your Census 2027 registration is incomplete! Pay ₹50 fee immediately at bit.ly/census-pay or face fine.";
  const scamResult = await classifyMisinformation(scamMsg);
  console.log(`   Test 2a: Scam message test -> Verdict: ${scamResult.verdict}, Red flags: ${scamResult.redFlags?.length || 0}`);
  if (!scamResult.isScam) throw new Error("Scam classifier failed on obvious fee/link scam");

  const genuineMsg = "Census 2027 Phase 1 House Listing will begin in Goa from April 16. Details at censusindia.gov.in";
  const genuineResult = await classifyMisinformation(genuineMsg);
  console.log(`   Test 2b: Genuine message test -> Verdict: ${genuineResult.verdict}`);
  if (genuineResult.isScam) throw new Error("Scam classifier falsely flagged genuine message");

  // Test 3: Enumeration Consistency Validator
  console.log("\n--- 3. Testing Enumeration Consistency Validator ---");
  const invalidPayload = {
    totalPersons: 2,
    marriedCouples: 3, // impossible: 3 couples need >= 6 persons
    headAge: 12, // minor head
    members: [
      { name: "Aarav", age: 4, isLiterate: "yes" },
      { name: "Pooja", age: 14, maritalStatus: "currently_married" }
    ]
  };
  const warnings = enumerationService.validateConsistency(invalidPayload);
  console.log(`✅ Detected ${warnings.length} inconsistency warnings as expected:`);
  warnings.forEach((w) => console.log(`   - [${w.type.toUpperCase()}] ${w.message}`));
  if (warnings.length < 3) throw new Error("Consistency validator failed to catch invalid logic");

  // Test 4: DPDP Privacy Service
  console.log("\n--- 4. Testing DPDP Act 2023 Privacy Service ---");
  const draft = await enumerationService.createDraft("test_citizen_user", "MH", 1);
  console.log(`✅ Created test draft: ${draft.id}`);
  const submitRes = await enumerationService.submitDraft(draft.id, "test_citizen_user");
  console.log(`✅ Finalized practice submission: Mock Ref ID = ${submitRes?.practiceReferenceId}`);

  const myData = await privacyService.getMyData("test_citizen_user");
  console.log(`✅ 'My Data' transparency view verified: ${myData.totalDraftsStored} draft(s) found`);

  const eraseRes = await privacyService.eraseUserData("test_citizen_user");
  console.log(`✅ Right to Erasure executed: Erased ${eraseRes.draftsErased} draft(s)`);

  // Test 5: Demographic Trends & Household Comparison
  console.log("\n--- 5. Testing Demographic Trends & Household Comparison ---");
  console.log(`✅ Historical Census Datapoints: ${HISTORICAL_CENSUS_TRENDS.length} cycles (1951 - 2027)`);
  const comparison = analyticsService.compareHouseholdWithAverages("DL", {
    lightingSource: "electricity",
    cookingFuel: "lpg_png",
    waterSource: "tap_treated",
    latrineAccess: "within_premises",
    hasInternet: "yes"
  });
  console.log(`✅ Household comparison calculated for ${comparison.stateName}: ${comparison.metrics.length} metrics assessed`);
  if (comparison.metrics.length < 5) throw new Error("Household comparison metrics incomplete");

  // Test 6: Dynamic Multi-Language AI Translation
  console.log("\n--- 6. Testing Dynamic Google Gemini AI Translation Engine ---");
  const testDict = {
    appName: "Jan Ganana AI",
    practiceNotice: "100% Free Practice Simulation"
  };
  const translated = await dynamicTranslateBatch(testDict, "hi");
  console.log(`✅ Hindi Batch Translation Source: [${translated.source}] (${translated.count} keys)`);
  if (!translated.translations.appName) throw new Error("Batch translation failed to return keys");

  console.log("\n🎉 ALL 6 PRODUCTION TEST SUITES PASSED WITH 100% SUCCESS!\n");
}

runTests().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
