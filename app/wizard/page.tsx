"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/context/AppContext";
import { ALL_STATES } from "@/lib/db/seed-data";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";
import {
  FileCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Printer,
  RotateCcw,
  Home,
  Users,
  Droplets,
  Tv,
  QrCode,
  Download,
  Lock,
  Plus,
  Trash2,
  HelpCircle,
  Check,
  Layers
} from "lucide-react";

const WIZARD_PAGE_ENGLISH = {
  headerBadge: "Official Practice Simulator • 31 HLO Questions",
  step1: "Location & Head",
  step2: "Housing Structure",
  step3: "Water & Fuel",
  step4: "Assets & Members",
  step5: "Practice Slip",
  step1Heading: "Step 1: Household Location & Head of Household",
  step2Heading: "Step 2: Housing Material, Ownership & Living Space",
  step3Heading: "Step 3: Drinking Water, Sanitation, Lighting & Fuel",
  step4Heading: "Step 4: Digital Assets & Household Member Roster",
  step5Heading: "Step 5: Simulation Complete & Practice Reference Slip",
  stateLabel: "State / UT",
  districtLabel: "District",
  buildingLabel: "Building / Door No.",
  censusHouseLabel: "Census House Sub-Number",
  headNameLabel: "Name of Head of Household",
  headSexLabel: "Sex of Head",
  socialCategoryLabel: "Social Category of Head (SC / ST / Other)",
  mobileLabel: "Head Mobile Number (For Digital Census Verification)",
  floorLabel: "Predominant Floor Material",
  wallLabel: "Predominant Wall Material",
  roofLabel: "Predominant Roof Material",
  ownershipLabel: "Ownership Status of Census House",
  roomsLabel: "Number of Dwelling Rooms",
  couplesLabel: "Number of Married Couples",
  waterSourceLabel: "Main Source of Drinking Water",
  waterAvailLabel: "Availability of Drinking Water Source",
  lightingLabel: "Main Source of Lighting",
  latrineLabel: "Type of Latrine Facility",
  drainageLabel: "Waste Water Drainage System",
  kitchenLabel: "Availability of Kitchen with LPG/PNG",
  fuelLabel: "Main Fuel Used for Cooking",
  assetsHeading: "Select Household Assets (Radio, TV, Internet, Vehicle):",
  membersHeading: "Household Member Details:",
  addMemberBtn: "+ Add Family Member",
  btnNext: "Next Step",
  btnPrev: "Previous Step",
  btnSubmit: "Finalize Practice & Generate Slip",
  certTitle: "Digital Census 2027 Practice Enumeration Slip",
  certSubtitle: "Practice & Awareness simulation only. No real data submitted to government servers.",
  refCodeLabel: "Practice Reference Code:",
  printBtn: "Print Practice Slip",
  practiceAgainBtn: "Practice Again",
};

interface MemberRecord {
  id: string;
  name: string;
  relation: string;
  gender: string;
  age: number | string;
  maritalStatus: string;
  isLiterate: string;
  casteCategory: string;
}

