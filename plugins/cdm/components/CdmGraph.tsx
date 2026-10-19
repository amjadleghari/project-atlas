/**
 * Cytoscape-rendered graph of the canonical data model. Client-only: CdmPage
 * loads it inside <BrowserOnly>.
 *
 *  - Families are compound nodes (boxes) containing their models.
 *  - Inheritance: solid line, hollow triangle at the parent (UML generalisation).
 *  - Composition: diamond at the owning model.
 *  - Reference by id (x-references): dashed line with an open arrow.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { type Core, type ElementDefinition, type NodeSingular } from 'cytoscape';
import elk from 'cytoscape-elk';
import fcose from 'cytoscape-fcose';
import type { CdmGraphData } from '../index';
import { familyColor, type Mode } from './palette';
import type { Selection } from './CdmPage';
import styles from './styles.module.css';

let registered = false;
function register() {
  if (registered) return;
  cytoscape.use(elk as any);
  cytoscape.use(fcose as any);
  registered = true;
}

export type GraphProps = {
  graph: CdmGraphData;
  selection: Selection;
  onSelect: (s: Selection) => void;
  hiddenFamilies: Set<string>;
  showComposition: boolean;
  showReferences: boolean;
  lineageOnly: boolean;
  layout: 'hierarchy' | 'clusters';
  mode: Mode;
  fitSignal: number;
};

const MAX_FIT_ZOOM = 1.35;

/** Fit to the given elements without zooming in past a comfortable reading size. */
function fitCapped(cy: Core, eles: cytoscape.CollectionReturnValue, padding: number, animate: boolean) {
  const bb = eles.boundingBox({});
  const zoom = Math.min(
    MAX_FIT_ZOOM,
    Math.max(cy.minZoom(), Math.min((cy.width() - 2 * padding) / bb.w, (cy.height() - 2 * padding) / bb.h)),
  );
  const pan = { x: (cy.width() - zoom * (bb.x1 + bb.x2)) / 2, y: (cy.height() - zoom * (bb.y1 + bb.y2)) / 2 };
  if (animate) cy.animate({ zoom, pan }, { duration: 300 });
  else cy.viewport({ zoom, pan });
}

/** On narrow screens, frame the selection and its neighbours rather than the whole map. */
function focusSelection(cy: Core, animate: boolean): boolean {
  if (cy.width() >= 700) return false;
  const focus = cy.nodes('.selected, .neighbor').filter(':visible');
  if (focus.empty()) return false;
  fitCapped(cy, focus.union(focus.connectedEdges(':visible')), 28, animate);
  return true;
}

const mid = (id: string) => `m:${id}`;
const fid = (id: string) => `f:${id}`;

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // Cytoscape can't paint 'transparent' (Infima uses it for some surfaces) — use the fallback.
  return v && v !== 'transparent' && !v.startsWith('rgba(0, 0, 0, 0') ? v : fallback;
}

