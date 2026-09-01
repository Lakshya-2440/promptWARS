"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import { useApp } from "@/lib/context/AppContext";
import { ALL_STATES, StateData } from "@/lib/db/seed-data";
import { HISTORICAL_CENSUS_TRENDS } from "@/lib/services/analytics-service";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";
import {
  Database,
  TrendingUp,
  BarChart3,
  Users,
  Home,
  CheckCircle2,
  Droplets,
  Zap,
  Flame,
  Wifi,
  Sparkles,
  Info
} from "lucide-react";

const DATA_PAGE_ENGLISH = {
  benchmarkBadge: "Census 2011 Official Benchmark & 2027 Projections",
  dataSourceTitle: "Source: Office of the Registrar General & Census Commissioner, India (2011 Tables + 2027 Demographic Estimates)",
  govtechLayer: "Gov-Tech Visualization Layer",
  historicalTitle: "Historical Census Transformation (1951 – 2027)",
  historicalDesc: "Witness India's demographic growth and transition across 16 national census cycles.",
  popMetric: "Population (Cr)",
  litMetric: "Literacy Rate (%)",
  sexMetric: "Sex Ratio (F/1000M)",
  urbMetric: "Urbanization (%)",
  popChartLabel: "Total Population (in Crores)",
  litChartLabel: "National Literacy Rate (%)",
  sexChartLabel: "Sex Ratio (Females per 1000 Males)",
  urbChartLabel: "Urban Population Share (%)",
  populousTitle: "Most Populous States: Literacy vs Amenities (%)",
  populousDesc: "Comparing basic literacy rate and clean LPG gas connectivity across major states.",
  literacyLegend: "Literacy Rate (%)",
  lpgLegend: "Clean LPG Fuel (%)",
  radarTitle: "Amenities Radar Comparison",
  radarDesc: "State coverage vs 2011 National Baseline Average.",
  radarElectricity: "Electricity",
  radarLpg: "Clean LPG",
  radarWater: "Tap Water",
  radarLatrine: "Latrine",
  radarLiteracy: "Literacy",
  nationalAvg: "National Average",
  compareTitle: "Compare Your Household Amenities vs State & National Averages",
  compareDesc: "See how your practice self-enumeration answers measure against official state averages. (Processed locally in browser)",
  stateLabel: "Select State / UT",
  lightingLabel: "Lighting Source",
  cookingLabel: "Cooking Fuel",
  waterLabel: "Drinking Water",
  latrineLabel: "Latrine Facility",
  internetLabel: "Internet Connection",
  optElectricity: "Electricity (Grid)",
  optSolar: "Solar Energy",
  optKerosene: "Kerosene",
  optLpg: "LPG / PNG Gas",
  optFirewood: "Firewood",
  optPipedTap: "Treated Tap Water",
  optHandpump: "Handpump / Borewell",
  optWithinPremises: "Within Premises",
  optCommunity: "Community Toilet",
  optOpen: "No Latrine / Open",
  optYes: "Yes",
  optNo: "No",
  compareYourHouseholdResult: "Your Household Comparison Analysis",
};

import { HouseholdComparisonResponse, HouseholdAmenityMetric } from "@/types/census";

