/**
 * Final CTA Section - Strong Call-to-Action
 * Encourages signup or GitHub engagement
 */

import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export default function FinalCTA(): ReactNode {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <div className={styles.ctaText}>
            <Heading as="h2" className={styles.ctaTitle}>
              🚀 Start Your Physical AI Journey Today
            </Heading>
            <p className={styles.ctaSubtitle}>
              Join the next generation of robotics engineers building intelligent physical systems.
              Free access to all 24 chapters, interactive chatbot, and hands-on projects.
            </p>

            <div className={styles.ctaFeatures}>
              <div className={styles.ctaFeature}>
                <span className={styles.checkmark}>✓</span>
                <span>Comprehensive curriculum (100+ hours)</span>
              </div>
              <div className={styles.ctaFeature}>
                <span className={styles.checkmark}>✓</span>
                <span>AI-powered learning assistant</span>
              </div>
              <div className={styles.ctaFeature}>
                <span className={styles.checkmark}>✓</span>
                <span>Real-world robotics projects</span>
              </div>
              <div className={styles.ctaFeature}>
                <span className={styles.checkmark}>✓</span>
                <span>Always free and open-source</span>
              </div>
            </div>
          </div>

          <div className={styles.ctaActions}>
            <Link
              to="/signup"
              className={styles.primaryCtaButton}>
              Create Free Account
            </Link>
            <Link
              to="/docs/intro"
              className={styles.secondaryCtaButton}>
              Browse Content
            </Link>
            <Link
              to="https://github.com/khanzadiwazirali/physical-ai-textbook"
              className={styles.githubCtaButton}>
              ⭐ Star on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
