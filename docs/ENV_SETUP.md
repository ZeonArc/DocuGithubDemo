# DocuGithub Environment Variables & HMAC Setup Guide

Complete guide for configuring all environment variables and HMAC authentication.

---

## Complete .env File

```env
# ============================================
# N8N WEBHOOK CONFIGURATION
# ============================================
VITE_N8N_WEBHOOK_BASE=https://your-n8n-instance.app.n8n.cloud/webhook
VITE_WEBHOOK_SECRET=your_32_character_random_secret_here

# ============================================
# SUPABASE CONFIGURATION
# ============================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================
# AUTH0 CONFIGURATION
# ============================================
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
```

---

## Where to Get Each Value

### 1. VITE_N8N_WEBHOOK_BASE

**For n8n Cloud:**
1. Go to your n8n instance
2. Create/open any workflow with a webhook
3. Click on the webhook node
4. Look at the webhook URL, example: `https://myinstance.app.n8n.cloud/webhook/initialize`
5. Copy the base URL: `https://myinstance.app.n8n.cloud/webhook`

**For Self-Hosted n8n:**
```
https://your-domain.com/webhook
```

---

### 2. VITE_WEBHOOK_SECRET

This is a secret you **generate yourself**. It must match in both:
- Frontend `.env` file
- n8n environment variables

**Generate a secret:**

**Option 1: Command Line (Linux/Mac/Git Bash)**
```bash
openssl rand -hex 32
```
Output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

**Option 2: Online Generator**
Go to https://randomkeygen.com/ and copy a 256-bit key

**Option 3: PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Example secret:**
```
a7f3b9c2d8e1f0g4h5i6j7k8l9m0n1o2
```

---

### 3. VITE_SUPABASE_URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy the **Project URL**

Example: `https://utubdvdpyqxtfuxkfamn.supabase.co`

---

### 4. VITE_SUPABASE_ANON_KEY

1. Same page as above (**Settings → API**)
2. Under **Project API keys**
3. Copy the **anon (public)** key

> ⚠️ This is the PUBLIC key, safe to use in frontend

Example: `your_supabase_anon_key_here`

---

### 5. VITE_AUTH0_DOMAIN

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Select your application
3. Go to **Settings**
4. Copy the **Domain**

Example: `docugithub-auth.eu.auth0.com`

---

### 6. VITE_AUTH0_CLIENT_ID

1. Same page as above (**Settings**)
2. Copy the **Client ID**

Example: `m6xJ5ivUZzv1d7FU7Zi1Kr8DSuHlqiq1`

---

### 7. VITE_AUTH0_AUDIENCE

This is your Auth0 API identifier:
```
https://YOUR_AUTH0_DOMAIN/api/v2/
```

Example: `https://docugithub-auth.eu.auth0.com/api/v2/`

---

## HMAC Authentication Setup

HMAC (Hash-based Message Authentication Code) ensures that webhook requests come from your frontend and haven't been tampered with.

### How It Works

```
1. Frontend creates request body (JSON)
2. Frontend computes HMAC signature using secret + body
3. Frontend sends request with signature in header
4. n8n receives request
5. n8n computes its own signature using same secret + body
6. n8n compares signatures
7. If match → request is authentic
```

### Step 1: Generate Your Secret

```bash
# Generate a 32-character secret
openssl rand -hex 32
```

Save this secret - you'll need it in TWO places.

### Step 2: Add Secret to n8n

**Option A: n8n Cloud**
1. Go to **Settings → Variables**
2. Add new variable:
   - Name: `WEBHOOK_SECRET`
   - Value: `your_generated_secret`

**Option B: Self-Hosted (Docker)**
Add to `docker-compose.yml`:
```yaml
environment:
  - WEBHOOK_SECRET=your_generated_secret
```

**Option C: Self-Hosted (Environment)**
```bash
export WEBHOOK_SECRET=your_generated_secret
```

