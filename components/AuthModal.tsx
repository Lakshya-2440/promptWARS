"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import { X, ShieldCheck, Smartphone, KeyRound, Sparkles, CheckCircle2 } from "lucide-react";

const isSandboxDemo = process.env.NODE_ENV !== "production";

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login, addToast } = useApp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) {
      addToast("Please enter a valid 10-digit mobile number.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      const receivedDemoCode = typeof data.demoOtp === "string" ? data.demoOtp : null;
      setDemoCode(receivedDemoCode);
      setStep("otp");
      addToast(
        receivedDemoCode ? "OTP sent. Sandbox code provided." : "OTP sent to mobile number.",
        "success",
      );
    } catch (err: any) {
      addToast(err.message || "Failed to send OTP.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp) {
      addToast("Please enter 6-digit OTP code.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP code");

      login(data.token, data.userId, data.phoneHash, data.role || "citizen");
      setAuthModalOpen(false);
    } catch (err: any) {
      addToast(err.message || "Authentication failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fillSandboxDemo = () => {
    if (!isSandboxDemo) return;
    setPhone("9876543210");
    setOtp("123456");
    setStep("otp");
    setDemoCode("123456");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-navy-900 border border-saffron-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-saffron-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">Citizen Sandbox Login</h3>
            <p className="text-xs text-slate-400">Secure OTP Session • DPDP Act 2023 Compliant</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 mb-5 flex items-start gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Zero Plain-text Storage:</span> Your mobile number is converted to a salted SHA-256 hash. No Aadhaar or password is ever requested.
          </div>
        </div>

        {isSandboxDemo && (
          <button
            type="button"
            onClick={fillSandboxDemo}
            className="w-full mb-4 py-2 px-3 rounded-xl bg-gradient-to-r from-saffron-500/20 to-amber-500/20 border border-saffron-500/40 text-saffron-300 hover:bg-saffron-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
            Auto-Fill Sandbox Demo Credentials (9876543210 / 123456)
          </button>
        )}

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Indian Mobile Number
              </label>
              <div className="flex items-center bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-saffron-500">
                <span className="text-xs font-bold text-slate-400 mr-2">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length < 10}
              className="w-full py-3 rounded-xl bg-saffron-500 hover:bg-saffron-400 disabled:opacity-50 text-navy-950 font-bold text-sm shadow-md transition-colors"
            >
              {isLoading ? "Sending OTP..." : "Get Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Enter 6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-[11px] text-saffron-400 hover:underline"
                >
                  Change Number
                </button>
              </div>

              {demoCode && (
                <div className="mb-2 p-2 rounded-lg bg-navy-950 border border-saffron-500/30 text-[11px] text-saffron-300 font-mono flex items-center justify-between">
                  <span>Sandbox Code: <strong>{demoCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(demoCode)}
                    className="text-xs text-saffron-400 hover:underline font-bold"
                  >
                    Click to Use
                  </button>
                </div>
              )}

              <div className="flex items-center bg-navy-950 border border-slate-700 rounded-xl px-3 py-2.5 focus-within:border-saffron-500">
                <KeyRound className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter code"
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-600 font-mono tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !otp}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-navy-950 font-black text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? "Verifying..." : "Verify & Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
