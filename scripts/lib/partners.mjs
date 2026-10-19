/**
 * Partner contract generation: master OpenAPI + partner overlays → partner contract.
 *
 *   partner-experience/
 *     master/<vN>/openapi.yaml                     master Partner Experience API, one folder per major version
 *     partners/<partner>/partner.yaml              metadata + which master version and overlays each partner version uses
 *     partners/<partner>/overlays/*.overlay.yaml   OpenAPI Overlay 1.0 documents, applied in the listed order
 *     generated/<partner>/<version>/openapi.{yaml,json}   ← written by `npm run partners` (never edit by hand)
 *
 * Shared by scripts/partners.mjs (CLI / CI) and docusaurus.config.ts (routes and partner pages).
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const ROOT_DIR = 'partner-experience';

const KEY_ORDER = ['openapi', 'info', 'jsonSchemaDialect', 'servers', 'security', 'tags', 'paths', 'webhooks', 'components', 'externalDocs'];

export function partnerPaths(siteDir) {
  const root = path.join(siteDir, ROOT_DIR);
  return {
    root,
    master: path.join(root, 'master'),
    partners: path.join(root, 'partners'),
    generated: path.join(root, 'generated'),
  };
}

export function masterFile(siteDir, version) {
  return path.join(partnerPaths(siteDir).master, version, 'openapi.yaml');
}

export function generatedFiles(siteDir, partnerId, version) {
  const dir = path.join(partnerPaths(siteDir).generated, partnerId, version);
  return { dir, yaml: path.join(dir, 'openapi.yaml'), json: path.join(dir, 'openapi.json') };
}

/** Master versions available, e.g. ["v1", "v2"]. */
export function listMasterVersions(siteDir) {
  const dir = partnerPaths(siteDir).master;
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, 'openapi.yaml')))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * Reads and validates every partner.yaml. Returns partners plus a list of problems
 * (missing master version, missing overlay file, duplicate versions…).
 */
export function loadPartners(siteDir) {
  const { partners: dir } = partnerPaths(siteDir);
  const problems = [];
  if (!fs.existsSync(dir)) return { partners: [], problems };
  const masters = new Set(listMasterVersions(siteDir));
  const partners = [];
  for (const id of fs.readdirSync(dir).sort()) {
    const metaFile = path.join(dir, id, 'partner.yaml');
    if (!fs.existsSync(metaFile)) continue;
    let meta;
    try {
      meta = YAML.parse(fs.readFileSync(metaFile, 'utf8')) ?? {};
    } catch (e) {
      problems.push(`${id}/partner.yaml: invalid YAML — ${e.message}`);
      continue;
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) problems.push(`${id}: folder name must be lower-case kebab-case`);
    if (!meta.name) problems.push(`${id}/partner.yaml: "name" is required`);
    const seen = new Set();
    const versions = (meta.versions ?? []).map((v) => {
      if (!v.version) problems.push(`${id}/partner.yaml: every version needs "version"`);
      if (seen.has(v.version)) problems.push(`${id}/partner.yaml: version ${v.version} listed twice`);
      seen.add(v.version);
      if (!masters.has(v.master)) problems.push(`${id} ${v.version}: master version "${v.master}" not found in ${ROOT_DIR}/master/`);
      for (const o of v.overlays ?? []) {
        if (!fs.existsSync(path.join(dir, id, o))) problems.push(`${id} ${v.version}: overlay ${o} not found`);
      }
      return {
        version: String(v.version),
        master: String(v.master),
        status: v.status ?? 'current',
        released: v.released ? String(v.released) : undefined,
        sunset: v.sunset ? String(v.sunset) : undefined,
        overlays: v.overlays ?? [],
      };
    });
    if (versions.length === 0) problems.push(`${id}/partner.yaml: at least one version is required`);
    partners.push({
      id,
      name: meta.name ?? id,
      summary: meta.summary,
      status: meta.status ?? 'active',
      owner: meta.owner,
      contacts: meta.contacts ?? [],
      versions,
    });
  }
  return { partners, problems };
}

function orderKeys(doc) {
  const out = {};
  for (const k of KEY_ORDER) if (k in doc) out[k] = doc[k];
  for (const k of Object.keys(doc)) if (!(k in out)) out[k] = doc[k];
  return out;
}

