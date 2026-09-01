"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import {
  Globe,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Menu,
  X,
  FileCheck,
  Calendar,
  Layers,
  Database,
  Lock,
  ShieldAlert
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const {
    language,
    setLanguageCode,
    dict,
    session,
    setAuthModalOpen,
    setMyDataModalOpen,
    setAssistantOpen,
  } = useApp();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks = [
    { href: "/explainer", label: dict.twoPhaseBtn, icon: Layers },
    { href: "/schedule", label: dict.scheduleBtn, icon: Calendar },
    { href: "/wizard", label: dict.wizardBtn, icon: FileCheck },
    { href: "/verify", label: dict.verifyBtn, icon: ShieldAlert },
    { href: "/data", label: dict.dataBtn, icon: Database },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-saffron-500/20 bg-navy-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-saffron-500 via-amber-600 to-emerald-600 p-0.5 shadow-saffron-glow group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <span className="font-serif font-black text-lg sm:text-xl text-saffron-400">जन</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-base sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              {dict.appName}
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
                2027
              </span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
              National Digital Census Companion
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-navy-900/60 p-1.5 rounded-full border border-slate-800/80">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-navy-950 shadow-md font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-navy-950" : "text-saffron-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 16-Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-saffron-500/50 transition-colors"
              title="Switch to any of the 16 official Scheduled Languages"
              suppressHydrationWarning
            >
              <Globe className="w-3.5 h-3.5 text-saffron-400" />
              <span className="hidden sm:inline" suppressHydrationWarning>{language.nativeName}</span>
              <span className="sm:hidden" suppressHydrationWarning>{language.code.toUpperCase()}</span>
            </button>

            {isLangDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-navy-900 border border-saffron-500/30 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setLangDropdownOpen(false)}
              >
                <div className="col-span-2 px-2 py-1 text-[10px] uppercase font-bold text-saffron-400 tracking-wider border-b border-slate-800 mb-1">
                  16 Scheduled Languages (Schedule VIII)
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguageCode(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`flex flex-col text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      language.code === lang.code
                        ? "bg-saffron-500/20 text-saffron-300 font-bold border border-saffron-500/40"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="font-semibold">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Sathi quick launcher */}
          <button
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-saffron-500/20 border border-saffron-500/40 text-saffron-300 hover:bg-saffron-500/30 text-xs font-bold transition-all shadow-sm"
            title="Ask AI Sathi"
          >
            <Sparkles className="w-3.5 h-3.5 text-saffron-400 animate-pulse" />
            <span className="hidden md:inline">AI Sathi</span>
          </button>

          {/* DPDP My Data button */}
          <button
            onClick={() => setMyDataModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
            title="DPDP Act 2023 Data Transparency"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{dict.myDataBtn}</span>
          </button>

          {/* User / Login state */}
          {session ? (
            <button
              onClick={() => setMyDataModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{session.userId.slice(0, 10)}...</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-400 hover:to-amber-500 text-navy-950 text-xs font-black shadow-md transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{dict.loginBtn}</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-navy-900 border border-slate-700 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-navy-950 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-saffron-500 text-navy-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-navy-950" : "text-saffron-400"}`} />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex justify-between gap-2">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Admin Console & Schedule Editor
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