function buildStyle(mode: Mode): cytoscape.StylesheetJson {
  const text = cssVar('--ifm-font-color-base', mode === 'dark' ? '#e3e3e3' : '#1c1e21');
  const textMuted = cssVar('--ifm-color-emphasis-700', '#606770');
  const surface = cssVar('--ifm-background-surface-color', mode === 'dark' ? '#242526' : '#ffffff');
  const lineStrong = cssVar('--ifm-color-emphasis-800', '#444950');
  const line = cssVar('--ifm-color-emphasis-500', '#8d949e');
  const font = cssVar('--ifm-font-family-base', 'system-ui, sans-serif');
  return [
    {
      selector: 'node[type="family"]',
      style: {
        shape: 'round-rectangle',
        'background-color': 'data(color)',
        'background-opacity': mode === 'dark' ? 0.14 : 0.07,
        'border-color': 'data(color)',
        'border-width': 1.5,
        'border-opacity': 0.9,
        label: 'data(label)',
        color: textMuted,
        'font-family': font,
        'font-size': 13,
        'font-weight': 700,
        'text-transform': 'uppercase',
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': -6,
        padding: '22px',
        'corner-radius': 14,
        'overlay-opacity': 0,
        'underlay-opacity': 0,
      } as any,
    },
    {
      selector: 'node[type="model"]',
      style: {
        shape: 'round-rectangle',
        width: 'data(w)',
        height: 'data(h)',
        'background-color': surface,
        'border-color': 'data(color)',
        'border-width': 2,
        label: 'data(label)',
        color: text,
        'font-family': font,
        'font-size': 13,
        'font-weight': 600,
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'underlay-color': 'data(color)',
        'underlay-padding': 6,
        'underlay-opacity': 0,
        'underlay-shape': 'round-rectangle',
        'transition-property': 'underlay-opacity, opacity, border-width',
        'transition-duration': 150,
      } as any,
    },
    { selector: 'node[?abstract]', style: { 'border-style': 'dashed', 'font-style': 'italic' } },
    { selector: 'node:active, edge:active', style: { 'overlay-opacity': 0 } as any },
    { selector: 'node[type="model"].hover', style: { 'underlay-opacity': 0.18 } as any },
    { selector: 'node[type="model"].neighbor', style: { 'border-width': 3 } },
    { selector: 'node[type="model"].selected', style: { 'border-width': 4, 'underlay-opacity': 0.32 } as any },
    { selector: 'node[type="family"].selected', style: { 'border-width': 3, 'background-opacity': mode === 'dark' ? 0.24 : 0.14 } },
    { selector: 'node.faded', style: { opacity: 0.18 } },
    { selector: 'node[type="family"].dim', style: { 'border-opacity': 0.35, 'text-opacity': 0.5 } },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': line,
        'curve-style': 'bezier',
        'target-arrow-color': line,
        'source-arrow-color': line,
        'arrow-scale': 1.2,
        'font-family': font,
        'font-size': 11,
        color: textMuted,
        'text-background-color': surface,
        'text-background-opacity': 1,
        'text-background-padding': '2px',
        'text-background-shape': 'roundrectangle',
      } as any,
    },
    {
      selector: 'edge[kind="extends"]',
      style: {
        width: 2,
        'line-color': lineStrong,
        'target-arrow-color': lineStrong,
        'target-arrow-shape': 'triangle',
        'target-arrow-fill': 'hollow',
        'arrow-scale': 1.6,
      },
    },
    {
      selector: 'edge[kind="embeds"], edge[kind="many"]',
      style: { 'source-arrow-shape': 'diamond', 'source-arrow-fill': 'filled', 'arrow-scale': 1.3 },
    },
    {
      selector: 'edge[kind="references"]',
      style: { 'line-style': 'dashed', 'line-dash-pattern': [6, 4], 'target-arrow-shape': 'vee' } as any,
    },
    { selector: 'edge.labelled', style: { label: 'data(label)', width: 2.5, 'z-compound-depth': 'top', 'z-index': 99 } as any },
    { selector: 'edge.faded', style: { opacity: 0.08 } },
    { selector: '.hidden', style: { display: 'none' } },
  ];
}

function buildElements(graph: CdmGraphData, mode: Mode): ElementDefinition[] {
  const colorOf = new Map(graph.families.map((f, i) => [f.id, familyColor(i, mode)]));
  const els: ElementDefinition[] = [];
  for (const f of graph.families) {
    els.push({ data: { id: fid(f.id), type: 'family', label: f.title, color: colorOf.get(f.id), family: f.id } });
  }
  for (const m of graph.models) {
    const label = m.abstract ? `${m.title}\n«abstract»` : m.title;
    els.push({
      data: {
        id: mid(m.id),
        parent: fid(m.family),
        type: 'model',
        label,
        abstract: m.abstract,
        color: colorOf.get(m.family),
        family: m.family,
        w: Math.max(96, m.title.length * 8 + 32),
        h: m.abstract ? 46 : 36,
      },
    });
  }
  for (const m of graph.models) {
    for (const p of m.extends) {
      els.push({ data: { id: `x:${m.id}>${p}`, source: mid(m.id), target: mid(p), kind: 'extends', label: '' } });
    }
    // merge several properties pointing at the same model into one edge
    const merged = new Map<string, { target: string; kind: string; labels: string[] }>();
    for (const prop of m.properties) {
      for (const r of prop.refs) {
        const key = `${r.kind}|${r.model}`;
        if (!merged.has(key)) merged.set(key, { target: r.model, kind: r.kind, labels: [] });
        merged.get(key)!.labels.push(r.kind === 'many' ? `${prop.name} [*]` : prop.name);
      }
    }
    for (const [key, e] of merged) {
      if (e.target === m.id && e.kind !== 'references') continue;
      els.push({
        data: { id: `r:${m.id}>${key}`, source: mid(m.id), target: mid(e.target), kind: e.kind, label: e.labels.join(', ') },
      });
    }
  }
  return els;
}

