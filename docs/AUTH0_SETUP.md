# Auth0 Setup Guide — For Production Deployment

> ⚠️ **Note**: Auth0 is **optional** for local testing. Skip this if you just want to test the system.

Auth0 is only needed when you deploy to production and want GitHub OAuth login.

---

## When Do You Need Auth0?

| Scenario | Auth0 Required? |
|----------|-----------------|
| Local testing with URL input | ❌ No |
| Testing n8n webhooks | ❌ No |
| Production with GitHub login | ✅ Yes |

---

## Test Mode (No Auth0)

For local development, just leave these empty in `.env`:

```env
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
```

The app will automatically hide the "Sign in with GitHub" option and show only the URL input.

---

## Production Setup (When Ready)

### Step 1: Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. **Applications → Create Application**
3. Select **Single Page Application**
4. Name: `DocuGithub`

### Step 2: Configure URLs

| Setting | Value |
|---------|-------|
| Allowed Callback URLs | `https://your-domain.com` |
| Allowed Logout URLs | `https://your-domain.com` |
| Allowed Web Origins | `https://your-domain.com` |

### Step 3: Enable GitHub Connection

1. **Authentication → Social → GitHub**
2. Create GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
3. Callback URL: `https://your-tenant.auth0.com/login/callback`
4. Copy Client ID & Secret to Auth0

### Step 4: Create Action for GitHub Token

1. **Actions → Library → Build Custom**
2. Name: `Add GitHub Token`
3. Code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  if (event.connection.strategy !== 'github') return;
  
  const identity = event.user.identities?.find(i => i.provider === 'github');
  if (identity?.access_token) {
    api.idToken.setCustomClaim('https://docugithub.dev/github_token', identity.access_token);
  }
};
```

4. Deploy → Add to Post Login flow

### Step 5: Update `.env`

```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
```

---

## Accessing GitHub Token in Code

```tsx
import { useAuth0 } from '@auth0/auth0-react';

const { getIdTokenClaims } = useAuth0();
const claims = await getIdTokenClaims();
const githubToken = claims?.['https://docugithub.dev/github_token'];
```

---

## Summary

- **Testing locally**: Skip Auth0, use URL input
- **Production**: Follow steps above
- The app auto-detects if Auth0 is configured
