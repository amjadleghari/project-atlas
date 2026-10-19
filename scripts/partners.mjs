#!/usr/bin/env node
/**
 * Partner contracts CLI.
 *
 *   npm run partners                         regenerate every partner contract
 *   npm run partners -- --partner bluegum-advisers
 *   npm run partners:check                   fail if any generated contract is out of date (CI on main)
 *   node scripts/partners.mjs diff --base origin/main [--out summary.md]
 *                                            markdown summary of contract changes vs a git ref (PR comment)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
import {
  ROOT_DIR,
  loadPartners,
  generatePartnerContract,
  generatedFiles,
  serialise,
  summariseChange,
  partnerPaths,
} from './lib/partners.mjs';

const siteDir = process.cwd();
const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('--') ? args[0] : 'build';
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt('partner');
const rel = (p) => path.relative(siteDir, p);

const CODEOWNERS = '.github/CODEOWNERS';
const BEGIN = '# BEGIN partner owners';
const END = '# END partner owners';

/** Expected CODEOWNERS file content with the partner block regenerated from partner.yaml owners. */
function codeownersContent(partners) {
  if (!fs.existsSync(CODEOWNERS)) return null;
  const current = fs.readFileSync(CODEOWNERS, 'utf8');
  const start = current.indexOf(BEGIN);
  const end = current.indexOf(END);
  if (start < 0 || end < start) return null;
  const startLineEnd = current.indexOf('\n', start) + 1;
  const lines = partners
    .filter((p) => p.owner)
    .map((p) => `/${ROOT_DIR}/partners/${p.id}/ ${p.owner}`.replace(/^(\S+)/, (m) => m.padEnd(48)));
  return current.slice(0, startLineEnd) + lines.map((l) => l + '\n').join('') + current.slice(end);
}

async function buildAll({ write }) {
  const { partners, problems } = loadPartners(siteDir);
  const stale = [];
  const written = [];
  const expected = new Set();
  for (const partner of partners) {
    if (only && partner.id !== only) continue;
    for (const v of partner.versions) {
      let result;
      try {
        result = await generatePartnerContract(siteDir, partner, v);
      } catch (e) {
        problems.push(`${partner.id} ${v.version}: ${e.message}`);
        continue;
      }
      problems.push(...result.problems);
      const out = serialise(result.doc, partner, v);
      const files = generatedFiles(siteDir, partner.id, v.version);
      for (const [file, content] of [
        [files.yaml, out.yaml],
        [files.json, out.json],
      ]) {
        expected.add(path.resolve(file));
        const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
        if (current === content) continue;
        if (write) {
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, content);
          written.push(rel(file));
        } else stale.push(rel(file));
      }
    }
  }
  // Generated files whose partner/version no longer exists
  if (!only) {
    const genDir = partnerPaths(siteDir).generated;
    const orphans = fs.existsSync(genDir)
      ? fs
          .readdirSync(genDir, { recursive: true })
          .map((f) => path.resolve(genDir, f))
          .filter((f) => /openapi\.(ya?ml|json)$/.test(f) && !expected.has(f))
      : [];
    for (const f of orphans) {
      if (write) {
        fs.rmSync(f);
        written.push(`${rel(f)} (removed)`);
      } else stale.push(`${rel(f)} (orphaned)`);
    }
  }
  if (!only) {
    const want = codeownersContent(partners);
    if (want !== null && want !== fs.readFileSync(CODEOWNERS, 'utf8')) {
      if (write) {
        fs.writeFileSync(CODEOWNERS, want);
        written.push(CODEOWNERS);
      } else stale.push(CODEOWNERS);
    }
  }
  return { problems, stale, written, partners };
}

async function main() {
  if (command === 'build') {
    const { problems, written, partners } = await buildAll({ write: true });
    const count = partners.reduce((n, p) => n + (only && p.id !== only ? 0 : p.versions.length), 0);
    if (problems.length) {
      console.error(`✖ Partner contracts: ${problems.length} problem(s)\n`);
      problems.forEach((p) => console.error(`  - ${p}`));
      process.exit(1);
    }
    console.log(`✔ Partner contracts: ${count} generated, ${written.length} file(s) changed`);
    written.forEach((f) => console.log(`  ${f}`));
    return;
  }

  if (command === 'check') {
    const { problems, stale } = await buildAll({ write: false });
    if (problems.length || stale.length) {
      problems.forEach((p) => console.error(`  - ${p}`));
      if (stale.length) {
        console.error(`✖ Generated partner contracts are out of date. Run \`npm run partners\` and commit:`);
        stale.forEach((f) => console.error(`  ${f}`));
      }
      process.exit(1);
    }
    console.log('✔ Partner contracts are up to date');
    return;
  }

  if (command === 'diff') {
    const base = opt('base') ?? 'origin/main';
    const { partners } = loadPartners(siteDir);
    const sections = [];
    let breakingCount = 0;
    for (const partner of partners) {
      for (const v of partner.versions) {
        const file = rel(generatedFiles(siteDir, partner.id, v.version).json);
        if (!fs.existsSync(file)) continue;
        const now = JSON.parse(fs.readFileSync(file, 'utf8'));
        let before = null;
        try {
          before = JSON.parse(execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
        } catch {
          before = null;
        }
        if (before && JSON.stringify(before) === JSON.stringify(now)) continue;
        const s = summariseChange(before, now);
        breakingCount += s.breaking.length;
        sections.push(
          `### ${partner.name} — ${v.version}${v.status !== 'current' ? ` _(${v.status})_` : ''}\n` +
            s.lines.map((l) => `- ${l}`).join('\n') +
            (s.breaking.length ? `\n\n**⚠️ Potentially breaking for this partner**\n${s.breaking.map((b) => `- ${b}`).join('\n')}` : ''),
        );
      }
    }
    const md = sections.length
      ? `## Partner contract changes\n\nCompared with \`${base}\`. ${breakingCount ? `**${breakingCount} potentially breaking change(s)** — tell the affected partners before merging.` : 'No breaking changes detected.'}\n\n${sections.join('\n\n')}\n\n<sub>Generated by \`scripts/partners.mjs diff\`. Breaking-change detection is heuristic: removed operations/schemas, removed enum values, new required fields and parameters.</sub>\n`
      : '';
    const out = opt('out');
    if (out) fs.writeFileSync(out, md);
    else process.stdout.write(md || 'No partner contract changes.\n');
    return;
  }

  if (command === 'list') {
    const { partners } = loadPartners(siteDir);
    console.log(YAML.stringify(partners.map((p) => ({ id: p.id, name: p.name, versions: p.versions.map((v) => `${v.version}←master/${v.master}`) }))));
    return;
  }

  console.error(`Unknown command "${command}". Use build | check | diff | list.`);
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
