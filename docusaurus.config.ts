import fs from 'node:fs';
import path from 'node:path';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as Redocusaurus from 'redocusaurus';
import { openapiSpecs, arazzo, cdm, site } from './apis.config';
import { listMasterVersions, loadPartners } from './scripts/lib/partners.mjs';
import arazzoPlugin from './plugins/arazzo';
import cdmPlugin from './plugins/cdm';
import portalPlugin, { type PortalSpec } from './plugins/portal';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * SITE_URL / BASE_URL are injected by the GitHub Actions workflow from
 * actions/configure-pages, so the same config works for:
 *   - private Pages sites  (served at https://<random>.pages.github.io/ → baseUrl "/")
 *   - public project sites (served at https://<org>.github.io/<repo>/ → baseUrl "/<repo>/")
 *   - local dev            (http://localhost:3000/)
 */
const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';
const baseUrl = (() => {
  const b = process.env.BASE_URL ?? '/';
  return b.endsWith('/') ? b : `${b}/`;
})();

// ---- Contract catalogue ------------------------------------------------------
// Platform APIs come from apis.config.ts; master Partner Experience versions and
// partner contracts are discovered from partner-experience/.
const { partners, problems } = loadPartners(__dirname);
if (problems.length) {
  throw new Error(`partner-experience problems:\n  - ${problems.join('\n  - ')}`);
}

const platformSpecs: PortalSpec[] = openapiSpecs.map((s) => ({ ...s, group: 'platform' }));

const masterSpecs: PortalSpec[] = listMasterVersions(__dirname).map((v) => ({
  id: `partner-experience-${v}`,
  spec: `partner-experience/master/${v}/openapi.yaml`,
  route: `/api/partner-experience/${v}`,
  label: `Partner Experience API ${v} (master)`,
  description: 'Master contract every partner contract is generated from.',
  group: 'master',
  version: v,
}));

const partnerSpecs: PortalSpec[] = partners.flatMap((p) =>
  p.versions
    .filter((v) => fs.existsSync(path.join(__dirname, `partner-experience/generated/${p.id}/${v.version}/openapi.yaml`)))
    .map((v) => ({
      id: `partner-${p.id}-${v.version}`,
      spec: `partner-experience/generated/${p.id}/${v.version}/openapi.yaml`,
      route: `/partners/${p.id}/${v.version}`,
      label: `${p.name} ${v.version}`,
      group: 'partner' as const,
      partner: p.id,
      version: v.version,
      status: v.status,
    })),
);

const allSpecs = [...platformSpecs, ...masterSpecs, ...partnerSpecs];

// Bundled JSON/YAML downloads are written here by the plugins and served at /contracts.
const generatedStatic = path.join(__dirname, '.generated', 'static');
const downloadsDir = path.join(generatedStatic, 'contracts');
fs.mkdirSync(downloadsDir, { recursive: true });

const config: Config = {
  title: site.name,
  tagline: site.tagline,
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: siteUrl,
  baseUrl,
  trailingSlash: false,
  staticDirectories: ['static', '.generated/static'],

  // Internal portal: keep it out of search engines even if visibility is ever changed.
  noIndex: true,

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Point this at your repo to get "Edit this page" links:
          // editUrl: 'https://github.com/<org>/<repo>/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
    [
      'redocusaurus',
      {
        // Explicit list (instead of folder auto-discovery) so routes are stable
        // and the Arazzo pages can deep-link into each operation.
        specs: allSpecs.map((s) => ({ id: s.id, spec: s.spec, route: s.route })),
        theme: {
          primaryColor: '#2e5bba',
          options: {
            // Redoc options — https://redocly.com/docs/redoc/config
            // Downloads (JSON + YAML) are provided by the toolbar above each reference.
            hideDownloadButton: true,
            expandResponses: '200,201',
            jsonSampleExpandLevel: 2,
            sortPropsAlphabetically: false,
          },
        },
      },
    ] satisfies Redocusaurus.PresetEntry,
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        // Each partner's documentation lives next to its overlays:
        // partner-experience/partners/<partner>/*.md(x) → /partners/<partner>/…
        id: 'partners',
        path: 'partner-experience/partners',
        routeBasePath: 'partners',
        sidebarPath: './sidebars.partners.ts',
        include: ['**/*.md', '**/*.mdx'],
      },
    ],
    [
      portalPlugin,
      {
        specs: allSpecs,
        partners,
        downloadsDir,
      },
    ],
    [
      arazzoPlugin,
      {
        path: arazzo.path,
        routeBasePath: arazzo.routeBasePath,
        openapiSpecs: allSpecs,
        downloadsDir,
      },
    ],
    [
      cdmPlugin,
      {
        path: cdm.path,
        routeBasePath: cdm.routeBasePath,
        openapiSpecs: allSpecs,
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    navbar: {
      title: site.name,
      logo: {
        alt: site.name,
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'dropdown',
          label: 'API reference',
          position: 'left',
          items: [...platformSpecs, ...masterSpecs].map((s) => ({ label: s.label, to: s.route })),
        },
        { to: '/partners', label: 'Partners', position: 'left' },
        { to: arazzo.routeBasePath, label: 'Workflows', position: 'left' },
        { to: cdm.routeBasePath, label: 'Data model', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'APIs',
          items: [...platformSpecs, ...masterSpecs].map((s) => ({ label: s.label, to: s.route })),
        },
        {
          title: 'Partners',
          items: [
            { label: 'All partners', to: '/partners' },
            ...partners.map((p) => ({ label: p.name, to: `/partners/${p.id}/` })),
          ],
        },
        {
          title: 'Explore',
          items: [
            { label: 'Workflows', to: arazzo.routeBasePath },
            { label: 'Canonical data model', to: cdm.routeBasePath },
            { label: 'Diagrams', to: '/docs/diagrams' },
          ],
        },
        {
          title: 'Contribute',
          items: [
            { label: 'Publishing a contract', to: '/docs/guides/publishing-contracts' },
            { label: 'Managing partner documentation', to: '/docs/guides/partner-documentation' },
          ],
        },
      ],
      copyright: `${site.name} · Internal use only · © ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      // Note: adding `additionalLanguages` here (even 'bash') causes React hydration
      // warnings on every page with code blocks in Docusaurus 3.10 + React 19.
      // YAML, JSON, TS and most others are built in; bash renders unhighlighted.
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
