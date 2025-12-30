import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import ChapterCard, {type ChapterItem} from '../ChapterCard';
import styles from './styles.module.css';

const featuredChapters: ChapterItem[] = [
  {
    number: 1,
    title: 'Robotic Nervous System (ROS 2)',
    description: 'Master ROS 2, the industry-standard middleware for robot control. Learn nodes, topics, services, and actions.',
    path: '/docs/07-ros2-nervous-system/introduction',
    icon: '🧠',
    status: 'available',
    topics: ['ROS 2', 'Middleware', 'Nodes', 'Topics'],
  },
  {
    number: 2,
    title: 'Digital Twin (Gazebo & Unity)',
    description: 'Build realistic physics simulations and virtual environments for testing robots before real-world deployment.',
    path: '/docs/08-digital-twin/gazebo-unity',
    icon: '🌍',
    status: 'available',
    topics: ['Gazebo', 'Unity', 'Simulation', 'Physics'],
  },
  {
    number: 3,
    title: 'AI-Robot Brain (NVIDIA Isaac)',
    description: 'Harness NVIDIA Isaac for advanced perception, training, and sim-to-real transfer with GPU acceleration.',
    path: '/docs/09-isaac-brain/introduction',
    icon: '🚀',
    status: 'available',
    topics: ['Isaac Sim', 'GPU', 'Perception', 'Training'],
  },
];

export default function FeaturedChapters(): ReactNode {
  return (
    <section className={styles.featuredSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Featured Chapters
          </Heading>
          <p className={styles.sectionSubtitle}>
            Dive into the most exciting topics in Physical AI and Humanoid Robotics
          </p>
        </div>

        <div className="row">
          {featuredChapters.map((chapter) => (
            <div key={chapter.number} className="col col--4">
              <ChapterCard chapter={chapter} featured />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
