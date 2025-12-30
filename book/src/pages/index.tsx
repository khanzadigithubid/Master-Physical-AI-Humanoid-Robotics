/**
 * MODERN HACKATHON HOMEPAGE - Redesigned UI
 *
 * Features:
 * - Animated gradient hero with floating particles
 * - Glassmorphism feature cards
 * - Modern curriculum grid
 * - Interactive CTAs with micro-animations
 * - Fully responsive design
 */

import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import CurriculumOverview from '@site/src/components/CurriculumOverview';
import AboutSection from '@site/src/components/AboutSection';
import FinalCTA from '@site/src/components/FinalCTA';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      {/* Animated Background Elements */}
      <div className={styles.heroBackground}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
        <div className={styles.gridPattern}></div>
      </div>

      <div className={clsx('container', styles.heroContainer)}>
        {/* Badge */}
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot}></span>
          <span>Open Source Educational Platform</span>
        </div>

        {/* Main Title */}
        <Heading as="h1" className={styles.heroTitle}>
          Master <span className={styles.gradientText}>Physical AI</span> &
          <br />
          <span className={styles.gradientText}>Humanoid Robotics</span>
        </Heading>

        {/* Subtitle */}
        <p className={styles.heroSubtitle}>
          The comprehensive AI-native learning platform for robotics engineers.
          <br className={styles.hideOnMobile} />
          From fundamentals to deployment — powered by cutting-edge AI.
        </p>

        {/* CTA Buttons */}
        <div className={styles.buttons}>
          <Link className={styles.primaryButton} to="/docs/intro">
            <span className={styles.buttonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
            Start Learning Free
          </Link>
          <Link className={styles.secondaryButton} to="/docs/introduction/overview">
            <span className={styles.buttonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </span>
            Explore Curriculum
          </Link>
        </div>

        {/* Stats Row */}
        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>6</span>
            <span className={styles.statLabel}>Modules</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>24</span>
            <span className={styles.statLabel}>Chapters</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100+</span>
            <span className={styles.statLabel}>Hours</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>Free</span>
            <span className={styles.statLabel}>Forever</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollMouse}>
          <div className={styles.scrollWheel}></div>
        </div>
        <span>Scroll to explore</span>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="AI-Native Textbook Platform for Physical AI and Humanoid Robotics Education">

      {/* HERO - Animated Introduction */}
      <HomepageHeader />

      <main className={styles.mainContent}>
        {/* FEATURES - Core Platform Benefits */}
        <HomepageFeatures />

        {/* CURRICULUM - Complete Learning Path */}
        <CurriculumOverview />

        {/* ABOUT - Platform Description & Stats */}
        <AboutSection />

        {/* FINAL CTA - Strong Call-to-Action */}
        <FinalCTA />
      </main>

      {/* Footer is now handled by src/theme/Footer */}
    </Layout>
  );
}
