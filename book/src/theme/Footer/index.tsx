/**
 * Custom Footer Theme Component
 * This replaces the default Docusaurus footer with our SocialFooter
 * and appears on ALL pages (docs, blog, etc.)
 */

import type {ReactNode} from 'react';
import SocialFooter from '@site/src/components/SocialFooter';

export default function Footer(): ReactNode {
  return <SocialFooter />;
}
