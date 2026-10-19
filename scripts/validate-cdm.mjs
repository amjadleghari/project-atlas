#!/usr/bin/env node
/**
 * Validates the canonical data model in ./cdm:
 *   1. every *.schema.json is valid JSON Schema 2020-12 and compiles (all $refs resolve)
 *   2. each $id equals CDM_BASE_URI + its path under cdm/ — so relative $refs and $id-based
 *      resolution always agree
 *   3. every x-references target exists
 *   4. no inheritance cycles
 *
 * Usage: node scripts/validate-cdm.mjs [cdmDir] [baseUri]
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const dir = path.resolve(process.argv[2] ?? 'cdm');
const base = process.argv[3] ?? process.env.CDM_BASE_URI ?? 'https://schemas.example.internal/cdm/';

const files = fs
  .readdirSync(dir, { recursive: true })
  .filter((f) => f.endsWith('.schema.json'))
  .sort();

const errors = [];
const schemas = new Map();
const xKeywords = new Set();

const collectX = (node) => {
  if (Array.isArray(node)) node.forEach(collectX);
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('x-')) xKeywords.add(k);
      collectX(v);
    }
};

for (const f of files) {
  const rel = f.split(path.sep).join('/');
  try {
    const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const expected = base + rel;
    if (s.$id !== expected) errors.push(`${rel}: $id is "${s.$id}", expected "${expected}"`);
    if (!s.title) errors.push(`${rel}: missing "title" (used as the model name)`);
    collectX(s);
    schemas.set(rel, s);
  } catch (e) {
    errors.push(`${rel}: invalid JSON — ${e.message}`);
  }
}

const ajv = new Ajv2020({ strict: true, allErrors: true, keywords: [...xKeywords] });
addFormats(ajv);
for (const s of schemas.values()) {
  try {
    ajv.addSchema(s);
  } catch (e) {
    errors.push(`${s.$id}: ${e.message}`);
  }
}

for (const [rel, s] of schemas) {
  try {
    ajv.getSchema(s.$id) ?? ajv.compile(s);
  } catch (e) {
    errors.push(`${rel}: ${e.message}`);
  }
}

// x-references targets + inheritance cycles
const resolve = (from, ref) => path.posix.normalize(path.posix.join(path.posix.dirname(from), ref.split('#')[0]));
const parents = new Map();
const walk = (rel, node) => {
  if (Array.isArray(node)) return node.forEach((n) => walk(rel, n));
  if (!node || typeof node !== 'object') return;
  if (typeof node['x-references'] === 'string') {
    const target = resolve(rel, node['x-references']);
    if (!schemas.has(target)) errors.push(`${rel}: x-references "${node['x-references']}" not found`);
  }
  Object.values(node).forEach((v) => walk(rel, v));
};
for (const [rel, s] of schemas) {
  walk(rel, s);
  parents.set(
    rel,
    (s.allOf ?? []).filter((a) => typeof a.$ref === 'string' && !a.$ref.startsWith('#')).map((a) => resolve(rel, a.$ref)),
  );
}
const visiting = new Set();
const done = new Set();
const visit = (n, trail) => {
  if (done.has(n)) return;
  if (visiting.has(n)) return errors.push(`inheritance cycle: ${[...trail, n].join(' → ')}`);
  visiting.add(n);
  for (const p of parents.get(n) ?? []) visit(p, [...trail, n]);
  visiting.delete(n);
  done.add(n);
};
for (const n of parents.keys()) visit(n, []);

if (errors.length) {
  console.error(`✖ Canonical data model: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ Canonical data model: ${schemas.size} schemas valid (${base})`);
