import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { openapiSpecs, arazzo, cdm } from '../../apis.config';
import styles from './index.module.css';

export default function Home(): ReactNode {
  return (
    <Layout title="Home" description="Internal API contracts and workflows">
      <header className={styles.hero}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            API Portal
          </Heading>
          <p className={styles.subtitle}>
            Every internal API contract and the workflows that connect them, generated straight from the repository.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs">
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to={arazzo.routeBasePath}>
              Browse workflows
            </Link>
          </div>
        </div>
      </header>
      <main className="container margin-vert--xl">
        <Heading as="h2">API reference</Heading>
        <div className={styles.grid}>
          {openapiSpecs.map((s) => (
            <Link key={s.id} to={s.route} className={styles.card}>
              <span className={styles.badge}>OpenAPI</span>
              <div className={styles.cardTitle}>{s.label}</div>
              <p>{s.description}</p>
            </Link>
          ))}
          <Link to={arazzo.routeBasePath} className={`${styles.card} ${styles.cardAlt}`}>
            <span className={`${styles.badge} ${styles.badgeAlt}`}>Arazzo</span>
            <div className={styles.cardTitle}>Workflows</div>
            <p>Multi-step journeys across APIs, with diagrams and links to every operation.</p>
          </Link>
          <Link to={cdm.routeBasePath} className={`${styles.card} ${styles.cardAlt}`}>
            <span className={`${styles.badge} ${styles.badgeCdm}`}>JSON Schema</span>
            <div className={styles.cardTitle}>Canonical data model</div>
            <p>Interactive map of the shared models, their families and inheritance, and where each is used.</p>
          </Link>
        </div>
      </main>
    </Layout>
  );
}
