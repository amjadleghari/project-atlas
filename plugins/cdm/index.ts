/**
 * docusaurus-plugin-cdm (local)
 *
 * Turns a folder of JSON Schema files — the canonical data model — into an
 * interactive graph page:
 *
 *   cdm/<family>/<model>.schema.json   one model per file; the folder is its family
 *   cdm/<family>/family.json           optional { "title", "description" } for the family
 *
 * Relationships are read straight from standard JSON Schema:
 *   allOf: [{ "$ref": "parent.schema.json" }]   → inheritance ("extends")
 *   properties.x: { "$ref": … }                  → composition (embeds a value)
 *   properties.x: { type: array, items: {$ref} } → composition, many
 *   properties.x: { "x-references": … }          → association by id (foreign key)
 *   "x-abstract": true                            → abstract model (not used on its own)
 *   "x-family": "…"                               → overrides the folder-derived family
 *
 * It also scans the published OpenAPI contracts for $refs into the CDM, so
 * every model lists the API operations that use it (directly or via another model).
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import type { LoadContext, Plugin } from '@docusaurus/types';

export type CdmPluginOptions = {
  path: string;
  routeBasePath: string;
  openapiSpecs: { id: string; spec: string; route: string; label: string }[];
};

export type RelKind = 'embeds' | 'many' | 'references';

export type CdmProperty = {
  name: string;
  required: boolean;
  type: string;
  refs: { model: string; kind: RelKind }[];
  description?: string;
  constraints: string[];
  enum?: unknown[];
  overrides?: boolean;
};

export type CdmUsage = {
  specId: string;
  specLabel: string;
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  href: string;
  where: ('request' | 'response' | 'parameter')[];
  via?: string;
};

export type CdmModel = {
  id: string;
  title: string;
  family: string;
  file: string;
  schemaId?: string;
  description?: string;
  abstract: boolean;
  extends: string[];
  subtypes: string[];
  ancestors: string[];
  properties: CdmProperty[];
  inherited: { from: string; properties: CdmProperty[] }[];
  referencedBy: { model: string; property: string; kind: RelKind }[];
  usedIn: CdmUsage[];
  raw: string;
};

export type CdmFamily = { id: string; title: string; description?: string; models: string[] };

export type CdmGraphData = { models: CdmModel[]; families: CdmFamily[]; errors: string[] };

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

const posixRel = (from: string, to: string) => path.relative(from, to).split(path.sep).join('/');

/** Resolves a $ref / x-references string relative to the file it appears in. */
const resolveRefFile = (fromFile: string, ref: string) => path.resolve(path.dirname(fromFile), ref.split('#')[0]);

function describeConstraints(s: any): string[] {
  const out: string[] = [];
  if (s.format) out.push(`format: ${s.format}`);
  if (s.pattern) out.push(`pattern: ${s.pattern}`);
  if (s.minLength != null) out.push(`minLength: ${s.minLength}`);
  if (s.maxLength != null) out.push(`maxLength: ${s.maxLength}`);
  if (s.minimum != null) out.push(`≥ ${s.minimum}`);
  if (s.maximum != null) out.push(`≤ ${s.maximum}`);
  if (s.minItems != null) out.push(`minItems: ${s.minItems}`);
  if (s.maxItems != null) out.push(`maxItems: ${s.maxItems}`);
  if (s.const !== undefined) out.push(`const: ${JSON.stringify(s.const)}`);
  if (s.default !== undefined) out.push(`default: ${JSON.stringify(s.default)}`);
  if (s.readOnly) out.push('read-only');
  if (s.writeOnly) out.push('write-only');
  if (s.deprecated) out.push('deprecated');
  if (s.examples?.length) out.push(`e.g. ${s.examples.map((e: unknown) => JSON.stringify(e)).join(', ')}`);
  for (const [k, v] of Object.entries(s)) {
    if (k.startsWith('x-') && k !== 'x-references') out.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  }
  return out;
}

