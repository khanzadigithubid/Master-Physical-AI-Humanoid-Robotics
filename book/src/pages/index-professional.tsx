/**
 * PROFESSIONAL HOMEPAGE - Streamlined for Hackathon
 *
 * Structure (6 Essential Sections):
 * 1. Hero - Title, subtitle, CTA buttons
 * 2. Features - Core benefits (3 cards)
 * 3. Curriculum - All 6 modules with progress
 * 4. About - Platform description with stats
 * 5. Final CTA - Strong call-to-action
 * 6. Footer - Contact and links
 *
 * Removed: InteractiveFeatures, CourseStats, FeaturedChapters, Testimonials
 * Reason: Redundant with Curriculum section, reduced visual clutter
 */

import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import AboutSection from '@site/src/components/AboutSection';
import FinalCTA from '@site/src/components/FinalCTA';
import SocialFooter from '@site/src/components/SocialFooter';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Start Learning →
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/introduction/overview"
            style={{color: 'white', borderColor: 'white'}}>
            Explore Curriculum
          </Link>
        </div>
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

      {/* SECTION 1: HERO */}
      <HomepageHeader />

      <main>
        {/* SECTION 2: FEATURES - Core Benefits */}
        <HomepageFeatures />

        {/* SECTION 4: ABOUT - Platform Overview */}
        <AboutSection />

        {/* SECTION 5: FINAL CTA - Call-to-Action */}
        <FinalCTA />
      </main>

      {/* SECTION 6: FOOTER */}
      <SocialFooter />
    </Layout>
  );
}
