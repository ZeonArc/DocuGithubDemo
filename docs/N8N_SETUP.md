# DocuGithub n8n Complete Setup Guide

A step-by-step guide to configure DocuGithub's n8n workflows for production.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **n8n** | Self-hosted or n8n Cloud (v1.20+) |
| **Supabase** | Account with schema deployed |
| **Google AI Studio** | Gemini API key |
| **GitHub** | Personal Access Token |

---

## Supabase Setup in n8n (Detailed)

### Step A: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy these values:

| Value | Location |
|-------|----------|
| **Project URL** | `https://xxxxx.supabase.co` |
| **anon (public) key** | For frontend only |
| **service_role key** | For n8n (⚠️ Keep secret!) |

### Step B: Create Supabase Credential in n8n

1. In n8n, go to **Credentials → Add Credential**
2. Search for **Supabase API**
3. Fill in:

```
Name: Supabase (or any name you prefer)
Host: https://utubdvdpyqxtfuxkfamn.supabase.co
Service Role Key: your_service_role_key_here
```

4. Click **Save**
5. Note the credential ID from the URL (e.g., `abc123`)

### Step C: Run the SQL Schema

Before using the workflows, run the schema in Supabase:

1. Go to **Supabase Dashboard → SQL Editor**
2. Create a new query
3. Paste the contents of `supabase/schema.sql`
4. Click **Run**

This creates:
- `users` table
- `sessions` table
- `readme_versions` table
- RLS policies
- Helper functions

### Step D: Configure Supabase Nodes in Workflows

Each workflow has Supabase nodes that need credential configuration:

#### Workflow 1: Session Initialize
| Node Name | Operation | Table |
|-----------|-----------|-------|
| Create Session in Supabase | CREATE | `sessions` |

#### Workflow 2: Repository Analysis
| Node Name | Operation | Table |
|-----------|-----------|-------|
| Fetch Session | GET | `sessions` |
| Update Session Analysis | UPDATE | `sessions` |

#### Workflow 3: User Preferences
| Node Name | Operation | Table |
|-----------|-----------|-------|
| Check Session Exists | GET | `sessions` |
| Update Session Preferences | UPDATE | `sessions` |

#### Workflow 4: README Generate
| Node Name | Operation | Table |
|-----------|-----------|-------|
| Fetch Session | GET | `sessions` |
| Create Version Record | CREATE | `readme_versions` |
| Update Session | UPDATE | `sessions` |

#### Workflow 5: Chat Revision
| Node Name | Operation | Table |
|-----------|-----------|-------|
| Fetch Session | GET | `sessions` |
| Create New Version | CREATE | `readme_versions` |
| Update Session Version | UPDATE | `sessions` |

#### Workflow 6: GitHub Push
| Node Name | Operation | Table |
|-----------|-----------|-------|
| Fetch Session | GET | `sessions` |
| Fetch User GitHub Token | GET | `users` |
| Update Session - Pushed | UPDATE | `sessions` |

### Step E: Update Supabase Nodes

For EACH Supabase node in each workflow:

1. **Double-click** the node
2. Under **Credential to connect with**, click the dropdown
3. Select your **Supabase** credential
4. Verify the table name matches (e.g., `sessions`)
5. Click **Save**

### Step F: Supabase Node Settings Reference

**GET (Read) Operation:**
```
Operation: Get
Table: sessions
Filters:
  - Key: id
  - Value: {{ $json.session_id }}
```

**CREATE (Insert) Operation:**
```
Operation: Create
Table: sessions
Data to Send: Define Below
Fields:
  - id: {{ $json.session_id }}
  - repo_url: {{ $json.repo_url }}
  - status: initialized
```

**UPDATE Operation:**
```
Operation: Update
Table: sessions
Filters:
  - Key: id
  - Value: {{ $json.session_id }}
Data to Send: Define Below
Fields:
  - status: analyzed
  - updated_at: {{ new Date().toISOString() }}
```

### Step G: Test Supabase Connection

1. Open any workflow with a Supabase node
2. Click on a Supabase node
3. Click **Test step**
4. If successful, you'll see data from the table
5. If error, check:
   - Credential host URL (no trailing slash)
   - Service role key is correct
   - Table exists in Supabase

---

## Step 1: Create n8n Credentials

### 1.1 Supabase API

1. Go to **Credentials → Add Credential → Supabase API**
2. Fill in:
   - **Host**: `https://your-project.supabase.co`
   - **Service Role Key**: From Supabase Dashboard → Settings → API → `service_role` key
3. Save and note the **Credential ID** (shown in URL)

### 1.2 GitHub Token (HTTP Header Auth)

1. Go to **Credentials → Add Credential → Header Auth**
2. Fill in:
   - **Name**: `GitHub Token`
   - **Name** (header): `Authorization`
   - **Value**: `Bearer ghp_your_personal_access_token`
3. Save and note the **Credential ID**

> **GitHub Token Scopes**: `repo`, `read:user`

### 1.3 Google Gemini (PaLM API)

