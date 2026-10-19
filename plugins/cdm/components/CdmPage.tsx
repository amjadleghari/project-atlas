import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useHistory, useLocation } from '@docusaurus/router';
import { useColorMode } from '@docusaurus/theme-common';
import type { CdmGraphData } from '../index';
import DetailPanel from './DetailPanel';
import { familyColor } from './palette';
import styles from './styles.module.css';

export type Selection = { kind: 'model'; id: string } | { kind: 'family'; id: string } | null;

function readSelection(search: string, graph: CdmGraphData): Selection {
  const q = new URLSearchParams(search);
  const model = q.get('model');
  if (model && graph.models.some((m) => m.id === model)) return { kind: 'model', id: model };
  const family = q.get('family');
  if (family && graph.families.some((f) => f.id === family)) return { kind: 'family', id: family };
  return null;
}

function Legend({ graph, mode }: { graph: CdmGraphData; mode: 'light' | 'dark' }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(max-width: 996px)').matches) setOpen(false);
  }, []);
  return (
    <details
      className={styles.legend}
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className={styles.legendSummary}>Legend</summary>
      <div className={styles.legendRow}>
        <svg width="34" height="12" aria-hidden>
          <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="2" />
          <path d="M22 1 L32 6 L22 11 Z" fill="var(--ifm-background-color)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Extends
      </div>
      <div className={styles.legendRow}>
        <svg width="34" height="12" aria-hidden>
          <path d="M2 6 L8 2 L14 6 L8 10 Z" fill="currentColor" />
          <line x1="14" y1="6" x2="32" y2="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Contains
      </div>
      <div className={styles.legendRow}>
        <svg width="34" height="12" aria-hidden>
          <line x1="2" y1="6" x2="28" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 3" />
          <path d="M24 2 L31 6 L24 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        References by id
      </div>
      <div className={styles.legendRow}>
        <span className={styles.legendAbstract} aria-hidden />
        Abstract
      </div>
      <div className={styles.legendDivider} />
      {graph.families.map((f, i) => (
        <div key={f.id} className={styles.legendRow}>
          <span className={styles.swatch} style={{ background: familyColor(i, mode) }} aria-hidden />
          {f.title}
        </div>
      ))}
    </details>
  );
}

