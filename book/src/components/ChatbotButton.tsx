/**
 * ChatbotButton - Floating button to open RAG chatbot
 * Appears on all pages in bottom-right corner
 */

import React from 'react';
import styles from './ChatbotButton.module.css';

interface ChatbotButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export default function ChatbotButton({ onClick, hasUnread = false }: ChatbotButtonProps) {
  return (
    <button
      className={styles.chatbotButton}
      onClick={onClick}
      aria-label="Open chatbot"
      title="Ask questions about Physical AI"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.icon}
      >
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M9 10h6M9 14h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {hasUnread && <span className={styles.badge}></span>}
    </button>
  );
}
