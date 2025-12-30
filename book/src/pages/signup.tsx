/**
 * Signup Page - Embedded in Docusaurus
 * Collects user background (software & hardware) for personalization
 */

import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { signup, type SignupRequest } from '../lib/api-client';
import styles from './auth.module.css';

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    password: '',
    software_background: 'beginner',
    hardware_background: 'none',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signup(formData);
      // Redirect to book homepage
      window.location.href = '/docs/intro';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Sign Up" description="Create your account">
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Create Your Account</h1>
          <p className={styles.subtitle}>
            Tell us about your background so we can personalize your learning experience.
          </p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="you@example.com"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="software">Software Experience</label>
              <select
                id="software"
                value={formData.software_background}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    software_background: e.target.value as SignupRequest['software_background'],
                  })
                }
                className={styles.select}
              >
                <option value="beginner">Beginner - New to programming</option>
                <option value="intermediate">Intermediate - Can write scripts and basic programs</option>
                <option value="advanced">Advanced - Professional software developer</option>
              </select>
              <small className={styles.hint}>
                Helps us adjust code examples and explanations
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hardware">Hardware Experience</label>
              <select
                id="hardware"
                value={formData.hardware_background}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hardware_background: e.target.value as SignupRequest['hardware_background'],
                  })
                }
                className={styles.select}
              >
                <option value="none">None - No hardware experience</option>
                <option value="hobbyist">Hobbyist - Arduino, Raspberry Pi projects</option>
                <option value="professional">Professional - Engineering or robotics background</option>
              </select>
              <small className={styles.hint}>
                Helps us explain physical concepts appropriately
              </small>
            </div>

            <button type="submit" disabled={isLoading} className={styles.button}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.footer}>
            Already have an account? <Link to="/signin">Sign In</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