async function bundleMaster(file) {
  const core = await import('@redocly/openapi-core');
  const config = await core.createConfig({});
  const result = await core.bundle({ ref: file, config });
  const errs = (result.problems ?? []).filter((p) => p.severity === 'error');
  if (errs.length) throw new Error(`bundling ${file}: ${errs.map((p) => p.message).join('; ')}`);
  return renameBundledSchemas(structuredClone(result.bundle.parsed));
}

/**
 * The bundler names schemas pulled in from other files after the file
 * ("money.schema"). Partners should see the model name, so rename each one to
 * its JSON Schema `title` (when free) and rewrite every $ref to it.
 */
function renameBundledSchemas(doc) {
  const schemas = doc.components?.schemas;
  if (!schemas) return doc;
  const renames = new Map();
  for (const [key, s] of Object.entries(schemas)) {
    if (!key.includes('.') || !s?.title) continue;
    const target = s.title.replace(/[^A-Za-z0-9_.-]/g, '');
    if (target && !(target in schemas) && ![...renames.values()].includes(target)) renames.set(key, target);
  }
  if (!renames.size) return doc;
  const rewritten = {};
  for (const [key, s] of Object.entries(schemas)) rewritten[renames.get(key) ?? key] = s;
  doc.components.schemas = rewritten;
  const fix = (node) => {
    if (Array.isArray(node)) return node.forEach(fix);
    if (!node || typeof node !== 'object') return;
    if (typeof node.$ref === 'string') {
      const m = node.$ref.match(/^#\/components\/schemas\/(.+)$/);
      if (m && renames.has(m[1])) node.$ref = `#/components/schemas/${renames.get(m[1])}`;
    }
    Object.values(node).forEach(fix);
  };
  fix(doc);
  return doc;
}

async function applyOverlays(doc, overlayFiles, label) {
  const { openapiOverlay } = (await import('openapi-format')).default;
  const problems = [];
  let current = doc;
  for (const file of overlayFiles) {
    const overlay = YAML.parse(fs.readFileSync(file, 'utf8'));
    const res = await openapiOverlay(current, { overlaySet: overlay });
    current = res.data;
    for (const a of res.resultData?.unusedActions ?? []) {
      // An action that matches nothing almost always means the master changed
      // underneath the overlay (renamed path, removed schema…). Fail loudly.
      problems.push(`${label}: overlay ${path.basename(file)} — action targeting "${a.target}" matched nothing`);
    }
  }
  return { doc: current, problems };
}

/** Builds one partner contract in memory. */
export async function generatePartnerContract(siteDir, partner, v) {
  const label = `${partner.id} ${v.version}`;
  const master = await bundleMaster(masterFile(siteDir, v.master));
  const masterVersion = master.info?.version;
  const overlayFiles = v.overlays.map((o) => path.join(partnerPaths(siteDir).partners, partner.id, o));
  const { doc, problems } = await applyOverlays(master, overlayFiles, label);
  doc.info = {
    ...doc.info,
    'x-partner': partner.id,
    'x-partner-version': v.version,
    'x-generated-from': {
      master: `${ROOT_DIR}/master/${v.master}/openapi.yaml`,
      masterVersion,
      overlays: v.overlays,
    },
  };
  return { doc: orderKeys(doc), problems };
}

export function serialise(doc, partner, v) {
  const header =
    `# GENERATED FILE — DO NOT EDIT.\n` +
    `# ${partner.name} ${v.version} = ${ROOT_DIR}/master/${v.master}/openapi.yaml + ${v.overlays.join(' + ')}\n` +
    `# Change the overlays in ${ROOT_DIR}/partners/${partner.id}/ and run \`npm run partners\`.\n`;
  return {
    yaml: header + YAML.stringify(doc, { lineWidth: 100 }),
    json: JSON.stringify(doc, null, 2) + '\n',
  };
}

// ---------------------------------------------------------------------------
// Change summary between two versions of a generated contract (for PR comments)
// ---------------------------------------------------------------------------
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

function operations(doc) {
  const out = new Map();
  for (const [p, item] of Object.entries(doc?.paths ?? {}))
    for (const m of METHODS) if (item?.[m]) out.set(`${m.toUpperCase()} ${p}`, { op: item[m], shared: item.parameters });
  for (const [name, item] of Object.entries(doc?.webhooks ?? {}))
    for (const m of METHODS) if (item?.[m]) out.set(`WEBHOOK ${name}`, { op: item[m] });
  return out;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Walks two schemas and reports removed enum values and newly required properties. */
function schemaBreaks(oldS, newS, where, out) {
  if (!oldS || !newS || typeof oldS !== 'object' || typeof newS !== 'object') return;
  if (Array.isArray(oldS.enum) && Array.isArray(newS.enum)) {
    const removed = oldS.enum.filter((v) => !newS.enum.some((n) => same(n, v)));
    if (removed.length) out.push(`${where}: enum value(s) removed — ${removed.map((v) => JSON.stringify(v)).join(', ')}`);
  }
  const oldReq = new Set(oldS.required ?? []);
  for (const r of newS.required ?? []) if (!oldReq.has(r)) out.push(`${where}: \`${r}\` is now required`);
  for (const [k, v] of Object.entries(newS.properties ?? {})) schemaBreaks(oldS.properties?.[k], v, `${where}.${k}`, out);
  if (oldS.items && newS.items) schemaBreaks(oldS.items, newS.items, `${where}[]`, out);
}

export function summariseChange(oldDoc, newDoc) {
  const lines = [];
  const breaking = [];
  if (!oldDoc) return { added: true, lines: ['New contract.'], breaking };
  if (oldDoc.info?.version !== newDoc.info?.version)
    lines.push(`Version \`${oldDoc.info?.version}\` → \`${newDoc.info?.version}\``);
  if (!same(oldDoc.servers, newDoc.servers)) lines.push('Servers changed');

  const o = operations(oldDoc);
  const n = operations(newDoc);
  const added = [...n.keys()].filter((k) => !o.has(k));
  const removed = [...o.keys()].filter((k) => !n.has(k));
  const changed = [...n.keys()].filter((k) => o.has(k) && !same(o.get(k), n.get(k)));
  if (added.length) lines.push(`Operations added: ${added.map((k) => `\`${k}\``).join(', ')}`);
  if (removed.length) {
    lines.push(`Operations removed: ${removed.map((k) => `\`${k}\``).join(', ')}`);
    removed.forEach((k) => breaking.push(`\`${k}\` removed`));
  }
  if (changed.length) lines.push(`Operations changed: ${changed.map((k) => `\`${k}\``).join(', ')}`);
  for (const k of changed) {
    const oldParams = new Map([...(o.get(k).shared ?? []), ...(o.get(k).op.parameters ?? [])].map((p) => [p.name ?? p.$ref, p]));
    for (const p of [...(n.get(k).shared ?? []), ...(n.get(k).op.parameters ?? [])]) {
      const key = p.name ?? p.$ref;
      if ((p.required || p.$ref) && !oldParams.has(key)) breaking.push(`\`${k}\`: new parameter \`${key}\``);
    }
  }

  const os = oldDoc.components?.schemas ?? {};
  const ns = newDoc.components?.schemas ?? {};
  const sAdded = Object.keys(ns).filter((k) => !(k in os));
  const sRemoved = Object.keys(os).filter((k) => !(k in ns));
  const sChanged = Object.keys(ns).filter((k) => k in os && !same(os[k], ns[k]));
  if (sAdded.length) lines.push(`Schemas added: ${sAdded.map((k) => `\`${k}\``).join(', ')}`);
  if (sRemoved.length) {
    lines.push(`Schemas removed: ${sRemoved.map((k) => `\`${k}\``).join(', ')}`);
    sRemoved.forEach((k) => breaking.push(`schema \`${k}\` removed`));
  }
  if (sChanged.length) lines.push(`Schemas changed: ${sChanged.map((k) => `\`${k}\``).join(', ')}`);
  for (const k of sChanged) schemaBreaks(os[k], ns[k], `\`${k}\``, breaking);

  if (!lines.length) lines.push('Descriptions or metadata only.');
  return { added: false, lines, breaking };
}
