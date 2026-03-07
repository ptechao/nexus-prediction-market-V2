import { describe, it, expect } from 'vitest';
import { getLanguageName, getLanguageFlag, getBrowserLanguage } from './useLanguage';

describe('Language Management', () => {
  it('should return correct language names', () => {
    expect(getLanguageName('en')).toBe('English');
    expect(getLanguageName('zh-TW')).toBe('Traditional Chinese');
    expect(getLanguageName('es')).toBe('Spanish');
  });

  it('should return correct language flags', () => {
    expect(getLanguageFlag('en')).toBe('🇺🇸');
    expect(getLanguageFlag('zh-TW')).toBe('🇹🇼');
    expect(getLanguageFlag('es')).toBe('🇪🇸');
  });

  it('should return default language on server-side', () => {
    // getBrowserLanguage returns 'en' when window is undefined (server-side)
    const lang = getBrowserLanguage();
    expect(lang).toBe('en');
  });

  it('should support all three languages', () => {
    const languages = ['en', 'zh-TW', 'es'] as const;
    languages.forEach((lang) => {
      const name = getLanguageName(lang);
      const flag = getLanguageFlag(lang);
      expect(name).toBeTruthy();
      expect(flag).toBeTruthy();
    });
  });

  it('should have unique flags for each language', () => {
    const flags = new Set([
      getLanguageFlag('en'),
      getLanguageFlag('zh-TW'),
      getLanguageFlag('es'),
    ]);
    expect(flags.size).toBe(3);
  });

  it('should have unique names for each language', () => {
    const names = new Set([
      getLanguageName('en'),
      getLanguageName('zh-TW'),
      getLanguageName('es'),
    ]);
    expect(names.size).toBe(3);
  });
});
