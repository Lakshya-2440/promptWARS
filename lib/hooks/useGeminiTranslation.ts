"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/context/AppContext";

// Global in-memory cache across all components
const clientTranslationCache = new Map<string, any>();

/**
 * React Hook for dynamic Google Gemini AI Translation of any content
 * SSR-safe: matches server on initial render, hydrates asynchronously
 */
export function useGeminiTranslation<T extends Record<string, any> | string>(
  content: T,
  cacheNamespace: string = "default"
): { data: T; isLoading: boolean; error: string | null } {
  const { language } = useApp();
  const langCode = language?.code || "en";

  // Initial state always matches server HTML (English content)
  const [translatedData, setTranslatedData] = useState<T>(content);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (langCode === "en" || !content) {
      setTranslatedData(content);
      setIsLoading(false);
      return;
    }

    const cacheKey = `gemini_${cacheNamespace}_${langCode}`;

    // 1. Check in-memory client cache
    if (clientTranslationCache.has(cacheKey)) {
      setTranslatedData(clientTranslationCache.get(cacheKey));
      setIsLoading(false);
      return;
    }

    // 2. Check localStorage cache
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        clientTranslationCache.set(cacheKey, parsed);
        setTranslatedData(parsed);
        setIsLoading(false);
        return;
      }
    } catch (e) {}

    // 3. Fetch dynamic translation from Google Gemini 2.5 Flash API
    let isMounted = true;
    setIsLoading(true);

    const isString = typeof content === "string";
    const payload = isString
      ? { text: content, targetLangCode: langCode }
      : { dictionary: content, targetLangCode: langCode };

    fetch("/api/v1/i18n/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData.success) {
          const result = isString ? resData.translatedText : resData.translations;
          clientTranslationCache.set(cacheKey, result);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {}
          setTranslatedData(result);
        } else {
          setError(resData.error || "Translation failed");
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [langCode, cacheNamespace]);

  return { data: translatedData, isLoading, error };
}
