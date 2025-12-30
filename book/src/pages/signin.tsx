/**
 * Signin Page - Embedded in Docusaurus
 */

import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { signin, type SigninRequest } from '../lib/api-client';
import styles from './auth.module.css';

export default function SigninPage() {
  const [formData, setFormData] = useState<SigninRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signin(formData);
      // Redirect to book homepage
      window.location.href = '/docs/intro';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signin failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Sign In" description="Sign in to your account">
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to continue your Physical AI learning journey.
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
                placeholder="Your password"
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={isLoading} className={styles.button}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.footer}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
