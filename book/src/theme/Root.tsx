/**
 * Root Theme Component - Global Wrapper
 *
 * This component wraps all pages and provides:
 * - Global chatbot integration
 * - Text selection tracking for "selected text" mode
 * - Custom event handling for opening chatbot
 *
 * BROWSER-SAFE: All code is client-side only
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import ChatbotButton from '../components/ChatbotButton';
import ChatbotPanel from '../components/ChatbotPanel';
import { ChapterProvider } from '../context/ChapterContext';

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  /**
   * Open the chatbot panel
   */
  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  /**
   * Close the chatbot panel
   */
  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  /**
   * Expose openChat to window for global access (browser-only)
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openChat = openChat;
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).openChat = undefined;
      }
    };
  }, [openChat]);

  /**
   * Capture text selection for "selected text" mode
   */
  useEffect(() => {
    const handleSelection = () => {
      if (typeof window === 'undefined') return;
      try {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';
        if (text.length > 10) {
          setSelectedText(text);
        }
      } catch {
        // Silently handle any selection errors
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, []);

  /**
   * Listen for custom "openChatbot" events
   */
  useEffect(() => {
    const handleOpenChatbot = () => {
      openChat();
    };
    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => {
      window.removeEventListener('openChatbot', handleOpenChatbot);
    };
  }, [openChat]);

  /**
   * Prevent body scroll when chatbot is open
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  return (
    <ChapterProvider>
      {children}

      <ChatbotButton
        onClick={openChat}
        hasUnread={false}
      />

      <ChatbotPanel
        isOpen={isChatOpen}
        onClose={closeChat}
        selectedText={selectedText}
      />
    </ChapterProvider>
  );
}
