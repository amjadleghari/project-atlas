import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { arazzo, cdm, site } from '../../apis.config';
import { usePortalData, StatusPill } from '../components/portal/shared';
import styles from './index.module.css';

export default function Home(): ReactNode {
  const { specs, partners } = usePortalData();
  const apis = specs.filter((s) => s.group === 'platform' || s.group === 'master');
  return (
    <Layout title="Home" description={site.tagline}>
      <header className={styles.hero}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            {site.name}
          </Heading>
          <p className={styles.subtitle}>{site.tagline}</p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs">
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to="/partners">
              Partner contracts
            </Link>
          </div>
        </div>
      </header>
      <main className="container margin-vert--xl">
        <Heading as="h2">API reference</Heading>
        <div className={styles.grid}>
          {apis.map((s) => (
            <Link key={s.id} to={s.route} className={styles.card}>
              <span className={styles.badge}>{s.group === 'master' ? 'Master' : 'OpenAPI'}</span>
              <div className={styles.cardTitle}>{s.label}</div>
              <p>{s.description}</p>
            </Link>
          ))}
        </div>

        <Heading as="h2" className="margin-top--xl">
          Explore
        </Heading>
        <div className={styles.grid}>
          <Link to="/partners" className={`${styles.card} ${styles.cardAlt}`}>
            <span className={`${styles.badge} ${styles.badgePartner}`}>Partners</span>
            <div className={styles.cardTitle}>Partner contracts &amp; docs</div>
            <p>
              {partners.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  {p.name} <StatusPill status={p.status} />
                </span>
              ))}
            </p>
          </Link>
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
          <Link to="/docs/diagrams" className={`${styles.card} ${styles.cardAlt}`}>
            <span className={styles.badge}>Mermaid</span>
            <div className={styles.cardTitle}>Diagrams as code</div>
            <p>19 diagram types with copy-ready examples: sequence, state, C4, ER, Gantt and more.</p>
          </Link>
        </div>
      </main>
    </Layout>
  );
}
