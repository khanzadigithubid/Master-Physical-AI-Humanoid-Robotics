/**
 * PersonalizeButton - Adjusts content depth based on user background
 * Embedded at the start of each chapter via MDX
 */

import React, { useState } from 'react';
import { personalizeContent, getCurrentUser, isAuthenticated } from '../lib/api-client';
import styles from './ActionButton.module.css';

interface PersonalizeButtonProps {
  chapterId: string;
  content: string;
  onContentUpdate?: (newContent: string) => void;
}

export default function PersonalizeButton({
  chapterId,
  content,
  onContentUpdate,
}: PersonalizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPersonalized, setIsPersonalized] = useState(false);

  const handlePersonalize = async () => {
    if (!isAuthenticated()) {
      window.location.href = '/signin';
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await getCurrentUser();
      const response = await personalizeContent({
        chapter_id: chapterId,
        content,
        user_background: {
          software: user.software_background,
          hardware: user.hardware_background,
        },
      });

      if (onContentUpdate) {
        onContentUpdate(response.personalized_content);
      }
      setIsPersonalized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personalization failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPersonalized) {
    return (
      <div className={`${styles.banner} ${styles.success}`}>
        ✓ Content adjusted for your level
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        onClick={handlePersonalize}
        disabled={isLoading}
        className={styles.button}
        title="Adjust content depth based on your background"
      >
        {isLoading ? (
          <>
            <span className={styles.spinner}></span>
            Personalizing...
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
                d="M8 2v12M2 8h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            Adjust for My Level
          </>
        )}
      </button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
