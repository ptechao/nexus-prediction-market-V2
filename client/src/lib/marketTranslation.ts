/**
 * Market Title Translation Utility
 * Provides translation for market titles and descriptions
 */

type SupportedLanguage = 'en' | 'zh-TW' | 'es';

interface MarketTranslation {
  en: string;
  'zh-TW': string;
  es: string;
}

/**
 * Market title translations mapping
 * This is a simple mock implementation for MVP
 * In production, this would use a translation API or database
 */
const marketTitleTranslations: Record<string, MarketTranslation> = {
  'Lakers vs Warriors: Who wins?': {
    en: 'Lakers vs Warriors: Who wins?',
    'zh-TW': '湖人隊對勇士隊：誰會贏？',
    es: 'Lakers vs Warriors: ¿Quién gana?',
  },
  'US Election 2024: Trump to win?': {
    en: 'US Election 2024: Trump to win?',
    'zh-TW': '2024年美國大選：特朗普會贏嗎？',
    es: 'Elecciones de EE.UU. 2024: ¿Ganará Trump?',
  },
  'Bitcoin hits $100k by end of Q1?': {
    en: 'Bitcoin hits $100k by end of Q1?',
    'zh-TW': '比特幣在第一季度末達到10萬美元？',
    es: '¿Bitcoin alcanza $100k antes de fin de Q1?',
  },
  'S&P 500 above 5000 by March?': {
    en: 'S&P 500 above 5000 by March?',
    'zh-TW': '標普500指數在3月前突破5000？',
    es: '¿S&P 500 por encima de 5000 antes de marzo?',
  },
  'Apple stock hits $200 by year-end?': {
    en: 'Apple stock hits $200 by year-end?',
    'zh-TW': '蘋果股票在年底前達到200美元？',
    es: '¿Acción de Apple alcanza $200 antes de fin de año?',
  },
  'Will Ethereum reach $5k?': {
    en: 'Will Ethereum reach $5k?',
    'zh-TW': '以太坊會達到5000美元嗎？',
    es: '¿Ethereum alcanzará $5k?',
  },
  'Oscars 2026: Best Picture winner?': {
    en: 'Oscars 2026: Best Picture winner?',
    'zh-TW': '2026年奧斯卡獎：最佳影片獲獎者？',
    es: 'Premios Oscar 2026: ¿Ganador de Mejor Película?',
  },
  'World Cup 2026: France to win?': {
    en: 'World Cup 2026: France to win?',
    'zh-TW': '2026年世界杯：法國會贏嗎？',
    es: 'Copa del Mundo 2026: ¿Ganará Francia?',
  },
};

/**
 * Market description translations mapping
 */
const marketDescriptionTranslations: Record<string, MarketTranslation> = {
  'Will the Lakers defeat the Warriors in their upcoming matchup?': {
    en: 'Will the Lakers defeat the Warriors in their upcoming matchup?',
    'zh-TW': '湖人隊會在即將進行的比賽中擊敗勇士隊嗎？',
    es: '¿Los Lakers derrotarán a los Warriors en su próximo partido?',
  },
  'Will Donald Trump win the 2024 US Presidential Election?': {
    en: 'Will Donald Trump win the 2024 US Presidential Election?',
    'zh-TW': '唐納德·特朗普會贏得2024年美國總統大選嗎？',
    es: '¿Donald Trump ganará las elecciones presidenciales de EE.UU. 2024?',
  },
  'Will Bitcoin reach or exceed $100,000 USD by March 31, 2026?': {
    en: 'Will Bitcoin reach or exceed $100,000 USD by March 31, 2026?',
    'zh-TW': '比特幣會在2026年3月31日前達到或超過10萬美元嗎？',
    es: '¿Bitcoin alcanzará o superará $100,000 USD antes del 31 de marzo de 2026?',
  },
};

/**
 * Translate market title to target language
 * Falls back to English if translation not found
 */
export function translateMarketTitle(title: string, targetLang: SupportedLanguage): string {
  const translation = marketTitleTranslations[title];

  if (!translation) {
    // Return original title if no translation found
    return title;
  }

  return translation[targetLang] || translation['en'];
}

/**
 * Translate market description to target language
 * Falls back to English if translation not found
 */
export function translateMarketDescription(
  description: string,
  targetLang: SupportedLanguage
): string {
  const translation = marketDescriptionTranslations[description];

  if (!translation) {
    // Return original description if no translation found
    return description;
  }

  return translation[targetLang] || translation['en'];
}

/**
 * Translate market title and description together
 */
export function translateMarket(
  title: string,
  description: string,
  targetLang: SupportedLanguage
): { title: string; description: string } {
  return {
    title: translateMarketTitle(title, targetLang),
    description: translateMarketDescription(description, targetLang),
  };
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'es', name: 'Español' },
  ];
}

/**
 * Check if language is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return ['en', 'zh-TW', 'es'].includes(lang);
}

/**
 * Get default language
 */
export function getDefaultLanguage(): SupportedLanguage {
  return 'en';
}

/**
 * Add new market translations (for future use)
 */
export function addMarketTranslation(
  title: string,
  translations: MarketTranslation
): void {
  marketTitleTranslations[title] = translations;
}

/**
 * Add new market description translations (for future use)
 */
export function addMarketDescriptionTranslation(
  description: string,
  translations: MarketTranslation
): void {
  marketDescriptionTranslations[description] = translations;
}

/**
 * Get market translation statistics
 */
export function getTranslationStats(): {
  totalTitles: number;
  totalDescriptions: number;
  languages: SupportedLanguage[];
} {
  return {
    totalTitles: Object.keys(marketTitleTranslations).length,
    totalDescriptions: Object.keys(marketDescriptionTranslations).length,
    languages: ['en', 'zh-TW', 'es'],
  };
}
