import React from 'react';
import { useAITranslation } from '@/hooks/useAITranslation';

interface AITranslatedTextProps {
  text: string | undefined;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}

/**
 * A component that handles AI translation for a specific block of text.
 * Useful for translating items in a list where hooks cannot be used directly inside map().
 */
export function AITranslatedText({ 
  text, 
  className = '', 
  as: Component = 'span' 
}: AITranslatedTextProps) {
  const { translatedText, isTranslating } = useAITranslation(text);

  if (!text) return null;

  const hasTranslation = translatedText && translatedText !== text;

  return (
    <div className="flex flex-col gap-0.5">
      <Component className={`${className} ${isTranslating ? 'animate-pulse opacity-70' : 'transition-opacity duration-300'}`}>
        {translatedText || text}
      </Component>
      {hasTranslation && !isTranslating && (
        <span className="text-[10px] text-muted-foreground/60 italic leading-tight line-clamp-1">
          Original: {text}
        </span>
      )}
    </div>
  );
}
