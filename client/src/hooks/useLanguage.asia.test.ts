import { describe, it, expect } from 'vitest';
import {
  getLanguageName,
  getLanguageNativeName,
  getLanguageFlag,
  getAllSupportedLanguages,
} from './useLanguage';

describe('useLanguage - Asia Market Support', () => {
  describe('getLanguageName', () => {
    it('should return English name for all supported languages', () => {
      expect(getLanguageName('en')).toBe('English');
      expect(getLanguageName('zh-TW')).toBe('Traditional Chinese');
      expect(getLanguageName('zh-CN')).toBe('Simplified Chinese');
      expect(getLanguageName('ja')).toBe('Japanese');
      expect(getLanguageName('ko')).toBe('Korean');
      expect(getLanguageName('th')).toBe('Thai');
      expect(getLanguageName('es')).toBe('Spanish');
    });
  });

  describe('getLanguageNativeName', () => {
    it('should return native name for all supported languages', () => {
      expect(getLanguageNativeName('en')).toBe('English');
      expect(getLanguageNativeName('zh-TW')).toBe('繁體中文');
      expect(getLanguageNativeName('zh-CN')).toBe('简体中文');
      expect(getLanguageNativeName('ja')).toBe('日本語');
      expect(getLanguageNativeName('ko')).toBe('한국어');
      expect(getLanguageNativeName('th')).toBe('ไทย');
      expect(getLanguageNativeName('es')).toBe('Español');
    });
  });

  describe('getLanguageFlag', () => {
    it('should return correct flag emoji for each language', () => {
      expect(getLanguageFlag('en')).toBe('🇺🇸');
      expect(getLanguageFlag('zh-TW')).toBe('🇹🇼');
      expect(getLanguageFlag('zh-CN')).toBe('🇨🇳');
      expect(getLanguageFlag('ja')).toBe('🇯🇵');
      expect(getLanguageFlag('ko')).toBe('🇰🇷');
      expect(getLanguageFlag('th')).toBe('🇹🇭');
      expect(getLanguageFlag('es')).toBe('🇪🇸');
    });
  });

  describe('getAllSupportedLanguages', () => {
    it('should return all 7 supported languages', () => {
      const languages = getAllSupportedLanguages();
      expect(languages).toHaveLength(7);
    });

    it('should include all required language properties', () => {
      const languages = getAllSupportedLanguages();
      languages.forEach((lang) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(lang).toHaveProperty('flag');
      });
    });

    it('should have correct language codes', () => {
      const languages = getAllSupportedLanguages();
      const codes = languages.map((l) => l.code);
      expect(codes).toEqual(['en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'th', 'es']);
    });

    it('should have non-empty names and native names', () => {
      const languages = getAllSupportedLanguages();
      languages.forEach((lang) => {
        expect(lang.name.length).toBeGreaterThan(0);
        expect(lang.nativeName.length).toBeGreaterThan(0);
      });
    });

    it('should have valid flag emojis', () => {
      const languages = getAllSupportedLanguages();
      languages.forEach((lang) => {
        // Flags are typically 2 characters (emoji)
        expect(lang.flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CJK and Thai language support', () => {
    it('should support Simplified Chinese (zh-CN)', () => {
      expect(getLanguageNativeName('zh-CN')).toContain('简体');
      expect(getLanguageFlag('zh-CN')).toBe('🇨🇳');
    });

    it('should support Traditional Chinese (zh-TW)', () => {
      expect(getLanguageNativeName('zh-TW')).toContain('繁體');
      expect(getLanguageFlag('zh-TW')).toBe('🇹🇼');
    });

    it('should support Japanese (ja)', () => {
      expect(getLanguageNativeName('ja')).toContain('日本');
      expect(getLanguageFlag('ja')).toBe('🇯🇵');
    });

    it('should support Korean (ko)', () => {
      expect(getLanguageNativeName('ko')).toContain('한');
      expect(getLanguageFlag('ko')).toBe('🇰🇷');
    });

    it('should support Thai (th)', () => {
      expect(getLanguageNativeName('th')).toContain('ไทย');
      expect(getLanguageFlag('th')).toBe('🇹🇭');
    });
  });

  describe('Language differentiation', () => {
    it('should distinguish between Simplified and Traditional Chinese', () => {
      const simplified = getLanguageNativeName('zh-CN');
      const traditional = getLanguageNativeName('zh-TW');
      expect(simplified).not.toBe(traditional);
      expect(simplified).toContain('简');
      expect(traditional).toContain('繁');
    });

    it('should have unique flags for each language', () => {
      const languages = getAllSupportedLanguages();
      const flags = languages.map((l) => l.flag);
      const uniqueFlags = new Set(flags);
      expect(uniqueFlags.size).toBe(languages.length);
    });
  });
});
