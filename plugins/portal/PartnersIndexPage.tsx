import React, { type ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { DownloadButtons, StatusPill } from '@site/src/components/portal/shared';
import styles from '@site/src/components/portal/portal.module.css';
import type { PortalData } from './index';

export default function PartnersIndexPage({ data }: { data: PortalData }): ReactNode {
  const masters = data.specs.filter((s) => s.group === 'master');
  return (
    <Layout title="Partners" description="Partner contracts and documentation">
      <main className="container margin-vert--lg">
        <Heading as="h1">Partners</Heading>
        <p>
          Each partner gets its own contract, generated from the master Partner Experience API with that partner's
          OpenAPI overlays, plus its own onboarding notes and changelog.
        </p>
        <p>
          Master versions:{' '}
          {masters.map((m, i) => (
            <React.Fragment key={m.id}>
              {i > 0 && ' · '}
              <Link to={m.route}>{m.label}</Link>
            </React.Fragment>
          ))}
        </p>
        <div className={styles.grid}>
          {data.partners.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHead}>
                <Link to={`/partners/${p.id}/`} className={styles.cardTitle}>
                  {p.name}
                </Link>
                <StatusPill status={p.status} />
              </div>
              {p.summary && <p className={styles.cardSummary}>{p.summary}</p>}
              <ul className={styles.versionList}>
                {p.versions.map((v) => {
                  const spec = data.specs.find((s) => s.partner === p.id && s.version === v.version);
                  return (
                    <li key={v.version}>
                      {spec ? <Link to={spec.route}>{v.version}</Link> : <strong>{v.version}</strong>}
                      <StatusPill status={v.status} />
                      <span style={{ color: 'var(--ifm-color-emphasis-700)' }}>
                        master {v.master}
                        {v.sunset ? ` · sunset ${v.sunset}` : ''}
                      </span>
                      {spec && (
                        <span style={{ marginLeft: 'auto' }}>
                          <DownloadButtons spec={spec} compact />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className={styles.cardFoot}>
                <span>{p.owner ? `Owner ${p.owner}` : ''}</span>
                <Link to={`/partners/${p.id}/`}>Partner docs →</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
