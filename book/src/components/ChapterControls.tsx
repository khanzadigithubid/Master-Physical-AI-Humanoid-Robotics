import React, { useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { personalizeContent, translateContent, isAuthenticated } from '../lib/api-client';
import { useChapter } from '../context/ChapterContext';
import styles from './ActionButton.module.css';

interface ChapterControlsProps {
  chapterId: string;
}

function ChapterControlsInner({ chapterId }: ChapterControlsProps) {
  const {
    mode, setMode,
    lang, setLang,
    originalContent, setOriginalContent,
    personalizedContent, setPersonalizedContent,
    translatedContent, setTranslatedContent,
  } = useChapter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());

    // Capture original content from article body
    if (!originalContent) {
      const article = document.querySelector('article');
      if (article) {
        setOriginalContent(article.innerText);
      }
    }
  }, [originalContent, setOriginalContent]);

  const handlePersonalize = async () => {
    if (!isLoggedIn) {
      setError('Please sign in to personalize this chapter.');
      return;
    }

    if (mode === 'personalized') {
      setMode('original');
      return;
    }

    if (personalizedContent) {
      setMode('personalized');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await personalizeContent({
        chapter_id: chapterId,
        original_markdown: originalContent || 'Content placeholder',
      });

      setPersonalizedContent(response.content, response.summary);
      setMode('personalized');
      setTranslatedContent(null);
      setLang('en');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personalization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!isLoggedIn) {
      setError('Please sign in to translate content.');
      return;
    }

    if (lang === 'ur') {
      setLang('en');
      return;
    }

    if (translatedContent) {
      setLang('ur');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const contentToTranslate = mode === 'personalized' ? personalizedContent! : originalContent;

      const response = await translateContent({
        chapter_id: chapterId,
        markdown_content: contentToTranslate,
        target_language: 'ur',
      });

      setTranslatedContent(response.translated_markdown);
      setLang('ur');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Safe openChat implementation
   */
  const openChat = () => {
    if (typeof window !== 'undefined' && (window as any).openChat) {
      (window as any).openChat();
    } else {
      console.warn('Chatbot not initialized or not available in this environment.');
    }
  };

  return (
    <div className={styles.chapterActionsContainer}>
      <div className={styles.actionsGroup}>
        <button
          onClick={handlePersonalize}
          disabled={isLoading}
          className={`${styles.button} ${mode === 'personalized' ? styles.active : ''}`}
        >
          {isLoading && mode === 'original' ? (
            <span className={styles.spinner}></span>
          ) : mode === 'personalized' ? (
            'Revert to Original'
          ) : (
            'Personalize this Chapter'
          )}
        </button>

        <button
          onClick={handleTranslate}
          disabled={isLoading}
          className={`${styles.button} ${styles.translate} ${lang === 'ur' ? styles.active : ''}`}
        >
          {isLoading && lang === 'en' ? (
            <span className={styles.spinner}></span>
          ) : lang === 'ur' ? (
            'Switch to English'
          ) : (
            'Translate to Urdu'
          )}
        </button>

        <button
          onClick={openChat}
          className={`${styles.button} ${styles.chatButton}`}
        >
          Ask AI Assistant
        </button>
      </div>

      {!isLoggedIn && (
        <p className={styles.authWarning}>
          Please <a href="/signin">sign in</a> to use premium AI features.
        </p>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default function ChapterControls(props: ChapterControlsProps) {
  return (
    <BrowserOnly fallback={<div className={styles.chapterActionsContainer}>Loading controls...</div>}>
      {() => <ChapterControlsInner {...props} />}
    </BrowserOnly>
  );
}
