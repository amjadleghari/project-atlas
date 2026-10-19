"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var _a;
exports.__esModule = true;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var prism_react_renderer_1 = require("prism-react-renderer");
var apis_config_1 = require("./apis.config");
var partners_mjs_1 = require("./scripts/lib/partners.mjs");
var arazzo_1 = require("./plugins/arazzo");
var cdm_1 = require("./plugins/cdm");
var portal_1 = require("./plugins/portal");
// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
/**
 * SITE_URL / BASE_URL are injected by the GitHub Actions workflow from
 * actions/configure-pages, so the same config works for:
 *   - private Pages sites  (served at https://<random>.pages.github.io/ → baseUrl "/")
 *   - public project sites (served at https://<org>.github.io/<repo>/ → baseUrl "/<repo>/")
 *   - local dev            (http://localhost:3000/)
 */
var siteUrl = (_a = process.env.SITE_URL) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
var baseUrl = (function () {
    var _a;
    var b = (_a = process.env.BASE_URL) !== null && _a !== void 0 ? _a : '/';
    return b.endsWith('/') ? b : b + "/";
})();
// ---- Contract catalogue ------------------------------------------------------
// Platform APIs come from apis.config.ts; master Partner Experience versions and
// partner contracts are discovered from partner-experience/.
var _b = partners_mjs_1.loadPartners(__dirname), partners = _b.partners, problems = _b.problems;
if (problems.length) {
    throw new Error("partner-experience problems:\n  - " + problems.join('\n  - '));
}
var platformSpecs = apis_config_1.openapiSpecs.map(function (s) { return (__assign(__assign({}, s), { group: 'platform' })); });
var masterSpecs = partners_mjs_1.listMasterVersions(__dirname).map(function (v) { return ({
    id: "partner-experience-" + v,
    spec: "partner-experience/master/" + v + "/openapi.yaml",
    route: "/api/partner-experience/" + v,
    label: "Partner Experience API " + v + " (master)",
    description: 'Master contract every partner contract is generated from.',
    group: 'master',
    version: v
}); });
var partnerSpecs = partners.flatMap(function (p) {
    return p.versions
        .filter(function (v) { return node_fs_1["default"].existsSync(node_path_1["default"].join(__dirname, "partner-experience/generated/" + p.id + "/" + v.version + "/openapi.yaml")); })
        .map(function (v) { return ({
        id: "partner-" + p.id + "-" + v.version,
        spec: "partner-experience/generated/" + p.id + "/" + v.version + "/openapi.yaml",
        route: "/partners/" + p.id + "/" + v.version,
        label: p.name + " " + v.version,
        group: 'partner',
        partner: p.id,
        version: v.version,
        status: v.status
    }); });
});
var allSpecs = __spreadArrays(platformSpecs, masterSpecs, partnerSpecs);
// Bundled JSON/YAML downloads are written here by the plugins and served at /contracts.
var generatedStatic = node_path_1["default"].join(__dirname, '.generated', 'static');
var downloadsDir = node_path_1["default"].join(generatedStatic, 'contracts');
node_fs_1["default"].mkdirSync(downloadsDir, { recursive: true });
var config = {
    title: apis_config_1.site.name,
    tagline: apis_config_1.site.tagline,
    favicon: 'img/favicon.ico',
    future: {
        v4: true
    },
    url: siteUrl,
    baseUrl: baseUrl,
    trailingSlash: false,
    staticDirectories: ['static', '.generated/static'],
    // Internal portal: keep it out of search engines even if visibility is ever changed.
    noIndex: true,
    onBrokenLinks: 'throw',
    markdown: {
        mermaid: true,
        hooks: {
            onBrokenMarkdownLinks: 'warn'
        }
    },
    i18n: {
        defaultLocale: 'en',
        locales: ['en']
    },
    themes: ['@docusaurus/theme-mermaid'],
    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts'
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css'
                }
            }, satisfies, Preset.Options,
        ],
        [
            'redocusaurus',
            {
                // Explicit list (instead of folder auto-discovery) so routes are stable
                // and the Arazzo pages can deep-link into each operation.
                specs: allSpecs.map(function (s) { return ({ id: s.id, spec: s.spec, route: s.route }); }),
                theme: {
                    primaryColor: '#2e5bba',
                    options: {
                        // Redoc options — https://redocly.com/docs/redoc/config
                        // Downloads (JSON + YAML) are provided by the toolbar above each reference.
                        hideDownloadButton: true,
                        expandResponses: '200,201',
                        jsonSampleExpandLevel: 2,
                        sortPropsAlphabetically: false
                    }
                }
            },
        ],
        satisfies, Redocusaurus.PresetEntry,
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
                include: ['**/*.md', '**/*.mdx']
            },
        ],
        [
            portal_1["default"],
            {
                specs: allSpecs,
                partners: partners,
                downloadsDir: downloadsDir
            },
        ],
        [
            arazzo_1["default"],
            {
                path: apis_config_1.arazzo.path,
                routeBasePath: apis_config_1.arazzo.routeBasePath,
                openapiSpecs: allSpecs,
                downloadsDir: downloadsDir
            },
        ],
        [
            cdm_1["default"],
            {
                path: apis_config_1.cdm.path,
                routeBasePath: apis_config_1.cdm.routeBasePath,
                openapiSpecs: allSpecs
            },
        ],
    ],
    themeConfig: {
        colorMode: {
            respectPrefersColorScheme: true
        },
        mermaid: {
            theme: { light: 'neutral', dark: 'dark' }
        },
        navbar: {
            title: apis_config_1.site.name,
            logo: {
                alt: apis_config_1.site.name,
                src: 'img/logo.svg'
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'guidesSidebar',
                    position: 'left',
                    label: 'Documentation'
                },
                {
                    type: 'dropdown',
                    label: 'API reference',
                    position: 'left',
                    items: __spreadArrays(platformSpecs, masterSpecs).map(function (s) { return ({ label: s.label, to: s.route }); })
                },
                { to: '/partners', label: 'Projects', position: 'left' },
                { to: apis_config_1.arazzo.routeBasePath, label: 'Workflows', position: 'left' },
                { to: apis_config_1.cdm.routeBasePath, label: 'Data model', position: 'left' },
            ]
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'APIs',
                    items: __spreadArrays(platformSpecs, masterSpecs).map(function (s) { return ({ label: s.label, to: s.route }); })
                },
                {
                    title: 'Partners',
                    items: __spreadArrays([
                        { label: 'All partners', to: '/partners' }
                    ], partners.map(function (p) { return ({ label: p.name, to: "/partners/" + p.id + "/" }); }))
                },
                {
                    title: 'Explore',
                    items: [
                        { label: 'Workflows', to: apis_config_1.arazzo.routeBasePath },
                        { label: 'Canonical data model', to: apis_config_1.cdm.routeBasePath },
                        { label: 'Diagrams', to: '/docs/diagrams' },
                    ]
                },
                {
                    title: 'Contribute',
                    items: [
                        { label: 'Publishing a contract', to: '/docs/guides/publishing-contracts' },
                        { label: 'Managing partner documentation', to: '/docs/guides/partner-documentation' },
                    ]
                },
            ],
            copyright: apis_config_1.site.name + " \u00B7 Internal use only \u00B7 \u00A9 " + new Date().getFullYear()
        },
        prism: {
            theme: prism_react_renderer_1.themes.github,
            darkTheme: prism_react_renderer_1.themes.dracula
        }
    }, satisfies: satisfies, Preset: Preset,
    : .ThemeConfig
};
exports["default"] = config;
