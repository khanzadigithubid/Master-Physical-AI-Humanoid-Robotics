/**
 * TranslateButton - Toggles content between English and Urdu
 * Embedded at the start of each chapter via MDX
 */

import React, { useState } from 'react';
import { translateContent } from '../lib/api-client';
import styles from './ActionButton.module.css';

interface TranslateButtonProps {
  chapterId: string;
  content: string;
  onContentUpdate?: (newContent: string, language: 'en' | 'ur') => void;
}

export default function TranslateButton({
  chapterId,
  content,
  onContentUpdate,
}: TranslateButtonProps) {
  const [currentLang, setCurrentLang] = useState<'en' | 'ur'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    const targetLang = currentLang === 'en' ? 'ur' : 'en';
    setIsLoading(true);
    setError('');

    try {
      const response = await translateContent({
        chapter_id: chapterId,
        content,
        target_language: targetLang,
        preserve_technical_terms: true,
      });

      if (onContentUpdate) {
        onContentUpdate(response.translated_content, targetLang);
      }
      setCurrentLang(targetLang);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleTranslate}
        disabled={isLoading}
        className={`${styles.button} ${styles.translate}`}
        title={`Switch to ${currentLang === 'en' ? 'Urdu' : 'English'}`}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner}></span>
            Translating...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={styles.icon}
            >
              <path
                d="M1 2h6M4 2v2M2 6c0 2 2 4 4 4M2 4h4M11 6l2 2 4-4M9 14l2-4 2 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {currentLang === 'en' ? 'اردو میں پڑھیں' : 'Read in English'}
          </>
        )}
      </button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
