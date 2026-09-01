"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context/AppContext";
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useGeminiTranslation } from "@/lib/hooks/useGeminiTranslation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
  groundingContext?: string[];
  latencyMs?: number;
}

export function AiAssistantDrawer() {
  const {
    language,
    dict,
    isAssistantOpen,
    setAssistantOpen,
    assistantInitialPrompt,
    openAssistantWithPrompt,
    selectedStateCode,
    addToast
  } = useApp();

  const { data: floatingBtnText } = useGeminiTranslation("Ask Jan Ganana Sathi AI", "ai_btn");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: dict.assistantGreeting,
      source: "official_knowledge_base",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ratedMessages, setRatedMessages] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle initial prompt passed from elsewhere in app
  useEffect(() => {
    if (assistantInitialPrompt && isAssistantOpen) {
      handleSend(assistantInitialPrompt);
    }
  }, [assistantInitialPrompt, isAssistantOpen]);

  const SPEECH_LOCALE_MAP: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    te: "te-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    gu: "gu-IN",
    ur: "ur-IN",
    kn: "kn-IN",
    or: "or-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    as: "as-IN",
    mai: "hi-IN",
    sat: "hi-IN",
    sa: "sa-IN",
  };

  // Sync welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "msg-welcome") {
        return [{ id: "msg-welcome", role: "assistant", content: dict.assistantGreeting, source: "official_knowledge_base" }];
      }
      return prev;
    });
  }, [dict]);

  // Web Speech API - Speech to Text setup
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = SPEECH_LOCALE_MAP[language.code] || "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      addToast("Speech recognition not supported in this browser.", "warning");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      addToast("Voice narration not supported on this browser.", "warning");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LOCALE_MAP[language.code] || "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          language: language.name,
          context: { stateCode: selectedStateCode },
          conversationHistory: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.answer || "I apologize, but I could not retrieve official guidance for this query.",
        source: data.modelUsed || "local_rag",
        groundingContext: data.groundingContext || [],
        latencyMs: data.latencyMs,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: "assistant",
          content: "Under Section 15 of Census Act 1948, your data is safe. For real-time updates on your state's schedule, please check the State Schedule tab.",
          source: "offline_fallback",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (msgId: string, query: string, answer: string, rating: number) => {
    setRatedMessages((prev) => ({ ...prev, [msgId]: rating }));
    try {
      await fetch("/api/v1/assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, answer, rating }),
      });
      addToast("Thank you for your rating!", "success");
    } catch (e) {}
  };

  const resetChat = () => {
    setMessages([
      {
        id: "msg-welcome-reset",
        role: "assistant",
        content: dict.assistantGreeting,
        source: "official_knowledge_base",
      },
    ]);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isAssistantOpen) {
    return (
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-saffron-500 via-amber-500 to-emerald-600 text-navy-950 font-black shadow-2xl hover:scale-105 transition-all group"
        aria-label="Open Jan Ganana Sathi AI Assistant"
      >
        <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: "4s" }} />
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          {floatingBtnText}
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-navy-950" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] bg-navy-950/95 border border-saffron-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-navy-900 via-navy-850 to-slate-900 border-b border-saffron-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-saffron-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm text-white">Jan Ganana Sathi</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official RAG
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Grounded GenAI Census Assistant ({language.name})</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={resetChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAssistantOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => {
          const isAsst = m.role === "assistant";
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {isAsst && (
                <div className="w-6 h-6 rounded-md bg-saffron-500/20 border border-saffron-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-saffron-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-navy-950 font-medium rounded-tr-none"
                    : "bg-navy-900/90 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {isAsst && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {m.source?.includes("llama") ? "Llama-3.1-8B" : "RAG Grounded"}
                      {m.latencyMs ? ` • ${m.latencyMs}ms` : ""}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakText(m.content)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3 text-saffron-400" />
                      </button>
                      <button
                        onClick={() => handleRating(m.id, "", m.content, 1)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          ratedMessages[m.id] === 1 ? "text-emerald-400" : "text-slate-400"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRating(m.id, "", m.content, 0)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          ratedMessages[m.id] === 0 ? "text-rose-400" : "text-slate-400"
                        }`}
                        title="Not accurate"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs">
            <div className="w-6 h-6 rounded-md bg-saffron-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-saffron-400 animate-spin" />
            </div>
            <div className="bg-navy-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 font-medium ml-1">Consulting Census 2027 Knowledge Base...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-3 py-1.5 bg-navy-900/60 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
        {dict.quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-navy-800/80 border border-slate-700 text-slate-300 hover:border-saffron-500/50 hover:text-saffron-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-navy-900 border-t border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2 rounded-xl border transition-colors ${
            isListening
              ? "bg-rose-500 text-white border-rose-400 animate-pulse"
              : "bg-navy-800 border-slate-700 text-slate-400 hover:text-white"
          }`}
          title={isListening ? "Listening... click to stop" : "Voice Input (Speech to Text)"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-saffron-400" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={dict.assistantPlaceholder}
          className="flex-1 bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-saffron-500"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-xl bg-saffron-500 hover:bg-saffron-400 disabled:opacity-40 text-navy-950 font-bold transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
