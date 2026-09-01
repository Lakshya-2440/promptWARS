"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { ALL_STATES } from "@/lib/db/seed-data";
import { computeStateStatus } from "@/lib/services/schedule-service";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";
import {
  Sparkles,
  Layers,
  Calendar,
  FileCheck,
  ShieldCheck,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  TrendingUp,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Mic
} from "lucide-react";

const HOME_PAGE_ENGLISH = {
  liveRolloutBadge: "Live Digital Rollout Status",
  selfEnum15d: "15-Day Self-Enumeration",
  selfEnumSub: "Citizen online portal open",
  hlo30d: "Phase I: House Listing (HLO)",
  hloSub: "Enumerator house visit window",
  pePhase: "Phase II: Population & Caste",
  snowBoundNotice: "❄️ Snow-bound Autumn window",
  nationalSyncNotice: "National Synchronous PE",
  explore36States: "Explore All 36 States & UTs",
  stat1Title: "100% Digital",
  stat1Desc: "India's 1st Paperless Census (6,000 Tonnes Paper Saved)",
  stat2Title: "₹11,718 Cr",
  stat2Desc: "Approved Outlay for 16th National Census",
  stat3Title: "16 Languages",
  stat3Desc: "Native Script Self-Enumeration & AI Sathi",
  stat4Title: "1st Since 1931",
  stat4Desc: "Nationwide Caste Census in Phase II (2027)",
  pillarsHeading: "Everything You Need for Digital Census 2027",
  pillarsSubtitle: "Interactive awareness tools engineered for speed, privacy, accessibility, and regional language inclusion.",
  card1Title: "Two-Phase Guide",
  card1Desc: "Understand Phase I (31 Housing & Amenity Questions) vs Phase II (Demographics & Caste Census) with interactive timeline and snow-bound exceptions.",
  card1Link: "Explore 31 Questions",
  card2Title: "State Rollout Schedule",
  card2Desc: "Searchable interactive India map and table with exact 15-day Self-Enumeration, HLO, and PE date windows for all 36 States & UTs.",
  card2Link: "Check State Schedule",
  card3Title: "Practice Wizard",
  card3Desc: "Step-by-step 5-stage simulated self-enumeration with real-time AI consistency validation, voice I/O, and Practice Reference Slip generation.",
  card3Link: "Start Practice Form",
  card4Title: "Verify Messages & Myths",
  card4Desc: "Paste suspicious SMS / WhatsApp links to detect scams via AI classifier, learn Section 15 legal shields, and explore verified facts.",
  card4Link: "Verify Message",
};

const HOME_FAQ_ENGLISH = {
  faqBadge: "Statutory & Practical Knowledge",
  faqHeading: "Frequently Asked Questions",
  faq1Q: "Is Census 2027 mandatory, and what if I miss online self-enumeration?",
  faq1A: "Participation in Census is a statutory duty under the Census Act 1948. However, online Self-Enumeration is completely optional for your ease. If you do not fill online during the 15-day window, an authorized government enumerator will visit your house during the 30-day HLO period with an official digital tablet.",
  faq2Q: "Is Aadhaar number or fee mandatory for Census 2027?",
  faq2A: "NO. Aadhaar is NOT mandatory for Census 2027, and zero fees are charged. The Census of India is 100% free by law. Only a mobile number is requested for sending your Self-Enumeration reference SMS.",
  faq3Q: "How does Section 15 of the Census Act 1948 protect my personal privacy?",
  faq3A: "Under Section 15, individual census answers are strictly confidential and barred from being used in any court of law, or shared with police, tax, or commercial entities. Only aggregate statistical data is published.",
  faq4Q: "What is the Caste Census in Phase II (February 2027)?",
  faq4A: "In Phase II (Population Enumeration), the census includes comprehensive caste enumeration for the first time since 1931, alongside Scheduled Castes (SC) and Scheduled Tribes (ST) data, to facilitate evidence-based social justice policies.",
  moreQuestions: "Have more questions? Ask Jan Ganana Sathi AI",
};

import { TodayStatusResponse, QuickVerifyResult } from "@/types/census";

