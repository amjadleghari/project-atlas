import React, { type ReactNode } from 'react';
import { usePluginData } from '@docusaurus/useGlobalData';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type { PortalData, PortalSpecData } from '../../../plugins/portal';
import styles from './portal.module.css';

export function usePortalData(): PortalData {
  return usePluginData('docusaurus-plugin-portal') as PortalData;
}

const STATUS_CLASS: Record<string, string> = {
  current: styles.ok,
  active: styles.ok,
  onboarding: styles.info,
  deprecated: styles.warn,
  sunset: styles.warn,
  retired: styles.muted,
};

/** Status shown as a labelled pill (never colour alone). */
export function StatusPill({ status }: { status?: string }): ReactNode {
  if (!status) return null;
  return <span className={`${styles.pill} ${STATUS_CLASS[status] ?? ''}`}>{status}</span>;
}

/** JSON + YAML download buttons for a bundled contract. */
export function DownloadButtons({ spec, compact }: { spec: Pick<PortalSpecData, 'id' | 'downloads'>; compact?: boolean }): ReactNode {
  const json = useBaseUrl(spec.downloads.json);
  const yaml = useBaseUrl(spec.downloads.yaml);
  return (
    <span className={styles.downloads}>
      <a className={`${styles.dl} ${compact ? styles.dlCompact : ''}`} href={json} download={`${spec.id}.json`}>
        <DownloadIcon /> JSON
      </a>
      <a className={`${styles.dl} ${compact ? styles.dlCompact : ''}`} href={yaml} download={`${spec.id}.yaml`}>
        <DownloadIcon /> YAML
      </a>
    </span>
  );
}

export function DownloadIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 12.5h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
