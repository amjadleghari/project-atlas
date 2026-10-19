---
slug: /
title: Getting started
sidebar_position: 1
---

# Getting started

This site is our documentation as code: every contract, workflow, data model and guide lives in Git, is reviewed in pull requests, and is published automatically. It publishes:

- **API reference** — each OpenAPI description rendered with Redoc. Use the **API reference** menu in the navbar.
- **Workflows** — Arazzo descriptions showing how several APIs are called together, step by step, with a diagram and links into each operation.
- **Partners** — one contract per partner and version, generated from the master Partner Experience API with OpenAPI overlays, plus each partner's onboarding notes and changelog. See [Managing partner documentation](guides/partner-documentation.md).
- **Data model** — an interactive graph of the canonical JSON Schemas every contract is built from. Click a model to see its properties, inheritance and where it's used. See [Canonical data model](guides/canonical-data-model.md).
- **Diagrams** — Mermaid diagrams written in the pages themselves. See the [diagram guide](diagrams/index.md) for every supported type.

Every API reference and workflow page has **JSON** and **YAML** download buttons for the bundled, self-contained contract.

Everything on this site is generated from files in the repository, so the docs never drift from the contracts. When a contract changes on `main`, the site rebuilds and redeploys automatically.

## Who can see this site

The site is published as a **private GitHub Pages site**. Only people signed in to GitHub with read access to the repository can open it. If you can't see it, ask the repository admins for access.

## How the pieces fit

```mermaid
flowchart LR
  C["cdm/**/*.schema.json"] --> V["Ajv validate"]
  C -. "$ref" .-> A
  A["openapi/*.json"] --> L["Redocly CLI lint"]
  V --> D
  B["arazzo/*.arazzo.yaml"] --> L
  L --> D["Docusaurus build"]
  D --> R["Redoc pages<br/>/api/…"]
  D --> W["Workflow pages<br/>/workflows/…"]
  D --> G["Data model graph<br/>/data-model"]
  O["partner-experience/<br/>master + overlays"] --> PG["npm run partners"]
  PG --> D
  D --> PP["Partner pages<br/>/partners/…"]
  PP --> P
  G --> P
  R --> P["GitHub Pages<br/>(private)"]
  W --> P
```
