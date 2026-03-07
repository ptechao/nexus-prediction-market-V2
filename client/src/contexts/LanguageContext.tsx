import React, { createContext, useContext, useEffect, useState } from 'react';

type SupportedLanguage = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'th' | 'es';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'nexus-language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    if (isSupportedLanguage(lang)) {
      setLanguageState(lang);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}

function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
  return (
    typeof lang === 'string' &&
    ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'th', 'es'].includes(lang)
  );
}
