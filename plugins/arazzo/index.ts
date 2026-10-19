/**
 * docusaurus-plugin-arazzo (local)
 *
 * Scans a folder for Arazzo 1.0.x documents and generates:
 *   - <routeBasePath>                a catalogue of every workflow
 *   - <routeBasePath>/<file-slug>    one page per Arazzo document
 *
 * Each step is resolved against its OpenAPI source description so the page can
 * show the HTTP method + path and deep-link to the matching Redoc operation.
 * A Mermaid flowchart is generated for every workflow (rendered by
 * @docusaurus/theme-mermaid), including onSuccess / onFailure branches.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import type { LoadContext, Plugin } from '@docusaurus/types';

export type ArazzoPluginOptions = {
  path: string;
  routeBasePath: string;
  /** OpenAPI specs rendered by Redocusaurus, so steps can link to them. */
  openapiSpecs: { spec: string; route: string; label: string }[];
};

type OpIndexEntry = { method: string; path: string; summary?: string; operationId?: string };
type SourceIndex = {
  name: string;
  type: string;
  url: string;
  title?: string;
  route?: string;
  byId: Record<string, OpIndexEntry>;
  byPointer: Record<string, OpIndexEntry>;
  loadError?: string;
};

export type ResolvedTarget =
  | {
      kind: 'operation';
      source?: string;
      sourceTitle?: string;
      method?: string;
      path?: string;
      summary?: string;
      operationId?: string;
      raw: string;
      href?: string;
    }
  | { kind: 'workflow'; workflowId: string; source?: string; raw: string; href?: string }
  | { kind: 'unknown'; raw: string };

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const ARAZZO_FILE = /\.arazzo\.(ya?ml|json)$/i;

function slugify(file: string): string {
  return file.replace(ARAZZO_FILE, '').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
}

