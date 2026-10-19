# API Portal

Internal developer portal built with **Docusaurus 3**, rendering:

- **OpenAPI** contracts with Redoc (via [Redocusaurus](https://github.com/rohit-gohri/redocusaurus)) — one reference page per API.
- **Arazzo** workflows with a small local plugin (`plugins/arazzo`) — one page per workflow file, with a Mermaid flow diagram and step cards that deep-link into the matching Redoc operation.
- **Canonical data model** (`cdm/`, JSON Schema 2020-12) as an interactive graph at `/data-model`: families as boxes, inheritance arrows, click a model for its details in a side panel. Contracts `$ref` these schemas, so each model lists the operations that use it.
- Data model validated with **Ajv** and contracts linted with **Redocly CLI** on every push and PR.

Deployed to **GitHub Pages with private visibility** (GitHub Enterprise Cloud), so only signed-in users with read access to the repo can open it.

```
apis.config.ts          ← OpenAPI specs, Arazzo folder, CDM folder (single source of truth)
cdm/<family>/*.schema.json ← canonical data model (JSON Schema 2020-12)
openapi/<api>/openapi.json ← OpenAPI contracts, $ref-ing the CDM
arazzo/*.arazzo.yaml    ← Arazzo workflows (auto-discovered)
plugins/arazzo/         ← Arazzo → Docusaurus pages plugin
plugins/cdm/            ← CDM → interactive graph page plugin (Cytoscape + ELK)
scripts/validate-cdm.mjs ← schema, $id and reference checks for the CDM
docs/                   ← guides (Markdown/MDX)
redocly.yaml            ← lint config — add every contract here
.github/workflows/      ← lint → build → deploy to Pages
```

## Run locally

Requires Node 20+.

```bash
npm ci
npm run check   # validate CDM + lint OpenAPI/Arazzo + typecheck
npm start       # http://localhost:3000
npm run build && npm run serve
```

## One-time GitHub setup

1. **Create the repo** in your organisation with **Internal** (everyone in the enterprise) or **Private** (only people you grant) visibility, and push this project to `main`.
2. **Allow private Pages for the org** — an org owner opens *Organization settings → Member privileges → Pages creation* and enables **Private**.
3. **Point Pages at Actions** — in the repo: *Settings → Pages → Build and deployment → Source: GitHub Actions*.
4. **Make the site private** — same page, *Visibility: Private*. (If your enterprise uses Enterprise Managed Users, sites are private by default and this option is not shown.)
5. Push to `main` (or run the workflow manually). The deploy job prints the site URL; private sites live on a unique `*.pages.github.io` domain, and the build picks up the right URL and base path automatically from `actions/configure-pages`.

**Who can view it:** anyone with read access to the repository. With an *Internal* repo that's every member of the enterprise; with a *Private* repo, manage access through repo collaborators and teams.

## Adding contracts

See [docs/guides/publishing-contracts.md](docs/guides/publishing-contracts.md). In short:

- **OpenAPI** — add the folder under `openapi/`, an entry in `apis.config.ts`, and an entry in `redocly.yaml`.
- **Arazzo** — drop `*.arazzo.yaml` into `arazzo/` and add it to `redocly.yaml`. Point `sourceDescriptions[].url` at the OpenAPI files with a path relative to the Arazzo file so steps resolve and link to Redoc.

## Canonical data model

See [docs/guides/canonical-data-model.md](docs/guides/canonical-data-model.md) for the conventions. In short, one model per file under `cdm/<family>/`:

- `allOf: [{ "$ref": … }]` means *extends*;
- a property `$ref` means *contains*;
- `x-references` means *references by id*;
- `x-abstract: true` marks an abstract model.

`$id` must match the file path under `schemaBaseUri` in `apis.config.ts`.

## Notes and limits

- Redoc's free (MIT) renderer is used; Redocly's commercial products (Realm/Reunite) also render Arazzo natively if you later want an off-the-shelf portal.
- The Arazzo plugin resolves steps against **local** OpenAPI files; remote `https://` source descriptions are shown but not resolved (keeps builds offline-safe).
- The graph handles a few hundred models comfortably; for much larger models, use the family filters and "Lineage only" to keep views focused.
- `noIndex: true` is set so the site is never indexed, even if visibility changes.