export default function HomePage() {
  const {
    dict,
    language,
    selectedStateCode,
    setSelectedStateCode,
    openAssistantWithPrompt,
    addToast
  } = useApp();

  const { data: ht } = useGeminiTranslation(HOME_PAGE_ENGLISH, "home_page");
  const { data: fq } = useGeminiTranslation(HOME_FAQ_ENGLISH, "home_faqs");
  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);
  const [quickVerifyText, setQuickVerifyText] = useState("");
  const [quickVerifyResult, setQuickVerifyResult] = useState<QuickVerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeFaqId, setActiveFaqId] = useState<string | null>("faq-01");

  useEffect(() => {
    fetchTodayStatus(selectedStateCode);
  }, [selectedStateCode]);

  const fetchTodayStatus = async (stateCode: string) => {
    try {
      const res = await fetch(`/api/v1/schedule/today-status?stateCode=${stateCode}`);
      const data = await res.json();
      setTodayStatus(data);
    } catch (e) {
      console.warn("Failed to fetch today status:", e);
    }
  };

  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVerifyText.trim()) return;

    setIsVerifying(true);
    setQuickVerifyResult(null);
    try {
      const res = await fetch("/api/v1/assistant/verify-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quickVerifyText.trim() }),
      });
      const data = await res.json();
      setQuickVerifyResult(data);
    } catch (e) {
      addToast("Failed to verify message.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const selectedState = todayStatus?.selectedState || ALL_STATES[0];

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 flex flex-col items-center text-center relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Sovereign Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-300 text-xs font-bold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-saffron-400 animate-ping" />
          <span>{dict.heroBadge}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">16 Languages</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-white max-w-4xl leading-[1.15]">
          {dict.heroTitle1}{" "}
          <span className="saffron-gradient-text block sm:inline">
            {dict.heroTitle2}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal">
          {dict.heroDesc}
        </p>

        {/* Primary Action Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 w-full max-w-md">
          <Link
            href="/wizard"
            className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-400 hover:to-amber-500 text-navy-950 font-black text-sm shadow-saffron-glow transition-all flex items-center justify-center gap-2 group"
          >
            <FileCheck className="w-4 h-4 text-navy-950" />
            <span>{dict.wizardBtn}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/schedule"
            className="py-3.5 px-6 rounded-xl bg-navy-900/90 hover:bg-navy-800 border border-saffron-500/30 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-saffron-400" />
            <span>{dict.scheduleBtn}</span>
          </Link>
        </div>

        {/* Quick State Live Status Ticker */}
        <div className="mt-12 w-full max-w-3xl glass-card rounded-2xl p-5 border border-saffron-500/30 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] uppercase font-bold text-saffron-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {ht.liveRolloutBadge}
              </span>
              <h2 className="text-base sm:text-lg font-display font-black text-white mt-0.5">
                {selectedState?.name} ({selectedState?.regionalName})
              </h2>
            </div>

            {/* State Picker Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <MapPin className="w-4 h-4 text-saffron-400 shrink-0" />
              <select
                value={selectedStateCode}
                onChange={(e) => setSelectedStateCode(e.target.value)}
                className="w-full sm:w-auto bg-navy-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-saffron-500"
              >
                {ALL_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code}) {s.is_snow_bound ? "❄️" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
            <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">{ht.selfEnum15d}</span>
              <span className="font-bold text-saffron-300 text-sm block">
                {selectedState?.self_enum_start} → {selectedState?.self_enum_end}
              </span>
              <span className="text-[10px] text-slate-500">{ht.selfEnumSub}</span>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">{ht.hlo30d}</span>
              <span className="font-bold text-white text-sm block">
                {selectedState?.hlo_start} → {selectedState?.hlo_end}
              </span>
              <span className="text-[10px] text-slate-500">{ht.hloSub}</span>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">{ht.pePhase}</span>
              <span className="font-bold text-emerald-400 text-sm block">
                {selectedState?.pe_start} → {selectedState?.pe_end}
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedState?.is_snow_bound ? ht.snowBoundNotice : ht.nationalSyncNotice}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-semibold">{computeStateStatus(selectedState).statusLabel}</span>
            </div>
            <Link
              href="/schedule"
              className="text-saffron-400 hover:text-saffron-300 font-bold flex items-center gap-1"
            >
              {ht.explore36States} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Key Figures Banner */}
      <section className="w-full bg-navy-900/60 border-y border-slate-800/80 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-display font-black text-saffron-400 block">
              {ht.stat1Title}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              {ht.stat1Desc}
            </span>
          </div>

          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-display font-black text-white block">
              {ht.stat2Title}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              {ht.stat2Desc}
            </span>
          </div>

          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-display font-black text-emerald-400 block">
              {ht.stat3Title}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              {ht.stat3Desc}
            </span>
          </div>

          <div className="p-3">
            <span className="text-2xl sm:text-3xl font-display font-black text-amber-400 block">
              {ht.stat4Title}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              {ht.stat4Desc}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Four Core Feature Pillars */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
            {ht.pillarsHeading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            {ht.pillarsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Two-Phase Explainer */}
          <Link
            href="/explainer"
            className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-saffron-400" />
              </div>
              <h3 className="font-display font-black text-lg text-white mb-2 group-hover:text-saffron-400 transition-colors">
                {ht.card1Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ht.card1Desc}
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-saffron-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {ht.card1Link} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 2: State Schedule Viewer */}
          <Link
            href="/schedule"
            className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-display font-black text-lg text-white mb-2 group-hover:text-amber-400 transition-colors">
                {ht.card2Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ht.card2Desc}
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {ht.card2Link} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 3: Guided Self-Enumeration Wizard */}
          <Link
            href="/wizard"
            className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between group border-saffron-500/40"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-display font-black text-lg text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {ht.card3Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ht.card3Desc}
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {ht.card3Link} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 4: Misinformation & Privacy Hub */}
          <Link
            href="/verify"
            className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-display font-black text-lg text-white mb-2 group-hover:text-rose-400 transition-colors">
                {ht.card4Title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ht.card4Desc}
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-rose-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {ht.card4Link} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* 4. Quick Scam Verifier Mini-Tool on Home */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-saffron-500/30 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">{dict.verifyMsgTitle}</h3>
              <p className="text-xs text-slate-400">{dict.verifyMsgDesc}</p>
            </div>
          </div>

          <form onSubmit={handleQuickVerify} className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={quickVerifyText}
                onChange={(e) => setQuickVerifyText(e.target.value)}
                placeholder={dict.verifyMsgPlaceholder}
                className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-saffron-500 font-sans resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Try Sample:</span>
                <button
                  type="button"
                  onClick={() => setQuickVerifyText("Urgent: Pay ₹50 online fee immediately at bit.ly/census-pay to avoid ₹5000 fine on Census 2027 registration.")}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Fake Fee Scam
                </button>
                <button
                  type="button"
                  onClick={() => setQuickVerifyText("Phase 1 House Listing for Census 2027 in Goa will be conducted from April 16. Details at censusindia.gov.in.")}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Genuine Notice
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !quickVerifyText.trim()}
                className="py-2.5 px-5 rounded-xl bg-saffron-500 hover:bg-saffron-400 disabled:opacity-50 text-navy-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isVerifying ? "Classifying Message with AI..." : dict.verifyMsgButton}
              </button>
            </div>
          </form>

          {/* Quick Result Drawer */}
          {quickVerifyResult && (
            <div className={`mt-5 p-4 rounded-xl border text-xs animate-in fade-in duration-200 ${
              quickVerifyResult.isScam
                ? "bg-rose-950/80 border-rose-500/50 text-rose-100"
                : "bg-emerald-950/80 border-emerald-500/50 text-emerald-100"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {quickVerifyResult.isScam ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="font-display font-black text-sm tracking-wide">
                    VERDICT: {quickVerifyResult.verdict}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                  Confidence: {Math.round(quickVerifyResult.confidenceScore * 100)}%
                </span>
              </div>

              <p className="leading-relaxed mb-3">{quickVerifyResult.explanation}</p>

              {quickVerifyResult.redFlags && quickVerifyResult.redFlags.length > 0 && (
                <div className="mb-3 space-y-1 bg-black/30 p-2.5 rounded-lg">
                  <span className="font-bold block text-rose-300">Detected Red Flags:</span>
                  {quickVerifyResult.redFlags.map((flag: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-rose-200">
                      <span>•</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] font-medium opacity-90">
                <strong>Official Advice:</strong> {quickVerifyResult.officialAdvice}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Interactive FAQ Accordion */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <span className="text-xs uppercase font-bold text-saffron-400 tracking-wider">
            {fq.faqBadge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white mt-1">
            {fq.faqHeading}
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { id: "faq-01", q: fq.faq1Q, a: fq.faq1A },
            { id: "faq-02", q: fq.faq2Q, a: fq.faq2A },
            { id: "faq-03", q: fq.faq3Q, a: fq.faq3A },
            { id: "faq-04", q: fq.faq4Q, a: fq.faq4A },
          ].map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-xl border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setActiveFaqId(activeFaqId === item.id ? null : item.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-saffron-400 shrink-0" />
                  {item.q}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeFaqId === item.id ? "rotate-90 text-saffron-400" : ""
                  }`}
                />
              </button>

              {activeFaqId === item.id && (
                <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 bg-navy-950/50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => openAssistantWithPrompt("What are the key legal safeguards for citizen data in Census 2027?")}
            className="inline-flex items-center gap-2 text-xs font-bold text-saffron-400 hover:text-saffron-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {fq.moreQuestions}
          </button>
        </div>
      </section>
    </div>
  );
}
