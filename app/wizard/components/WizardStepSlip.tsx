"use client";

import React from "react";
import { CheckCircle2, QrCode, Printer, RotateCcw } from "lucide-react";
import type { WizardStepSlipProps } from "../types";

/**
 * Wizard Step 5: Practice self-enumeration completion slip.
 * Displays a mock ORGI-style reference slip with QR placeholder, household summary,
 * and print/restart actions. Clearly labeled as simulation.
 */
export function WizardStepSlip({
  formData,
  members,
  submissionResult,
  translations: wt,
  onPracticeAgain,
}: WizardStepSlipProps) {
  return (
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
              State: {formData.stateCode} • District: {formData.districtName}
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

      {/* Action Buttons */}
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
          onClick={onPracticeAgain}
          className="py-3 px-4 rounded-xl bg-saffron-500 hover:bg-saffron-400 text-navy-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {wt.practiceAgainBtn}
        </button>
      </div>
    </div>
  );
}
