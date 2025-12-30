/**
 * Curriculum Overview Section
 * Modern card design with icons and progress indicators
 */

import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type ModuleItem = {
  number: string;
  title: string;
  description: string;
  link: string;
  chapters: number;
  icon: ReactNode;
  gradient: string;
};

const ModuleList: ModuleItem[] = [
  {
    number: '01',
    title: 'Introduction',
    description: 'Physical AI fundamentals, humanoid robotics landscape, and learning path.',
    link: '/docs/introduction/overview',
    chapters: 4,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  {
    number: '02',
    title: 'Robotics Fundamentals',
    description: 'Kinematics, dynamics, control theory, actuators and sensors.',
    link: '/docs/robotics-fundamentals/kinematics',
    chapters: 4,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  {
    number: '03',
    title: 'Perception Systems',
    description: 'Computer vision, LiDAR, sensor fusion, and SLAM navigation.',
    link: '/docs/perception-systems/computer-vision',
    chapters: 4,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  },
  {
    number: '04',
    title: 'AI for Robotics',
    description: 'Foundation models, reinforcement learning, neural networks.',
    link: '/docs/ai-for-robotics/foundation-models',
    chapters: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 9a7 7 0 0 0-14 0v6a7 7 0 0 0 14 0V9z"/>
        <circle cx="9" cy="12" r="1" fill="currentColor"/>
        <circle cx="15" cy="12" r="1" fill="currentColor"/>
        <path d="M12 18v4M8 22h8"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
  },
  {
    number: '05',
    title: 'Humanoid Robotics',
    description: 'Bipedal locomotion, manipulation, grasping, and human-robot interaction.',
    link: '/docs/humanoid-robotics/bipedal-locomotion',
    chapters: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="4" r="2"/>
        <path d="M12 6v6M12 12l-4 8M12 12l4 8M8 10h8"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  {
    number: '06',
    title: 'Deployment & Ethics',
    description: 'Safety systems, real-world deployment, ethics, and future directions.',
    link: '/docs/deployment-ethics/safety-systems',
    chapters: 1,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  },
];

function ModuleCard({number, title, description, link, chapters, icon, gradient}: ModuleItem) {
  return (
    <Link to={link} className={styles.moduleCard}>
      <div className={styles.moduleIconWrapper} style={{'--gradient': gradient} as React.CSSProperties}>
        <div className={styles.moduleIcon}>{icon}</div>
      </div>
      <div className={styles.moduleContent}>
        <div className={styles.moduleHeader}>
          <span className={styles.moduleNumber}>Module {number}</span>
          <span className={styles.moduleChapters}>{chapters} Chapters</span>
        </div>
        <Heading as="h3" className={styles.moduleTitle}>{title}</Heading>
        <p className={styles.moduleDescription}>{description}</p>
        <div className={styles.moduleArrow}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function CurriculumOverview(): ReactNode {
  return (
    <section className={styles.curriculumSection}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Curriculum</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Structured Learning Path
          </Heading>
          <p className={styles.sectionSubtitle}>
            Progress from foundational concepts to advanced humanoid robotics
            through our carefully designed 6-module curriculum.
          </p>
        </div>

        {/* Module Grid */}
        <div className={styles.modulesGrid}>
          {ModuleList.map((module, idx) => (
            <ModuleCard key={idx} {...module} />
          ))}
        </div>

        {/* CTA */}
        <div className={styles.curriculumCta}>
          <Link to="/docs/intro" className={styles.ctaButton}>
            <span>View Full Curriculum</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
