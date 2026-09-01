"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context/AppContext";
import {
  X,
  ShieldCheck,
  Trash2,
  Lock,
  LogOut,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Eye
} from "lucide-react";

export function MyDataModal() {
  const { isMyDataModalOpen, setMyDataModalOpen, session, logout, addToast } = useApp();
  const [dataReport, setDataReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    if (isMyDataModalOpen) {
      fetchMyData();
    }
  }, [isMyDataModalOpen, session]);

  const fetchMyData = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (session?.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
      }
      const res = await fetch("/api/v1/privacy/my-data", { headers });
      const data = await res.json();
      setDataReport(data);
    } catch (e) {
      console.warn("Failed to fetch my data report:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRightToErasure = async () => {
    if (!confirm("Are you sure you want to execute your DPDP Right to Erasure? This will permanently delete all your practice drafts and session logs from our database.")) {
      return;
    }

    setIsErasing(true);
    try {
      const headers: Record<string, string> = {};
      if (session?.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
      }
      const res = await fetch("/api/v1/privacy/erase-me", {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        addToast("Right to Erasure executed. All data deleted.", "success");
        logout();
        setMyDataModalOpen(false);
      }
    } catch (e) {
      addToast("Failed to erase data.", "error");
    } finally {
      setIsErasing(false);
    }
  };

  if (!isMyDataModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-navy-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setMyDataModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">DPDP 2023 Data Transparency</h3>
            <p className="text-xs text-slate-400">Digital Personal Data Protection Act • Section 15 Compliance</p>
          </div>
        </div>

        {/* Identity Safeguards Banner */}
        <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Session ID:</span>
            <span className="font-mono text-emerald-300 font-bold">
              {session?.userId || "Guest Anonymous Session"}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Phone Identifier:</span>
            <span className="font-mono text-[11px] text-slate-300">
              {session?.phoneHash ? `${session.phoneHash.slice(0, 12)}... (Salted Hash)` : "None"}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Sensitive PII Stored:</span>
            <span className="font-bold text-emerald-400">Zero (No Aadhaar / No Biometrics)</span>
          </div>
        </div>

        {/* Active Stored Practice Drafts */}
        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-saffron-400" />
            Your Stored Practice Drafts ({dataReport?.totalDraftsStored || 0})
          </h4>

          {dataReport?.drafts && dataReport.drafts.length > 0 ? (
            <div className="space-y-2">
              {dataReport.drafts.map((d: any) => (
                <div
                  key={d.draftId}
                  className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">
                      State: {d.stateCode} • Step {d.step}/5
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: {d.referenceId}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.status === "submitted" ? "bg-emerald-500/20 text-emerald-300" : "bg-saffron-500/20 text-saffron-300"
                  }`}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-400 text-center">
              No saved practice enumeration drafts in this session.
            </div>
          )}
        </div>

        {/* Statutory Rights */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 mb-5 text-xs text-emerald-300 space-y-1">
          <span className="font-bold block">Your Guaranteed Rights under DPDP Act 2023:</span>
          <p className="text-[11px] text-slate-300">
            • Right to Access: You can inspect this data report anytime.<br />
            • Right to Correction: You can edit answers in the Practice Wizard.<br />
            • Right to Erasure: Click the button below to purge all your data instantly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleRightToErasure}
            disabled={isErasing}
            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900/80 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isErasing ? "Erasing..." : "Execute Right to Erasure (Delete All)"}
          </button>

          {session && (
            <button
              onClick={() => {
                logout();
                setMyDataModalOpen(false);
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