function CdmApp({ graph }: { graph: CdmGraphData }): ReactNode {
  const location = useLocation();
  const history = useHistory();
  const { colorMode } = useColorMode();

  const [selection, setSelection] = useState<Selection>(null);
  const [hiddenFamilies, setHiddenFamilies] = useState<Set<string>>(new Set());
  const [showComposition, setShowComposition] = useState(true);
  const [showReferences, setShowReferences] = useState(true);
  const [lineageOnly, setLineageOnly] = useState(false);
  const [layout, setLayout] = useState<'hierarchy' | 'clusters'>('hierarchy');
  const [fitSignal, setFitSignal] = useState(0);

  // Narrow screens: the compact cluster layout reads better than a wide hierarchy.
  useEffect(() => {
    if (window.matchMedia('(max-width: 700px)').matches) setLayout('clusters');
  }, []);
  const [query, setQuery] = useState('');

  // Deep links: /data-model?model=Customer or ?family=party (read after hydration)
  useEffect(() => {
    setSelection(readSelection(location.search, graph));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const select = useCallback(
    (s: Selection) => {
      setSelection(s);
      const q = new URLSearchParams();
      if (s?.kind === 'model') q.set('model', s.id);
      if (s?.kind === 'family') q.set('family', s.id);
      const search = q.toString() ? `?${q}` : '';
      if (search !== location.search) history.replace({ ...location, search, hash: '' });
      // a hidden family's model should become visible when picked
      if (s?.kind === 'model') {
        const fam = graph.models.find((m) => m.id === s.id)?.family;
        if (fam && hiddenFamilies.has(fam)) {
          const next = new Set(hiddenFamilies);
          next.delete(fam);
          setHiddenFamilies(next);
        }
      }
    },
    [history, location, graph, hiddenFamilies],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement)) select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  const toggleFamily = (id: string) => {
    const next = new Set(hiddenFamilies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (next.size === graph.families.length) return; // keep at least one visible
    setHiddenFamilies(next);
  };

  const onlyFamily = (id: string) => setHiddenFamilies(new Set(graph.families.map((f) => f.id).filter((f) => f !== id)));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return graph.models
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.properties.some((p) => p.name.toLowerCase().includes(q)) ||
          (m.description ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, graph]);

  const mode = colorMode === 'dark' ? 'dark' : 'light';

  return (
      <div className={styles.app}>
        <div className={styles.toolbar} role="toolbar" aria-label="Graph controls">
          <div className={styles.search}>
            <input
              type="search"
              placeholder="Find a model or property…"
              value={query}
              aria-label="Find a model or property"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) {
                  select({ kind: 'model', id: matches[0].id });
                  setQuery('');
                }
                if (e.key === 'Escape') setQuery('');
              }}
            />
            {matches.length > 0 && (
              <ul className={styles.searchResults} role="listbox">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        select({ kind: 'model', id: m.id });
                        setQuery('');
                      }}
                    >
                      <strong>{m.title}</strong>
                      <span className={styles.muted}> · {graph.families.find((f) => f.id === m.family)?.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.chips} aria-label="Families">
            {graph.families.map((f, i) => {
              const on = !hiddenFamilies.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                  aria-pressed={on}
                  title={`${on ? 'Hide' : 'Show'} ${f.title} (double-click: show only this)`}
                  onClick={() => toggleFamily(f.id)}
                  onDoubleClick={() => onlyFamily(f.id)}
                >
                  <span className={styles.swatch} style={{ background: familyColor(i, mode) }} aria-hidden />
                  {f.title}
                  <span className={styles.chipCount}>{f.models.length}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.toggles}>
            <label>
              <input type="checkbox" checked={showComposition} onChange={(e) => setShowComposition(e.target.checked)} />
              Contains
            </label>
            <label>
              <input type="checkbox" checked={showReferences} onChange={(e) => setShowReferences(e.target.checked)} />
              References
            </label>
            <label title={selection?.kind === 'model' ? '' : 'Select a model first'}>
              <input
                type="checkbox"
                checked={lineageOnly}
                disabled={selection?.kind !== 'model'}
                onChange={(e) => setLineageOnly(e.target.checked)}
              />
              Lineage only
            </label>
            <select value={layout} onChange={(e) => setLayout(e.target.value as any)} aria-label="Layout">
              <option value="hierarchy">Hierarchy</option>
              <option value="clusters">Clusters</option>
            </select>
            <button type="button" className={styles.iconBtn} onClick={() => setFitSignal((n) => n + 1)} title="Fit to screen">
              Fit
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.canvas}>
            <BrowserOnly fallback={<div className={styles.loading}>Loading graph…</div>}>
              {() => {
                const CdmGraph = require('./CdmGraph').default;
                return (
                  <CdmGraph
                    graph={graph}
                    selection={selection}
                    onSelect={select}
                    hiddenFamilies={hiddenFamilies}
                    showComposition={showComposition}
                    showReferences={showReferences}
                    lineageOnly={lineageOnly}
                    layout={layout}
                    mode={mode}
                    fitSignal={fitSignal}
                  />
                );
              }}
            </BrowserOnly>
            <Legend graph={graph} mode={mode} />
          </div>
          <aside className={styles.panel} aria-label="Details">
            <DetailPanel graph={graph} selection={selection} onSelect={select} onOnlyFamily={onlyFamily} mode={mode} />
          </aside>
        </div>
      </div>
  );
}

export default function CdmPage({ graph }: { graph: CdmGraphData }): ReactNode {
  return (
    <Layout title="Canonical data model" description="Interactive map of the canonical data model" noFooter>
      <CdmApp graph={graph} />
    </Layout>
  );
}
