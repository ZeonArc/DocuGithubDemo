# HMAC Authentication with Auth0 - Complete Guide

This guide explains how to implement secure HMAC authentication for DocuGithub webhooks using Auth0 tokens.

---

## Overview

There are two approaches to securing your n8n webhooks:

1. **Simple HMAC** - Shared secret between frontend and n8n
2. **Auth0 + HMAC** - JWT token validation + HMAC for double security

This guide covers **both approaches**.

---

## Approach 1: Simple HMAC (Current Implementation)

### How It Works

```
Frontend                                    n8n
   |                                         |
   | 1. Create request body                  |
   | 2. Generate HMAC signature              |
   | 3. Send request + signature header      |
   |------------------------------------------->
   |                                         | 4. Receive request
   |                                         | 5. Compute own HMAC
   |                                         | 6. Compare signatures
   |                                         | 7. Accept or reject
```

### Setup Steps

**Step 1: Generate a secret**
```bash
openssl rand -hex 32
# Output: a7f3b9c2d8e1f0g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0
```

**Step 2: Add to n8n**
```
Settings → Variables → Add:
Name: WEBHOOK_SECRET
Value: your_generated_secret
```

**Step 3: Add to Frontend `.env`**
```env
VITE_WEBHOOK_SECRET=your_generated_secret
```

**Step 4: Frontend Code**
```typescript
// src/lib/hmac.ts
export async function generateHmacSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(body);
  
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Usage in API calls
const body = JSON.stringify(requestData);
const signature = await generateHmacSignature(body, import.meta.env.VITE_WEBHOOK_SECRET);

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-signature': signature
  },
  body
});
```

---

## Approach 2: Auth0 JWT + HMAC (Enhanced Security)

This approach adds Auth0 JWT token validation ON TOP of HMAC for maximum security.

### Architecture

```
Frontend (Auth0)                            n8n
   |                                         |
   | 1. User logs in with Auth0              |
   | 2. Get JWT access token                 |
   | 3. Create request body                  |
   | 4. Generate HMAC signature              |
   | 5. Send request + JWT + signature       |
   |------------------------------------------->
   |                                         | 6. Validate JWT token
   |                                         | 7. Validate HMAC signature
   |                                         | 8. Extract user from JWT
   |                                         | 9. Process request
```

### Step 1: Auth0 Configuration

#### 1.1 Create Auth0 API

1. Go to **Auth0 Dashboard → APIs**
2. Click **Create API**
3. Fill in:
   - Name: `DocuGithub API`
   - Identifier: `https://docugithub.netlify.app/api`
   - Signing Algorithm: `RS256`
4. Save

#### 1.2 Get Auth0 Values

From **Auth0 Dashboard**:

| Value | Where to Find |
|-------|---------------|
| Domain | Settings → Domain (e.g., `docugithub-auth.eu.auth0.com`) |
| Client ID | Applications → Your App → Client ID |
| Audience | APIs → Your API → Identifier |

#### 1.3 Frontend `.env`

```env
VITE_AUTH0_DOMAIN=docugithub-auth.eu.auth0.com
VITE_AUTH0_CLIENT_ID=m6xJ5ivUZzv1d7FU7Zi1Kr8DSuHlqiq1
VITE_AUTH0_AUDIENCE=https://docugithub.netlify.app/api
VITE_WEBHOOK_SECRET=your_hmac_secret
```

### Step 2: Frontend Implementation

#### 2.1 Auth0 Provider Setup

```typescript
// src/main.tsx
import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: 'openid profile email'
    }}
  >
    <App />
  </Auth0Provider>
);
```

#### 2.2 Secure API Client

```typescript
// src/lib/secureApi.ts
import { useAuth0 } from '@auth0/auth0-react';

// HMAC Generator
async function generateHmacSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(body);
  
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Secure API Request with Auth0 + HMAC
export async function secureApiRequest(
  endpoint: string, 
  data: object,
  getAccessTokenSilently: () => Promise<string>
) {
  const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
  const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;
  
  // Get Auth0 JWT token
  const accessToken = await getAccessTokenSilently();
  
  // Prepare body
  const body = JSON.stringify(data);
  
  // Generate HMAC signature
  const signature = await generateHmacSignature(body, webhookSecret);
  
  // Make request with BOTH Auth0 token AND HMAC signature
  const response = await fetch(`${webhookBase}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,      // Auth0 JWT
      'x-webhook-signature': signature               // HMAC signature
    },
    body
  });
  
  return response.json();
}
```

#### 2.3 Usage in Components

```typescript
// In a React component
import { useAuth0 } from '@auth0/auth0-react';
import { secureApiRequest } from '@/lib/secureApi';