export default function cdmPlugin(context: LoadContext, pluginOptions: unknown): Plugin<unknown> {
  const options = pluginOptions as CdmPluginOptions;
  const dir = path.resolve(context.siteDir, options.path);
  const base = options.routeBasePath.replace(/\/$/, '');

  async function load(): Promise<CdmGraphData> {
    const errors: string[] = [];
    let files: string[] = [];
    try {
      files = (await fs.readdir(dir, { recursive: true }))
        .filter((f) => f.endsWith('.schema.json'))
        .sort();
    } catch {
      return { models: [], families: [], errors: [`CDM folder not found: ${options.path}`] };
    }

    // ---- 1. read every schema -------------------------------------------------
    type Loaded = { abs: string; rel: string; schema: any; raw: string };
    const loaded: Loaded[] = [];
    for (const f of files) {
      const abs = path.join(dir, f);
      const raw = await fs.readFile(abs, 'utf8');
      try {
        loaded.push({ abs, rel: posixRel(dir, abs), schema: JSON.parse(raw), raw });
      } catch (e: any) {
        errors.push(`${f}: invalid JSON (${e.message})`);
      }
    }

    // Model id = title (falls back to file name). Must be unique.
    const idByFile = new Map<string, string>();
    const seen = new Set<string>();
    for (const l of loaded) {
      let id: string = l.schema.title ?? path.basename(l.abs, '.schema.json');
      if (seen.has(id)) {
        errors.push(`Duplicate model title "${id}" in ${l.rel} — renamed for the graph.`);
        id = `${id} (${l.rel})`;
      }
      seen.add(id);
      idByFile.set(l.abs, id);
    }

    const refTarget = (fromAbs: string, ref: string, where: string): string | undefined => {
      if (ref.startsWith('#')) return undefined; // local definitions are not separate models
      const target = idByFile.get(resolveRefFile(fromAbs, ref));
      if (!target) errors.push(`${where}: unresolved reference "${ref}"`);
      return target;
    };

    // ---- 2. own properties + extends -----------------------------------------
    const describeProp = (fromAbs: string, rel: string, name: string, s: any, required: boolean): CdmProperty => {
      const refs: CdmProperty['refs'] = [];
      let type = '';
      const add = (ref: string, kind: RelKind) => {
        const t = refTarget(fromAbs, ref, `${rel} › ${name}`);
        if (t) refs.push({ model: t, kind });
        return t ?? ref;
      };
      const unionOf = (list: any[], kind: RelKind) =>
        list.map((o) => (o.$ref ? add(o.$ref, kind) : o.type ?? 'object')).join(' | ');

      if (s.$ref) type = add(s.$ref, 'embeds');
      else if (s.type === 'array' && s.items) {
        if (s.items.$ref) type = `${add(s.items.$ref, 'many')}[]`;
        else if (s.items.oneOf || s.items.anyOf) type = `(${unionOf(s.items.oneOf ?? s.items.anyOf, 'many')})[]`;
        else type = `${s.items.type ?? 'any'}[]`;
      } else if (s.oneOf || s.anyOf) type = unionOf(s.oneOf ?? s.anyOf, 'embeds');
      else if (s.enum) type = 'enum';
      else if (s.const !== undefined) type = typeof s.const;
      else type = Array.isArray(s.type) ? s.type.join(' | ') : s.type ?? 'any';

      if (typeof s['x-references'] === 'string') {
        const t = refTarget(fromAbs, s['x-references'], `${rel} › ${name} (x-references)`);
        if (t) refs.push({ model: t, kind: 'references' });
      }
      return {
        name,
        required,
        type,
        refs,
        description: s.description,
        constraints: describeConstraints(s),
        enum: s.enum,
      };
    };

    const models = new Map<string, CdmModel>();
    for (const l of loaded) {
      const s = l.schema;
      const id = idByFile.get(l.abs)!;
      const parts = [s, ...(s.allOf ?? []).filter((a: any) => !a.$ref)];
      const extendsIds = (s.allOf ?? [])
        .filter((a: any) => typeof a.$ref === 'string')
        .map((a: any) => refTarget(l.abs, a.$ref, `${l.rel} › allOf`))
        .filter(Boolean) as string[];
      const required = new Set<string>(parts.flatMap((p: any) => p.required ?? []));
      const properties: CdmProperty[] = [];
      for (const p of parts) {
        for (const [name, ps] of Object.entries<any>(p.properties ?? {})) {
          properties.push(describeProp(l.abs, l.rel, name, ps, required.has(name)));
        }
      }
      const family = s['x-family'] ?? (l.rel.includes('/') ? l.rel.split('/')[0] : 'ungrouped');
      models.set(id, {
        id,
        title: s.title ?? id,
        family,
        file: posixRel(context.siteDir, l.abs),
        schemaId: s.$id,
        description: s.description,
        abstract: s['x-abstract'] === true,
        extends: extendsIds,
        subtypes: [],
        ancestors: [],
        properties,
        inherited: [],
        referencedBy: [],
        usedIn: [],
        raw: JSON.stringify(s, null, 2),
      });
    }

    // ---- 3. derived: subtypes, ancestors, inherited props, referencedBy -------
    for (const m of models.values()) {
      for (const p of m.extends) models.get(p)?.subtypes.push(m.id);
      for (const prop of m.properties)
        for (const r of prop.refs) models.get(r.model)?.referencedBy.push({ model: m.id, property: prop.name, kind: r.kind });
    }
    const ancestorsOf = (id: string, trail: string[] = []): string[] => {
      const m = models.get(id);
      if (!m) return [];
      const out: string[] = [];
      for (const p of m.extends) {
        if (trail.includes(p)) {
          errors.push(`Inheritance cycle: ${[...trail, id, p].join(' → ')}`);
          continue;
        }
        for (const a of [...ancestorsOf(p, [...trail, id]), p]) if (!out.includes(a)) out.push(a);
      }
      return out;
    };
    for (const m of models.values()) {
      m.ancestors = ancestorsOf(m.id); // root first
      const own = new Set(m.properties.map((p) => p.name));
      const shown = new Set(own);
      for (const a of [...m.ancestors].reverse()) {
        const am = models.get(a)!;
        const props = am.properties.filter((p) => !shown.has(p.name)).map((p) => ({ ...p }));
        props.forEach((p) => shown.add(p.name));
        if (props.length) m.inherited.push({ from: a, properties: props });
      }
      // flag own properties that refine an inherited one
      const inheritedNames = new Set(m.ancestors.flatMap((a) => models.get(a)!.properties.map((p) => p.name)));
      for (const p of m.properties) if (inheritedNames.has(p.name)) p.overrides = true;
      m.subtypes.sort();
    }

    // ---- 4. usage in published OpenAPI contracts -------------------------------
    // A model is part of a payload if the contract $refs it, or it is embedded in
    // (or inherited by) a model the contract $refs.
    const includes = (id: string, seenIds = new Set<string>()): string[] => {
      if (seenIds.has(id)) return [];
      seenIds.add(id);
      const m = models.get(id);
      if (!m) return [];
      const direct = [
        ...m.extends,
        ...m.properties.flatMap((p) => p.refs.filter((r) => r.kind !== 'references').map((r) => r.model)),
      ];
      return [...new Set(direct.flatMap((d) => [d, ...includes(d, seenIds)]))];
    };

    for (const spec of options.openapiSpecs) {
      const specAbs = path.resolve(context.siteDir, spec.spec);
      let doc: any;
      try {
        const text = await fs.readFile(specAbs, 'utf8');
        doc = specAbs.endsWith('.json') ? JSON.parse(text) : YAML.parse(text);
      } catch (e: any) {
        errors.push(`${spec.spec}: ${e.message}`);
        continue;
      }
      const local = (pointer: string) =>
        pointer
          .replace(/^#\//, '')
          .split('/')
          .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))
          .reduce((n: any, k) => n?.[k], doc);

      // Collect CDM model ids reachable from a node, following local #/ refs.
      const collect = (node: any, out: Set<string>, visited: Set<string>) => {
        if (Array.isArray(node)) return node.forEach((n) => collect(n, out, visited));
        if (!node || typeof node !== 'object') return;
        if (typeof node.$ref === 'string') {
          const ref: string = node.$ref;
          if (ref.startsWith('#/')) {
            if (!visited.has(ref)) {
              visited.add(ref);
              collect(local(ref), out, visited);
            }
          } else {
            const id = idByFile.get(resolveRefFile(specAbs, ref));
            if (id) out.add(id);
          }
        }
        for (const [k, v] of Object.entries(node)) if (k !== '$ref') collect(v, out, visited);
      };

      for (const [p, item] of Object.entries<any>(doc.paths ?? {})) {
        for (const method of HTTP_METHODS) {
          const op = item?.[method];
          if (!op) continue;
          const sections: [CdmUsage['where'][number], any][] = [
            ['request', op.requestBody],
            ['response', op.responses],
            ['parameter', [...(item.parameters ?? []), ...(op.parameters ?? [])]],
          ];
          const whereById = new Map<string, Set<CdmUsage['where'][number]>>();
          for (const [where, node] of sections) {
            const found = new Set<string>();
            collect(node, found, new Set());
            for (const id of found) {
              if (!whereById.has(id)) whereById.set(id, new Set());
              whereById.get(id)!.add(where);
            }
          }
          const usage = (where: Set<CdmUsage['where'][number]>, via?: string): CdmUsage => ({
            specId: spec.id,
            specLabel: spec.label,
            method: method.toUpperCase(),
            path: p,
            operationId: op.operationId,
            summary: op.summary,
            href: op.operationId ? `${spec.route}#operation/${op.operationId}` : spec.route,
            where: [...where],
            via,
          });
          // model → where it appears in this operation, and which directly-used model
          // brought it in (undefined = the contract references it directly)
          const perOp = new Map<string, { where: Set<CdmUsage['where'][number]>; via?: string; direct: boolean }>();
          const note = (id: string, where: Set<CdmUsage['where'][number]>, via?: string) => {
            const e = perOp.get(id) ?? { where: new Set(), via, direct: !via };
            where.forEach((w) => e.where.add(w));
            if (!via) {
              e.direct = true;
              e.via = undefined;
            }
            perOp.set(id, e);
          };
          for (const [id, where] of whereById) {
            note(id, where);
            for (const inc of includes(id)) note(inc, where, id);
          }
          for (const [id, e] of perOp) models.get(id)!.usedIn.push(usage(e.where, e.direct ? undefined : e.via));
        }
      }
    }

    // ---- 5. families ----------------------------------------------------------
    const familyIds = [...new Set([...models.values()].map((m) => m.family))].sort();
    const families: CdmFamily[] = [];
    for (const f of familyIds) {
      let meta: any = {};
      try {
        meta = JSON.parse(await fs.readFile(path.join(dir, f, 'family.json'), 'utf8'));
      } catch {
        /* optional */
      }
      families.push({
        id: f,
        title: meta.title ?? f.charAt(0).toUpperCase() + f.slice(1),
        description: meta.description,
        models: [...models.values()]
          .filter((m) => m.family === f)
          .map((m) => m.id)
          .sort(),
      });
    }

    return { models: [...models.values()].sort((a, b) => a.id.localeCompare(b.id)), families, errors };
  }

  return {
    name: 'docusaurus-plugin-cdm',

    getPathsToWatch() {
      return [`${dir}/**/*`, ...options.openapiSpecs.map((s) => path.resolve(context.siteDir, s.spec))];
    },

    async loadContent() {
      const data = await load();
      for (const e of data.errors) console.warn(`[cdm] ${e}`);
      return data;
    },

    async contentLoaded({ content, actions }) {
      const dataPath = await actions.createData('cdm-graph.json', JSON.stringify(content));
      actions.addRoute({
        path: context.baseUrl.replace(/\/$/, '') + base,
        component: path.resolve(__dirname, 'components/CdmPage.tsx'),
        modules: { graph: dataPath },
        exact: true,
      });
    },
  };
}
