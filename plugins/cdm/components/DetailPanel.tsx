import React, { useState, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import type { CdmGraphData, CdmModel, CdmProperty, CdmUsage } from '../index';
import { MethodBadge } from '../../arazzo/components/shared';
import { familyColor, type Mode } from './palette';
import type { Selection } from './CdmPage';
import styles from './styles.module.css';

type Props = {
  graph: CdmGraphData;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onOnlyFamily: (id: string) => void;
  mode: Mode;
};

function ModelLink({ id, onSelect, many }: { id: string; onSelect: Props['onSelect']; many?: boolean }) {
  return (
    <button type="button" className={styles.modelLink} onClick={() => onSelect({ kind: 'model', id })}>
      {id}
      {many && '[]'}
    </button>
  );
}

function FamilyBadge({ graph, family, mode, onSelect }: { graph: CdmGraphData; family: string; mode: Mode; onSelect: Props['onSelect'] }) {
  const i = graph.families.findIndex((f) => f.id === family);
  const f = graph.families[i];
  return (
    <button type="button" className={styles.familyBadge} onClick={() => onSelect({ kind: 'family', id: family })}>
      <span className={styles.swatch} style={{ background: familyColor(i, mode) }} aria-hidden />
      {f?.title ?? family}
    </button>
  );
}

function PropType({ p, onSelect }: { p: CdmProperty; onSelect: Props['onSelect'] }) {
  const embeds = p.refs.filter((r) => r.kind !== 'references');
  const refs = p.refs.filter((r) => r.kind === 'references');
  const fmt = p.constraints.find((c) => c.startsWith('format: '))?.slice(8);
  return (
    <span className={styles.ptype}>
      {embeds.length > 0 ? (
        embeds.map((r, i) => (
          <React.Fragment key={r.model + i}>
            {i > 0 && <span className={styles.muted}> | </span>}
            <ModelLink id={r.model} many={r.kind === 'many'} onSelect={onSelect} />
          </React.Fragment>
        ))
      ) : (
        <code>
          {p.type}
          {fmt && <span className={styles.muted}> ‹{fmt}›</span>}
        </code>
      )}
      {refs.map((r) => (
        <span key={r.model} className={styles.fk} title="References another model by its id">
          → <ModelLink id={r.model} onSelect={onSelect} />
        </span>
      ))}
    </span>
  );
}

function PropTable({ props, onSelect }: { props: CdmProperty[]; onSelect: Props['onSelect'] }) {
  return (
    <table className={styles.props}>
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {props.map((p) => (
          <tr key={p.name}>
            <td>
              <code className={styles.pname}>{p.name}</code>
              {p.required && <span className={styles.req}>required</span>}
              {p.overrides && <span className={styles.tag}>refines</span>}
            </td>
            <td>
              <PropType p={p} onSelect={onSelect} />
              {p.description && <div className={styles.pdesc}>{p.description}</div>}
              {p.enum && (
                <div className={styles.enumRow}>
                  {p.enum.map((v) => (
                    <code key={String(v)}>{JSON.stringify(v)}</code>
                  ))}
                </div>
              )}
              {p.constraints.filter((c) => !c.startsWith('format: ')).length > 0 && (
                <div className={styles.constraints}>
                  {p.constraints
                    .filter((c) => !c.startsWith('format: '))
                    .map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Usage({ usage }: { usage: CdmUsage[] }) {
  const bySpec = new Map<string, CdmUsage[]>();
  for (const u of usage) {
    if (!bySpec.has(u.specLabel)) bySpec.set(u.specLabel, []);
    bySpec.get(u.specLabel)!.push(u);
  }
  return (
    <>
      {[...bySpec].map(([label, list]) => (
        <div key={label} className={styles.usageGroup}>
          <div className={styles.usageSpec}>{label}</div>
          <ul className={styles.usageList}>
            {list.map((u) => (
              <li key={u.method + u.path + (u.via ?? '')}>
                <Link to={u.href} className={styles.usageOp}>
                  <MethodBadge method={u.method} />
                  <code>{u.path}</code>
                </Link>
                <div className={styles.usageMeta}>
                  {u.where.join(' + ')}
                  {u.via && <> · via {u.via}</>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className={styles.psection}>
      <h3 className={styles.psectionTitle}>
        {title}
        {count != null && <span className={styles.count}>{count}</span>}
      </h3>
      {children}
    </section>
  );
}

function ModelDetail({ m, graph, onSelect, mode }: { m: CdmModel } & Omit<Props, 'selection' | 'onOnlyFamily'>) {
  const [copied, setCopied] = useState(false);
  const inheritedCount = m.inherited.reduce((n, g) => n + g.properties.length, 0);
  const direct = m.usedIn.filter((u) => !u.via);
  const indirect = m.usedIn.filter((u) => u.via);
  const download = `data:application/schema+json;charset=utf-8,${encodeURIComponent(m.raw)}`;
  return (
    <div>
      <div className={styles.pheadMeta}>
        <FamilyBadge graph={graph} family={m.family} mode={mode} onSelect={onSelect} />
        {m.abstract && <span className={styles.tagAbstract}>abstract</span>}
      </div>
      <h2 className={styles.ptitle}>{m.title}</h2>
      {m.description && <p className={styles.plead}>{m.description}</p>}

      {m.schemaId && (
        <div className={styles.idRow}>
          <code title={m.schemaId}>{m.schemaId}</code>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              navigator.clipboard?.writeText(m.schemaId!).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              });
            }}
          >
            {copied ? 'Copied' : 'Copy $id'}
          </button>
          <a className={styles.iconBtn} href={download} download={m.file.split('/').pop()}>
            Download
          </a>
        </div>
      )}

      {(m.ancestors.length > 0 || m.subtypes.length > 0) && (
        <Section title="Inheritance">
          {m.ancestors.length > 0 && (
            <div className={styles.chain}>
              {m.ancestors.map((a) => (
                <React.Fragment key={a}>
                  <ModelLink id={a} onSelect={onSelect} />
                  <span className={styles.chainArrow}>›</span>
                </React.Fragment>
              ))}
              <strong>{m.title}</strong>
            </div>
          )}
          {m.subtypes.length > 0 && (
            <div className={styles.subtypes}>
              <span className={styles.muted}>Subtypes:</span>
              {m.subtypes.map((s) => (
                <ModelLink key={s} id={s} onSelect={onSelect} />
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="Properties" count={m.properties.length + inheritedCount}>
        {m.properties.length > 0 ? (
          <PropTable props={m.properties} onSelect={onSelect} />
        ) : (
          <p className={styles.muted}>No properties of its own.</p>
        )}
        {m.inherited.map((g) => (
          <details key={g.from} className={styles.inherited}>
            <summary>
              Inherited from <ModelLink id={g.from} onSelect={onSelect} /> <span className={styles.count}>{g.properties.length}</span>
            </summary>
            <PropTable props={g.properties} onSelect={onSelect} />
          </details>
        ))}
      </Section>

      {m.referencedBy.length > 0 && (
        <Section title="Used by models" count={m.referencedBy.length}>
          <ul className={styles.refList}>
            {m.referencedBy.map((r) => (
              <li key={r.model + r.property}>
                <ModelLink id={r.model} onSelect={onSelect} />
                <code className={styles.muted}>.{r.property}</code>
                <span className={styles.tag}>{r.kind === 'references' ? 'by id' : r.kind === 'many' ? 'contains many' : 'contains'}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Used in contracts" count={new Set(m.usedIn.map((u) => u.specId + u.method + u.path)).size}>
        {m.usedIn.length === 0 && <p className={styles.muted}>Not used by any published API contract yet.</p>}
        {direct.length > 0 && <Usage usage={direct} />}
        {indirect.length > 0 && (
          <>
            {direct.length > 0 && <div className={styles.subhead}>Included through other models</div>}
            <Usage usage={indirect} />
          </>
        )}
      </Section>

      <details className={styles.sourceBlock}>
        <summary>JSON Schema · {m.file}</summary>
        <CodeBlock language="json">{m.raw}</CodeBlock>
      </details>
    </div>
  );
}

function FamilyDetail({ id, graph, onSelect, onOnlyFamily, mode }: { id: string } & Omit<Props, 'selection'>) {
  const i = graph.families.findIndex((f) => f.id === id);
  const f = graph.families[i];
  const models = f.models.map((mid) => graph.models.find((m) => m.id === mid)!);
  return (
    <div>
      <div className={styles.pheadMeta}>
        <span className={styles.kicker}>
          <span className={styles.swatch} style={{ background: familyColor(i, mode) }} aria-hidden /> Family
        </span>
      </div>
      <h2 className={styles.ptitle}>{f.title}</h2>
      {f.description && <p className={styles.plead}>{f.description}</p>}
      <button type="button" className={styles.iconBtn} onClick={() => onOnlyFamily(id)}>
        Show only this family
      </button>
      <Section title="Models" count={models.length}>
        <ModelList models={models} onSelect={onSelect} />
      </Section>
    </div>
  );
}

function ModelList({ models, onSelect }: { models: CdmModel[]; onSelect: Props['onSelect'] }) {
  return (
    <ul className={styles.modelList}>
      {models.map((m) => (
        <li key={m.id}>
          <button type="button" onClick={() => onSelect({ kind: 'model', id: m.id })}>
            <span className={m.abstract ? styles.italic : undefined}>{m.title}</span>
            {m.extends.length > 0 && <span className={styles.muted}> extends {m.extends.join(', ')}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Overview({ graph, onSelect, mode }: Omit<Props, 'selection' | 'onOnlyFamily'>) {
  return (
    <div>
      <span className={styles.kicker}>Canonical data model</span>
      <h2 className={styles.ptitle}>
        {graph.models.length} models in {graph.families.length} families
      </h2>
      <p className={styles.plead}>
        The shared vocabulary every API contract is built from. Click a model in the graph — or below — to see its
        properties, inheritance and the operations that use it.
      </p>
      {graph.errors.length > 0 && (
        <div className="alert alert--warning margin-bottom--md">
          {graph.errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
      {graph.families.map((f, i) => (
        <Section key={f.id} title={f.title} count={f.models.length}>
          <button type="button" className={styles.familyBadge} onClick={() => onSelect({ kind: 'family', id: f.id })}>
            <span className={styles.swatch} style={{ background: familyColor(i, mode) }} aria-hidden />
            About this family
          </button>
          <ModelList models={f.models.map((id) => graph.models.find((m) => m.id === id)!)} onSelect={onSelect} />
        </Section>
      ))}
      <p className={styles.hint}>
        Tip: <kbd>Esc</kbd> clears the selection. Links like <code>?model=Customer</code> open straight to a model.
      </p>
    </div>
  );
}

export default function DetailPanel(props: Props): ReactNode {
  const { graph, selection, onSelect } = props;
  const model = selection?.kind === 'model' ? graph.models.find((m) => m.id === selection.id) : undefined;
  return (
    <div className={styles.panelInner}>
      {selection && (
        <button type="button" className={styles.back} onClick={() => onSelect(null)}>
          ← All models
        </button>
      )}
      {model ? (
        <ModelDetail key={model.id} m={model} graph={graph} onSelect={onSelect} mode={props.mode} />
      ) : selection?.kind === 'family' ? (
        <FamilyDetail id={selection.id} {...props} />
      ) : (
        <Overview graph={graph} onSelect={onSelect} mode={props.mode} />
      )}
    </div>
  );
}
