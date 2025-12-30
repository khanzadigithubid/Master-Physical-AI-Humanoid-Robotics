import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/index-professional',
    component: ComponentCreator('/index-professional', '2bf'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/signin',
    component: ComponentCreator('/signin', 'ba0'),
    exact: true
  },
  {
    path: '/signup',
    component: ComponentCreator('/signup', '312'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '8d2'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '96d'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'e11'),
            routes: [
              {
                path: '/docs/ai-for-robotics/foundation-models',
                component: ComponentCreator('/docs/ai-for-robotics/foundation-models', '4ae'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/ai-for-robotics/reinforcement-learning',
                component: ComponentCreator('/docs/ai-for-robotics/reinforcement-learning', 'eae'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/deployment-ethics/safety-systems',
                component: ComponentCreator('/docs/deployment-ethics/safety-systems', 'd58'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/humanoid-robotics/bipedal-locomotion',
                component: ComponentCreator('/docs/humanoid-robotics/bipedal-locomotion', '20d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/humanoid-robotics/manipulation-grasping',
                component: ComponentCreator('/docs/humanoid-robotics/manipulation-grasping', 'e8d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/introduction/curriculum-guide',
                component: ComponentCreator('/docs/introduction/curriculum-guide', '60d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/introduction/overview',
                component: ComponentCreator('/docs/introduction/overview', '48e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/introduction/physical-ai-definition',
                component: ComponentCreator('/docs/introduction/physical-ai-definition', '6c0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/introduction/prerequisites',
                component: ComponentCreator('/docs/introduction/prerequisites', '355'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/perception-systems/computer-vision',
                component: ComponentCreator('/docs/perception-systems/computer-vision', '769'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/perception-systems/lidar-sensors',
                component: ComponentCreator('/docs/perception-systems/lidar-sensors', '481'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/perception-systems/sensor-fusion',
                component: ComponentCreator('/docs/perception-systems/sensor-fusion', '6af'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/perception-systems/slam',
                component: ComponentCreator('/docs/perception-systems/slam', 'd8a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/robotics-fundamentals/actuators-sensors',
                component: ComponentCreator('/docs/robotics-fundamentals/actuators-sensors', 'd25'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/robotics-fundamentals/control-theory',
                component: ComponentCreator('/docs/robotics-fundamentals/control-theory', '309'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/robotics-fundamentals/dynamics',
                component: ComponentCreator('/docs/robotics-fundamentals/dynamics', '02b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/robotics-fundamentals/kinematics',
                component: ComponentCreator('/docs/robotics-fundamentals/kinematics', 'add'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
