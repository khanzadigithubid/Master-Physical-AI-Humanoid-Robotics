import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type StatItem = {
  value: string;
  label: string;
  icon: string;
};

const stats: StatItem[] = [
  {
    value: '24',
    label: 'Comprehensive Chapters',
    icon: '📚',
  },
  {
    value: '6',
    label: 'Learning Modules',
    icon: '🎯',
  },
  {
    value: '100+',
    label: 'Hours of Content',
    icon: '⏱️',
  },
  {
    value: 'Free',
    label: 'Open Access',
    icon: '🌟',
  },
];

function StatCard({value, label, icon}: StatItem) {
  return (
    <div className={clsx('col col--3')}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

export default function CourseStats(): ReactNode {
  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Comprehensive Curriculum
          </Heading>
          <p className={styles.sectionSubtitle}>
            Industry-aligned content designed for next-generation robotics engineers
          </p>
        </div>

        <div className="row">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