### Step 3: Add Secret to Frontend

In your `.env`:
```env
VITE_WEBHOOK_SECRET=your_generated_secret  # Same secret!
```

### Step 4: Frontend HMAC Implementation

The frontend sends signatures with each request. Here's how it works:

**File: `src/lib/api.ts`** (create this if it doesn't exist)

```typescript
// HMAC Signature Generator
async function generateSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(body);
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `sha256=${hashHex}`;
}

// API Request Function
export async function apiRequest(endpoint: string, data: object) {
  const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
  const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;
  
  const body = JSON.stringify(data);
  const signature = await generateSignature(body, webhookSecret);
  
  const response = await fetch(`${webhookBase}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body
  });
  
  return response.json();
}
```

**Usage:**
```typescript
import { apiRequest } from '@/lib/api';

// Initialize session
const result = await apiRequest('initialize', {
  repo_url: 'https://github.com/owner/repo',
  session_id: 'uuid-here'
});
```

### Step 5: n8n HMAC Validation

Each n8n workflow has a **Validate HMAC** code node. Here's what it does:

```javascript
// n8n Code Node: Validate HMAC
const crypto = require('crypto');

// Get the secret from environment
const webhookSecret = $env.WEBHOOK_SECRET;

// Get signature from request header
const signature = $input.first().json.headers['x-webhook-signature'];

// Get request body (raw string)
const body = $input.first().json.body;

// Validate
if (!webhookSecret) {
  throw new Error('WEBHOOK_SECRET not configured');
}

if (!signature) {
  return [{ json: { valid: false, error: 'Missing signature' } }];
}

// Compute expected signature
const expectedSignature = 'sha256=' + 
  crypto.createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

// Compare
const valid = signature === expectedSignature;

if (!valid) {
  return [{ json: { valid: false, error: 'Invalid signature' } }];
}

// Parse body and pass through
const parsedBody = JSON.parse(body);
return [{ json: { valid: true, ...parsedBody } }];
```

### Step 6: Test HMAC

**Test with cURL:**

```bash
# Set your variables
SECRET="your_webhook_secret"
URL="https://your-n8n.com/webhook/initialize"
BODY='{"repo_url":"https://github.com/test/repo","session_id":"test-123"}'

# Generate signature
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Make request
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$SIGNATURE" \
  -d "$BODY"
```

**Expected Response (success):**
```json
{
  "success": true,
  "session_id": "test-123"
}
```

**Expected Response (invalid signature):**
```json
{
  "error": "Invalid signature"
}
```

---

## Netlify Environment Variables

When deploying to Netlify, add these same variables:

1. Go to **Site settings → Environment variables**
2. Add each variable:

| Key | Value |
|-----|-------|
| `VITE_N8N_WEBHOOK_BASE` | Your n8n webhook URL |
| `VITE_WEBHOOK_SECRET` | Your HMAC secret |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_AUTH0_DOMAIN` | Your Auth0 domain |
| `VITE_AUTH0_CLIENT_ID` | Your Auth0 client ID |
| `VITE_AUTH0_AUDIENCE` | Your Auth0 audience |

3. **Redeploy** the site for changes to take effect

---

## Quick Checklist

- [ ] Generated HMAC secret
- [ ] Added secret to n8n (`WEBHOOK_SECRET`)
- [ ] Added secret to frontend (`.env`)
- [ ] Same secret in both places
- [ ] Tested with cURL
- [ ] Added all env vars to Netlify
- [ ] Redeployed site

---

## Troubleshooting HMAC

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing signature" | Header not sent | Check `x-webhook-signature` header |
| "Invalid signature" | Secrets don't match | Verify same secret in n8n and frontend |
| "WEBHOOK_SECRET not configured" | n8n missing variable | Add `WEBHOOK_SECRET` to n8n settings |
| Signature mismatch | Body modified | Ensure JSON is not reformatted |