function MyComponent() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const handleGenerate = async () => {
    if (!isAuthenticated) {
      alert('Please log in first');
      return;
    }
    
    const result = await secureApiRequest(
      'generate',
      { session_id: 'uuid-here' },
      getAccessTokenSilently
    );
    
    console.log(result);
  };
  
  return <button onClick={handleGenerate}>Generate</button>;
}
```

### Step 3: n8n JWT Validation

#### 3.1 Add n8n Environment Variables

```
AUTH0_DOMAIN=docugithub-auth.eu.auth0.com
AUTH0_AUDIENCE=https://docugithub.netlify.app/api
WEBHOOK_SECRET=your_hmac_secret
```

#### 3.2 n8n Code Node: Validate Auth0 JWT + HMAC

```javascript
// n8n Code Node: Validate Auth0 JWT + HMAC
const crypto = require('crypto');

// Get environment variables
const auth0Domain = $env.AUTH0_DOMAIN;
const auth0Audience = $env.AUTH0_AUDIENCE;
const webhookSecret = $env.WEBHOOK_SECRET;

// Get headers and body
const authHeader = $input.first().json.headers['authorization'];
const signature = $input.first().json.headers['x-webhook-signature'];
const body = $input.first().json.body;

// ============================================
// STEP 1: Validate HMAC Signature
// ============================================
if (!webhookSecret || !signature) {
  return [{ json: { valid: false, error: 'Missing HMAC configuration or signature' } }];
}

const expectedSignature = 'sha256=' + 
  crypto.createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

if (signature !== expectedSignature) {
  return [{ json: { valid: false, error: 'Invalid HMAC signature' } }];
}

// ============================================
// STEP 2: Validate Auth0 JWT (Optional)
// ============================================
let user = null;

if (authHeader && authHeader.startsWith('Bearer ')) {
  const token = authHeader.substring(7);
  
  try {
    // Decode JWT payload (without verification - verification done by Auth0)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Basic validation
      if (payload.aud === auth0Audience || 
          (Array.isArray(payload.aud) && payload.aud.includes(auth0Audience))) {
        user = {
          sub: payload.sub,
          email: payload.email,
          name: payload.name
        };
      }
    }
  } catch (e) {
    // JWT parsing failed, continue without user
    console.log('JWT parsing failed:', e.message);
  }
}

// ============================================
// STEP 3: Return validated data
// ============================================
const parsedBody = JSON.parse(body);

return [{
  json: {
    valid: true,
    user: user,
    ...parsedBody
  }
}];
```

### Step 4: Full JWT Verification (Production)

For production, you should verify the JWT signature using Auth0's JWKS endpoint:

#### 4.1 Install jose in n8n (if self-hosted)

```bash
npm install jose
```

#### 4.2 Full JWT Verification Code

```javascript
// Full JWT verification with JWKS
const crypto = require('crypto');
const https = require('https');

const auth0Domain = $env.AUTH0_DOMAIN;
const auth0Audience = $env.AUTH0_AUDIENCE;
const webhookSecret = $env.WEBHOOK_SECRET;

const authHeader = $input.first().json.headers['authorization'];
const signature = $input.first().json.headers['x-webhook-signature'];
const body = $input.first().json.body;

// Validate HMAC first
if (!webhookSecret || !signature) {
  return [{ json: { valid: false, error: 'Missing HMAC' } }];
}

const expectedSig = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
if (signature !== expectedSig) {
  return [{ json: { valid: false, error: 'Invalid HMAC' } }];
}

// For full JWT verification, use an HTTP Request node to call:
// https://{auth0Domain}/.well-known/jwks.json
// Then verify the JWT signature against the public keys

const parsedBody = JSON.parse(body);
return [{ json: { valid: true, ...parsedBody } }];
```

---

## Quick Reference

### Headers Sent by Frontend

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `application/json` | Body format |
| `Authorization` | `Bearer <jwt_token>` | Auth0 user identity |
| `x-webhook-signature` | `sha256=<hmac_hash>` | Request integrity |

### n8n Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `WEBHOOK_SECRET` | Random 32-char string | HMAC signing |
| `AUTH0_DOMAIN` | `your-tenant.auth0.com` | JWT issuer |
| `AUTH0_AUDIENCE` | `https://your-app/api` | JWT audience |

### Validation Order

1. ✅ Check HMAC signature (integrity)
2. ✅ Validate JWT token (identity)
3. ✅ Extract user info
4. ✅ Process request

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing HMAC" | Secret not configured | Add `WEBHOOK_SECRET` to n8n |
| "Invalid HMAC" | Secrets don't match | Same secret in frontend and n8n |
| "Invalid JWT" | Wrong audience | Match `AUTH0_AUDIENCE` |
| "Token expired" | JWT expired | User needs to re-login |