function layoutOptions(kind: 'hierarchy' | 'clusters'): cytoscape.LayoutOptions {
  if (kind === 'clusters') {
    return {
      name: 'fcose',
      quality: 'proof',
      animate: false,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: 9000,
      idealEdgeLength: 90,
      nestingFactor: 0.6,
      padding: 30,
    } as any;
  }
  return {
    name: 'elk',
    nodeDimensionsIncludeLabels: true,
    fit: true,
    padding: 30,
    animate: false,
    elk: {
      algorithm: 'layered',
      'elk.direction': 'UP', // parents above their subtypes
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.layered.spacing.nodeNodeBetweenLayers': 64,
      'elk.spacing.nodeNode': 28,
      'elk.padding': '[top=36,left=20,bottom=20,right=20]',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
  } as any;
}

export default function CdmGraph(props: GraphProps) {
  const { graph, selection, onSelect, hiddenFamilies, showComposition, showReferences, lineageOnly, layout, mode, fitSignal } =
    props;
  const container = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [tip, setTip] = useState<{ x: number; y: number; id: string } | null>(null);
  const byId = useMemo(() => new Map(graph.models.map((m) => [m.id, m])), [graph]);

  // ---- create once ------------------------------------------------------------
  useEffect(() => {
    register();
    const cy = cytoscape({
      container: container.current,
      elements: buildElements(graph, mode),
      style: buildStyle(mode),
      minZoom: 0.15,
      maxZoom: 2.5,
      boxSelectionEnabled: false,
      autounselectify: true, // selection is handled by the page (URL + panel), not Cytoscape
      autoungrabify: false,
    });
    cyRef.current = cy;
    cy.on('tap', 'node', (e) => {
      const n = e.target as NodeSingular;
      const d = n.data();
      onSelectRef.current(d.type === 'model' ? { kind: 'model', id: d.id.slice(2) } : { kind: 'family', id: d.family });
    });
    cy.on('tap', (e) => {
      if (e.target === cy) onSelectRef.current(null);
    });
    cy.on('mouseover', 'node[type="model"]', (e) => {
      const n = e.target as NodeSingular;
      n.addClass('hover');
      const p = n.renderedPosition();
      setTip({ x: p.x, y: p.y - n.renderedOuterHeight() / 2, id: n.id().slice(2) });
      if (container.current) container.current.style.cursor = 'pointer';
    });
    cy.on('mouseout', 'node[type="model"]', (e) => {
      (e.target as NodeSingular).removeClass('hover');
      setTip(null);
      if (container.current) container.current.style.cursor = '';
    });
    cy.on('viewport drag', () => setTip(null));
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // ---- colour mode: restyle + recolour ----------------------------------------
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    graph.families.forEach((f, i) => {
      const c = familyColor(i, mode);
      cy.$id(fid(f.id)).data('color', c);
      cy.nodes(`[family="${f.id}"]`).data('color', c);
    });
    cy.style(buildStyle(mode));
  }, [mode, graph]);

  // ---- visibility (families + edge kinds) and layout ---------------------------
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        n.toggleClass('hidden', hiddenFamilies.has(n.data('family')));
      });
      cy.edges('[kind="embeds"], [kind="many"]').toggleClass('hidden', !showComposition);
      cy.edges('[kind="references"]').toggleClass('hidden', !showReferences);
    });
    // Reference-by-id edges are drawn but don't drive the layout, so the
    // inheritance hierarchy stays readable.
    const eles = cy.elements().not('.hidden').not('edge[kind="references"]');
    const l = eles.layout(layoutOptions(layout));
    l.one('layoutstop', () => {
      if (!focusSelection(cy, false)) fitCapped(cy, cy.elements(':visible'), 40, false);
    });
    l.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenFamilies, layout, graph, showComposition]);

  useEffect(() => {
    cyRef.current?.edges('[kind="references"]').toggleClass('hidden', !showReferences);
  }, [showReferences]);

  useEffect(() => {
    const cy = cyRef.current;
    if (cy && fitSignal) fitCapped(cy, cy.elements(':visible'), 40, true);
  }, [fitSignal]);

  // ---- selection highlight ------------------------------------------------------
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass('selected neighbor faded labelled dim');
      cy.nodes('.lineage-hidden-x').removeClass('hidden lineage-hidden-x');
      if (!selection) return;

      if (selection.kind === 'family') {
        const fam = cy.$id(fid(selection.id));
        fam.addClass('selected');
        cy.nodes('[type="model"]')
          .filter((n) => n.data('family') !== selection.id)
          .addClass('faded');
        cy.nodes('[type="family"]').not(fam).addClass('dim');
        cy.edges()
          .filter((e) => e.source().data('family') !== selection.id && e.target().data('family') !== selection.id)
          .addClass('faded');
        return;
      }

      const node = cy.$id(mid(selection.id));
      if (node.empty()) return;
      const m = byId.get(selection.id)!;
      // lineage = ancestors + all descendants, plus direct neighbours via any edge
      const descendants = new Set<string>();
      const walk = (id: string) =>
        byId.get(id)?.subtypes.forEach((s) => {
          if (!descendants.has(s)) {
            descendants.add(s);
            walk(s);
          }
        });
      walk(m.id);
      const lineage = new Set([m.id, ...m.ancestors, ...descendants]);
      const connected = node.connectedEdges(':visible');
      const related = cy.collection().union(node);
      cy.nodes('[type="model"]').forEach((n) => {
        if (lineage.has(n.id().slice(2))) related.merge(n);
      });
      related.merge(connected.connectedNodes());
      const lineageEdges = cy.edges('[kind="extends"]').filter((e) => related.contains(e.source()) && related.contains(e.target()));
      const keepEdges = connected.union(lineageEdges);

      node.addClass('selected');
      related.not(node).addClass('neighbor');
      cy.nodes('[type="model"]').not(related).addClass('faded');
      cy.edges().not(keepEdges).addClass('faded');
      connected.addClass('labelled');
      const keepFamilies = new Set(related.map((n) => n.data('family')));
      cy.nodes('[type="family"]')
        .filter((f) => !keepFamilies.has(f.data('family')))
        .addClass('dim');

      if (lineageOnly) {
        cy.nodes('[type="model"]').not(related).not('.hidden').addClass('hidden lineage-hidden-x');
        cy.nodes('[type="family"]')
          .filter((f) => !keepFamilies.has(f.data('family')) && !f.hasClass('hidden'))
          .addClass('hidden lineage-hidden-x');
      }

      if (focusSelection(cy, true)) return;
      // bring the node into view if it's off-screen
      const bb = node.renderedBoundingBox({});
      const w = cy.width();
      const h = cy.height();
      if (bb.x1 < 0 || bb.y1 < 0 || bb.x2 > w || bb.y2 > h) {
        cy.animate({ center: { eles: node } }, { duration: 300 });
      }
    });
    if (lineageOnly && selection?.kind === 'model') {
      fitCapped(cy, cy.elements(':visible'), 48, true);
    }
  }, [selection, lineageOnly, byId, hiddenFamilies, showComposition, showReferences]);

  const tipModel = tip ? byId.get(tip.id) : undefined;
  return (
    <div className={styles.graphWrap}>
      <div ref={container} className={styles.graph} role="img" aria-label="Canonical data model graph" />
      {tip && tipModel && (
        <div className={styles.tooltip} style={{ left: tip.x, top: tip.y }}>
          <strong>{tipModel.title}</strong>
          {tipModel.abstract && <span className={styles.tagAbstract}>abstract</span>}
          {tipModel.description && <div className={styles.tooltipDesc}>{tipModel.description}</div>}
          <div className={styles.tooltipMeta}>
            {tipModel.properties.length} own · {tipModel.inherited.reduce((n, g) => n + g.properties.length, 0)} inherited
            properties
            {tipModel.usedIn.length > 0 && ` · ${new Set(tipModel.usedIn.map((u) => u.specId + u.path + u.method)).size} operations`}
          </div>
        </div>
      )}
    </div>
  );
}
