---
title: Onboarding and environments
sidebar_position: 2
---

# Onboarding and environments

| Environment | Base URL | Credentials |
|---|---|---|
| Sandbox | `https://northwind.sandbox.partners.api.example.com/experience/v2` | Issued by Partner Integrations on request |
| Production | `https://northwind.partners.api.example.com/experience/v2` | Issued after certification |

## Certification checklist

- [x] Quote, accept and issue a lifetime policy in sandbox
- [x] Receive and acknowledge a `policyStatusChanged` webhook
- [x] Handle a `409` on duplicate `partnerReference`
- [ ] Load test at 20 quotes/second for 10 minutes

## Escalation

Business hours: the partner manager listed on the overview. Production incidents: raise a P1 through the partner support line; the on-call engineer is paged automatically.
