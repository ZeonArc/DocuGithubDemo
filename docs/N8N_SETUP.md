# n8n Setup Guide — Built-in Nodes Only

This guide uses **ONLY n8n built-in nodes** (no custom/community plugins).

---

## 📋 Prerequisites

- n8n installed (Docker or npm)
- GitHub account
- Google AI Studio account (for Gemini API key)
- Supabase project

---

## 🚀 Step 1: Start n8n

```bash
# Docker (recommended)
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

# Or npm
npm install n8n -g && n8n start
```

Open: `http://localhost:5678`

---

## 🔐 Step 2: Create GitHub OAuth App

### 2.1 Create OAuth App on GitHub

1. Go to **[GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)**
2. Click **New OAuth App**
3. Fill in:

| Field | Value |
|-------|-------|
| Application name | `DocuGithub n8n` |
| Homepage URL | `http://localhost:5678` |
| Authorization callback URL | `http://localhost:5678/rest/oauth2-credential/callback` |

4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** → Copy it

### 2.2 Create GitHub OAuth2 Credential in n8n

1. In n8n: **Settings → Credentials → Add Credential**
2. Search: **GitHub OAuth2 API**
3. Fill in:
   - **Client ID**: (from GitHub)
   - **Client Secret**: (from GitHub)
4. Click **Connect** — A GitHub authorization page opens
5. Click **Authorize** → You'll be redirected back to n8n
6. Click **Save**

> ✅ Now the credential shows "Connected" — n8n has your GitHub access!

---

## 🔑 Step 3: Create Gemini API Credential

### 3.1 Get Gemini API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Click **Create API Key**
3. Copy the key

### 3.2 Create Query Auth Credential in n8n

1. In n8n: **Settings → Credentials → Add Credential**
2. Search: **Query Auth**
3. Fill in:
   - **Name**: `key`
   - **Value**: `YOUR_GEMINI_API_KEY`
4. **Save** as "Gemini API Key"

---

## 🗄️ Step 4: Create Supabase Credential

1. In n8n: **Settings → Credentials → Add Credential**
2. Search: **Supabase API**
3. Fill in:
   - **Host**: `https://your-project.supabase.co`
   - **Service Role Key**: From Supabase Dashboard → Settings → API → `service_role`

> ⚠️ Use `service_role` key (bypasses RLS for backend operations)

---

## 📥 Step 5: Import Workflow

1. Download `n8n/n8n_workflow_complete.json` from your project
2. In n8n: **Workflows → Import from File**
3. Select the JSON
4. Click **Import**

---

## ✏️ Step 6: Update Credential References

After import, each node shows red credential errors. Fix each:

1. Click on each **GitHub** node → Select your "GitHub OAuth2" credential
2. Click on each **Gemini** (HTTP Request) node → Select your "Gemini API Key" credential
3. Click on each **Supabase** node → Select your "Supabase" credential

---

## ⚡ Step 7: Activate & Get Webhook URLs

1. Toggle workflow to **Active** (top-right)
2. Click each Webhook node and copy the **Webhook URL**:
   - `/webhook/analyze`
   - `/webhook/generate`
   - `/webhook/publish`
   - `/webhook/ai-edit`

---

## 🧪 Step 8: Test Webhooks

```bash
# Test Analyze
curl -X POST http://localhost:5678/webhook/analyze \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","owner":"facebook","repo":"react"}'

# Test Generate
curl -X POST http://localhost:5678/webhook/generate \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123"}'
```

---

## 🔄 Workflow Architecture

```
ANALYZE:  Webhook → Supabase → GitHub → Zip → Extract → Gemini → Supabase → Respond
GENERATE: Webhook → Supabase × 2 → Gemini → Supabase → Respond
PUBLISH:  Webhook → GitHub Check → GitHub Update → Supabase → Respond
AI-EDIT:  Webhook → Gemini → Respond
```

---

## 🛠️ Nodes Used (All Built-in)

| Node Type | Purpose |
|-----------|---------|
| `n8n-nodes-base.webhook` | Receive HTTP requests |
| `n8n-nodes-base.respondToWebhook` | Return HTTP responses |
| `n8n-nodes-base.httpRequest` | Call Gemini API |
| `n8n-nodes-base.github` | GitHub OAuth operations |
| `n8n-nodes-base.supabase` | Database operations |
| `n8n-nodes-base.compression` | Extract zip files |
| `n8n-nodes-base.code` | Transform data |

**No community/custom nodes required!**

---

## ❗ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Custom plugin" error | Re-download the latest JSON from this repo |
| GitHub auth fails | Re-create OAuth app with correct callback URL |
| Gemini 401 error | Check API key in Query Auth credential |
| Supabase errors | Use `service_role` key, ensure tables exist |

---

## 🧪 Test Mode for Frontend

Since you haven't deployed yet, use this test configuration:

### Frontend `.env` (Development)

```env
VITE_N8N_WEBHOOK_BASE=http://localhost:5678/webhook
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
```

### Bypass Auth0 for Testing

Set these in your frontend code temporarily:

```tsx
// In src/pages/Landing.tsx - add this for testing
const SKIP_AUTH = true; // Set to false for production

// When SKIP_AUTH is true, go directly to manual URL entry
```

This allows you to test the full flow without Auth0 configuration.
