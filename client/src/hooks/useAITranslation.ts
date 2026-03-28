import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguageContext } from '@/contexts/LanguageContext';

/**
 * AI Translation Hook
 * Translates dynamic text (like market titles) in real-time using AI
 */
export function useAITranslation(text: string | undefined) {
  const { language } = useLanguageContext();
  const [translatedText, setTranslatedText] = useState<string | undefined>(text);
  
  const isEnglish = language === 'en';
  const shouldTranslate = !isEnglish && !!text;

  const translationMutation = trpc.translation.text.useMutation();

  useEffect(() => {
    // If English or no text, just use original
    if (!shouldTranslate) {
      setTranslatedText(text);
      return;
    }

    // Trigger translation
    const performTranslation = async () => {
      try {
        const result = await translationMutation.mutateAsync({
          text: text!,
          targetLang: language,
        });
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation failed', error);
        setTranslatedText(text); // Fallback to original
      }
    };

    performTranslation();
  }, [text, language, shouldTranslate]);

  return {
    translatedText: translatedText || text,
    isTranslating: translationMutation.isPending,
    isError: translationMutation.isError,
  };
}
