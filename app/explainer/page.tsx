"use client";

import React, { useState } from "react";
import { HLO_31_QUESTIONS, CensusQuestionSchema } from "@/lib/db/seed-data";
import { useApp } from "@/lib/context/AppContext";
import {
  Layers,
  HelpCircle,
  ShieldCheck,
  Search,
  Sparkles,
  Calendar,
  Snowflake,
  Home,
  Users,
  Droplets,
  Flame,
  Tv,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info
} from "lucide-react";
import {
  getLocalizedQuestion,
  getLocalizedCategory,
} from "@/lib/i18n/content-translations";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";

const EXPLAINER_ENGLISH = {
  phase1Badge: "PHASE I OVERVIEW • 1 APRIL – 30 SEPTEMBER 2026",
  phase1Heading: "House Listing and Housing Census (HLO)",
  phase1Desc: "Phase I covers 31 comprehensive questions recording the physical structure, housing quality, access to clean drinking water, electricity, sanitation, clean cooking gas, and digital assets. It builds the GIS geo-tagged building directory of India.",
  badge30Days: "30-Day Window per State",
  badge15Days: "15-Day Self-Enumeration Window",
  badgeZeroBio: "Zero Biometrics or Bank Data",
  qCountHeading: "31 Official Questions",
  qCountDesc: "Every question is designed to measure public welfare and infrastructure reach.",
  askAiPhase1: "Ask AI Sathi about Phase I",
  exploreTitle: "Explore the 31 House Listing Questions",
  exploreDesc: "Search or click any question to understand what will be asked and why the government collects it.",
  searchPlaceholder: "Search questions (e.g. LPG, floor, water)...",
  whyGovCollects: "Why does the Government collect this?",
  explainWithAiBtn: "Explain this question in detail with AI",
  protectedSection15: "Section 15 Protected",
  phase2Badge: "PHASE II OVERVIEW • 9 FEBRUARY – 28 FEBRUARY 2027",
  phase2Heading: "Population Enumeration & Caste Census (PE)",
  phase2Desc: "Phase II counts every individual citizen, recording demographic characteristics, education, economic activity, migration, fertility, SC/ST categories, and India's first nationwide caste census since 1931. Synchronous across all 36 States/UTs.",
  snowBoundNotice: "Snow-Bound Regions (J&K, Ladakh, HP, UK) conduct Phase II earlier in Sep-Oct 2026 before winter closure."
};

