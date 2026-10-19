---
title: Publishing a contract
sidebar_position: 1
---

# Publishing a contract

## Add an OpenAPI contract

1. Create a folder under `openapi/` and put your contract in it as `openapi.json` (YAML works too). Take payload schemas from the [canonical data model](canonical-data-model.md) with relative `$ref`s rather than redefining them — they're bundled into the Redoc page at build time.

   ```text
   openapi/
     inventory/
       openapi.json      ← "$ref": "../../cdm/commerce/product.schema.json"
   ```

2. Register it in `apis.config.ts`:

   ```ts
   {
     id: 'inventory',
     spec: 'openapi/inventory/openapi.json',
     route: '/api/inventory',
     label: 'Inventory API',
     description: 'Stock levels by warehouse.',
   },
   ```

3. Add it to `redocly.yaml` so CI lints it:

   ```yaml
   apis:
     inventory@v1:
       root: ./openapi/inventory/openapi.json
   ```

The new reference appears in the **API reference** menu, on the home page and in the footer.

## Add an Arazzo workflow

1. Drop a file ending in `.arazzo.yaml` into `arazzo/`. It is discovered automatically and published at `/workflows/<file-name>`.
2. Point `sourceDescriptions[].url` at the OpenAPI files **relative to the Arazzo file**, for example `../openapi/orders/openapi.json`. That lets the portal resolve each step to its HTTP method and path and link straight to the operation in Redoc.
3. Reference operations as `$sourceDescriptions.<name>.<operationId>` (or with `operationPath`).
4. Add the file to `redocly.yaml`.

## Check locally before you push

```bash
npm ci
npm run check    # validate the data model, lint contracts, typecheck
npm start        # http://localhost:3000 with live reload
npm run build    # the same production build CI runs
```

## Optional: test a workflow against staging

Redocly CLI can execute Arazzo workflows (`redocly respect`). Point it at a non-production environment only:

```bash
npx redocly respect arazzo/checkout.arazzo.yaml \
  --input customerId=… \
  --server ordersApi=https://orders.api.staging.example.internal/v1
```
