"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { StateWithComputedStatus } from "@/lib/services/schedule-status";
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  Filter,
  Snowflake,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function SchedulePage() {
  const { selectedStateCode, setSelectedStateCode, openAssistantWithPrompt, dict } = useApp();

  const [states, setStates] = useState<StateWithComputedStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [snowBoundOnly, setSnowBoundOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"grid" | "timeline">("grid");
  const [selectedStateModal, setSelectedStateModal] = useState<StateWithComputedStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/schedule/states");
      const data = await res.json();
      setStates(data.states || []);
    } catch (e) {
      console.warn("Failed to fetch state schedule:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const zones = ["all", "North", "South", "East", "West", "North-East", "Central", "Islands"];

  const filteredStates = states.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.regionalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.capital.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = selectedZone === "all" || s.zone === selectedZone;
    const matchesSnow = !snowBoundOnly || s.is_snow_bound;

    return matchesSearch && matchesZone && matchesSnow;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-saffron-300 text-xs font-bold mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span>Configurable Schedule Store • ORGI Staggered Rollout</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
          {dict.scheduleTitle}
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {dict.scheduleSubtitle}
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-saffron-500/30 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="w-full bg-navy-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-saffron-500"
            />
          </div>

          {/* View Toggles & Snow Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <button
              onClick={() => setSnowBoundOnly(!snowBoundOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                snowBoundOnly
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-navy-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-amber-400" />
              <span>Snow-Bound Regions (4)</span>
            </button>

            <div className="bg-navy-950 border border-slate-800 p-1 rounded-xl flex">
              <button
                onClick={() => setActiveTab("grid")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "grid"
                    ? "bg-saffron-500 text-navy-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {dict.gridView}
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "timeline"
                    ? "bg-saffron-500 text-navy-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {dict.timelineView}
              </button>
            </div>
          </div>
        </div>

        {/* Zone Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-800/80 pt-3">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 pr-2 shrink-0">
            <Filter className="w-3 h-3 text-saffron-400" /> Zone:
          </span>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedZone === zone
                  ? "bg-saffron-500/20 border border-saffron-500 text-saffron-300 font-bold"
                  : "bg-navy-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {zone === "all" ? "All Zones" : zone}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {activeTab === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStates.map((state) => {
            const isSelected = selectedStateCode === state.code;
            const isSelfEnumActive = state.status === "active_self_enum";
            const isHloActive = state.status === "active_hlo";

            return (
              <div
                key={state.code}
                className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-saffron-500 ring-1 ring-saffron-500/50 bg-navy-900/90"
                    : "border-slate-800 hover:border-slate-700 hover:bg-navy-900/60"
                }`}
                onClick={() => {
                  setSelectedStateCode(state.code);
                  setSelectedStateModal(state);
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-navy-950 border border-slate-700 text-slate-300">
                          {state.code}
                        </span>
                        <span className="text-[11px] text-slate-400">{state.zone} Zone</span>
                        {state.is_snow_bound && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-bold">
                            <Snowflake className="w-2.5 h-2.5" /> Snow
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-black text-lg text-white mt-1">
                        {state.name}
                      </h3>
                      <span className="text-xs text-saffron-400 font-semibold block">
                        {state.regionalName} • Capital: {state.capital}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelfEnumActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isHloActive
                          ? "bg-saffron-500/20 text-saffron-300 border border-saffron-500/40"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {state.status === "active_self_enum"
                        ? dict.activeNow
                        : state.status === "active_hlo"
                        ? "HLO Active"
                        : dict.upcoming}
                    </span>
                  </div>

                  {/* Date Breakdown */}
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{dict.selfEnumWindow}:</span>
                      <span className="font-mono font-bold text-saffron-300">
                        {state.self_enum_start} → {state.self_enum_end}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{dict.hloWindow}:</span>
                      <span className="font-mono font-bold text-white">
                        {state.hlo_start} → {state.hlo_end}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400">{dict.peWindow}:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {state.pe_start} → {state.pe_end}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Pop: <strong>{(state.population_2011 / 10000000).toFixed(2)} Cr</strong> (2011)
                  </span>
                  <span className="text-saffron-400 hover:text-saffron-300 font-bold flex items-center gap-1">
                    Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {activeTab === "timeline" && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-black text-white">
              Chronological Rollout Wave Schedule (2026–2027)
            </h3>
            <p className="text-xs text-slate-400">
              States are scheduled in staggered 30-day windows to optimize field supervisor and enumerator device capacity.
            </p>

            <div className="space-y-4 mt-6">
              {[
                {
                  wave: "Wave 1 (Earliest Starters)",
                  selfEnum: "1 Apr – 15 Apr 2026",
                  hlo: "16 Apr – 15 May 2026",
                  statesList: "Goa, Karnataka, Odisha, Sikkim, Mizoram, Andaman & Nicobar, Lakshadweep",
                  color: "border-saffron-500",
                },
                {
                  wave: "Wave 2 (Metro & Coastal Hubs)",
                  selfEnum: "15 Apr / 1 May – Mid May 2026",
                  hlo: "1 May / 16 May – Mid June 2026",
                  statesList: "Delhi (NDMC), Maharashtra, Tamil Nadu, Gujarat, Puducherry, Chandigarh",
                  color: "border-amber-500",
                },
                {
                  wave: "Wave 3 (Southern & Eastern States)",
                  selfEnum: "15 May / 1 Jun – Mid June 2026",
                  hlo: "1 Jun / 16 Jun – Mid July 2026",
                  statesList: "Kerala, Andhra Pradesh, Telangana, West Bengal, Uttar Pradesh, Bihar",
                  color: "border-emerald-500",
                },
                {
                  wave: "Wave 4 (Central & Northern Heartland)",
                  selfEnum: "15 Jun / 1 Jul – Mid July 2026",
                  hlo: "1 Jul / 16 Jul – Mid August 2026",
                  statesList: "Madhya Pradesh, Rajasthan, Punjab, Haryana, Assam, Jharkhand, Chhattisgarh",
                  color: "border-blue-500",
                },
                {
                  wave: "Wave 5 & Snow-Bound Autumn Regions",
                  selfEnum: "1 Aug – 15 Aug 2026",
                  hlo: "16 Aug – 15 Sep 2026 (PE early: Sep–Oct 2026)",
                  statesList: "Ladakh, Jammu & Kashmir, Himachal Pradesh, Uttarakhand, Tripura, Meghalaya, Manipur, Nagaland, Arunachal Pradesh",
                  color: "border-cyan-500",
                },
              ].map((wave, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl bg-navy-950 border-l-4 ${wave.color} border-y border-r border-slate-800`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="font-display font-black text-sm text-white">{wave.wave}</span>
                    <span className="text-xs font-mono text-saffron-300">
                      Self-Enum: {wave.selfEnum} • HLO: {wave.hlo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{wave.statesList}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* State Detail Modal */}
      {selectedStateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-navy-900 border border-saffron-500/40 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStateModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-saffron-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white">
                  {selectedStateModal.name} ({selectedStateModal.regionalName})
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedStateModal.zone} Zone • Capital: {selectedStateModal.capital}
                </p>
              </div>
            </div>

            {/* Official Date Windows */}
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3 mb-5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">15-Day Self-Enumeration:</span>
                <span className="font-mono font-bold text-saffron-300">
                  {selectedStateModal.self_enum_start} → {selectedStateModal.self_enum_end}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Phase I House Listing (HLO):</span>
                <span className="font-mono font-bold text-white">
                  {selectedStateModal.hlo_start} → {selectedStateModal.hlo_end}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Phase II Population (PE):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedStateModal.pe_start} → {selectedStateModal.pe_end}
                </span>
              </div>
            </div>

            {/* Benchmark Demographics */}
            <div className="space-y-2 mb-6 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                Official Benchmark Indicators (Census 2011)
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Population (2011)</span>
                  <span className="font-bold text-white text-sm">
                    {selectedStateModal.population_2011.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Literacy Rate</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {selectedStateModal.literacy_rate_2011}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Sex Ratio</span>
                  <span className="font-bold text-saffron-300 text-sm">
                    {selectedStateModal.sex_ratio_2011} F / 1000 M
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Electricity Access</span>
                  <span className="font-bold text-white text-sm">
                    {selectedStateModal.electricity_pct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/wizard"
                className="flex-1 py-3 px-4 rounded-xl bg-saffron-500 hover:bg-saffron-400 text-navy-950 font-black text-xs text-center shadow-md flex items-center justify-center gap-1.5 transition-colors"
                onClick={() => setSelectedStateModal(null)}
              >
                <FileCheck className="w-4 h-4" />
                Practice Self-Enumeration for {selectedStateModal.code}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
