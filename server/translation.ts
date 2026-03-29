// AI Translation Service
// Uses LLM to translate dynamic content (market titles/descriptions)

import { invokeLLM } from "./_core/llm";

// SIMPLE TRANSLATION CACHE (In-memory)
// Prevents redundant AI calls for the same phrases
const translationCache = new Map<string, string>();

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "English"
): Promise<string> {
  if (!text || targetLang === 'en' || targetLang === 'English') return text;

  // Use cache if available
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Map internal lang codes to full names for LLM prompt
  const langNames: Record<string, string> = {
    'zh-TW': 'Traditional Chinese (繁體中文)',
    'zh-CN': 'Simplified Chinese (简体中文)',
    'ja': 'Japanese (日本語)',
    'ko': 'Korean (한국어)',
    'th': 'Thai (ไทย)',
    'es': 'Spanish (Español)',
    'en': 'English',
  };

  const targetLangName = langNames[targetLang] || targetLang;

  const prompt = `Translate the following text from ${sourceLang} to ${targetLangName}. 
Maintain the original tone and financial/sports context. 
If it is a prediction market title, ensure it remains a clear question if the original is a question.
Only provide the translated text without any explanation.

Text: ${text}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional translator specializing in prediction markets and finance.",
        },
        {
          role: "user",
          content: prompt,
        },
      ] as const,
    });

    const translated = response.choices[0]?.message?.content;
    if (!translated || typeof translated !== "string") {
      throw new Error("No response from LLM for translation");
    }

    const result = translated.trim();
    translationCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    // CAPTURE DETAILED ERROR INFO
    const errorDetails = error.message || 'Unknown error';
    const isAuthError = errorDetails.includes('401') || errorDetails.includes('unauthorized');
    const isQuotaError = errorDetails.includes('429') || errorDetails.includes('quota');
    
    console.error(`[Translation Error] Target: ${targetLang}, Text: "${text.slice(0, 50)}..."`);
    console.error(`[Translation Error] Details: ${errorDetails}`);
    
    if (isAuthError) console.error(`[Translation Error] Potential API Key Issue! check OPENAI_API_KEY`);
    if (isQuotaError) console.error(`[Translation Error] OpenAI Quota Exceeded!`);

    return text;
  }
}
