"use client";

import React from "react";
import { useApp } from "@/lib/context/AppContext";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const isWarning = t.type === "warning";

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-2.5 text-xs text-white backdrop-blur-xl animate-in slide-in-from-top-3 duration-150 ${
              isSuccess
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100"
                : isError
                ? "bg-rose-950/90 border-rose-500/40 text-rose-100"
                : isWarning
                ? "bg-amber-950/90 border-amber-500/40 text-amber-100"
                : "bg-navy-900/90 border-saffron-500/30 text-slate-100"
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="w-4 h-4 text-saffron-400 shrink-0 mt-0.5" />}

            <div className="flex-1 font-medium leading-snug">{t.message}</div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
