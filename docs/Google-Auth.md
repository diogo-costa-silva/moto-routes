# Google OAuth Setup

This document describes how Google OAuth is configured for the Moto Routes project.

## Project References

| Item | Value |
|------|-------|
| App name | Moto Routes |
| Supabase project ID | `epaxdcbvbysjrnwuffay` |
| Supabase callback URL | `https://epaxdcbvbysjrnwuffay.supabase.co/auth/v1/callback` |
| Google Cloud project ID | `astute-synapse-368017` |
| Google Cloud project name | My First Project |
| Frontend dev URL | `http://localhost:5174` |
| Frontend prod URL | `https://moto-routes.vercel.app` |

---

## What Was Configured

### Google Cloud Console

1. Navigate to [console.cloud.google.com](https://console.cloud.google.com) and select project `astute-synapse-368017`.
2. Go to **APIs & Services** → **Credentials**.
3. An OAuth 2.0 Client ID exists with:
   - **Type**: Web application
   - **Name**: Moto Routes
   - **Authorized redirect URI**: `https://epaxdcbvbysjrnwuffay.supabase.co/auth/v1/callback`
4. The **OAuth consent screen** is configured as:
   - **User type**: External
   - **Publishing status**: Published — any Gmail account can sign in without restrictions.

### Supabase Dashboard

1. Under **Authentication** → **Providers** → **Google**:
   - Google provider is enabled.
   - Client ID and Client Secret from Google Cloud Console are saved here.
2. Under **Authentication** → **URL Configuration** → **Redirect URLs**:
   - `http://localhost:5174`
   - `https://moto-routes.vercel.app`

---

## Code

The OAuth flow is triggered from `frontend/src/hooks/useAuth.ts`:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + window.location.pathname,
  },
})
```

`window.location.origin` resolves dynamically — `http://localhost:5174` in development and `https://moto-routes.vercel.app` in production. Both origins are registered as allowed redirect URLs in Supabase.

> **Why include `pathname`:** React Router intercepts navigation to the root path before Supabase can process the `?code=` callback parameter. Including `window.location.pathname` ensures the redirect returns to the current page, preserving the OAuth code for Supabase to complete the authentication flow.

---

## Maintenance

### Adding a Test User (if app reverts to Testing mode)

If the consent screen status changes back to **Testing**, only explicitly listed test users can sign in.

To add a test user:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → project `astute-synapse-368017`.
2. Navigate to **APIs & Services** → **OAuth consent screen**.
3. Under **Test users**, click **Add users**.
4. Enter the Gmail address and save.

Current test users (only relevant in Testing mode): `dccsilva98@gmail.com`, `dipedilans@gmail.com`.

### Re-publishing the App (if it reverts to Testing)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → project `astute-synapse-368017`.
2. Navigate to **APIs & Services** → **OAuth consent screen**.
3. Click **Publish app** and confirm.

Once published, all Gmail accounts can sign in without needing to be listed as test users.
