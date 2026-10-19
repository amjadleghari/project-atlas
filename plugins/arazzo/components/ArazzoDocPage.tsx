import React, { type ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import Mermaid from '@theme/Mermaid';
import { Prose, Expr, MethodBadge } from './shared';
import { DownloadButtons } from '@site/src/components/portal/shared';
import styles from './styles.module.css';

type Props = { doc: any };

function Criteria({ items }: { items: any[] }) {
  return (
    <ul className={styles.criteria}>
      {items.map((c, i) => (
        <li key={i}>
          <Expr value={c.condition} />
          {c.context && (
            <span className={styles.muted}>
              {' '}
              on <Expr value={c.context} />
            </span>
          )}
          {c.type && c.type !== 'simple' && (
            <span className={styles.pill}>{typeof c.type === 'string' ? c.type : c.type.type}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Actions({ items, kind }: { items: any[]; kind: 'success' | 'failure' }) {
  return (
    <ul className={styles.criteria}>
      {items.map((a, i) => (
        <li key={i}>
          <span className={kind === 'failure' ? styles.pillFail : styles.pillOk}>{a.type}</span>{' '}
          <strong>{a.name}</strong>
          {a.stepId && (
            <>
              {' → '}
              <a href={`#step-${a.stepId}`}>{a.stepId}</a>
            </>
          )}
          {a.workflowId && <> → workflow <code>{a.workflowId}</code></>}
          {a.retryAfter != null && <span className={styles.muted}> after {a.retryAfter}s</span>}
          {a.retryLimit != null && <span className={styles.muted}> · max {a.retryLimit} tries</span>}
          {a.criteria?.length > 0 && (
            <div className={styles.muted}>
              when <Criteria items={a.criteria} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function KeyValueTable({ map }: { map: Record<string, string> }) {
  return (
    <table className={styles.kv}>
      <tbody>
        {Object.entries(map).map(([k, v]) => (
          <tr key={k}>
            <td>
              <code>{k}</code>
            </td>
            <td>
              <Expr value={typeof v === 'string' ? v : JSON.stringify(v)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function StepTarget({ target }: { target: any }) {
  if (target.kind === 'operation') {
    const label = (
      <>
        {target.method && <MethodBadge method={target.method} />}
        <code className={styles.path}>{target.path ?? target.operationId ?? target.raw}</code>
      </>
    );
    return (
      <div className={styles.target}>
        {target.href ? <Link to={target.href}>{label}</Link> : label}
        {target.sourceTitle && <span className={styles.muted}> · {target.sourceTitle}</span>}
        {target.summary && <div className={styles.muted}>{target.summary}</div>}
        {!target.method && (
          <div className={styles.warn}>Operation not found in a published OpenAPI contract.</div>
        )}
      </div>
    );
  }
  if (target.kind === 'workflow') {
    return (
      <div className={styles.target}>
        <span className={styles.pill}>workflow</span>{' '}
        {target.href ? <a href={target.href}>{target.workflowId}</a> : <code>{target.raw}</code>}
      </div>
    );
  }
  return null;
}

export default function ArazzoDocPage({ doc }: Props): ReactNode {
  return (
    <Layout title={`${doc.title} · Workflows`} description={doc.summary ?? undefined}>
      <main className={`container margin-vert--lg ${styles.page}`}>
        <nav className={styles.crumbs}>
          <Link to="/workflows">Workflows</Link> / {doc.title}
        </nav>
        <header className={styles.header}>
          <Heading as="h1">{doc.title}</Heading>
          <div className={styles.meta}>
            {doc.version && <span className={styles.pill}>v{doc.version}</span>}
            <span className={styles.pill}>Arazzo {doc.arazzo}</span>
            <code className={styles.muted}>{doc.file}</code>
            {doc.downloads && <DownloadButtons spec={{ id: `${doc.slug}.arazzo`, downloads: doc.downloads }} compact />}
          </div>
          {doc.summary && <p className={styles.lead}>{doc.summary}</p>}
          {doc.description && <Prose text={doc.description} />}
        </header>

        {doc.errors.length > 0 && (
          <div className="alert alert--warning margin-bottom--md">
            {doc.errors.map((e: string) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        <Section title="Source descriptions">
          <table className={styles.kv}>
            <tbody>
              {doc.sources.map((s: any) => (
                <tr key={s.name}>
                  <td>
                    <code>{s.name}</code>
                  </td>
                  <td>
                    {s.route ? <Link to={s.route}>{s.title ?? s.url}</Link> : <code>{s.url}</code>}
                    <span className={styles.muted}> · {s.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {doc.workflows.map((wf: any) => (
          <section key={wf.workflowId} id={`workflow-${wf.workflowId}`} className={styles.workflow}>
            <Heading as="h2">
              <code>{wf.workflowId}</code>
            </Heading>
            {wf.summary && <p className={styles.lead}>{wf.summary}</p>}
            {wf.description && <Prose text={wf.description} />}
            {wf.dependsOn?.length > 0 && (
              <p className={styles.muted}>
                Depends on:{' '}
                {wf.dependsOn.map((d: string) => (
                  <code key={d}>{d}</code>
                ))}
              </p>
            )}

            <div className={styles.diagram}>
              <Mermaid value={wf.mermaid} />
            </div>

            <div className={styles.twoCol}>
              {wf.inputs && (
                <Section title="Inputs">
                  <CodeBlock language="yaml">{wf.inputs}</CodeBlock>
                </Section>
              )}
              {wf.outputs && (
                <Section title="Outputs">
                  <KeyValueTable map={wf.outputs} />
                </Section>
              )}
            </div>

            <Heading as="h3">Steps</Heading>
            <ol className={styles.steps}>
              {wf.steps.map((st: any) => (
                <li key={st.stepId} id={`step-${st.stepId}`} className={styles.step}>
                  <div className={styles.stepHead}>
                    <strong>{st.stepId}</strong>
                    <StepTarget target={st.target} />
                  </div>
                  {st.description && <Prose text={st.description} />}
                  {st.parameters && (
                    <Section title="Parameters">
                      <table className={styles.kv}>
                        <tbody>
                          {st.parameters.map((p: any, i: number) => (
                            <tr key={i}>
                              <td>
                                <code>{p.name ?? p.reference}</code>
                                {p.in && <span className={styles.muted}> ({p.in})</span>}
                              </td>
                              <td>
                                <Expr value={typeof p.value === 'string' ? p.value : JSON.stringify(p.value)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Section>
                  )}
                  {st.requestBody && (
                    <Section title={`Request body${st.requestBody.contentType ? ` · ${st.requestBody.contentType}` : ''}`}>
                      <CodeBlock language="yaml">{st.requestBody.yaml}</CodeBlock>
                    </Section>
                  )}
                  {st.successCriteria && (
                    <Section title="Success criteria">
                      <Criteria items={st.successCriteria} />
                    </Section>
                  )}
                  {st.onSuccess && (
                    <Section title="On success">
                      <Actions items={st.onSuccess} kind="success" />
                    </Section>
                  )}
                  {st.onFailure && (
                    <Section title="On failure">
                      <Actions items={st.onFailure} kind="failure" />
                    </Section>
                  )}
                  {st.outputs && (
                    <Section title="Outputs">
                      <KeyValueTable map={st.outputs} />
                    </Section>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}

        <details className={styles.source}>
          <summary>View source</summary>
          <CodeBlock language="yaml" title={doc.file}>
            {doc.raw}
          </CodeBlock>
        </details>
      </main>
    </Layout>
  );
}