1. Go to **Credentials → Add Credential → Google PaLM API**
2. Fill in:
   - **API Key**: From [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Save and note the **Credential ID**

---

## Step 2: Set Environment Variable

In n8n Settings → Variables (or docker-compose):

```bash
WEBHOOK_SECRET=your_random_32_character_secret
```

Generate a secret:
```bash
openssl rand -hex 32
```

> **Important**: This must match `VITE_WEBHOOK_SECRET` in your frontend `.env`

---

## Step 3: Import Workflows

Import each file from `n8n/workflows/` in order:

| File | Endpoint |
|------|----------|
| `1-session-initialize.json` | `/webhook/initialize` |
| `2-repository-analysis.json` | `/webhook/analyze` |
| `3-user-preferences.json` | `/webhook/preferences` |
| `4-readme-generate.json` | `/webhook/generate` |
| `5-chat-revision.json` | `/webhook/chat` |
| `6-github-push.json` | `/webhook/push` |

**To import:**
1. Click **Add Workflow** → Import from File
2. Select the JSON file
3. Save the workflow

---

## Step 4: Update Credential IDs

After importing, each workflow has placeholder credential IDs. Update them:

### For each Supabase node:
1. Double-click the node
2. Under **Credential to connect with**, select your Supabase credential

### For each HTTP Request node (GitHub):
1. Double-click the node
2. Under **Credential to connect with**, select your GitHub Token

### For each Gemini node:
1. Double-click the node (purple AI nodes)
2. Under **Credential to connect with**, select your Google PaLM API

---

## Step 5: Verify AI Connections

For workflows 2, 4, 5 (with LangChain):

1. Open the workflow
2. Look for the **purple AI connection lines**
3. Ensure `Gemini` node connects to `LLM Chain` node via the AI input

If missing:
1. Click the Gemini node output (purple dot)
2. Drag to the LLM Chain's AI input (left side purple dot)

---

## Step 6: Activate Workflows

For each workflow:
1. Open the workflow
2. Toggle the **Active** switch (top right)
3. Verify the webhook URL appears

---

## Step 7: Get Webhook URLs

After activation, get your webhook base URL:

**n8n Cloud:**
```
https://your-instance.app.n8n.cloud/webhook
```

**Self-hosted:**
```
https://your-domain.com/webhook
```

---

## Step 8: Configure Frontend

In your frontend `.env` or Netlify environment variables:

```env
VITE_N8N_WEBHOOK_BASE=https://your-n8n-instance.com/webhook
VITE_WEBHOOK_SECRET=same_as_n8n_WEBHOOK_SECRET
```

---

## Workflow Reference

### 1. Session Initialize (`/webhook/initialize`)

**Input:**
```json
{
  "repo_url": "https://github.com/owner/repo",
  "session_id": "uuid-from-frontend"
}
```

**Output:**
```json
{
  "success": true,
  "session_id": "uuid",
  "repo_info": { "owner": "...", "repo": "...", "...": "..." }
}
```

---

### 2. Repository Analysis (`/webhook/analyze`)

**Input:**
```json
{
  "session_id": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "analysis": { "project_type": "...", "tech_stack": [...], "...": "..." }
}
```

---

### 3. User Preferences (`/webhook/preferences`)

**Input:**
```json
{
  "session_id": "uuid",
  "preferences": {
    "tone": "professional",
    "sections": ["overview", "installation"],
    "badges": ["license", "version"],
    "include_toc": true,
    "emoji_style": "minimal"
  }
}
```

---

### 4. README Generate (`/webhook/generate`)

**Input:**
```json
{
  "session_id": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "readme": "# Project\n...",
  "version": 1
}
```

---

### 5. Chat Revision (`/webhook/chat`)

**Input:**
```json
{
  "session_id": "uuid",
  "message": "Add a Docker section",
  "current_readme": "# Project\n..."
}
```

**Output:**
```json
{
  "success": true,
  "revised_readme": "# Project\n...",
  "version": 2,
  "changes_summary": "Added Docker section"
}
```

---

### 6. GitHub Push (`/webhook/push`)

**Input:**
```json
{
  "session_id": "uuid",
  "readme_content": "# Project\n... (optional)",
  "commit_message": "docs: Update README (optional)"
}
```

**Output:**
```json
{
  "success": true,
  "commit_sha": "abc123...",
  "commit_url": "https://github.com/..."
}
```

---

## Troubleshooting

### "Invalid Signature" Error
- Check `WEBHOOK_SECRET` matches in n8n and frontend
- Ensure signature is sent as `x-webhook-signature` header

### "Credential not found" Error
- Re-select credentials in each node
- Verify credential IDs exist

### "No prompt specified" Error
- Check LLM Chain nodes have `text` parameter
- Ensure typeVersion is `1.4`

### Gemini Rate Limit
- Check [Google AI Studio](https://aistudio.google.com) for quota
- Add delays between requests if needed

---

## Security Notes

1. **Never expose** `WEBHOOK_SECRET` or `service_role` key in frontend
2. Use HTTPS for production n8n
3. Consider IP allowlisting for webhooks
4. Store GitHub tokens encrypted in Supabase

---

## Testing

Test the initialize endpoint:

```bash
# Generate signature
SECRET="your_webhook_secret"
BODY='{"repo_url":"https://github.com/facebook/react","session_id":"test-123"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Make request
curl -X POST https://your-n8n.com/webhook/initialize \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$SIGNATURE" \
  -d "$BODY"
```

---

## Next Steps

1. ✅ Import all 6 workflows
2. ✅ Update credential IDs
3. ✅ Set `WEBHOOK_SECRET`
4. ✅ Activate workflows
5. ✅ Update frontend `.env`
6. ✅ Test endpoints
7. 🚀 Deploy!
