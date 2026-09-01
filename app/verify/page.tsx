"use client";

import React, { useState } from "react";
import { MYTHS_AND_FACTS } from "@/lib/db/seed-data";
import { useApp } from "@/lib/context/AppContext";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Send,
  Sparkles,
  PhoneCall,
  FileWarning,
  Scale,
  Check,
  X
} from "lucide-react";

import { getLocalizedMyth } from "@/lib/i18n/content-translations";
import { QuickVerifyResult } from "@/types/census";

export default function VerifyPage() {
  const { addToast, openAssistantWithPrompt, dict, language } = useApp();

  const [messageText, setMessageText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<QuickVerifyResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMythCat, setSelectedMythCat] = useState("all");

  const sampleMessages = [
    {
      label: language.code === "hi" ? "फर्जी शुल्क जबरन वसूली संदेश" : "Fake Fee Extortion Scam",
      text: language.code === "hi"
        ? "अति आवश्यक: आपके पते के लिए जनगणना 2027 हाउस लिस्टिंग लंबित है। ₹50 शुल्क http://census-india-online.top पर तुरंत जमा करें अन्यथा ₹5,000 का जुर्माना लगेगा।"
        : "URGENT: Census 2027 House Listing pending for your address. Pay ₹50 processing fee at http://census-india-online.top or face ₹5,000 fine.",
    },
    {
      label: language.code === "hi" ? "आधार व ओटीपी फिशिंग" : "Aadhaar & OTP Phishing",
      text: language.code === "hi"
        ? "जनगणना कार्यालय: डिजिटल जनगणना प्रमाणपत्र हेतु अपने आधार लिंक को सत्यापित करने के लिए 6 अंकों का ओटीपी साझा करें।"
        : "Census Bureau: Please share your 6-digit OTP code to verify your Aadhaar link for digital enumeration certificate.",
    },
    {
      label: language.code === "hi" ? "आधिकारिक सरकारी सूचना" : "Official Genuine Broadcast",
      text: language.code === "hi"
        ? "आधिकारिक महारजिस्ट्रार सूचना: दिल्ली के लिए मकान सूचीकरण (चरण 1) 1 मई 2026 से आरंभ होगा। आधिकारिक पोर्टल: censusindia.gov.in."
        : "Official ORGI Notice: House Listing & Housing Census (Phase 1) for Delhi will commence from May 1, 2026. Self-enumeration portal: censusindia.gov.in.",
    },
  ];

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/v1/assistant/verify-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText.trim() }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (e) {
      addToast("Failed to verify message.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mythCategories = ["all", "Financial / Scams", "Documents & Privacy", "Legal Protection", "Process"];

  const filteredMyths = MYTHS_AND_FACTS.filter(
    (m) => selectedMythCat === "all" || m.category === selectedMythCat
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Misinformation Defense & Privacy Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
          {dict.verifyTitle}
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {dict.verifySubtitle}
        </p>
      </div>

      {/* Main Grid: AI Verifier (Left) & Legal Shield (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Left: AI Message Verifier (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 sm:p-8 border border-saffron-500/30 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">
                {dict.verifyMsgTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {dict.verifyMsgDesc}
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={dict.verifyMsgPlaceholder}
                className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-saffron-500 font-sans resize-none"
              />
            </div>

            {/* Quick Test Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">
                {language.code === "hi" ? "या नमूना संदेशों के साथ परीक्षण करें:" : "Or test with sample scam/genuine cases:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleMessages.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessageText(sample.text);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 hover:border-saffron-500 hover:text-white transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !messageText.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-400 hover:to-amber-500 disabled:opacity-50 text-navy-950 font-black text-xs shadow-saffron-glow transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isAnalyzing ? "Classifying with GenAI..." : dict.verifyMsgButton}
            </button>
          </form>

          {/* Analysis Result Drawer */}
          {analysisResult && (
            <div
              className={`p-5 rounded-2xl border text-xs animate-in fade-in duration-200 ${
                analysisResult.isScam
                  ? "bg-rose-950/90 border-rose-500/50 text-rose-100"
                  : "bg-emerald-950/90 border-emerald-500/50 text-emerald-100"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  {analysisResult.isScam ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest block opacity-75">
                      CLASSIFICATION VERDICT
                    </span>
                    <span className="font-display font-black text-base tracking-wide">
                      {analysisResult.verdict}
                    </span>
                  </div>
                </div>

                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-black/40 border border-white/10 font-bold">
                  {Math.round(analysisResult.confidenceScore * 100)}% Confidence
                </span>
              </div>

              <p className="leading-relaxed mb-4 text-xs">{analysisResult.explanation}</p>

              {analysisResult.redFlags && analysisResult.redFlags.length > 0 && (
                <div className="mb-4 bg-black/30 p-3 rounded-xl border border-rose-500/20 space-y-1.5">
                  <span className="font-bold text-rose-300 block">Identified Red Flags:</span>
                  {analysisResult.redFlags.map((flag: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-rose-200">
                      <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-1">
                <span className="font-bold text-white block">Official Protective Steps:</span>
                <p className="text-slate-200">{analysisResult.officialAdvice}</p>
                <div className="pt-2 text-[10px] text-slate-400 flex flex-wrap gap-3">
                  <span>📞 Helpline: 1800-11-2027</span>
                  <span>🛡️ Cyber Helpline: 1930</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Statutory Privacy & Legal Shield (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Section 15, Census Act 1948
                </h3>
                <span className="text-xs text-emerald-400 font-semibold">
                  Absolute Statutory Confidentiality
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language.code === "hi"
                ? "भारतीय कानून के तहत, व्यक्तिगत जनगणना प्रविष्टियां पूर्णतः गोपनीय हैं और किसी भी न्यायालय, पुलिस विभाग या कर प्राधिकरण द्वारा तलब नहीं की जा सकतीं।"
                : "Under Indian law, individual census schedules are strictly confidential and cannot be inspected or subpoenaed by any court of law, police department, tax authority, or commercial organization."}
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{language.code === "hi" ? "दीवानी/आपराधिक मामलों में साक्ष्य के रूप में अग्राह्य।" : "Inadmissible as evidence in civil/criminal proceedings."}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{language.code === "hi" ? "केवल अज्ञातकृत सांख्यिकीय तालिकाएं ही प्रकाशित होती हैं।" : "Only aggregated statistical tables are ever published."}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{language.code === "hi" ? "शून्य आधार नंबर या बायोमेट्रिक्स एकत्र।" : "Zero Aadhaar numbers or biometrics collected."}</span>
              </div>
            </div>
          </div>

          {/* Phishing Warning Card */}
          <div className="glass-card rounded-2xl p-6 border border-amber-500/30 space-y-3">
            <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-amber-400" />
              {language.code === "hi" ? "नागरिकों के लिए स्वर्णिम नियम" : "Golden Rules for Citizens"}
            </h4>
            <ul className="text-xs text-slate-300 space-y-2">
              <li>
                <strong>1. {language.code === "hi" ? "जनगणना 100% निःशुल्क है:" : "Census is 100% Free:"}</strong> {language.code === "hi" ? "कभी भी कोई शुल्क न दें और न ही यूपीआई क्यूआर कोड स्कैन करें।" : "Never pay any fee or scan any UPI QR code."}
              </li>
              <li>
                <strong>2. {language.code === "hi" ? "वेबसाइट पते की जांच करें:" : "Verify Web Addresses:"}</strong> {language.code === "hi" ? "आधिकारिक पोर्टल केवल .gov.in या .nic.in पर समाप्त होते हैं।" : "Official sites end strictly in .gov.in or .nic.in."}
              </li>
              <li>
                <strong>3. {language.code === "hi" ? "ओटीपी की मांग नहीं:" : "No OTP Demands:"}</strong> {language.code === "hi" ? "प्रगणक कभी भी बैंकिंग ओटीपी या पिन नहीं मांगते।" : "Enumerators never ask for banking OTPs or PINs."}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Myth vs Fact Carousel / Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-display font-black text-white">
              {dict.mythBustersTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {language.code === "hi"
                ? "डिजिटल जनगणना 2027 से संबंधित सोशल मीडिया पर फैलाई जाने वाली अफवाहों का सच।"
                : "Debunking rumors circulated on social media regarding Census 2027."}
            </p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {mythCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedMythCat(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedMythCat === cat
                    ? "bg-saffron-500 text-navy-950 font-bold"
                    : "bg-navy-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {cat === "all" ? (language.code === "hi" ? "सभी अफवाहें" : "All Myths") : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMyths.map((item) => {
            const locMyth = getLocalizedMyth(item, language.code);
            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Myth */}
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs mb-3">
                    <span className="font-bold text-rose-400 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <X className="w-3 h-3 text-rose-400" /> {dict.falseMyth}:
                    </span>
                    <p className="text-rose-200 font-medium">"{locMyth.myth}"</p>
                  </div>

                  {/* Fact */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                    <span className="font-bold text-emerald-400 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> {dict.verifiedFact}:
                    </span>
                    <p className="text-emerald-100">{locMyth.fact}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Ref: {locMyth.officialRef}</span>
                  <span className="font-mono text-saffron-400/80">{locMyth.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
