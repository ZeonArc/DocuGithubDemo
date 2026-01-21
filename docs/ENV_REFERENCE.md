# Environment Variables Reference

This document clarifies the environment variable naming conventions.

---

## Naming Convention

| Location | Prefix | Example |
|----------|--------|---------|
| **Frontend (Vite)** | `VITE_` | `VITE_WEBHOOK_SECRET` |
| **n8n** | No prefix | `WEBHOOK_SECRET` |
| **Netlify** | `VITE_` | `VITE_WEBHOOK_SECRET` |

> **Note**: Vite requires the `VITE_` prefix to expose environment variables to the frontend. n8n uses variables without any prefix.

---

## Frontend `.env` (with VITE_ prefix)

```env
# n8n Webhook Configuration
VITE_N8N_WEBHOOK_BASE=http://localhost:5678/webhook
VITE_WEBHOOK_SECRET=your_32_char_secret_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
```

---

## n8n Environment Variables (no prefix)

```env
# HMAC Authentication
WEBHOOK_SECRET=your_32_char_secret_here

# Auth0 JWT Validation (optional)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
```

---

## Netlify Environment Variables

Same as frontend, with `VITE_` prefix:

| Variable | Value |
|----------|-------|
| `VITE_N8N_WEBHOOK_BASE` | `https://your-n8n.com/webhook` |
| `VITE_WEBHOOK_SECRET` | Same as n8n `WEBHOOK_SECRET` |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_AUTH0_DOMAIN` | Your Auth0 domain |
| `VITE_AUTH0_CLIENT_ID` | Your Auth0 client ID |
| `VITE_AUTH0_AUDIENCE` | Your Auth0 audience |

---

## Mapping Table

| Frontend (VITE_) | n8n (no prefix) | Purpose |
|------------------|-----------------|---------|
| `VITE_WEBHOOK_SECRET` | `WEBHOOK_SECRET` | HMAC signing |
| `VITE_AUTH0_DOMAIN` | `AUTH0_DOMAIN` | Auth0 tenant |
| `VITE_AUTH0_AUDIENCE` | `AUTH0_AUDIENCE` | JWT audience |

---

## How It Works

```
Frontend                                    n8n
   |                                         |
   | Uses: VITE_WEBHOOK_SECRET               | Uses: WEBHOOK_SECRET
   | (same value, different name)            | (same value, different name)
   |                                         |
   | 1. Creates request body                 |
   | 2. Signs with VITE_WEBHOOK_SECRET       |
   | 3. Sends signature in header            |
   |------------------------------------------->
   |                                         | 4. Receives request
   |                                         | 5. Verifies with WEBHOOK_SECRET
   |                                         | 6. Processes if valid
```

---

## Generate a Secret

Both frontend and n8n must use the **same secret value**:

```bash
# Generate secret
openssl rand -hex 32

# Output example: c041388dc9a306dc0b5b0fe3024995ea16750f3c49724b8aa5245e72c08514fd
```

Then add to:
- Frontend `.env`: `VITE_WEBHOOK_SECRET=c041388dc9...`
- n8n Variables: `WEBHOOK_SECRET=c041388dc9...` (same value!)
