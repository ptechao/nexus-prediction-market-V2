/**
 * Language Switcher Component
 * Dropdown menu for language selection with support for 7 languages
 * Includes: English, Traditional Chinese, Simplified Chinese, Japanese, Korean, Thai, Spanish
 */

import { useLanguageContext } from '@/contexts/LanguageContext';
import { getLanguageFlag, getLanguageName, getLanguageNativeName } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

type SupportedLanguage = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'th' | 'es';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageContext();
  const supportedLanguages = [
    { code: 'en' as const, name: 'English', nativeName: 'English' },
    { code: 'zh-TW' as const, name: 'Traditional Chinese', nativeName: '繁體中文' },
    { code: 'zh-CN' as const, name: 'Simplified Chinese', nativeName: '简体中文' },
    { code: 'ja' as const, name: 'Japanese', nativeName: '日本語' },
    { code: 'ko' as const, name: 'Korean', nativeName: '한국어' },
    { code: 'th' as const, name: 'Thai', nativeName: 'ไทย' },
    { code: 'es' as const, name: 'Spanish', nativeName: 'Español' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 hover:bg-gray-100 transition-colors"
          title="Switch language"
        >
          <Globe className="h-4 w-4" />
          <span className="text-lg">{getLanguageFlag(language as SupportedLanguage)}</span>
          <span className="hidden sm:inline text-xs font-medium truncate max-w-[60px]">
            {getLanguageNativeName(language as SupportedLanguage)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Select Language
        </div>

        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as SupportedLanguage)}
            className={`cursor-pointer flex items-center gap-3 px-3 py-2 transition-colors ${
              language === lang.code
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Flag Emoji */}
            <span className="text-xl flex-shrink-0">{getLanguageFlag(lang.code as SupportedLanguage)}</span>

            {/* Language Names */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{lang.nativeName}</div>
              <div className="text-xs text-gray-500 truncate">{lang.name}</div>
            </div>

            {/* Checkmark for active language */}
            {language === lang.code && (
              <span className="text-blue-600 font-bold text-lg flex-shrink-0">✓</span>
            )}
          </DropdownMenuItem>
        ))}

        {/* Divider and Info */}
        <div className="border-t my-1" />
        <div className="px-3 py-1.5 text-xs text-gray-500">
          {supportedLanguages.length} languages supported
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
