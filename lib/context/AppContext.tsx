"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SUPPORTED_LANGUAGES, Language, getLanguage } from "@/lib/i18n/languages";
import { getDictionary, TranslationDictionary } from "@/lib/i18n/dictionaries";

export type FontScale = "sm" | "md" | "lg" | "xl";

export interface UserSession {
  userId: string;
  phoneHash: string;
  role: "citizen" | "admin";
  token?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AppContextType {
  // Language & Translation
  language: Language;
  setLanguageCode: (code: string) => void;
  dict: TranslationDictionary;
  translateDynamic: (text: string) => Promise<string>;
  
  // Accessibility
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  dyslexiaFont: boolean;
  setDyslexiaFont: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (val: boolean) => void;

  // Authentication & DPDP
  session: UserSession | null;
  login: (token: string, userId: string, phoneHash: string, role?: "citizen" | "admin") => void;
  logout: () => void;

  // Selected State
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;

  // Global AI Assistant Drawer
  isAssistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  assistantInitialPrompt: string;
  openAssistantWithPrompt: (prompt: string) => void;

  // Modals
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isMyDataModalOpen: boolean;
  setMyDataModalOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [langCode, setLangCode] = useState<string>("en");
  const [fontScale, setFontScale] = useState<FontScale>("md");
  const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);

  const [session, setSession] = useState<UserSession | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string>("GA");

  const [isAssistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string>("");

  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isMyDataModalOpen, setMyDataModalOpen] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeDict, setActiveDict] = useState<TranslationDictionary>(getDictionary("en"));

  // Dynamic AI API Translation function
  const translateDynamic = async (text: string): Promise<string> => {
    if (!text || langCode === "en") return text;
    try {
      const res = await fetch("/api/v1/i18n/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLangCode: langCode }),
      });
      const data = await res.json();
      return data?.translatedText || text;
    } catch (e) {
      return text;
    }
  };

  // Fetch dynamic translation from Google Gemini API on language change
  useEffect(() => {
    if (langCode === "en") {
      setActiveDict(getDictionary("en"));
      return;
    }

    const cacheKey = `gemini_dict_${langCode}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setActiveDict(JSON.parse(cached));
        return;
      }
    } catch (e) {}

    // Call Google Gemini 2.5 Flash API endpoint
    fetch("/api/v1/i18n/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dictionary: getDictionary("en"),
        targetLangCode: langCode,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.translations) {
          setActiveDict((prev) => ({ ...prev, ...data.translations }));
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data.translations));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.warn("Dynamic Gemini dictionary translation fallback:", err);
      });
  }, [langCode]);

  // Load persisted user preferences
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("jg_lang");
      if (savedLang) setLangCode(savedLang);

      const savedToken = localStorage.getItem("jg_token");
      const savedUserId = localStorage.getItem("jg_user_id");
      const savedHash = localStorage.getItem("jg_phone_hash");
      const savedRole = localStorage.getItem("jg_role") as any;

      if (savedToken && savedUserId) {
        setSession({
          token: savedToken,
          userId: savedUserId,
          phoneHash: savedHash || "",
          role: savedRole || "citizen",
        });
      }

      const savedScale = localStorage.getItem("jg_font_scale") as FontScale;
      if (savedScale) setFontScale(savedScale);

      if (localStorage.getItem("jg_dyslexia") === "true") setDyslexiaFont(true);
      if (localStorage.getItem("jg_contrast") === "true") setHighContrast(true);
      if (localStorage.getItem("jg_bandwidth") === "true") setLowBandwidth(true);
    } catch (e) {
      // LocalStorage access fallback
    }
  }, []);

  const setLanguageCode = (code: string) => {
    setLangCode(code);
    try {
      localStorage.setItem("jg_lang", code);
    } catch (e) {}
  };

  const login = (token: string, userId: string, phoneHash: string, role: "citizen" | "admin" = "citizen") => {
    const user = { token, userId, phoneHash, role };
    setSession(user);
    try {
      localStorage.setItem("jg_token", token);
      localStorage.setItem("jg_user_id", userId);
      localStorage.setItem("jg_phone_hash", phoneHash);
      localStorage.setItem("jg_role", role);
    } catch (e) {}
    addToast("Signed in securely.", "success");
  };

  const logout = () => {
    setSession(null);
    try {
      localStorage.removeItem("jg_token");
      localStorage.removeItem("jg_user_id");
      localStorage.removeItem("jg_phone_hash");
      localStorage.removeItem("jg_role");
    } catch (e) {}
    addToast("Logged out.", "info");
  };

  const openAssistantWithPrompt = (prompt: string) => {
    setAssistantInitialPrompt(prompt);
    setAssistantOpen(true);
  };

  const addToast = (message: string, type: ToastMessage["type"] = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const language = getLanguage(langCode);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguageCode,
        dict: activeDict,
        translateDynamic,
        fontScale,
        setFontScale,
        dyslexiaFont,
        setDyslexiaFont,
        highContrast,
        setHighContrast,
        lowBandwidth,
        setLowBandwidth,
        session,
        login,
        logout,
        selectedStateCode,
        setSelectedStateCode,
        isAssistantOpen,
        setAssistantOpen,
        assistantInitialPrompt,
        openAssistantWithPrompt,
        isAuthModalOpen,
        setAuthModalOpen,
        isMyDataModalOpen,
        setMyDataModalOpen,
        toasts,
        addToast,
        removeToast,
      }}
    >
      <div
        className={`min-h-screen ${dyslexiaFont ? "dyslexia-font" : ""} ${highContrast ? "high-contrast-mode" : ""} ${lowBandwidth ? "low-bandwidth-mode" : ""} font-scale-${fontScale}`}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