export default function WizardPage() {
  const {
    selectedStateCode,
    setSelectedStateCode,
    language,
    dict,
    session,
    addToast,
    openAssistantWithPrompt
  } = useApp();

  const { data: wt } = useGeminiTranslation(WIZARD_PAGE_ENGLISH, "wizard_page");
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeQuestionHelp, setActiveQuestionHelp] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Location & Household
    stateCode: selectedStateCode || "GA",
    district: "North Goa",
    areaType: "urban",
    buildingNumber: "B-104",
    censusHouseNumber: "Unit 2A",
    headName: "Rajesh Sharma",
    headGender: "male",
    headSocialCategory: "other",
    totalPersons: 4,

    // Step 2: Housing Characteristics
    houseOwnership: "owned",
    houseCondition: "good",
    floorMaterial: "mosaic_tiles",
    wallMaterial: "burnt_brick",
    roofMaterial: "concrete_rcc",
    dwellingRooms: 3,
    marriedCouples: 1,

    // Step 3: Amenities & Sanitation
    waterSource: "tap_treated",
    waterAvailability: "within_premises",
    lightingSource: "electricity",
    latrineAccess: "within_premises",
    latrineType: "sewer_system",
    drainageType: "closed_drain",
    bathingFacility: "bathroom_with_roof",
    kitchenStatus: "cooking_inside_lpg",
    cookingFuel: "lpg_png",

    // Step 4: Assets & Members
    hasRadio: "no",
    hasTv: "yes",
    hasInternet: "yes",
    laptopStatus: "laptop_with_internet",
    phoneStatus: "smartphone",
    vehicles: ["scooter_bike", "car_van"],
    cerealConsumed: "rice_wheat",
    respondentMobile: "9876543210",
  });

  const [members, setMembers] = useState<MemberRecord[]>([
    {
      id: "m1",
      name: "Rajesh Sharma",
      relation: "Head",
      gender: "male",
      age: 42,
      maritalStatus: "currently_married",
      isLiterate: "yes",
      casteCategory: "General",
    },
    {
      id: "m2",
      name: "Sunita Sharma",
      relation: "Spouse",
      gender: "female",
      age: 39,
      maritalStatus: "currently_married",
      isLiterate: "yes",
      casteCategory: "General",
    },
  ]);

  const [warnings, setWarnings] = useState<any[]>([]);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Initialize draft
  useEffect(() => {
    initDraft();
  }, []);

  // Validate consistency on change
  useEffect(() => {
    validateClientConsistency();
  }, [formData, members]);

  const initDraft = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

      const res = await fetch("/api/v1/enumeration/drafts", {
        method: "POST",
        headers,
        body: JSON.stringify({ stateCode: formData.stateCode, phase: 1 }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraftId(data.draft.id);
      }
    } catch (e) {}
  };

  const validateClientConsistency = () => {
    const list: any[] = [];
    const couples = Number(formData.marriedCouples);
    const total = Number(formData.totalPersons);

    if (couples * 2 > total) {
      list.push({
        type: "error",
        message: `${couples} married couple(s) requires at least ${couples * 2} persons, but total household count is ${total}.`,
      });
    }

    members.forEach((m, idx) => {
      const ageNum = Number(m.age);
      if (ageNum < 18 && m.maritalStatus === "currently_married") {
        list.push({
          type: "warning",
          message: `${m.name || `Member #${idx + 1}`} is listed as age ${m.age} with marital status 'Currently Married' (Legal age is 18/21).`,
        });
      }
      if (ageNum < 5 && m.isLiterate === "yes") {
        list.push({
          type: "warning",
          message: `${m.name || `Member #${idx + 1}`} is under 5 years old and marked as Literate.`,
        });
      }
    });

    setWarnings(list);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberChange = (id: string, field: keyof MemberRecord, value: any) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addMember = () => {
    const newM: MemberRecord = {
      id: `m_${Date.now()}`,
      name: "",
      relation: "Son / Daughter",
      gender: "male",
      age: 10,
      maritalStatus: "never_married",
      isLiterate: "yes",
      casteCategory: "General",
    };
    setMembers((prev) => [...prev, newM]);
  };

  const removeMember = (id: string) => {
    if (members.length <= 1) {
      addToast("Household must have at least one member.", "warning");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const saveStepProgress = async (nextStep: number) => {
    if (!draftId) {
      setCurrentStep(nextStep);
      return;
    }

    setIsSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

      await fetch(`/api/v1/enumeration/drafts/${draftId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          step: nextStep,
          payload: { ...formData, members },
        }),
      });
      setCurrentStep(nextStep);
    } catch (e) {
      setCurrentStep(nextStep);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPractice = async () => {
    setIsSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

      const res = await fetch(`/api/v1/enumeration/drafts/${draftId || "draft_demo"}/submit`, {
        method: "POST",
        headers,
      });
      const data = await res.json();

      setSubmissionResult(data);
      setCurrentStep(5);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#10B981", "#3B82F6", "#FDE047"],
      });

      addToast("Practice Self-Enumeration finalized!", "success");
    } catch (e) {
      // Demo fallback
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const mockId = `CEN27-${formData.stateCode}-${randomSuffix}`;
      setSubmissionResult({
        practiceReferenceId: mockId,
        summary: {
          referenceId: mockId,
          stateCode: formData.stateCode,
          headOfHousehold: formData.headName,
          totalMembers: members.length,
          submissionDate: new Date().toISOString(),
        },
      });
      setCurrentStep(5);
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
    } finally {
      setIsSaving(false);
    }
  };

  const speakActiveQuestion = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.code === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-300 text-xs font-bold mb-3">
          <FileCheck className="w-3.5 h-3.5" />
          <span>{wt.headerBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
          {dict.wizardTitle}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300">
          {dict.wizardSubtitle}
        </p>
      </div>

      {/* Wizard Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: wt.step1 },
            { num: 2, label: wt.step2 },
            { num: 3, label: wt.step3 },
            { num: 4, label: wt.step4 },
            { num: 5, label: wt.step5 },
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-navy-950 shadow-emerald-glow"
                      : isCurrent
                      ? "bg-saffron-500 text-navy-950 shadow-saffron-glow font-black ring-4 ring-saffron-500/20"
                      : "bg-navy-900 border border-slate-800 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] hidden sm:inline ${
                    isCurrent ? "text-saffron-300 font-bold" : isCompleted ? "text-slate-300 font-medium" : "text-slate-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-navy-900 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-saffron-500 via-amber-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Layout with Sidebar AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Form Container (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 sm:p-8 border border-saffron-500/30">
          {/* Consistency Warnings Box if any */}
          {warnings.length > 0 && currentStep < 5 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/80 border border-amber-500/40 text-xs text-amber-200 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AI Sathi Consistency Alert ({warnings.length}):</span>
              </div>
              {warnings.map((w, idx) => (
                <p key={idx} className="text-[11px] pl-6">• {w.message}</p>
              ))}
            </div>
          )}

          {/* STEP 1: Location & Household */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-saffron-400" />
                  {wt.step1Heading}
                </h3>
                <button
                  type="button"
                  onClick={() => speakActiveQuestion(wt.step1Heading)}
                  className="p-1 rounded bg-navy-950 text-slate-400 hover:text-white"
                  title="Read instructions aloud"
                >
                  <Volume2 className="w-4 h-4 text-saffron-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.stateLabel}</label>
                  <select
                    value={formData.stateCode}
                    onChange={(e) => {
                      handleFieldChange("stateCode", e.target.value);
                      setSelectedStateCode(e.target.value);
                    }}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:border-saffron-500"
                  >
                    {ALL_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.districtLabel}</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.buildingLabel}</label>
                  <input
                    type="text"
                    value={formData.buildingNumber}
                    onChange={(e) => handleFieldChange("buildingNumber", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.censusHouseLabel}</label>
                  <input
                    type="text"
                    value={formData.censusHouseNumber}
                    onChange={(e) => handleFieldChange("censusHouseNumber", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">
                    {wt.headNameLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.headName}
                    onChange={(e) => handleFieldChange("headName", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Sex of Head</label>
                  <select
                    value={formData.headGender}
                    onChange={(e) => handleFieldChange("headGender", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Social Category</label>
                  <select
                    value={formData.headSocialCategory}
                    onChange={(e) => handleFieldChange("headSocialCategory", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="sc">Scheduled Caste (SC)</option>
                    <option value="st">Scheduled Tribe (ST)</option>
                    <option value="other">Other / General</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Housing Characteristics */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-saffron-400" />
                  {wt.step2Heading}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.ownershipLabel}</label>
                  <select
                    value={formData.houseOwnership}
                    onChange={(e) => handleFieldChange("houseOwnership", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="owned">Owned</option>
                    <option value="rented">Rented</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.floorLabel}</label>
                  <select
                    value={formData.floorMaterial}
                    onChange={(e) => handleFieldChange("floorMaterial", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="mud">Mud / Earth</option>
                    <option value="wood">Wood / Bamboo</option>
                    <option value="burnt_brick">Burnt Brick / Stone</option>
                    <option value="cement">Cement</option>
                    <option value="mosaic_tiles">Mosaic / Floor Tiles / Marble</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.roofLabel}</label>
                  <select
                    value={formData.roofMaterial}
                    onChange={(e) => handleFieldChange("roofMaterial", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="grass_thatch">Grass / Thatch / Wood</option>
                    <option value="tiles_slate">Tiles / Slate</option>
                    <option value="metal_asbestos">Metal / Asbestos Sheets</option>
                    <option value="concrete_rcc">Concrete (RCC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {wt.roomsLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.dwellingRooms}
                    onChange={(e) => handleFieldChange("dwellingRooms", Number(e.target.value))}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {wt.couplesLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.marriedCouples}
                    onChange={(e) => handleFieldChange("marriedCouples", Number(e.target.value))}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Amenities & Sanitation */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  {wt.step3Heading}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.waterSourceLabel}</label>
                  <select
                    value={formData.waterSource}
                    onChange={(e) => handleFieldChange("waterSource", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="tap_treated">Piped Tap Water (Treated Source)</option>
                    <option value="tap_untreated">Piped Tap Water (Untreated)</option>
                    <option value="covered_well">Covered Well</option>
                    <option value="handpump">Hand Pump / Borewell</option>
                    <option value="river_canal">River / Canal / Tank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.waterAvailLabel}</label>
                  <select
                    value={formData.waterAvailability}
                    onChange={(e) => handleFieldChange("waterAvailability", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="within_premises">Within premises</option>
                    <option value="near_premises">Near premises (&lt;100m)</option>
                    <option value="away">Away</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.lightingLabel}</label>
                  <select
                    value={formData.lightingSource}
                    onChange={(e) => handleFieldChange("lightingSource", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="electricity">Electricity (Grid power)</option>
                    <option value="solar">Solar Energy</option>
                    <option value="kerosene">Kerosene</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.latrineLabel}</label>
                  <select
                    value={formData.latrineAccess}
                    onChange={(e) => handleFieldChange("latrineAccess", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="within_premises">Flush / Pour Flush within premises</option>
                    <option value="community_toilet">Community / Public Latrine</option>
                    <option value="open">Open / No latrine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{wt.fuelLabel}</label>
                  <select
                    value={formData.cookingFuel}
                    onChange={(e) => handleFieldChange("cookingFuel", e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:border-saffron-500"
                  >
                    <option value="lpg_png">LPG / Piped Natural Gas (PNG)</option>
                    <option value="electricity">Electricity / Induction</option>
                    <option value="biogas">Biogas</option>
                    <option value="firewood">Firewood</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Assets & Members */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-saffron-400" />
                  {wt.step4Heading}
                </h3>
              </div>

              {/* Assets Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">{wt.assetsHeading}</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1 font-medium">Internet Access</span>
                    <select
                      value={formData.hasInternet}
                      onChange={(e) => handleFieldChange("hasInternet", e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1 font-medium">Television</span>
                    <select
                      value={formData.hasTv}
                      onChange={(e) => handleFieldChange("hasTv", e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1 font-medium">Computing Device</span>
                    <select
                      value={formData.laptopStatus}
                      onChange={(e) => handleFieldChange("laptopStatus", e.target.value)}
                      className="w-full bg-navy-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="laptop_with_internet">Laptop / PC with Net</option>
                      <option value="laptop_no_internet">Laptop without Net</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Members Roster */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {wt.membersHeading} ({members.length})
                  </span>
                  <button
                    type="button"
                    onClick={addMember}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 hover:bg-emerald-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" /> {wt.addMemberBtn}
                  </button>
                </div>

                <div className="space-y-3">
                  {members.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-saffron-400 text-xs">
                          Member #{idx + 1} ({m.relation})
                        </span>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(m.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => handleMemberChange(m.id, "name", e.target.value)}
                            placeholder="Name"
                            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Exact Age</label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={m.age}
                            onChange={(e) => handleMemberChange(m.id, "age", e.target.value)}
                            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Relationship</label>
                          <select
                            value={m.relation}
                            onChange={(e) => handleMemberChange(m.id, "relation", e.target.value)}
                            className="w-full bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          >
                            <option value="Head">Head</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Son/Daughter">Son / Daughter</option>
                            <option value="Parent">Parent</option>
                            <option value="Other">Other Relative</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Final Submission Slip & Reference ID */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center pb-4 border-b border-slate-800">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-emerald-glow">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display font-black text-2xl text-white">
                  {wt.step5Heading}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {wt.certSubtitle}
                </p>
              </div>

              {/* Official-Style Practice Slip */}
              <div className="p-6 rounded-2xl bg-white text-navy-950 font-sans shadow-2xl relative border-4 border-amber-500/80">
                <div className="flex items-start justify-between border-b-2 border-slate-900/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                      OFFICE OF THE REGISTRAR GENERAL OF INDIA (MOCK SIMULATION)
                    </span>
                    <h4 className="font-display font-black text-lg text-navy-950">
                      {wt.certTitle}
                    </h4>
                    <span className="text-xs text-slate-600 font-mono">
                      State: {formData.stateCode} • District: {formData.district}
                    </span>
                  </div>

                  <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 text-[10px] block">{wt.refCodeLabel}</span>
                    <span className="font-mono font-black text-base text-navy-950 block">
                      {submissionResult?.practiceReferenceId || `CEN27-${formData.stateCode}-784912`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">{wt.headNameLabel}</span>
                    <span className="font-bold text-navy-950 text-sm block">
                      {formData.headName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">{wt.step4}</span>
                    <span className="font-bold text-navy-950 text-sm block">
                      {members.length} Members
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Timestamp</span>
                    <span className="font-mono text-slate-700 text-xs block">
                      {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-tight">
                  <strong>Notice:</strong> {wt.certSubtitle}
                </div>
              </div>

              {/* Action Buttons for Slip */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 rounded-xl bg-navy-950 border border-slate-700 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-saffron-400" />
                  {wt.printBtn}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setSubmissionResult(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-saffron-500 hover:bg-saffron-400 text-navy-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {wt.practiceAgainBtn}
                </button>
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="py-2.5 px-4 rounded-xl bg-navy-950 border border-slate-700 hover:bg-slate-900 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {wt.btnPrev}
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => saveStepProgress(currentStep + 1)}
                  disabled={isSaving}
                  className="py-2.5 px-5 rounded-xl bg-saffron-500 hover:bg-saffron-400 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-colors"
                >
                  {wt.btnNext} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitPractice}
                  disabled={isSaving}
                  className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-emerald-glow transition-all"
                >
                  <FileCheck className="w-4 h-4" /> {wt.btnSubmit}
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Sathi Wizard Assistant Sidebar (1 Col) */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-saffron-500/30 space-y-3 sticky top-24">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-saffron-400 animate-pulse" />
              <h4 className="font-display font-black text-sm text-white">AI Sathi Assistant</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              I am monitoring your practice answers in real-time to ensure full consistency and explain tricky questions.
            </p>

            <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-saffron-400 block">Current Step Context:</span>
              <p className="text-slate-400 text-[11px]">
                {currentStep === 1 && "Recording location identifiers and head of household details."}
                {currentStep === 2 && "Recording physical structure, roof/wall materials, and room density."}
                {currentStep === 3 && "Recording water supply, drainage, lighting, and clean fuel connections."}
                {currentStep === 4 && "Recording household consumer durables and member demographics."}
                {currentStep === 5 && "Reviewing completed mock registration summary."}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => openAssistantWithPrompt(`Why is question #${currentStep} asked in Census 2027?`)}
                className="w-full py-2 px-3 rounded-xl bg-navy-950 border border-slate-700 hover:border-saffron-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Why is this collected?</span>
                <HelpCircle className="w-3.5 h-3.5 text-saffron-400" />
              </button>

              <button
                type="button"
                onClick={() => openAssistantWithPrompt("What happens to my self-enumeration ID when the enumerator visits?")}
                className="w-full py-2 px-3 rounded-xl bg-navy-950 border border-slate-700 hover:border-saffron-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>How will enumerator verify this?</span>
                <ArrowRight className="w-3.5 h-3.5 text-saffron-400" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2 text-[11px] text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Section 15 Confidentiality: Your practice answers are completely private.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
