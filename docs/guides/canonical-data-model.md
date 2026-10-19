---
title: Canonical data model
sidebar_position: 2
---

# Canonical data model

The [Data model](pathname:///data-model) page is an interactive map of every canonical schema. Click a model to open its details: properties (own and inherited), inheritance chain, which models use it, and every API operation whose payload includes it.

API contracts don't redefine these shapes. They `$ref` the canonical JSON Schema files, so the portal can always show where each model is used.

## How a model is written

One model per file, in a folder named after its **family**:

```text
cdm/
  core/
    family.json              ← optional: { "title", "description" }
    entity.schema.json
    money.schema.json
  party/
    party.schema.json
    person.schema.json
    customer.schema.json
```

Each file is plain JSON Schema 2020-12. The portal reads relationships from standard keywords, plus three `x-` extensions:

| You write | The graph shows |
|---|---|
| `"allOf": [{ "$ref": "person.schema.json" }]` | **Extends** — solid line, hollow arrow to the parent |
| `"total": { "$ref": "../core/money.schema.json" }` | **Contains** — diamond at the owning model |
| `"items": { "type": "array", "items": { "$ref": … } }` | **Contains many** — labelled `items [*]` |
| `"customerId": { …, "x-references": "../party/customer.schema.json" }` | **References by id** — dashed arrow (a foreign key, not an embedded copy) |
| `"x-abstract": true` | Dashed, italic box — never used on its own |
| `"x-family": "party"` | Overrides the folder-derived family |

Example:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.example.internal/cdm/party/customer.schema.json",
  "title": "Customer",
  "description": "A person who buys from us.",
  "allOf": [{ "$ref": "person.schema.json" }],
  "type": "object",
  "required": ["customerNumber"],
  "properties": {
    "customerNumber": { "type": "string", "pattern": "^C\\d{8}$" },
    "addresses": { "type": "array", "items": { "$ref": "../core/address.schema.json" } }
  }
}
```

### Rules CI enforces (`npm run validate:cdm`)

- `title` is required — it's the model's name in the graph and in URLs (`?model=Customer`), so keep titles unique.
- `$id` must equal the base URI plus the file's path under `cdm/`. Relative `$ref`s and `$id`-based resolution then always agree, in the portal, in Redoc and in any validator your services use.
- Every `$ref` and `x-references` target must exist, and inheritance can't loop.

## Using a model in an API contract

Reference the schema file from the contract with a relative path:

```json
"components": {
  "schemas": {
    "Order": { "$ref": "../../cdm/commerce/order.schema.json" }
  }
}
```

The Redoc reference inlines the schema at build time, and the model's **Used in contracts** list picks up the operation automatically. Models included indirectly, such as Money inside Order, are listed with *via Order*.

## Linking to a model

Every view has a shareable URL:

- `/data-model?model=Customer` — one model
- `/data-model?family=party` — one family

From inside an OpenAPI description, use a relative link such as `[Order](../data-model?model=Order)` so it keeps working whatever the site's base path is.
