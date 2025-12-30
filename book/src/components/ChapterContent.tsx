import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useChapter } from '../context/ChapterContext';

interface ChapterContentProps {
  originalContent: React.ReactNode;
}

function ChapterContentInner({ originalContent }: ChapterContentProps) {
  const { mode, lang, personalizedContent, personalizedSummary, translatedContent } = useChapter();

  const isAiActive = (mode === 'personalized' && personalizedContent) || (lang === 'ur' && translatedContent);
  const aiContent = lang === 'ur' ? translatedContent : personalizedContent;

  if (!isAiActive || !aiContent) {
    return <>{originalContent}</>;
  }

  return (
    <div
      className="theme-doc-markdown markdown"
      style={{
        direction: lang === 'ur' ? 'rtl' : 'ltr',
        textAlign: lang === 'ur' ? 'right' : 'left',
        padding: '24px',
        backgroundColor: 'var(--ifm-color-emphasis-100)',
        borderRadius: '12px',
        border: '1px solid var(--ifm-color-emphasis-300)',
        marginTop: '20px'
      }}
    >
      <div style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--ifm-color-primary)' }}>
        {lang === 'ur' ? 'AI کے ذریعے ترجمہ شدہ' : 'Personalized Chapter'}
      </div>

      {mode === 'personalized' && personalizedSummary && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'var(--ifm-color-info-lightest)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--ifm-color-info)',
          fontSize: '0.95rem',
          fontStyle: 'italic',
          lineHeight: '1.5'
        }}>
          <strong>Personalization Summary:</strong> {personalizedSummary}
        </div>
      )}

      <div
        dangerouslySetInnerHTML={{
          __html: aiContent
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/# (.*)/g, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
        }}
      />
    </div>
  );
}

export default function ChapterContent(props: ChapterContentProps) {
  return (
    <BrowserOnly fallback={<>{props.originalContent}</>}>
      {() => <ChapterContentInner {...props} />}
    </BrowserOnly>
  );
}
