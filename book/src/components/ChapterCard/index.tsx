import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

export type ChapterItem = {
  number: number;
  title: string;
  description: string;
  path: string;
  icon?: string;
  status?: 'available' | 'coming-soon';
  topics?: string[];
};

interface ChapterCardProps {
  chapter: ChapterItem;
  featured?: boolean;
}

export default function ChapterCard({chapter, featured = false}: ChapterCardProps): ReactNode {
  const {number, title, description, path, icon, status = 'available', topics} = chapter;

  const isComingSoon = status === 'coming-soon';

  return (
    <div className={clsx(
      styles.chapterCard,
      featured && styles.featured,
      isComingSoon && styles.comingSoon
    )}>
      <div className={styles.chapterHeader}>
        <div className={styles.chapterNumber}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.number}>Chapter {number}</span>
        </div>
        {isComingSoon && (
          <span className={styles.badge}>Coming Soon</span>
        )}
      </div>

      <h3 className={styles.chapterTitle}>{title}</h3>

      <p className={styles.chapterDescription}>{description}</p>

      {topics && topics.length > 0 && (
        <div className={styles.topics}>
          {topics.map((topic, idx) => (
            <span key={idx} className={styles.topic}>
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className={styles.cardFooter}>
        {!isComingSoon ? (
          <Link
            to={path}
            className={clsx('button', 'button--primary', styles.chapterButton)}
          >
            Start Chapter →
          </Link>
        ) : (
          <button
            className={clsx('button', 'button--secondary', styles.chapterButton)}
            disabled
          >
            Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}
