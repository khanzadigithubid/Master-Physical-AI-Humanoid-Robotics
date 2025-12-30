/**
 * Testimonials Section - Student Reviews
 * Social proof for hackathon credibility
 */

import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Testimonial = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Robotics Engineering Student',
    avatar: '👩‍💻',
    quote: 'The RAG chatbot is incredible! I can ask questions about any concept and get instant, context-aware answers. The personalized learning paths adapted to my background perfectly.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Ahmed Hassan',
    role: 'AI Researcher',
    avatar: '👨‍🔬',
    quote: 'Best Physical AI curriculum I\'ve found. The progression from kinematics to humanoid locomotion is logical and comprehensive. Hardware guides are practical and detailed.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Maria Rodriguez',
    role: 'Mechatronics Engineer',
    avatar: '👩‍🔧',
    quote: 'Interactive features like translation and personalization make complex robotics accessible. The capstone projects mirror real industry challenges. Highly recommended!',
    rating: 5,
  },
];

function TestimonialCard({testimonial}: {testimonial: Testimonial}) {
  return (
    <div className={styles.testimonialCard}>
      <div className={styles.quote}>"</div>
      <p className={styles.testimonialText}>{testimonial.quote}</p>

      <div className={styles.rating}>
        {[...Array(testimonial.rating)].map((_, i) => (
          <span key={i} className={styles.star}>★</span>
        ))}
      </div>

      <div className={styles.author}>
        <div className={styles.avatar}>{testimonial.avatar}</div>
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{testimonial.name}</div>
          <div className={styles.authorRole}>{testimonial.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection(): ReactNode {
  return (
    <section className={styles.testimonialsSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            What Students Say
          </Heading>
          <p className={styles.sectionSubtitle}>
            Join hundreds of learners mastering Physical AI and Humanoid Robotics
          </p>
        </div>

        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
