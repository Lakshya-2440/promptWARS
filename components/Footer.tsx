"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";
import { ShieldCheck, ExternalLink, Scale, CheckCircle2 } from "lucide-react";

const FOOTER_ENGLISH = {
  subTitle: "Digital Census 2027 Citizen Companion",
  section15Header: "Section 15, Census Act 1948 Statutory Protection:",
  section15Body: "All individual census records are strictly confidential and inadmissible in any court of law. No Aadhaar or biometrics are collected.",
  officialPortals: "Official Portals",
  privacyGov: "Privacy & Governance",
  myData: "DPDP 2023: My Stored Data",
  phaseGuide: "Two-Phase Architecture (HLO vs PE)",
  scheduleCal: "State Rollout Calendar",
  verifyTool: "Scam & Misinformation Verifier",
  adminConsole: "Admin Console (Schedule Editor)",
  copyright: "© 2026–2027 Jan Ganana AI Citizen Awareness Companion • Built for Bharat Digital Census",
  dpdpCompliant: "DPDP 2023 Compliant",
  officialLangs: "16 Official Languages",
};

export function Footer() {
  const { dict, setMyDataModalOpen } = useApp();
  const { data: ft } = useGeminiTranslation(FOOTER_ENGLISH, "footer");

  return (
    <footer className="w-full border-t border-slate-800/80 bg-navy-950/95 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20 relative overflow-hidden">
      {/* Background Jaali Accent */}
      <div className="absolute inset-0 jaali-bg opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Identity & Legal Protection */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500 to-emerald-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-navy-950 rounded-[6px] flex items-center justify-center">
                <span className="font-serif font-bold text-saffron-400 text-sm">जन</span>
              </div>
            </div>
            <div>
              <span className="font-display font-black text-lg text-white">{dict.appName}</span>
              <p className="text-xs text-slate-400">{ft.subTitle}</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-400 max-w-lg">
            {dict.disclaimer}
          </p>

          <div className="p-3 rounded-xl bg-navy-900/80 border border-saffron-500/20 flex items-start gap-3 max-w-lg">
            <ShieldCheck className="w-5 h-5 text-saffron-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-saffron-300 block">{ft.section15Header}</span>
              <span className="text-slate-300">{ft.section15Body}</span>
            </div>
          </div>
        </div>

        {/* Col 2: Official Government Portals */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-saffron-400" />
            {ft.officialPortals}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://censusindia.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-saffron-300 transition-colors flex items-center gap-1"
              >
                ORGI Census Portal (censusindia.gov.in)
              </a>
            </li>
            <li>
              <a
                href="https://factcheck.pib.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-saffron-300 transition-colors flex items-center gap-1"
              >
                PIB Fact Check (Counter Fake News)
              </a>
            </li>
            <li>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-saffron-300 transition-colors flex items-center gap-1"
              >
                National Cyber Crime Helpline (1930)
              </a>
            </li>
            <li>
              <a
                href="https://mha.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-saffron-300 transition-colors flex items-center gap-1"
              >
                Ministry of Home Affairs (MHA)
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: DPDP & Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            {ft.privacyGov}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => setMyDataModalOpen(true)}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <CheckCircle2 className="w-3 h-3" />
                {ft.myData}
              </button>
            </li>
            <li>
              <Link href="/explainer" className="hover:text-white transition-colors">
                {ft.phaseGuide}
              </Link>
            </li>
            <li>
              <Link href="/schedule" className="hover:text-white transition-colors">
                {ft.scheduleCal}
              </Link>
            </li>
            <li>
              <Link href="/verify" className="hover:text-white transition-colors">
                {ft.verifyTool}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-slate-500 hover:text-slate-300 transition-colors">
                {ft.adminConsole}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          {ft.copyright}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {ft.dpdpCompliant}
          </span>
          <span>{ft.officialLangs}</span>
        </div>
      </div>
    </footer>
  );
}
