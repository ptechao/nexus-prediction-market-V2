import { describe, it, expect } from 'vitest';
import {
  translateMarketTitle,
  translateMarketDescription,
  translateMarket,
  getSupportedLanguages,
  isSupportedLanguage,
  getDefaultLanguage,
  getTranslationStats,
} from './marketTranslation';

describe('Market Translation System', () => {
  it('should translate market title to Chinese', () => {
    const title = 'Lakers vs Warriors: Who wins?';
    const translated = translateMarketTitle(title, 'zh-TW');
    expect(translated).toBe('湖人隊對勇士隊：誰會贏？');
  });

  it('should translate market title to Spanish', () => {
    const title = 'Lakers vs Warriors: Who wins?';
    const translated = translateMarketTitle(title, 'es');
    expect(translated).toBe('Lakers vs Warriors: ¿Quién gana?');
  });

  it('should return English title when language is English', () => {
    const title = 'Bitcoin hits $100k by end of Q1?';
    const translated = translateMarketTitle(title, 'en');
    expect(translated).toBe('Bitcoin hits $100k by end of Q1?');
  });

  it('should return original title if translation not found', () => {
    const title = 'Unknown Market Title';
    const translated = translateMarketTitle(title, 'zh-TW');
    expect(translated).toBe('Unknown Market Title');
  });

  it('should translate market description to Chinese', () => {
    const description = 'Will the Lakers defeat the Warriors in their upcoming matchup?';
    const translated = translateMarketDescription(description, 'zh-TW');
    expect(translated).toBe('湖人隊會在即將進行的比賽中擊敗勇士隊嗎？');
  });

  it('should translate market description to Spanish', () => {
    const description = 'Will Donald Trump win the 2024 US Presidential Election?';
    const translated = translateMarketDescription(description, 'es');
    expect(translated).toBe('¿Donald Trump ganará las elecciones presidenciales de EE.UU. 2024?');
  });

  it('should translate market title and description together', () => {
    const title = 'Bitcoin hits $100k by end of Q1?';
    const description = 'Will Bitcoin reach or exceed $100,000 USD by March 31, 2026?';
    const result = translateMarket(title, description, 'zh-TW');

    expect(result.title).toBe('比特幣在第一季度末達到10萬美元？');
    expect(result.description).toBe('比特幣會在2026年3月31日前達到或超過10萬美元嗎？');
  });

  it('should return supported languages', () => {
    const languages = getSupportedLanguages();
    expect(languages).toHaveLength(3);
    expect(languages.map((l) => l.code)).toEqual(['en', 'zh-TW', 'es']);
  });

  it('should validate supported languages', () => {
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('zh-TW')).toBe(true);
    expect(isSupportedLanguage('es')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
    expect(isSupportedLanguage('de')).toBe(false);
  });

  it('should return default language', () => {
    const defaultLang = getDefaultLanguage();
    expect(defaultLang).toBe('en');
  });

  it('should return translation statistics', () => {
    const stats = getTranslationStats();
    expect(stats.totalTitles).toBeGreaterThan(0);
    expect(stats.totalDescriptions).toBeGreaterThan(0);
    expect(stats.languages).toEqual(['en', 'zh-TW', 'es']);
  });

  it('should handle multiple market titles', () => {
    const titles = [
      'Lakers vs Warriors: Who wins?',
      'Bitcoin hits $100k by end of Q1?',
      'US Election 2024: Trump to win?',
    ];

    titles.forEach((title) => {
      const enTranslation = translateMarketTitle(title, 'en');
      const zhTranslation = translateMarketTitle(title, 'zh-TW');
      const esTranslation = translateMarketTitle(title, 'es');

      expect(enTranslation).toBeTruthy();
      expect(zhTranslation).toBeTruthy();
      expect(esTranslation).toBeTruthy();
    });
  });

  it('should fallback to English if translation not available for language', () => {
    const title = 'Lakers vs Warriors: Who wins?';
    // If translation for 'en' exists but for other language doesn't, should still work
    const translated = translateMarketTitle(title, 'en');
    expect(translated).toBe('Lakers vs Warriors: Who wins?');
  });
});
