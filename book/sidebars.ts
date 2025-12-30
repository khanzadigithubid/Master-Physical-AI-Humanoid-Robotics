import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '📚 Welcome',
    },
    {
      type: 'category',
      label: '🤖 Module 1: Introduction to Physical AI',
      collapsed: false,
      items: [
        'introduction/overview',
        'introduction/physical-ai-definition',
        'introduction/curriculum-guide',
        'introduction/prerequisites',
      ],
    },
    {
      type: 'category',
      label: '⚙️ Module 2: Robotics Fundamentals',
      collapsed: true,
      items: [
        'robotics-fundamentals/kinematics',
        'robotics-fundamentals/dynamics',
        'robotics-fundamentals/control-theory',
        'robotics-fundamentals/actuators-sensors',
      ],
    },
    {
      type: 'category',
      label: '👁️ Module 3: Perception Systems',
      collapsed: true,
      items: [
        'perception-systems/computer-vision',
        'perception-systems/lidar-sensors',
        'perception-systems/sensor-fusion',
        'perception-systems/slam',
      ],
    },
    {
      type: 'category',
      label: '🧠 Module 4: AI for Robotics',
      collapsed: true,
      items: [
        'ai-for-robotics/reinforcement-learning',
        'ai-for-robotics/foundation-models',
      ],
    },
    {
      type: 'category',
      label: '🚶 Module 5: Humanoid Robotics',
      collapsed: true,
      items: [
        'humanoid-robotics/bipedal-locomotion',
        'humanoid-robotics/manipulation-grasping',
      ],
    },
    {
      type: 'category',
      label: '🌍 Module 6: Deployment & Ethics',
      collapsed: true,
      items: [
        'deployment-ethics/safety-systems',
      ],
    },
  ],
};

export default sidebars;
