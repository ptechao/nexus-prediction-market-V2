/**
 * Translation Hook
 * Provides access to translations for the current language
 */

import { useLanguage } from './useLanguage';
import en from '../../../messages/en.json';
import zhTW from '../../../messages/zh-TW.json';
import es from '../../../messages/es.json';

type SupportedLanguage = 'en' | 'zh-TW' | 'es';

type TranslationKeys = typeof en;

interface UseTranslationReturn {
  t: (key: string) => string;
  language: SupportedLanguage;
}

/**
 * Hook to access translations for the current language
 * Usage: const { t } = useTranslation();
 *        const text = t('common.connectWallet');
 */
export function useTranslation(): UseTranslationReturn {
  const { language } = useLanguage();

  // Get translation object for current language
  const getTranslations = (): TranslationKeys => {
    switch (language) {
      case 'zh-TW':
        return zhTW as unknown as TranslationKeys;
      case 'es':
        return es as unknown as TranslationKeys;
      case 'en':
      default:
        return en;
    }
  };

  const translations = getTranslations();

  /**
   * Get translation by dot-notation key
   * Example: t('common.connectWallet') -> 'Connect Wallet'
   */
  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: unknown = translations;

      for (const k of keys) {
        if (typeof value === 'object' && value !== null && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          // Return key if translation not found
          return key;
        }
      }

      return typeof value === 'string' ? value : key;
    } catch {
      return key;
    }
  };

  return {
    t,
    language: language as SupportedLanguage,
  };
}

/**
 * Get all translations for a namespace
 * Example: getTranslationNamespace('markets') -> { title: '...', subtitle: '...' }
 */
export function getTranslationNamespace(namespace: string, language: SupportedLanguage) {
  const translations = language === 'zh-TW' ? zhTW : language === 'es' ? es : en;
  return (translations as Record<string, unknown>)[namespace] || {};
}

/**
 * Batch translate multiple keys
 */
export function useTranslationBatch(keys: string[]): Record<string, string> {
  const { t } = useTranslation();
  return keys.reduce(
    (acc, key) => {
      acc[key] = t(key);
      return acc;
    },
    {} as Record<string, string>
  );
}
