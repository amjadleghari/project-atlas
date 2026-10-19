/**
 * Wraps Redocusaurus' API page with a toolbar: breadcrumb, version and status,
 * and JSON / YAML downloads of the bundled contract.
 */
import React, { type ReactNode } from 'react';
import Layout from '@theme/Layout';
import Redoc from '@theme/Redoc';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePortalData, DownloadButtons, StatusPill } from '@site/src/components/portal/shared';
import styles from '@site/src/components/portal/portal.module.css';

type Props = { layoutProps?: Record<string, unknown>; specProps: any };

const trim = (p: string) => p.replace(/\/+$/, '');

export default function ApiDoc({ layoutProps, specProps }: Props): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const { pathname } = useLocation();
  const { specs, partners } = usePortalData();
  const base = trim(siteConfig.baseUrl);
  const spec = specs.find((s) => trim(base + s.route) === trim(pathname));
  const partner = spec?.partner ? partners.find((p) => p.id === spec.partner) : undefined;
  const info = specProps.spec?.info ?? {};
  const generated = info['x-generated-from'];

  return (
    <Layout title={info.title ?? 'API reference'} description={info.summary ?? info.description} {...layoutProps}>
      {spec && (
        <div className={styles.bar}>
          <div className={styles.barInner}>
            <div className={styles.barMain}>
              <span className={styles.crumbs}>
                {partner ? (
                  <>
                    <Link to="/partners">Partners</Link> / <Link to={`/partners/${partner.id}/`}>{partner.name}</Link> /
                  </>
                ) : (
                  <>API reference /</>
                )}
              </span>
              <span className={styles.barTitle}>{spec.label}</span>
              {info.version && <span className={styles.barMeta}>v{info.version}</span>}
              <StatusPill status={spec.status} />
              {generated && (
                <span className={styles.barMeta}>
                  generated from <code>master/{spec.version && partner ? partner.versions.find((v) => v.version === spec.version)?.master : ''}</code>{' '}
                  + {generated.overlays?.length ?? 0} overlay{generated.overlays?.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <DownloadButtons spec={spec} />
          </div>
        </div>
      )}
      <Redoc {...specProps} />
    </Layout>
  );
}
