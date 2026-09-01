"use client";

import React from "react";
import { Sparkles, ShieldCheck, HelpCircle, ArrowRight } from "lucide-react";
import type { WizardSidebarProps } from "../types";

/** Context descriptions per step for the AI assistant panel */
const STEP_CONTEXTS: Record<number, string> = {
  1: "Recording location identifiers and head of household details.",
  2: "Recording physical structure, roof/wall materials, and room density.",
  3: "Recording water supply, drainage, lighting, and clean fuel connections.",
  4: "Recording household consumer durables and member demographics.",
  5: "Reviewing completed mock registration summary.",
};

/**
 * AI Sathi sidebar panel that provides contextual guidance during wizard steps.
 * Displays current step context, quick-ask buttons, and a Section 15 privacy notice.
 */
export function WizardSidebar({ currentStep, onOpenAssistant }: WizardSidebarProps) {
  return (
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
            {STEP_CONTEXTS[currentStep] || STEP_CONTEXTS[1]}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenAssistant(`Why is question #${currentStep} asked in Census 2027?`)}
            className="w-full py-2 px-3 rounded-xl bg-navy-950 border border-slate-700 hover:border-saffron-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span>Why is this collected?</span>
            <HelpCircle className="w-3.5 h-3.5 text-saffron-400" />
          </button>

          <button
            type="button"
            onClick={() => onOpenAssistant("What happens to my self-enumeration ID when the enumerator visits?")}
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
  );
}