function decodePointer(p: string): string[] {
  return p
    .replace(/^#?\//, '')
    .split('/')
    .map((s) => decodeURIComponent(s).replace(/~1/g, '/').replace(/~0/g, '~'));
}

async function loadOpenApi(file: string): Promise<any> {
  // Prefer Redocly's bundler (resolves multi-file $refs); fall back to a plain parse.
  try {
    const core: any = await import('@redocly/openapi-core');
    const config = await core.createConfig({});
    const result = await core.bundle({ ref: file, config });
    if (result?.bundle?.parsed) return result.bundle.parsed;
  } catch {
    /* fall through */
  }
  return YAML.parse(await fs.readFile(file, 'utf8'));
}

function indexOperations(doc: any): Pick<SourceIndex, 'byId' | 'byPointer' | 'title'> {
  const byId: Record<string, OpIndexEntry> = {};
  const byPointer: Record<string, OpIndexEntry> = {};
  for (const [p, item] of Object.entries<any>(doc?.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const op = item?.[method];
      if (!op) continue;
      const entry: OpIndexEntry = {
        method: method.toUpperCase(),
        path: p,
        summary: op.summary,
        operationId: op.operationId,
      };
      if (op.operationId) byId[op.operationId] = entry;
      byPointer[`/paths/${p.replace(/~/g, '~0').replace(/\//g, '~1')}/${method}`] = entry;
    }
  }
  return { byId, byPointer, title: doc?.info?.title };
}

function redocHref(route: string | undefined, operationId: string | undefined): string | undefined {
  if (!route) return undefined;
  return operationId ? `${route}#operation/${operationId}` : route;
}

function resolveStep(step: any, sources: Record<string, SourceIndex>): ResolvedTarget {
  const openapiSources = Object.values(sources).filter((s) => s.type === 'openapi');

  if (step.operationId) {
    const raw = String(step.operationId);
    const m = raw.match(/^\$sourceDescriptions\.([^.]+)\.(.+)$/);
    const candidates = m ? [sources[m[1]]].filter(Boolean) : openapiSources;
    const opId = m ? m[2] : raw;
    for (const src of candidates) {
      const op = src.byId[opId];
      if (op) {
        return {
          kind: 'operation',
          source: src.name,
          sourceTitle: src.title ?? src.name,
          ...op,
          operationId: opId,
          raw,
          href: redocHref(src.route, opId),
        };
      }
    }
    return { kind: 'operation', source: m?.[1], operationId: opId, raw };
  }

  if (step.operationPath) {
    const raw = String(step.operationPath);
    const m = raw.match(/^\{\$sourceDescriptions\.([^.]+)\.url\}#(.+)$/);
    const src = m ? sources[m[1]] : undefined;
    if (src && m) {
      const segments = decodePointer(m[2]);
      const key = `/paths/${segments
        .slice(1, -1)
        .join('/')
        .replace(/~/g, '~0')
        .replace(/\//g, '~1')}/${segments.at(-1)}`;
      const op = src.byPointer[key];
      if (op) {
        return {
          kind: 'operation',
          source: src.name,
          sourceTitle: src.title ?? src.name,
          ...op,
          raw,
          href: redocHref(src.route, op.operationId),
        };
      }
    }
    return { kind: 'operation', source: m?.[1], raw };
  }

  if (step.workflowId) {
    const raw = String(step.workflowId);
    const m = raw.match(/^\$sourceDescriptions\.([^.]+)\.(.+)$/);
    if (m) return { kind: 'workflow', workflowId: m[2], source: m[1], raw };
    return { kind: 'workflow', workflowId: raw, raw, href: `#workflow-${raw}` };
  }

  return { kind: 'unknown', raw: '' };
}

/** Mermaid-safe label text. */
function esc(s: string): string {
  return String(s)
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;');
}

function buildMermaid(workflow: any, steps: { stepId: string; target: ResolvedTarget; raw: any }[]): string {
  const ids = new Map<string, string>(steps.map((s, i) => [s.stepId, `s${i}`]));
  const lines: string[] = ['flowchart TD', '  start(["Start"])'];
  const endNodes = new Set<string>();
  const failNodes: string[] = [];

  steps.forEach((s, i) => {
    const t = s.target;
    let detail = '';
    if (t.kind === 'operation') {
      detail = t.method && t.path ? `${t.method} ${t.path}` : t.operationId ?? t.raw;
      if (t.sourceTitle) detail += `<br/><i>${esc(t.sourceTitle)}</i>`;
    } else if (t.kind === 'workflow') {
      detail = `↳ workflow ${t.workflowId}`;
    }
    lines.push(`  ${ids.get(s.stepId)}["<b>${esc(s.stepId)}</b><br/>${esc(detail).replace(/#lt;(\/?)(i|br\/)#gt;/g, '<$1$2>')}"]`);
  });

  if (steps.length) lines.push(`  start --> s0`);

  const targetOf = (action: any, from: string): string | undefined => {
    if (action.type === 'end') {
      endNodes.add('done');
      return 'done';
    }
    if (action.type === 'retry') return from;
    if (action.type === 'goto') {
      if (action.stepId && ids.has(action.stepId)) return ids.get(action.stepId);
      if (action.workflowId) {
        const wf = `wf_${String(action.workflowId).replace(/[^a-zA-Z0-9_]/g, '_')}`;
        lines.push(`  ${wf}[["workflow ${esc(action.workflowId)}"]]`);
        return wf;
      }
    }
    return undefined;
  };

  steps.forEach((s, i) => {
    const id = ids.get(s.stepId)!;
    const next = i < steps.length - 1 ? `s${i + 1}` : 'done';
    const onSuccess: any[] = Array.isArray(s.raw.onSuccess) ? s.raw.onSuccess : [];
    const unconditional = onSuccess.some((a) => !a.criteria || a.criteria.length === 0);

    for (const a of onSuccess) {
      const to = targetOf(a, id);
      if (to) lines.push(`  ${id} -->|"${esc(a.name ?? a.type)}"| ${to}`);
    }
    if (!unconditional) {
      if (next === 'done') endNodes.add('done');
      lines.push(`  ${id} --> ${next}`);
    }

    const onFailure: any[] = Array.isArray(s.raw.onFailure) ? s.raw.onFailure : [];
    for (const a of onFailure) {
      if (a.type === 'end') {
        const f = `fail${failNodes.length}`;
        failNodes.push(f);
        lines.push(`  ${f}(["Stop: ${esc(a.name ?? 'failure')}"])`);
        lines.push(`  ${id} -.->|"failure"| ${f}`);
      } else {
        const to = targetOf(a, id);
        if (to) lines.push(`  ${id} -.->|"${esc(a.type === 'retry' ? `retry${a.retryLimit ? ` ×${a.retryLimit}` : ''}` : a.name ?? 'on failure')}"| ${to}`);
      }
    }
  });

  if (endNodes.has('done') || steps.length === 0) lines.push('  done(["Done"])');
  lines.push('  classDef fail fill:#fdecea,stroke:#d93025,color:#a50e0e');
  lines.push('  classDef term fill:#e6f4ea,stroke:#1e8e3e,color:#0d652d');
  if (failNodes.length) lines.push(`  class ${failNodes.join(',')} fail`);
  lines.push('  class start,done term');
  return lines.join('\n');
}

export type ArazzoDocData = Awaited<ReturnType<typeof loadDoc>>;

async function loadDoc(siteDir: string, dir: string, file: string, opts: ArazzoPluginOptions) {
  const abs = path.join(dir, file);
  const raw = await fs.readFile(abs, 'utf8');
  const doc: any = file.endsWith('.json') ? JSON.parse(raw) : YAML.parse(raw);
  const errors: string[] = [];
  if (!doc?.arazzo) errors.push('Missing top-level "arazzo" version field.');

  const specRoutes = new Map(opts.openapiSpecs.map((s) => [path.resolve(siteDir, s.spec), s]));

  const sources: Record<string, SourceIndex> = {};
  for (const sd of doc?.sourceDescriptions ?? []) {
    const entry: SourceIndex = {
      name: sd.name,
      type: sd.type ?? 'openapi',
      url: sd.url,
      byId: {},
      byPointer: {},
    };
    if (entry.type === 'openapi' && sd.url && !/^https?:/i.test(sd.url)) {
      const specPath = path.resolve(path.dirname(abs), sd.url);
      const published = specRoutes.get(specPath);
      entry.route = published?.route;
      try {
        Object.assign(entry, indexOperations(await loadOpenApi(specPath)));
      } catch (e: any) {
        entry.loadError = `Could not load ${sd.url}: ${e?.message ?? e}`;
        errors.push(entry.loadError);
      }
      if (published && !entry.title) entry.title = published.label;
    }
    sources[sd.name] = entry;
  }

  const workflows = (doc?.workflows ?? []).map((wf: any) => {
    const steps = (wf.steps ?? []).map((st: any) => ({
      stepId: st.stepId,
      description: st.description ?? null,
      target: resolveStep(st, sources),
      parameters: st.parameters ?? null,
      requestBody: st.requestBody
        ? {
            contentType: st.requestBody.contentType ?? null,
            yaml: YAML.stringify(st.requestBody.payload ?? st.requestBody).trimEnd(),
          }
        : null,
      successCriteria: st.successCriteria ?? null,
      onSuccess: st.onSuccess ?? null,
      onFailure: st.onFailure ?? null,
      outputs: st.outputs ?? null,
      raw: st,
    }));
    return {
      workflowId: wf.workflowId,
      summary: wf.summary ?? null,
      description: wf.description ?? null,
      dependsOn: wf.dependsOn ?? null,
      inputs: wf.inputs ? YAML.stringify(wf.inputs).trimEnd() : null,
      outputs: wf.outputs ?? null,
      mermaid: buildMermaid(wf, steps),
      steps: steps.map(({ raw: _raw, ...rest }: { raw: unknown; [k: string]: unknown }) => rest),
    };
  });

  const slug = slugify(file);
  return {
    slug,
    permalink: `${opts.routeBasePath.replace(/\/$/, '')}/${slug}`,
    file: path.relative(siteDir, abs),
    fileName: file,
    arazzo: doc?.arazzo ?? null,
    title: doc?.info?.title ?? file,
    version: doc?.info?.version ?? null,
    summary: doc?.info?.summary ?? null,
    description: doc?.info?.description ?? null,
    sources: Object.values(sources).map(({ byId: _a, byPointer: _b, ...s }) => s),
    workflows,
    raw,
    errors,
  };
}

export default function arazzoPlugin(
  context: LoadContext,
  pluginOptions: unknown,
): Plugin<unknown> {
  const options = pluginOptions as ArazzoPluginOptions;
  const dir = path.resolve(context.siteDir, options.path);
  const base = options.routeBasePath.replace(/\/$/, '');

  return {
    name: 'docusaurus-plugin-arazzo',

    getPathsToWatch() {
      return [`${dir}/**/*`, ...options.openapiSpecs.map((s) => path.resolve(context.siteDir, path.dirname(s.spec), '**/*'))];
    },

    async loadContent() {
      let files: string[] = [];
      try {
        files = (await fs.readdir(dir, { recursive: true })).filter((f) => ARAZZO_FILE.test(f)).sort();
      } catch {
        files = [];
      }
      const docs = await Promise.all(files.map((f) => loadDoc(context.siteDir, dir, f, options)));
      for (const d of docs) for (const e of d.errors) console.warn(`[arazzo] ${d.file}: ${e}`);
      return { docs };
    },

    async contentLoaded({ content: loaded, actions }) {
      const { createData, addRoute } = actions;
      const content = loaded as { docs: ArazzoDocData[] };
      const index = content.docs.map((d) => ({
        title: d.title,
        version: d.version,
        summary: d.summary,
        permalink: d.permalink,
        file: d.file,
        workflows: d.workflows.map((w: any) => ({ workflowId: w.workflowId, summary: w.summary, steps: w.steps.length })),
      }));
      const indexPath = await createData('arazzo-index.json', JSON.stringify(index));
      addRoute({
        path: context.baseUrl.replace(/\/$/, '') + base,
        component: path.resolve(__dirname, 'components/ArazzoIndexPage.tsx'),
        modules: { index: indexPath },
        exact: true,
      });
      for (const d of content.docs) {
        const dataPath = await createData(`arazzo-${d.slug}.json`, JSON.stringify(d));
        addRoute({
          path: context.baseUrl.replace(/\/$/, '') + d.permalink,
          component: path.resolve(__dirname, 'components/ArazzoDocPage.tsx'),
          modules: { doc: dataPath },
          exact: true,
        });
      }
    },
  };
}
