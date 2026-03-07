/**
 * Language Management Hook
 * Provides language switching and translation utilities
 * Supports: English, Traditional Chinese, Simplified Chinese, Japanese, Korean, Thai, Spanish
 */

import { useCallback, useEffect, useState } from 'react';

type SupportedLanguage = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'th' | 'es';

const LANGUAGE_STORAGE_KEY = 'nexus-language';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

interface UseLanguageReturn {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isLoading: boolean;
  supportedLanguages: Array<{ code: SupportedLanguage; name: string; nativeName: string }>;
}

/**
 * Hook to manage language preferences
 * Persists language choice to localStorage
 */
export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
    setIsLoading(false);
  }, []);

  // Handle language change
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (isSupportedLanguage(lang)) {
      setLanguageState(lang);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  const supportedLanguages = [
    { code: 'en' as SupportedLanguage, name: 'English', nativeName: 'English' },
    { code: 'zh-TW' as SupportedLanguage, name: 'Traditional Chinese', nativeName: '繁體中文' },
    { code: 'zh-CN' as SupportedLanguage, name: 'Simplified Chinese', nativeName: '简体中文' },
    { code: 'ja' as SupportedLanguage, name: 'Japanese', nativeName: '日本語' },
    { code: 'ko' as SupportedLanguage, name: 'Korean', nativeName: '한국어' },
    { code: 'th' as SupportedLanguage, name: 'Thai', nativeName: 'ไทย' },
    { code: 'es' as SupportedLanguage, name: 'Spanish', nativeName: 'Español' },
  ];

  return {
    language,
    setLanguage,
    isLoading,
    supportedLanguages,
  };
}

/**
 * Check if language is supported
 */
function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
  return (
    typeof lang === 'string' &&
    ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'th', 'es'].includes(lang)
  );
}

/**
 * Get browser language preference
 */
export function getBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.toLowerCase();

  // Map browser language to supported languages
  if (browserLang.startsWith('zh-hans') || browserLang === 'zh-cn') {
    return 'zh-CN';
  }
  if (browserLang.startsWith('zh')) {
    return 'zh-TW';
  }
  if (browserLang.startsWith('ja')) {
    return 'ja';
  }
  if (browserLang.startsWith('ko')) {
    return 'ko';
  }
  if (browserLang.startsWith('th')) {
    return 'th';
  }
  if (browserLang.startsWith('es')) {
    return 'es';
  }

  return 'en';
}

/**
 * Get language display name (English)
 */
export function getLanguageName(lang: SupportedLanguage): string {
  const names: Record<SupportedLanguage, string> = {
    en: 'English',
    'zh-TW': 'Traditional Chinese',
    'zh-CN': 'Simplified Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    th: 'Thai',
    es: 'Spanish',
  };
  return names[lang];
}

/**
 * Get language native name
 */
export function getLanguageNativeName(lang: SupportedLanguage): string {
  const nativeNames: Record<SupportedLanguage, string> = {
    en: 'English',
    'zh-TW': '繁體中文',
    'zh-CN': '简体中文',
    ja: '日本語',
    ko: '한국어',
    th: 'ไทย',
    es: 'Español',
  };
  return nativeNames[lang];
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(lang: SupportedLanguage): string {
  const flags: Record<SupportedLanguage, string> = {
    en: '🇺🇸',
    'zh-TW': '🇹🇼',
    'zh-CN': '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷',
    th: '🇹🇭',
    es: '🇪🇸',
  };
  return flags[lang];
}

/**
 * Get all supported languages
 */
export function getAllSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string; flag: string }> {
  const languages: SupportedLanguage[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'th', 'es'];
  return languages.map((lang) => ({
    code: lang,
    name: getLanguageName(lang),
    nativeName: getLanguageNativeName(lang),
    flag: getLanguageFlag(lang),
  }));
}
