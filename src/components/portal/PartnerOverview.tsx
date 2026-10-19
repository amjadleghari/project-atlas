/**
 * Facts, contacts and contract versions for one partner, read from its partner.yaml.
 * Usage in a partner's index.mdx:  <PartnerOverview partner="northwind-super" />
 */
import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { usePortalData, DownloadButtons, StatusPill } from './shared';
import styles from './portal.module.css';

export default function PartnerOverview({ partner: id }: { partner: string }): ReactNode {
  const { partners, specs } = usePortalData();
  const p = partners.find((x) => x.id === id);
  if (!p) return <div className="alert alert--danger">Unknown partner “{id}” — check partner.yaml.</div>;
  return (
    <div>
      <div className={styles.factGrid}>
        <div className={styles.fact}>
          <div className={styles.factLabel}>Status</div>
          <div className={styles.factValue}>
            <StatusPill status={p.status} />
          </div>
        </div>
        <div className={styles.fact}>
          <div className={styles.factLabel}>Owning team</div>
          <div className={styles.factValue}>
            <code>{p.owner ?? '—'}</code>
          </div>
        </div>
        {p.contacts.map((c) => (
          <div key={c.email ?? c.name} className={styles.fact}>
            <div className={styles.factLabel}>{c.role ?? 'Contact'}</div>
            <div className={styles.factValue}>
              {c.name}
              {c.email && (
                <>
                  <br />
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Version</th>
            <th>Status</th>
            <th>Built from</th>
            <th>Released</th>
            <th>Contract</th>
          </tr>
        </thead>
        <tbody>
          {p.versions.map((v) => {
            const spec = specs.find((s) => s.partner === p.id && s.version === v.version);
            return (
              <tr key={v.version}>
                <td>{spec ? <Link to={spec.route}>{v.version} reference</Link> : v.version}</td>
                <td>
                  <StatusPill status={v.status} />
                  {v.sunset && <div style={{ fontSize: '0.8rem' }}>sunset {v.sunset}</div>}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  master <code>{v.master}</code>
                  {spec?.info.version && <> ({spec.info.version})</>}
                  <br />+ {v.overlays.map((o) => o.replace(/^overlays\//, '')).join(', ')}
                </td>
                <td>{v.released ?? '—'}</td>
                <td>{spec && <DownloadButtons spec={spec} compact />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
