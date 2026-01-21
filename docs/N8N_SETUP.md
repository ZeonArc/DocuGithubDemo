# n8n Workflow Setup Guide

This guide explains how to set up the DocuGithub n8n workflow with Auth0 JWT validation and LangChain Gemini integration.

## Prerequisites

- **n8n** v2.3+ running locally or via Docker
- **Auth0** account with an API configured
- **GitHub OAuth App** for repository access
- **Google Gemini API Key** from [AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase** project with `documentation_sessions` table

---

## Quick Start

### 1. Start n8n

**Docker:**
```bash
docker run -it --rm \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

**npm:**
```bash
npx n8n
```

Access n8n at: `http://localhost:5678`

---

### 2. Create Credentials

#### Google Gemini (PaLM) API
1. Go to **Settings → Credentials → Add Credential**
2. Search: **Google Gemini(PaLM) Api**
3. Enter your API key from [AI Studio](https://aistudio.google.com/app/apikey)
4. Save as "Google Gemini(PaLM) Api account"

#### GitHub OAuth2
1. Create a GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
   - Authorization callback URL: `http://localhost:5678/rest/oauth2-credential/callback`
2. In n8n: **Settings → Credentials → Add Credential → GitHub OAuth2 API**
3. Enter Client ID and Client Secret
4. Click **Connect** to authorize

#### Supabase
1. In n8n: **Settings → Credentials → Add Credential → Supabase API**
2. Enter:
   - **Host**: `https://your-project.supabase.co`
   - **Service Role Key**: From Supabase Dashboard → Settings → API

---

### 3. Import Workflow

1. In n8n: **Workflows → Import from File**
2. Select: `n8n/docugithub_langchain.json`
3. The workflow will open in the editor

---

### 4. Configure the Workflow

#### Replace Auth0 Domain
Find and replace in all `Auth0: Verify` nodes:
```
YOUR_AUTH0_TENANT.auth0.com → your-tenant.auth0.com
```

#### Update Credential References
Click each node and select your credentials:
- **Gemini nodes** → Select your "Google Gemini(PaLM) Api account"
- **GitHub nodes** → Select your "GitHub OAuth2"
- **Supabase nodes** → Select your "Supabase"

#### Verify AI Connections
Ensure each `Gemini` node connects to its `LLM Chain` with a **purple AI line**:
- `Gemini (Analyze)` → `LLM Chain: Analyze`
- `Gemini (Generate)` → `LLM Chain: Generate`
- `Gemini (Edit)` → `LLM Chain: Edit`

---

### 5. Activate & Get Webhook URLs

1. Toggle the workflow to **Active**
2. Open each Webhook node to see your URLs:
   - `/webhook/analyze`
   - `/webhook/generate`
   - `/webhook/publish`
   - `/webhook/ai-edit`

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANALYZE PIPELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│ Webhook → Auth0 → IF → Supabase → GitHub → Zip → Extract → Filter  │
│                                                          ↓          │
│                     Respond ← Supabase ← LLM Chain ← Gemini (AI)    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         GENERATE PIPELINE                            │
├─────────────────────────────────────────────────────────────────────┤
│ Webhook → Auth0 → IF → Supabase (Get) → LLM Chain ← Gemini (AI)     │
│                                              ↓                       │
│                               Respond ← Supabase (Save)              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         PUBLISH PIPELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│ Webhook → Auth0 → IF → GitHub (Check) → IF (Exists?)                │
│                                          ↓         ↓                │
│                                      Update     Create              │
│                                          ↓         ↓                │
│                               Respond ← Supabase (Merge)            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         AI EDIT PIPELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│ Webhook → Auth0 → IF → LLM Chain ← Gemini (AI) → Respond            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Nodes Used

| Node Type | Purpose |
|-----------|---------|
| `Webhook` | Receive HTTP POST requests |
| `HTTP Request` | Auth0 /userinfo validation |
| `IF` | Route based on auth validity |
| `Respond to Webhook` | Return JSON responses |
| `Supabase` | Database operations |
| `GitHub` | Repository and file operations |
| `HTTP Request` | Download repo zip |
| `Compression` | Extract zip files |
| `Code` | Filter and process files |
| `Basic LLM Chain` | LangChain processing |
| `Google Gemini Chat Model` | AI language model |

---

## Testing

### Test with curl

```bash
# Get Auth0 token first
TOKEN="your_auth0_access_token"

# Test Analyze
curl -X POST http://localhost:5678/webhook/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sessionId": "uuid", "owner": "username", "repo": "reponame"}'

# Test Generate
curl -X POST http://localhost:5678/webhook/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sessionId": "uuid"}'

# Test Publish
curl -X POST http://localhost:5678/webhook/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sessionId": "uuid", "owner": "username", "repo": "reponame", "content": "# README"}'

# Test AI Edit
curl -X POST http://localhost:5678/webhook/ai-edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"selectedText": "Hello world", "instruction": "Make it formal"}'
```

---

## Troubleshooting

### "Node type not found" Error
Ensure you're using n8n v2.3+. The LangChain nodes (`@n8n/n8n-nodes-langchain.*`) are included by default.

### Gemini Not Responding
1. Verify your API key is correct
2. Check the AI connection (purple line) from Gemini to LLM Chain
3. Test with a simple chat workflow first

### 401 Unauthorized
1. Verify Auth0 domain is correctly set
2. Check that the token is valid and not expired
3. Test the token at `https://your-tenant.auth0.com/userinfo`

### GitHub Operations Failing
1. Ensure OAuth2 credential is connected
2. Verify the user has write access to the repository
3. Check the owner/repo values in the request

---

## Available Workflow Files

| File | Description |
|------|-------------|
| `docugithub_langchain.json` | **Recommended** - LangChain + Gemini |
| `docugithub_v2.json` | Alternative with official Gemini node |
| `docugithub_builtin_workflow.json` | HTTP Request fallback |

---

## Frontend Configuration

Update your frontend `.env`:

```env
VITE_N8N_WEBHOOK_BASE=http://localhost:5678/webhook
```

The frontend will automatically send the Auth0 token in the `Authorization` header.
