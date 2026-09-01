"use client";

import React from "react";
import { useApp, FontScale } from "@/lib/context/AppContext";
import { Eye, Type, WifiOff, Contrast } from "lucide-react";

export function AccessibilityBar() {
  const {
    fontScale,
    setFontScale,
    dyslexiaFont,
    setDyslexiaFont,
    highContrast,
    setHighContrast,
    lowBandwidth,
    setLowBandwidth,
  } = useApp();

  const handleScaleChange = (next: FontScale) => {
    setFontScale(next);
    try {
      localStorage.setItem("jg_font_scale", next);
    } catch (e) {}
  };

  const toggleDyslexia = () => {
    const next = !dyslexiaFont;
    setDyslexiaFont(next);
    try {
      localStorage.setItem("jg_dyslexia", String(next));
    } catch (e) {}
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    try {
      localStorage.setItem("jg_contrast", String(next));
    } catch (e) {}
  };

  const toggleBandwidth = () => {
    const next = !lowBandwidth;
    setLowBandwidth(next);
    try {
      localStorage.setItem("jg_bandwidth", String(next));
    } catch (e) {}
  };

  return (
    <div className="w-full bg-navy-950/90 border-b border-saffron-500/15 py-1 px-4 text-xs flex flex-wrap items-center justify-between gap-2 z-40">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-slate-300">Digital Census 2027 Portal</span>
        <span className="hidden sm:inline text-slate-500">•</span>
        <span className="hidden sm:inline text-slate-400">Section 15 Confidentiality Assured</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
        {/* Font scale controls */}
        <div className="flex items-center bg-navy-900 border border-slate-800 rounded px-1 py-0.5">
          <span className="text-[10px] text-slate-400 px-1 font-mono">Text:</span>
          {(["sm", "md", "lg", "xl"] as FontScale[]).map((scale) => (
            <button
              key={scale}
              onClick={() => handleScaleChange(scale)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                fontScale === scale
                  ? "bg-saffron-500 text-navy-950 font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title={`Set text size to ${scale.toUpperCase()}`}
            >
              {scale === "sm" ? "A-" : scale === "md" ? "A" : scale === "lg" ? "A+" : "A++"}
            </button>
          ))}
        </div>

        {/* Dyslexia font toggle */}
        <button
          onClick={toggleDyslexia}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
            dyslexiaFont
              ? "bg-saffron-500/20 border-saffron-500 text-saffron-300"
              : "border-slate-800 text-slate-400 hover:text-white"
          }`}
          title="Toggle Dyslexia-friendly high legibility font"
        >
          <Type className="w-3 h-3" />
          <span className="hidden md:inline">Dyslexia Font</span>
        </button>

        {/* High Contrast toggle */}
        <button
          onClick={toggleContrast}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
            highContrast
              ? "bg-amber-400 text-navy-950 border-amber-400 font-bold"
              : "border-slate-800 text-slate-400 hover:text-white"
          }`}
          title="Toggle High Contrast Mode (WCAG AAA)"
        >
          <Contrast className="w-3 h-3" />
          <span className="hidden md:inline">Contrast</span>
        </button>

        {/* Low Bandwidth Mode toggle */}
        <button
          onClick={toggleBandwidth}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
            lowBandwidth
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
              : "border-slate-800 text-slate-400 hover:text-white"
          }`}
          title="Toggle Low Bandwidth / 2G-3G Optimized Text Mode"
        >
          <WifiOff className="w-3 h-3" />
          <span className="hidden md:inline">Low Bandwidth</span>
        </button>
      </div>
    </div>
  );
}
