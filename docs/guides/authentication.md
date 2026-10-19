---
title: Authentication
sidebar_position: 3
---

# Authentication

All internal APIs use the OAuth 2.0 **client credentials** flow against the internal authorisation server.

```bash
curl -s https://auth.example.internal/oauth2/token \
  -d grant_type=client_credentials \
  -d client_id="$CLIENT_ID" \
  -d client_secret="$CLIENT_SECRET" \
  -d scope="orders:read orders:write"
```

Send the returned token as `Authorization: Bearer <token>`. Each operation's required scopes are listed in its API reference.

> Replace this page with your organisation's real onboarding steps.
