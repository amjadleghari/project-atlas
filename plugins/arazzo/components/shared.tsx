import React, { type ReactNode } from 'react';
import styles from './styles.module.css';

/** Highlights Arazzo runtime expressions ($inputs, $steps, $response…) inside a value. */
export function Expr({ value }: { value: string }): ReactNode {
  if (value == null) return null;
  const parts = String(value).split(/(\$[a-zA-Z][\w.#/\-\[\]]*)/g);
  return (
    <code className={styles.expr}>
      {parts.map((p, i) =>
        p.startsWith('$') ? (
          <span key={i} className={styles.exprVar}>
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </code>
  );
}

export function MethodBadge({ method }: { method: string }): ReactNode {
  return <span className={`${styles.method} ${styles[`m_${method.toLowerCase()}`] ?? ''}`}>{method}</span>;
}

/** Minimal CommonMark-ish rendering for description fields: paragraphs, **bold**, `code`, [links](url). */
export function Prose({ text }: { text: string }): ReactNode {
  const inline = (s: string, key: number) => {
    const out: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      const t = m[0];
      if (t.startsWith('**')) out.push(<strong key={i++}>{t.slice(2, -2)}</strong>);
      else if (t.startsWith('`')) out.push(<code key={i++}>{t.slice(1, -1)}</code>);
      else {
        const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
        out.push(
          <a key={i++} href={href}>
            {label}
          </a>,
        );
      }
      last = m.index + t.length;
    }
    if (last < s.length) out.push(s.slice(last));
    return <p key={key}>{out}</p>;
  };
  return (
    <div className={styles.prose}>
      {String(text)
        .trim()
        .split(/\n\s*\n/)
        .map((para, i) => inline(para.replace(/\s*\n\s*/g, ' '), i))}
    </div>
  );
}
