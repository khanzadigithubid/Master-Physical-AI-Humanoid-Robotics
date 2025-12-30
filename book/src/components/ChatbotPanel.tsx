/**
 * ChatbotPanel - Professional AI Research Assistant
 *
 * Features:
 * - Clean, academic design
 * - Graceful error handling (never crashes)
 * - Auto-scroll to latest message
 * - Typing indicator
 * - Clickable suggestions
 * - Markdown-like rendering
 * - Source citations
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ragQuery, ApiError, type RAGQueryRequest, type RAGQueryResponse } from '../lib/api-client';
import styles from './ChatbotPanel.module.css';

// ==================== TYPES ====================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: RAGQueryResponse['sources'];
  timestamp: Date;
  isError?: boolean;
}

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
}

// ==================== CONSTANTS ====================

const SUGGESTED_QUESTIONS = [
  'What is kinematics in robotics?',
  'Explain inverse kinematics with examples',
  'How does sensor fusion work in robots?',
  'What is SLAM and why is it important?',
  'Describe bipedal locomotion challenges',
];

const ERROR_MESSAGES = {
  network: 'Unable to connect to the AI service. Please check your internet connection and try again.',
  timeout: 'The request took too long. Please try again with a shorter question.',
  generic: 'Something went wrong. Please try again later.',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate unique message ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format message content with basic markdown-like rendering
 */
function formatMessageContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');
}

// ==================== COMPONENT ====================

export default function ChatbotPanel({ isOpen, onClose, selectedText }: ChatbotPanelProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'full-book' | 'selected-text'>('full-book');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Set mode based on selected text
  useEffect(() => {
    if (selectedText && selectedText.trim().length > 0) {
      setMode('selected-text');
    }
  }, [selectedText]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /**
   * Send message to API
   */
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const request: RAGQueryRequest = {
        query: messageText.trim(),
        mode,
        ...(mode === 'selected-text' && selectedText ? { selected_text: selectedText } : {}),
      };

      const response = await ragQuery(request);

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      let errorMessage = ERROR_MESSAGES.generic;

      if (error instanceof ApiError) {
        if (error.isNetworkError) {
          errorMessage = ERROR_MESSAGES.network;
        } else if (error.message.includes('timeout')) {
          errorMessage = ERROR_MESSAGES.timeout;
        } else {
          errorMessage = error.message;
        }
      }

      const systemMessage: Message = {
        id: generateId(),
        role: 'system',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, systemMessage]);

    } finally {
      setIsLoading(false);
    }
  }, [isLoading, mode, selectedText]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([]);
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <aside
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        aria-label="AI Research Assistant"
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 9a7 7 0 0 0-14 0v6a7 7 0 0 0 14 0V9Z"/>
                <circle cx="9" cy="13" r="1" fill="currentColor"/>
                <circle cx="15" cy="13" r="1" fill="currentColor"/>
                <path d="M12 17v2M8 21h8"/>
              </svg>
            </div>
            <div className={styles.headerText}>
              <h2>AI Research Assistant</h2>
              <p>Ask about Physical AI, Robotics & AI Agents</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <button
                className={styles.clearButton}
                onClick={clearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            )}
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close assistant"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${mode === 'full-book' ? styles.active : ''}`}
            onClick={() => setMode('full-book')}
            aria-pressed={mode === 'full-book'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Full Textbook
          </button>
          <button
            className={`${styles.modeButton} ${mode === 'selected-text' ? styles.active : ''}`}
            onClick={() => setMode('selected-text')}
            disabled={!selectedText || selectedText.trim().length === 0}
            aria-pressed={mode === 'selected-text'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            Selected Text
          </button>
        </div>

        {/* Selected Text Preview */}
        {mode === 'selected-text' && selectedText && (
          <div className={styles.selectedTextPreview}>
            <span className={styles.previewLabel}>Context:</span>
            <span className={styles.previewText}>
              {selectedText.slice(0, 150)}
              {selectedText.length > 150 && '...'}
            </span>
          </div>
        )}

        {/* Messages Container */}
        <div className={styles.messagesContainer}>
          {/* Empty State */}
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <path d="M12 17h.01"/>
                </svg>
              </div>
              <h3>How can I help you today?</h3>
              <p>Ask me anything about Physical AI, robotics, or humanoid systems.</p>
              <div className={styles.suggestions}>
                <span className={styles.suggestionsLabel}>Try asking:</span>
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    className={styles.suggestionButton}
                    onClick={() => handleSuggestionClick(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[message.role]} ${message.isError ? styles.error : ''}`}
            >
              {/* Avatar */}
              <div className={styles.messageAvatar}>
                {message.role === 'user' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ) : message.isError ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 9a7 7 0 0 0-14 0v6a7 7 0 0 0 14 0V9Z"/>
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className={styles.messageBody}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageRole}>
                    {message.role === 'user' ? 'You' : message.isError ? 'System' : 'AI Assistant'}
                  </span>
                  <span className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={styles.messageContent}
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(message.content)
                  }}
                />

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className={styles.sources}>
                    <div className={styles.sourcesHeader}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                      <span>Sources</span>
                    </div>
                    <ul className={styles.sourcesList}>
                      {message.sources.map((source, idx) => (
                        <li key={idx} className={styles.sourceItem}>
                          <a
                            href={`/docs/${source.chapter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            {source.chapter.replace(/-/g, ' ').replace(/\//g, ' > ')}
                          </a>
                          <span className={styles.relevanceScore}>
                            {Math.round(source.relevance_score * 100)}% match
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageAvatar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 9a7 7 0 0 0-14 0v6a7 7 0 0 0 14 0V9Z"/>
                </svg>
              </div>
              <div className={styles.messageBody}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageRole}>AI Assistant</span>
                </div>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about robotics..."
              className={styles.input}
              disabled={isLoading}
              aria-label="Message input"
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinner}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
          <p className={styles.disclaimer}>
            AI-powered answers based on textbook content. Verify important information.
          </p>
        </form>
      </aside>
    </div>
  );
}
