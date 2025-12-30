/**
 * Social Footer Component
 * Professional footer with contact links (WhatsApp, Zoom, GitHub)
 */

import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type SocialLink = {
  name: string;
  icon: string;
  url: string;
  description: string;
  color: string;
};

const socialLinks: SocialLink[] = [
  {
    name: 'WhatsApp Community',
    icon: '💬',
    url: 'https://wa.me/',  // Add your WhatsApp link
    description: 'Join our student community',
    color: '#25D366',
  },
  {
    name: 'Zoom Sessions',
    icon: '📹',
    url: 'https://zoom.us/',  // Add your Zoom link
    description: 'Weekly live Q&A sessions',
    color: '#2D8CFF',
  },
  {
    name: 'GitHub Repository',
    icon: '⚡',
    url: 'https://github.com/khanzadiwazirali/physical-ai-textbook',
    description: 'Contribute & star the project',
    color: '#24292F',
  },
];

type QuickLink = {
  label: string;
  to: string;
};

const quickLinks: QuickLink[] = [
  { label: 'Documentation', to: '/docs/intro' },
  { label: 'Curriculum', to: '/docs/introduction/overview' },
  { label: 'Hardware Setup', to: '/docs/robotics-fundamentals/actuators-sensors' },
  { label: 'Capstone Projects', to: '/docs/humanoid-robotics/bipedal-locomotion' },
];

const resourceLinks: QuickLink[] = [
  { label: 'Sign Up', to: '/signup' },
  { label: 'Sign In', to: '/signin' },
  { label: 'About Us', to: '/docs/intro' },
  { label: 'Contact', to: 'https://github.com/khanzadiwazirali/physical-ai-textbook/issues' },
];

export default function SocialFooter(): ReactNode {
  return (
    <footer className={styles.footer}>
      <div className="container">
        {/* Main Footer Content */}
        <div className={styles.footerContent}>
          {/* Brand Section */}
          <div className={styles.footerColumn}>
            <Heading as="h3" className={styles.footerBrand}>
              🤖 Physical AI Textbook
            </Heading>
            <p className={styles.footerDescription}>
              Master Physical AI and Humanoid Robotics with our comprehensive,
              interactive learning platform. From fundamentals to deployment.
            </p>
            <div className={styles.footerStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>24</span>
                <span className={styles.statLabel}>Chapters</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>6</span>
                <span className={styles.statLabel}>Modules</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100+</span>
                <span className={styles.statLabel}>Hours</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerColumn}>
            <Heading as="h4" className={styles.footerTitle}>
              Quick Links
            </Heading>
            <ul className={styles.footerLinks}>
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={styles.footerLink}>
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className={styles.footerColumn}>
            <Heading as="h4" className={styles.footerTitle}>
              Resources
            </Heading>
            <ul className={styles.footerLinks}>
              {resourceLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={styles.footerLink}>
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className={styles.footerColumn}>
            <Heading as="h4" className={styles.footerTitle}>
              Connect With Us
            </Heading>
            <p className={styles.connectDescription}>
              Join our community and stay updated with the latest in Physical AI
            </p>
            <div className={styles.socialButtons}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  style={{'--social-color': social.color} as React.CSSProperties}
                  title={social.description}>
                  <span className={styles.socialIcon}>{social.icon}</span>
                  <span className={styles.socialName}>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Physical AI Textbook Platform. Built with ❤️ for robotics education.
            </p>
            <div className={styles.footerMeta}>
              <Link to="/docs/intro" className={styles.metaLink}>
                Privacy
              </Link>
              <span className={styles.separator}>•</span>
              <Link to="/docs/intro" className={styles.metaLink}>
                Terms
              </Link>
              <span className={styles.separator}>•</span>
              <Link to="https://github.com/khanzadiwazirali/physical-ai-textbook" className={styles.metaLink}>
                Open Source
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
