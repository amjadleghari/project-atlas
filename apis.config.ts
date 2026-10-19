/**
 * Single source of truth for the contracts published on the portal.
 *
 * Add an OpenAPI contract:  drop it under ./openapi/<name>/ and add an entry to `openapiSpecs`.
 * Add an Arazzo workflow:   drop a *.arazzo.yaml file in ./arazzo/ — it is picked up automatically.
 *
 * Remember to add new files to redocly.yaml too so CI lints them.
 */

export type OpenApiSpec = {
  /** Unique id, also used as the Redoc download filename. */
  id: string;
  /** Path to the root OpenAPI file (multi-file specs are bundled at build time). */
  spec: string;
  /** Site route the reference is served at. */
  route: string;
  /** Label shown in the navbar dropdown and on the home page. */
  label: string;
  /** One-line description for the home page card. */
  description: string;
};

export const openapiSpecs: OpenApiSpec[] = [
  {
    id: 'orders',
    spec: 'openapi/orders/openapi.json',
    route: '/api/orders',
    label: 'Orders API',
    description: 'Create and track customer orders.',
  },
  {
    id: 'payments',
    spec: 'openapi/payments/openapi.json',
    route: '/api/payments',
    label: 'Payments API',
    description: 'Authorise and capture payments against orders.',
  },
];

export const arazzo = {
  /** Folder scanned for *.arazzo.yaml / *.arazzo.yml / *.arazzo.json files. */
  path: 'arazzo',
  /** Route the workflow catalogue is served at. */
  routeBasePath: '/workflows',
};

export const cdm = {
  /** Folder of JSON Schema files: cdm/<family>/<model>.schema.json */
  path: 'cdm',
  /** Route the interactive data model graph is served at. */
  routeBasePath: '/data-model',
  /** Every schema's $id must equal this + its path under cdm/ (checked by `npm run validate:cdm`). */
  schemaBaseUri: 'https://schemas.example.internal/cdm/',
};

/** Site identity — change the name here and it updates the title, navbar, home page and footer. */
export const site = {
  name: 'Project Atlas',
  tagline: 'Contracts, workflows, data model and Project documentation — generated from the repository.',
};
