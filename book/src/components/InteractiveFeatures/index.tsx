/**
 * Interactive Features Section - Clickable Cards
 * Professional, hackathon-ready component with smooth interactions
 */

import type {ReactNode} from 'react';
import {useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureCard = {
  id: string;
  title: string;
  icon: string;
  description: string;
  link: string;
  badge?: string;
  color: 'primary' | 'secondary' | 'accent' | 'purple';
};

const features: FeatureCard[] = [
  {
    id: 'modules',
    title: '📚 Learning Modules',
    icon: '📖',
    description: 'Explore 6 comprehensive modules covering Physical AI fundamentals to advanced humanoid robotics deployment.',
    link: '#curriculum',
    badge: '24 Chapters',
    color: 'primary',
  },
  {
    id: 'chatbot',
    title: '🤖 AI Chatbot',
    icon: '💬',
    description: 'Get instant answers from our RAG-powered chatbot. Ask questions about any chapter or concept.',
    link: '#chatbot',
    badge: 'RAG Powered',
    color: 'accent',
  },
  {
    id: 'hardware',
    title: '⚙️ Hardware Setup',
    icon: '🔧',
    description: 'Step-by-step hardware guides for robotics labs, actuators, sensors, and complete system integration.',
    link: '/docs/robotics-fundamentals/actuators-sensors',
    badge: 'Hands-on',
    color: 'secondary',
  },
  {
    id: 'capstone',
    title: '🎯 Capstone Projects',
    icon: '🚀',
    description: 'Real-world robotics projects including bipedal locomotion, manipulation, and autonomous navigation.',
    link: '/docs/humanoid-robotics/bipedal-locomotion',
    badge: 'Advanced',
    color: 'purple',
  },
];

interface FeatureCardProps {
  feature: FeatureCard;
  onClick: (id: string) => void;
}

function FeatureCardComponent({feature, onClick}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Handle special cases
    if (feature.link.startsWith('#')) {
      e.preventDefault();
      const targetId = feature.link.substring(1);
      const element = document.getElementById(targetId);

      if (targetId === 'chatbot') {
        // Trigger chatbot open
        onClick(feature.id);
      } else if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    // Otherwise, Link component handles navigation
  };

  return (
    <Link
      to={feature.link}
      className={clsx(styles.featureCard, styles[`card-${feature.color}`])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{textDecoration: 'none'}}>
      <div className={styles.cardHeader}>
        <div className={clsx(styles.iconContainer, styles[`icon-${feature.color}`])}>
          <span className={styles.icon}>{feature.icon}</span>
        </div>
        {feature.badge && (
          <span className={clsx(styles.badge, styles[`badge-${feature.color}`])}>
            {feature.badge}
          </span>
        )}
      </div>

      <Heading as="h3" className={styles.cardTitle}>
        {feature.title}
      </Heading>

      <p className={styles.cardDescription}>{feature.description}</p>

      <div className={styles.cardFooter}>
        <span className={clsx(styles.cardLink, {[styles.hovered]: isHovered})}>
          Explore {isHovered && '→'}
        </span>
      </div>
    </Link>
  );
}

interface InteractiveFeaturesProps {
  onChatbotOpen?: () => void;
}

export default function InteractiveFeatures({onChatbotOpen}: InteractiveFeaturesProps): ReactNode {
  const handleCardClick = (id: string) => {
    if (id === 'chatbot' && onChatbotOpen) {
      onChatbotOpen();
    }
  };

  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            ✨ Explore Our Platform
          </Heading>
          <p className={styles.sectionSubtitle}>
            Interactive tools and resources to accelerate your Physical AI learning journey
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {features.map((feature) => (
            <FeatureCardComponent
              key={feature.id}
              feature={feature}
              onClick={handleCardClick}
            />
          ))}
        </div>

        <div className={styles.ctaSection}>
          <Heading as="h3" className={styles.ctaTitle}>
            Ready to Start Learning?
          </Heading>
          <p className={styles.ctaText}>
            Join hundreds of students mastering Physical AI and Humanoid Robotics
          </p>
          <div className={styles.ctaButtons}>
            <Link
              to="/docs/intro"
              className="button button--primary button--lg">
              Get Started Free
            </Link>
            <Link
              to="/signup"
              className="button button--outline button--lg">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
