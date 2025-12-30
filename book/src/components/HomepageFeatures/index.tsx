import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: ReactNode;
  description: ReactNode;
  gradient: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'AI-Powered Learning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 9a7 7 0 0 0-14 0v6a7 7 0 0 0 14 0V9Z"/>
        <path d="M12 18v4M8 22h8"/>
        <circle cx="9" cy="12" r="1" fill="currentColor"/>
        <circle cx="15" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
    description: (
      <>
        Intelligent RAG chatbot provides instant answers from the textbook.
        Get personalized explanations and adaptive content delivery.
      </>
    ),
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  {
    title: 'Hands-On Projects',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    description: (
      <>
        Build real robotics systems with ROS 2, Gazebo, and modern simulators.
        From sensors to full humanoid implementations.
      </>
    ),
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  },
  {
    title: 'Industry-Ready Skills',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22,4 12,14.01 9,11.01"/>
      </svg>
    ),
    description: (
      <>
        Master technologies powering Tesla Bot, Figure AI, and Boston Dynamics.
        Curriculum aligned with leading robotics programs.
      </>
    ),
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
];

function Feature({title, icon, description, gradient}: FeatureItem) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIconWrapper} style={{'--gradient': gradient} as React.CSSProperties}>
        <div className={styles.featureIcon}>
          {icon}
        </div>
      </div>
      <div className={styles.featureContent}>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
      <div className={styles.featureGlow} style={{'--gradient': gradient} as React.CSSProperties}></div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Why Choose Us</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Everything You Need to Master Robotics
          </Heading>
          <p className={styles.sectionSubtitle}>
            Our platform combines cutting-edge AI with comprehensive curriculum
            to accelerate your robotics journey.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className={styles.featuresGrid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
