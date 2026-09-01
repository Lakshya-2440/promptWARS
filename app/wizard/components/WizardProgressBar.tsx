"use client";

import React from "react";
import { Check } from "lucide-react";
import type { WizardProgressBarProps } from "../types";

/**
 * 5-step visual progress indicator for the Census self-enumeration wizard.
 * Shows completed (green check), current (saffron ring), and upcoming (grey) states.
 */
export function WizardProgressBar({ currentStep, translations: wt }: WizardProgressBarProps) {
  const steps = [
    { num: 1, label: wt.step1 },
    { num: 2, label: wt.step2 },
    { num: 3, label: wt.step3 },
    { num: 4, label: wt.step4 },
    { num: 5, label: wt.step5 },
  ];

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {steps.map((s) => {
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
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-[11px] hidden sm:inline ${
                  isCurrent
                    ? "text-saffron-300 font-bold"
                    : isCompleted
                    ? "text-slate-300 font-medium"
                    : "text-slate-600"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-full bg-navy-900 h-1.5 rounded-full mt-3 overflow-hidden" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={5}>
        <div
          className="bg-gradient-to-r from-saffron-500 via-amber-500 to-emerald-500 h-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}
