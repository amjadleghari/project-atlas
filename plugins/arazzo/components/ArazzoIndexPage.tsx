import React, { type ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Props = {
  index: {
    title: string;
    version?: string;
    summary?: string;
    permalink: string;
    file: string;
    workflows: { workflowId: string; summary?: string; steps: number }[];
  }[];
};

export default function ArazzoIndexPage({ index }: Props): ReactNode {
  return (
    <Layout title="Workflows" description="Arazzo workflows that chain our internal APIs.">
      <main className={`container margin-vert--lg ${styles.page}`}>
        <Heading as="h1">Workflows</Heading>
        <p className={styles.lead}>
          Arazzo contracts describing how our APIs are called together. Each step links to the operation in its API
          reference.
        </p>
        {index.length === 0 && <p>No Arazzo documents found. Add a <code>*.arazzo.yaml</code> file to the <code>arazzo/</code> folder.</p>}
        <div className={styles.cards}>
          {index.map((d) => (
            <Link key={d.permalink} to={d.permalink} className={styles.card}>
              <div className={styles.cardTitle}>
                {d.title}
                {d.version && <span className={styles.pill}>v{d.version}</span>}
              </div>
              {d.summary && <p className={styles.muted}>{d.summary}</p>}
              <ul className={styles.wfList}>
                {d.workflows.map((w) => (
                  <li key={w.workflowId}>
                    <code>{w.workflowId}</code>
                    <span className={styles.muted}>
                      {' '}
                      · {w.steps} step{w.steps === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  );
}
