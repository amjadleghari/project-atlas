/**
 * docusaurus-plugin-portal (local)
 *
 *  - Bundles every OpenAPI contract (platform APIs, master Partner Experience
 *    versions, generated partner contracts) into self-contained JSON and YAML
 *    files under /contracts/openapi/, so every reference page can offer downloads.
 *  - Publishes the spec catalogue and partner catalogue as global data for the
 *    API page toolbar, home page and partner pages.
 *  - Adds the /partners index page.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import type { LoadContext, Plugin } from '@docusaurus/types';

export type PortalSpec = {
  id: string;
  spec: string;
  route: string;
  label: string;
  description?: string;
  group: 'platform' | 'master' | 'partner';
  partner?: string;
  version?: string;
  status?: string;
};

export type PortalPartner = {
  id: string;
  name: string;
  summary?: string;
  status: string;
  owner?: string;
  contacts: { name: string; role?: string; email?: string }[];
  versions: { version: string; master: string; status: string; released?: string; sunset?: string; overlays: string[] }[];
};

export type PortalOptions = {
  specs: PortalSpec[];
  partners: PortalPartner[];
  downloadsDir: string; // absolute; served at /contracts
};

export type PortalSpecData = PortalSpec & { info: { title?: string; version?: string }; downloads: { json: string; yaml: string } };
export type PortalData = { specs: PortalSpecData[]; partners: PortalPartner[] };

export default function portalPlugin(context: LoadContext, raw: unknown): Plugin<unknown> {
  const options = raw as PortalOptions;
  return {
    name: 'docusaurus-plugin-portal',

    getPathsToWatch() {
      return options.specs.map((s) => path.resolve(context.siteDir, s.spec));
    },

    async loadContent(): Promise<PortalData> {
      const core: any = await import('@redocly/openapi-core');
      const config = await core.createConfig({});
      const outDir = path.join(options.downloadsDir, 'openapi');
      await fs.mkdir(outDir, { recursive: true });
      const specs: PortalSpecData[] = [];
      for (const s of options.specs) {
        const file = path.resolve(context.siteDir, s.spec);
        const result = await core.bundle({ ref: file, config });
        const doc = result.bundle.parsed;
        await fs.writeFile(path.join(outDir, `${s.id}.json`), JSON.stringify(doc, null, 2) + '\n');
        await fs.writeFile(path.join(outDir, `${s.id}.yaml`), core.stringifyYaml(doc));
        specs.push({
          ...s,
          info: { title: doc.info?.title, version: doc.info?.version },
          downloads: { json: `/contracts/openapi/${s.id}.json`, yaml: `/contracts/openapi/${s.id}.yaml` },
        });
      }
      return { specs, partners: options.partners };
    },

    async contentLoaded({ content: loaded, actions }) {
      const content = loaded as PortalData;
      actions.setGlobalData(content);
      const data = await actions.createData('portal-partners.json', JSON.stringify(content));
      actions.addRoute({
        path: context.baseUrl.replace(/\/$/, '') + '/partners',
        component: path.resolve(__dirname, 'PartnersIndexPage.tsx'),
        modules: { data },
        exact: true,
      });
    },
  };
}