export default function ExplainerPage() {
  const { openAssistantWithPrompt, language, dict } = useApp();
  const [selectedPhase, setSelectedPhase] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>("q1");
  const [aiExplanation, setAiExplanation] = useState<{ id: string; text: string } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const { data: cardTexts } = useGeminiTranslation(EXPLAINER_ENGLISH, "explainer");

  const categoryKeys = [
    "all",
    "Building & Census House",
    "Housing Material",
    "House Use & Condition",
    "Household Demographics",
    "Ownership & Living Space",
    "Water & Sanitation",
    "Power & Lighting",
    "Kitchen & Cooking Fuel",
    "Household Assets",
  ];

  const categories = categoryKeys.map((key) => ({
    id: key,
    label: getLocalizedCategory(key, language.code),
  }));

  const filteredQuestions = HLO_31_QUESTIONS.filter((q) => {
    const locQ = getLocalizedQuestion(q, language.code);
    const matchesCat = selectedCategory === "all" || q.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      locQ.label.toLowerCase().includes(query) ||
      locQ.description.toLowerCase().includes(query) ||
      locQ.whyAsked.toLowerCase().includes(query) ||
      q.label.toLowerCase().includes(query) ||
      q.description.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  const handleExplainWithAi = async (q: CensusQuestionSchema) => {
    setIsExplaining(true);
    try {
      const res = await fetch("/api/v1/assistant/explain-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, language: language.name }),
      });
      const data = await res.json();
      setAiExplanation({ id: q.id, text: data.explanation });
    } catch (e) {
      setAiExplanation({
        id: q.id,
        text: `Question #${q.number} is collected to assess national infrastructure and socio-economic wellbeing. Protected under Section 15 of Census Act 1948.`,
      });
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-300 text-xs font-bold mb-4">
          <Layers className="w-3.5 h-3.5" />
          <span>{dict.twoPhaseBtn}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
          {dict.explainerTitle}
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {dict.explainerSubtitle}
        </p>
      </div>

      {/* Phase Selection Tabs */}
      <div className="flex justify-center mb-10">
        <div className="bg-navy-900/90 border border-slate-800 p-1.5 rounded-2xl flex gap-2 max-w-xl w-full">
          <button
            onClick={() => setSelectedPhase(1)}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              selectedPhase === 1
                ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-navy-950 shadow-saffron-glow font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{dict.phase1Tab}</span>
          </button>

          <button
            onClick={() => setSelectedPhase(2)}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              selectedPhase === 2
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-navy-950 shadow-emerald-glow font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{dict.phase2Tab}</span>
          </button>
        </div>
      </div>

      {/* Phase I Content */}
      {selectedPhase === 1 && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* Phase I Hero Summary Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-saffron-500/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <span className="text-xs uppercase font-bold text-saffron-400 tracking-wider">
                  {cardTexts.phase1Badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-black text-white">
                  {cardTexts.phase1Heading}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {cardTexts.phase1Desc}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 font-medium">
                    📍 {cardTexts.badge30Days}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 font-medium">
                    🌐 {cardTexts.badge15Days}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium">
                    🔒 {cardTexts.badgeZeroBio}
                  </span>
                </div>
              </div>

              <div className="bg-navy-950/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Question Count
                  </span>
                  <span className="text-3xl font-display font-black text-saffron-400 block">
                    {cardTexts.qCountHeading}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    {cardTexts.qCountDesc}
                  </p>
                </div>

                <button
                  onClick={() => openAssistantWithPrompt(language.code === "hi" ? "मुझे चरण 1 मकान सूचीकरण के 31 प्रश्नों के बारे में सरल शब्दों में बताएं।" : "Explain the difference between Phase 1 HLO and Phase 2 PE in simple words.")}
                  className="mt-4 py-2 px-3 rounded-lg bg-saffron-500/20 border border-saffron-500/40 text-saffron-300 hover:bg-saffron-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
                  {cardTexts.askAiPhase1}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive 31-Questions Browser */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-black text-white">
                  {cardTexts.exploreTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {cardTexts.exploreDesc}
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={cardTexts.searchPlaceholder}
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-saffron-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-saffron-500 text-navy-950 font-bold"
                      : "bg-navy-900 border border-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="grid grid-cols-1 gap-3">
              {filteredQuestions.map((q) => {
                const isExpanded = expandedQuestionId === q.id;
                const hasAi = aiExplanation?.id === q.id;
                const locQ = getLocalizedQuestion(q, language.code);

                return (
                  <div
                    key={q.id}
                    className={`glass-card rounded-xl border transition-all overflow-hidden ${
                      isExpanded ? "border-saffron-500/50 bg-navy-900/90" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      className="w-full p-4 text-left flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-saffron-500/20 border border-saffron-500/40 text-saffron-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          #{locQ.number}
                        </span>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-saffron-400/90 tracking-wider block">
                            {locQ.category}
                          </span>
                          <span className="text-sm font-bold text-white block mt-0.5">
                            {locQ.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {q.isConfidential && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-navy-950 border border-emerald-500/30 text-emerald-400">
                            <Lock className="w-3 h-3" />
                            {cardTexts.protectedSection15}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-bold">
                          {isExpanded ? "−" : "+"}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-navy-950/60 text-xs space-y-3">
                        <div>
                          <span className="font-bold text-slate-400 block mb-0.5">Question Description:</span>
                          <p className="text-slate-200">{locQ.description}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-navy-900/80 border border-slate-800">
                          <span className="font-bold text-emerald-400 block mb-0.5 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            {cardTexts.whyGovCollects}
                          </span>
                          <p className="text-slate-300">{locQ.whyAsked}</p>
                        </div>

                        {q.options && (
                          <div>
                            <span className="font-bold text-slate-400 block mb-1">Standard Option Codes:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300 font-mono">
                              {q.options.map((opt) => (
                                <div key={opt.value} className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                                  • {opt.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Explanation Action */}
                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            onClick={() => handleExplainWithAi(q)}
                            disabled={isExplaining}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron-500/20 border border-saffron-500/40 text-saffron-300 hover:bg-saffron-500/30 text-xs font-bold w-fit transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
                            {isExplaining && aiExplanation?.id === q.id
                              ? "AI Sathi is explaining..."
                              : cardTexts.explainWithAiBtn}
                          </button>

                          {hasAi && (
                            <div className="p-3 rounded-xl bg-navy-900 border border-saffron-500/30 text-slate-200 text-xs leading-relaxed animate-in fade-in duration-150">
                              <span className="font-bold text-saffron-400 block mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Sathi Explanation ({language.name}):
                              </span>
                              {aiExplanation?.text}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Phase II Content */}
      {selectedPhase === 2 && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Phase II Hero Summary Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-emerald-500/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  {cardTexts.phase2Badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-black text-white">
                  {cardTexts.phase2Heading}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {cardTexts.phase2Desc}
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 font-medium">
                    📅 National PE: 9 Feb – 28 Feb 2027
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-navy-950 border border-slate-700 text-slate-300 font-medium">
                    ⏳ Revision Round: 1 Mar – 5 Mar 2027
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-medium">
                    ❄️ Snow-Bound Areas: Sep – Oct 2026
                  </span>
                </div>
              </div>

              <div className="bg-navy-950/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Caste Census Scope
                  </span>
                  <span className="text-2xl font-display font-black text-emerald-400 block">
                    All Social Groups
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    Measures socio-economic status, education, occupation, and social representation.
                  </p>
                </div>

                <button
                  onClick={() => openAssistantWithPrompt(language.code === "hi" ? "जाति जनगणना 2027 के बारे में विस्तार से बताएं।" : "Explain the historic significance of the 2027 Caste Census in India.")}
                  className="mt-4 py-2 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Ask AI Sathi about Caste Census
                </button>
              </div>
            </div>
          </div>

          {/* Phase II Individual Questionnaire Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-display font-black text-base text-white mb-2">
                1. Demographics & Relationship
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Name of individual, relationship to head of household, sex (Male, Female, Transgender), date of birth, exact age, and marital status.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-saffron-400" />
              </div>
              <h3 className="font-display font-black text-base text-white mb-2">
                2. Caste & Social Category
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Religion, Scheduled Caste (SC) / Scheduled Tribe (ST) status, and comprehensive caste/sub-caste enumeration recorded directly from respondent declarations.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-display font-black text-base text-white mb-2">
                3. Education, Work & Languages
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mother tongue, subsidiary languages known, literacy status, highest educational level attained, economic activity/occupation, and migration reasons.
              </p>
            </div>
          </div>

          {/* Snow-Bound Region Exception Matrix */}
          <div className="glass-card rounded-2xl p-6 border border-amber-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Snowflake className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Non-Synchronous Snow-Bound Region Calendar
                </h3>
                <p className="text-xs text-slate-400">
                  Special provisions for high-altitude Himalayan zones due to harsh winter snowfall.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                <span className="font-bold text-white block">Ladakh</span>
                <span className="text-amber-400 font-mono text-[11px] block mt-1">
                  PE: 16 Sep – 31 Oct 2026
                </span>
                <span className="text-[10px] text-slate-500">Ref Date: 1 Oct 2026</span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                <span className="font-bold text-white block">Jammu & Kashmir</span>
                <span className="text-amber-400 font-mono text-[11px] block mt-1">
                  PE: 16 Sep – 31 Oct 2026
                </span>
                <span className="text-[10px] text-slate-500">Snow-bound tehsils</span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                <span className="font-bold text-white block">Himachal Pradesh</span>
                <span className="text-amber-400 font-mono text-[11px] block mt-1">
                  PE: 16 Sep – 31 Oct 2026
                </span>
                <span className="text-[10px] text-slate-500">Lahaul, Spiti & Kinnaur</span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                <span className="font-bold text-white block">Uttarakhand</span>
                <span className="text-amber-400 font-mono text-[11px] block mt-1">
                  PE: 16 Sep – 31 Oct 2026
                </span>
                <span className="text-[10px] text-slate-500">High-altitude passes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
