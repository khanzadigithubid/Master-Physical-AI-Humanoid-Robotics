/**
 * About Section - Platform Description
 * Professional, concise overview of the textbook platform
 */

import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export default function AboutSection(): ReactNode {
  return (
    <section className={styles.aboutSection}>
      <div className="container">
        <div className={styles.contentGrid}>
          {/* Left Column - Main Content */}
          <div className={styles.mainContent}>
            <Heading as="h2" className={styles.aboutTitle}>
              About Physical AI Textbook
            </Heading>
            <p className={styles.aboutDescription}>
              Our comprehensive AI-native educational platform combines cutting-edge curriculum
              with interactive learning tools to prepare you for the future of robotics engineering.
            </p>
            <p className={styles.aboutDescription}>
              From fundamental kinematics to advanced humanoid robotics deployment, we cover
              everything you need to build intelligent physical systems. Our RAG-powered chatbot,
              personalized learning paths, and hands-on projects ensure you master both theory
              and practice.
            </p>

            <div className={styles.highlights}>
              <div className={styles.highlight}>
                <div className={styles.highlightIcon}>🎓</div>
                <div className={styles.highlightContent}>
                  <div className={styles.highlightTitle}>University-Grade Content</div>
                  <div className={styles.highlightText}>
                    Curriculum aligned with international AI and robotics programs
                  </div>
                </div>
              </div>

              <div className={styles.highlight}>
                <div className={styles.highlightIcon}>🤖</div>
                <div className={styles.highlightContent}>
                  <div className={styles.highlightTitle}>AI-Powered Learning</div>
                  <div className={styles.highlightText}>
                    RAG chatbot, personalization, and adaptive content delivery
                  </div>
                </div>
              </div>

              <div className={styles.highlight}>
                <div className={styles.highlightIcon}>🛠️</div>
                <div className={styles.highlightContent}>
                  <div className={styles.highlightTitle}>Hands-On Projects</div>
                  <div className={styles.highlightText}>
                    Real-world robotics implementations from sensors to full systems
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.aboutActions}>
              <Link
                to="/docs/introduction/overview"
                className="button button--primary button--lg">
                Explore Curriculum
              </Link>
              <Link
                to="https://github.com/khanzadiwazirali/physical-ai-textbook"
                className="button button--outline button--lg">
                View on GitHub →
              </Link>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className={styles.sideContent}>
            <div className={styles.statsCard}>
              <Heading as="h3" className={styles.statsTitle}>
                Platform Highlights
              </Heading>

              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>6</div>
                  <div className={styles.statLabel}>Learning Modules</div>
                  <div className={styles.statDetail}>
                    From fundamentals to deployment
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statNumber}>24</div>
                  <div className={styles.statLabel}>Comprehensive Chapters</div>
                  <div className={styles.statDetail}>
                    Theory, practice, and applications
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statNumber}>100+</div>
                  <div className={styles.statLabel}>Hours of Content</div>
                  <div className={styles.statDetail}>
                    Video, text, and interactive exercises
                  </div>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statNumber}>∞</div>
                  <div className={styles.statLabel}>Free Access</div>
                  <div className={styles.statDetail}>
                    Open-source, always free
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.techStack}>
              <div className={styles.techTitle}>🔧 Tech Stack</div>
              <div className={styles.techTags}>
                <span className={styles.techTag}>ROS 2</span>
                <span className={styles.techTag}>Gazebo</span>
                <span className={styles.techTag}>Unity</span>
                <span className={styles.techTag}>NVIDIA Isaac</span>
                <span className={styles.techTag}>Python</span>
                <span className={styles.techTag}>C++</span>
                <span className={styles.techTag}>OpenAI</span>
                <span className={styles.techTag}>PyTorch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