export default function DataDashboardPage() {
  const { selectedStateCode, setSelectedStateCode, dict, language } = useApp();
  const { data: dt } = useGeminiTranslation(DATA_PAGE_ENGLISH, "data_page");

  const [activeMetric, setActiveMetric] = useState<"population" | "literacy" | "sexratio" | "urban">("population");
  const [targetStateCode, setTargetStateCode] = useState(selectedStateCode || "GA");
  const [householdInput, setHouseholdInput] = useState({
    lightingSource: "electricity",
    cookingFuel: "lpg_png",
    waterSource: "tap_treated",
    latrineAccess: "within_premises",
    hasInternet: "yes",
  });
  const [comparisonResult, setComparisonResult] = useState<HouseholdComparisonResponse | null>(null);

  useEffect(() => {
    runComparison();
  }, [targetStateCode, householdInput]);

  const runComparison = async () => {
    try {
      const res = await fetch("/api/v1/analytics/compare-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode: targetStateCode,
          householdData: householdInput,
        }),
      });
      const data = await res.json();
      setComparisonResult(data.comparison);
    } catch (e) {}
  };

  const selectedState = ALL_STATES.find((s) => s.code === targetStateCode) || ALL_STATES[0];

  // Top 10 States for Comparison Chart
  const top10States = ALL_STATES.slice(0, 8).map((s) => ({
    name: s.name.length > 8 ? s.code : s.name,
    literacy: s.literacy_rate_2011,
    lpg: s.lpg_pct,
    electricity: s.electricity_pct,
    water: s.tap_water_pct,
  }));

  // Amenities Radar Data
  const radarData = [
    { metric: dt.radarElectricity, State: selectedState.electricity_pct, National: 67.2 },
    { metric: dt.radarLpg, State: selectedState.lpg_pct, National: 28.5 },
    { metric: dt.radarWater, State: selectedState.tap_water_pct, National: 43.5 },
    { metric: dt.radarLatrine, State: selectedState.latrine_pct, National: 46.9 },
    { metric: dt.radarLiteracy, State: selectedState.literacy_rate_2011, National: 74.0 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
          <Database className="w-3.5 h-3.5" />
          <span>{dt.benchmarkBadge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
          {dict.dataTitle}
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {dict.dataSubtitle}
        </p>
      </div>

      {/* Official Data Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-navy-900 border border-saffron-500/30 mb-8 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-saffron-400 shrink-0" />
          <span>
            {dt.dataSourceTitle}
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] text-saffron-400">
          {dt.govtechLayer}
        </span>
      </div>

      {/* Chart 1: Historical Trend Evolution */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 mb-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-display font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-saffron-400" />
              {dt.historicalTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {dt.historicalDesc}
            </p>
          </div>

          <div className="bg-navy-950 border border-slate-800 p-1 rounded-xl flex gap-1 flex-wrap">
            {[
              { id: "population", label: dt.popMetric },
              { id: "literacy", label: dt.litMetric },
              { id: "sexratio", label: dt.sexMetric },
              { id: "urban", label: dt.urbMetric },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMetric(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeMetric === tab.id
                    ? "bg-saffron-500 text-navy-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Line/Area Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HISTORICAL_CENSUS_TRENDS}>
              <defs>
                <linearGradient id="saffronGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="year" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A1128",
                  borderColor: "#F59E0B",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              {activeMetric === "population" && (
                <Area
                  type="monotone"
                  dataKey="populationCrores"
                  name={dt.popChartLabel}
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fill="url(#saffronGrad)"
                />
              )}
              {activeMetric === "literacy" && (
                <Area
                  type="monotone"
                  dataKey="literacyRate"
                  name={dt.litChartLabel}
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#emeraldGrad)"
                />
              )}
              {activeMetric === "sexratio" && (
                <Line
                  type="monotone"
                  dataKey="sexRatio"
                  name={dt.sexChartLabel}
                  stroke="#38BDF8"
                  strokeWidth={3}
                />
              )}
              {activeMetric === "urban" && (
                <Area
                  type="monotone"
                  dataKey="urbanPct"
                  name={dt.urbChartLabel}
                  stroke="#A855F7"
                  strokeWidth={3}
                  fill="url(#saffronGrad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: State Comparison Chart (Left) & Radar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* State Breakdown Bar Chart (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-display font-black text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              {dt.populousTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {dt.populousDesc}
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10States}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1128",
                    borderColor: "#10B981",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                />
                <Legend />
                <Bar dataKey="literacy" name={dt.literacyLegend} fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lpg" name={dt.lpgLegend} fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Amenities Radar (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-base font-display font-black text-white">
                {dt.radarTitle}: {selectedState.name}
              </h3>
              <select
                value={targetStateCode}
                onChange={(e) => setTargetStateCode(e.target.value)}
                className="bg-navy-950 border border-slate-700 text-xs font-bold text-white rounded-lg p-1.5"
              >
                {ALL_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400">
              {dt.radarDesc}
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name={selectedState.name} dataKey="State" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                <Radar name={dt.nationalAvg} dataKey="National" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1128",
                    borderColor: "#F59E0B",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Tool: Compare Your Household with State Averages */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-saffron-500/30 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center">
            <Home className="w-5 h-5 text-saffron-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">
              {dt.compareTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {dt.compareDesc}
            </p>
          </div>
        </div>

        {/* Input selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">{dt.stateLabel}</label>
            <select
              value={targetStateCode}
              onChange={(e) => setTargetStateCode(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              {ALL_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">{dt.lightingLabel}</label>
            <select
              value={householdInput.lightingSource}
              onChange={(e) => setHouseholdInput({ ...householdInput, lightingSource: e.target.value })}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="electricity">{dt.optElectricity}</option>
              <option value="solar">{dt.optSolar}</option>
              <option value="kerosene">{dt.optKerosene}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">{dt.cookingLabel}</label>
            <select
              value={householdInput.cookingFuel}
              onChange={(e) => setHouseholdInput({ ...householdInput, cookingFuel: e.target.value })}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="lpg_png">{dt.optLpg}</option>
              <option value="firewood">{dt.optFirewood}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">{dt.waterLabel}</label>
            <select
              value={householdInput.waterSource}
              onChange={(e) => setHouseholdInput({ ...householdInput, waterSource: e.target.value })}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="tap_treated">{dt.optPipedTap}</option>
              <option value="handpump">{dt.optHandpump}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">{dt.internetLabel}</label>
            <select
              value={householdInput.hasInternet}
              onChange={(e) => setHouseholdInput({ ...householdInput, hasInternet: e.target.value })}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="yes">{dt.optYes}</option>
              <option value="no">{dt.optNo}</option>
            </select>
          </div>
        </div>

        {/* Comparison Cards */}
        {comparisonResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {comparisonResult.metrics.map((m: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-1.5"
              >
                <span className="font-bold text-slate-300 block text-[11px]">{m.name}</span>
                <div className="text-white font-bold text-xs">
                  Yours: <span className="text-saffron-300">{m.yourHousehold}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  State Avg: <strong className="text-emerald-400">{m.stateAverage}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
