"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/context/AppContext";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";
import { InconsistencyWarning, PracticeSubmissionResult } from "@/types/census";
import {
  FileCheck,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

import { WIZARD_PAGE_ENGLISH, DEFAULT_FORM_DATA, DEFAULT_MEMBERS } from "./constants";
import type { MemberRecord, WizardFormData } from "./types";
import {
  WizardProgressBar,
  WizardStepLocation,
  WizardStepHousing,
  WizardStepAmenities,
  WizardStepAssets,
  WizardStepSlip,
  WizardSidebar,
} from "./components";

/**
 * 5-step Census 2027 practice self-enumeration wizard.
 * Orchestrates step navigation, draft persistence, consistency validation,
 * and delegates rendering to focused step components.
 */
export default function WizardPage() {
  const {
    selectedStateCode,
    setSelectedStateCode,
    language,
    dict,
    session,
    addToast,
    openAssistantWithPrompt,
  } = useApp();

  const { data: wt } = useGeminiTranslation(WIZARD_PAGE_ENGLISH, "wizard_page");

  // Navigation state
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<WizardFormData>({
    ...DEFAULT_FORM_DATA,
    stateCode: selectedStateCode || "GA",
  });
  const [members, setMembers] = useState<MemberRecord[]>([...DEFAULT_MEMBERS]);
  const [warnings, setWarnings] = useState<InconsistencyWarning[]>([]);
  const [submissionResult, setSubmissionResult] = useState<PracticeSubmissionResult | null>(null);

  // --- API Helpers ---

  /** Builds auth headers from current session */
  const buildHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
    return headers;
  }, [session?.token]);

  /** Create initial draft on mount */
  useEffect(() => {
    const initDraft = async () => {
      try {
        const res = await fetch("/api/v1/enumeration/drafts", {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify({ stateCode: formData.stateCode, phase: 1 }),
        });
        const data = await res.json();
        if (data.draft) setDraftId(data.draft.id);
      } catch {
        /* Draft creation is non-blocking for UX */
      }
    };
    initDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Run client-side consistency validation whenever form data changes */
  useEffect(() => {
    const list: InconsistencyWarning[] = [];
    const couples = Number(formData.marriedCouplesCount);
    const total = Number(formData.householdTotalPersons);

    if (couples * 2 > total) {
      list.push({
        field: "marriedCouplesCount",
        type: "error",
        message: `${couples} married couple(s) requires at least ${couples * 2} persons, but total is ${total}.`,
      });
    }

    members.forEach((m, idx) => {
      const ageNum = Number(m.age);
      if (ageNum < 18 && m.maritalStatus === "currently_married") {
        list.push({
          field: `member_${idx}_maritalStatus`,
          type: "warning",
          message: `${m.name || `Member #${idx + 1}`} is age ${m.age} with status 'Currently Married' (Legal age is 18/21).`,
        });
      }
      if (ageNum < 5 && m.isLiterate === "yes") {
        list.push({
          field: `member_${idx}_literacy`,
          type: "warning",
          message: `${m.name || `Member #${idx + 1}`} is under 5 years old and marked as Literate.`,
        });
      }
    });

    setWarnings(list);
  }, [formData, members]);

  // --- Event Handlers ---

  const handleFieldChange = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleMemberChange = useCallback((id: string, field: keyof MemberRecord, value: string | number) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }, []);

  const addMember = useCallback(() => {
    setMembers((prev) => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        name: "",
        relation: "Son / Daughter",
        gender: "male",
        age: 10,
        maritalStatus: "never_married",
        isLiterate: "yes",
        casteCategory: "General",
      },
    ]);
  }, []);

  const removeMember = useCallback(
    (id: string) => {
      if (members.length <= 1) {
        addToast("Household must have at least one member.", "warning");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
    },
    [members.length, addToast]
  );

  /** Persist step progress to server draft and advance */
  const saveStepProgress = async (nextStep: number) => {
    if (!draftId) {
      setCurrentStep(nextStep);
      return;
    }
    setIsSaving(true);
    try {
      await fetch(`/api/v1/enumeration/drafts/${draftId}`, {
        method: "PATCH",
        headers: buildHeaders(),
        body: JSON.stringify({ step: nextStep, payload: { ...formData, members } }),
      });
    } catch {
      /* Non-blocking: advance step even if save fails */
    } finally {
      setCurrentStep(nextStep);
      setIsSaving(false);
    }
  };

  /** Finalize practice submission and show celebration */
  const handleSubmitPractice = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/v1/enumeration/drafts/${draftId || "draft_demo"}/submit`, {
        method: "POST",
        headers: buildHeaders(),
      });
    } catch {
      /* Non-blocking */
    } finally {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const mockId = `CEN27-${formData.stateCode}-${randomSuffix}`;

      setSubmissionResult({
        success: true,
        draft: {
          id: draftId || "draft_local",
          userId: session?.userId || "anon",
          stateCode: String(formData.stateCode || "GA"),
          phase: 1,
          step: 5,
          status: "submitted",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          payload: formData,
        },
        practiceReferenceId: mockId,
        summary: {
          state: String(formData.stateCode || "GA"),
          headOfHousehold: String(formData.headName || "Citizen"),
          totalPersons: members.length,
          dwellingRooms: Number(formData.dwellingRooms || 1),
          submittedAt: new Date().toISOString(),
        },
      });

      setCurrentStep(5);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#F59E0B", "#10B981", "#3B82F6", "#FDE047"] });
      addToast("Practice Self-Enumeration finalized!", "success");
      setIsSaving(false);
    }
  };

  /** Text-to-speech for accessibility */
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language.code === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    },
    [language.code]
  );

  // --- Render ---

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-300 text-xs font-bold mb-3">
          <FileCheck className="w-3.5 h-3.5" />
          <span>{wt.headerBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
          {dict.wizardTitle}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300">{dict.wizardSubtitle}</p>
      </div>

      <WizardProgressBar currentStep={currentStep} translations={wt} />

      {/* Main Form + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 sm:p-8 border border-saffron-500/30">
          {/* Consistency Warnings */}
          {warnings.length > 0 && currentStep < 5 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/80 border border-amber-500/40 text-xs text-amber-200 space-y-1.5 animate-in fade-in duration-150" role="alert">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AI Sathi Consistency Alert ({warnings.length}):</span>
              </div>
              {warnings.map((w, idx) => (
                <p key={idx} className="text-[11px] pl-6">• {w.message}</p>
              ))}
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && (
            <WizardStepLocation formData={formData} onFieldChange={handleFieldChange} translations={wt} onSpeak={speakText} onStateCodeChange={setSelectedStateCode} />
          )}
          {currentStep === 2 && (
            <WizardStepHousing formData={formData} onFieldChange={handleFieldChange} translations={wt} />
          )}
          {currentStep === 3 && (
            <WizardStepAmenities formData={formData} onFieldChange={handleFieldChange} translations={wt} />
          )}
          {currentStep === 4 && (
            <WizardStepAssets formData={formData} onFieldChange={handleFieldChange} translations={wt} members={members} onMemberChange={handleMemberChange} onAddMember={addMember} onRemoveMember={removeMember} />
          )}
          {currentStep === 5 && (
            <WizardStepSlip formData={formData} members={members} submissionResult={submissionResult} translations={wt} onPracticeAgain={() => { setCurrentStep(1); setSubmissionResult(null); }} />
          )}

          {/* Navigation Footer */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
              {currentStep > 1 ? (
                <button type="button" onClick={() => setCurrentStep((p) => Math.max(1, p - 1))} className="py-2.5 px-4 rounded-xl bg-navy-950 border border-slate-700 hover:bg-slate-900 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> {wt.btnPrev}
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button type="button" onClick={() => saveStepProgress(currentStep + 1)} disabled={isSaving} className="py-2.5 px-5 rounded-xl bg-saffron-500 hover:bg-saffron-400 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-colors">
                  {wt.btnNext} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmitPractice} disabled={isSaving} className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-black text-xs flex items-center gap-1.5 shadow-emerald-glow transition-all">
                  <FileCheck className="w-4 h-4" /> {wt.btnSubmit}
                </button>
              )}
            </div>
          )}
        </div>

        <WizardSidebar currentStep={currentStep} onOpenAssistant={openAssistantWithPrompt} />
      </div>
    </div>
  );
}
