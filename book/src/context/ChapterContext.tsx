import React, { createContext, useContext, useState, ReactNode } from 'react';

type ContentMode = 'original' | 'personalized';
type Language = 'en' | 'ur';

interface ChapterContextType {
  mode: ContentMode;
  lang: Language;
  originalContent: string;
  personalizedContent: string | null;
  personalizedSummary: string | null;
  translatedContent: string | null; // Stores Urdu version of current mode
  setOriginalContent: (content: string) => void;
  setPersonalizedContent: (content: string | null, summary?: string | null) => void;
  setTranslatedContent: (content: string | null) => void;
  setMode: (mode: ContentMode) => void;
  setLang: (lang: Language) => void;
  reset: () => void;
}

const ChapterContext = createContext<ChapterContextType | undefined>(undefined);

export function ChapterProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ContentMode>('original');
  const [lang, setLang] = useState<Language>('en');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [personalizedContent, setPersonalizedContent] = useState<string | null>(null);
  const [personalizedSummary, setPersonalizedSummary] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  const setPersonalizedContentWithSummary = (content: string | null, summary: string | null = null) => {
    setPersonalizedContent(content);
    setPersonalizedSummary(summary);
  };

  const reset = () => {
    setMode('original');
    setLang('en');
    setPersonalizedContent(null);
    setPersonalizedSummary(null);
    setTranslatedContent(null);
  };

  return (
    <ChapterContext.Provider
      value={{
        mode,
        lang,
        originalContent,
        personalizedContent,
        personalizedSummary,
        translatedContent,
        setOriginalContent,
        setPersonalizedContent: setPersonalizedContentWithSummary,
        setTranslatedContent,
        setMode,
        setLang,
        reset,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
}

export function useChapter() {
  const context = useContext(ChapterContext);
  if (context === undefined) {
    throw new Error('useChapter must be used within a ChapterProvider');
  }
  return context;
}
