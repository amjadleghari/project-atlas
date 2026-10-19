import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as Redocusaurus from 'redocusaurus';
import { openapiSpecs, arazzo, cdm } from './apis.config';
import arazzoPlugin from './plugins/arazzo';
import cdmPlugin from './plugins/cdm';

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

const config: Config = {
  title: 'API Portal',
  tagline: 'Internal API contracts and workflows',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: siteUrl,
  baseUrl,
  trailingSlash: false,

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
        specs: openapiSpecs.map((s) => ({
          id: s.id,
          spec: s.spec,
          route: s.route,
        })),
        theme: {
          primaryColor: '#2e5bba',
          options: {
            // Redoc options — https://redocly.com/docs/redoc/config
            hideDownloadButton: false,
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
      arazzoPlugin,
      {
        path: arazzo.path,
        routeBasePath: arazzo.routeBasePath,
        openapiSpecs,
      },
    ],
    [
      cdmPlugin,
      {
        path: cdm.path,
        routeBasePath: cdm.routeBasePath,
        openapiSpecs,
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
      title: 'API Portal',
      logo: {
        alt: 'API Portal',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          type: 'dropdown',
          label: 'API reference',
          position: 'left',
          items: openapiSpecs.map((s) => ({ label: s.label, to: s.route })),
        },
        { to: arazzo.routeBasePath, label: 'Workflows', position: 'left' },
        { to: cdm.routeBasePath, label: 'Data model', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'APIs',
          items: openapiSpecs.map((s) => ({ label: s.label, to: s.route })),
        },
        {
          title: 'Workflows',
          items: [
            { label: 'All workflows', to: arazzo.routeBasePath },
            { label: 'Canonical data model', to: cdm.routeBasePath },
          ],
        },
        {
          title: 'Contribute',
          items: [{ label: 'Publishing a contract', to: '/docs/guides/publishing-contracts' }],
        },
      ],
      copyright: `Internal use only · © ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
