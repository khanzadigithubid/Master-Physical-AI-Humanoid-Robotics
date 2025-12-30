import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  // Expose custom environment variables to the browser
  customFields: {
    DOCUSAURUS_API_URL: process.env.DOCUSAURUS_API_URL || 'http://localhost:8000',
  },
  title: 'Physical AI & Humanoid Robotics',
  tagline: 'AI-Native Textbook Platform for Physical AI Education',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://khanzadigithubid.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment with project repo, use '/<projectName>/'
  baseUrl: '/Master-Physical-AI-Humanoid-Robotics/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'khanzadigithubid', // GitHub org/user name.
  projectName: 'Master-Physical-AI-Humanoid-Robotics', // Repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Remove edit URL for now
          // editUrl: 'https://github.com/khanzadigithubid/Master-Physical-AI-Humanoid-Robotics',
          remarkPlugins: [require('remark-math')],
          rehypePlugins: [require('rehype-katex')],
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Edit URL removed - not using blog editing
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Social card for link previews (optional - can be customized later)
    // image: 'img/social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Physical AI Textbook',
      hideOnScroll: false,
      // Logo removed - using text-only branding
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Chapters',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {to: '/signup', label: 'Sign Up', position: 'right', className: 'navbar-signup-btn'},
        {to: '/signin', label: 'Sign In', position: 'right'},
        {
          href: 'https://github.com/khanzadigithubid/Master-Physical-AI-Humanoid-Robotics',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    // Footer disabled - using custom SocialFooter component instead
    // footer: undefined,
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
