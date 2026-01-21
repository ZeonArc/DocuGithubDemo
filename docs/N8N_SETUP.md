# DocuGithub n8n Setup Guide

## Overview

DocuGithub uses **6 separate n8n workflows** for modular architecture:

| Workflow | Endpoint | Purpose |
|----------|----------|---------|
| 1-session-initialize | `/webhook/initialize` | Create session |
| 2-repository-analysis | `/webhook/analyze` | AI analysis |
| 3-user-preferences | `/webhook/preferences` | Set preferences |
| 4-readme-generate | `/webhook/generate` | Generate README |
| 5-chat-revision | `/webhook/chat` | AI revisions |
| 6-github-push | `/webhook/push` | Push to GitHub |

---

## Prerequisites

1. **n8n** (self-hosted or cloud) - v2.0+
2. **Supabase** account with schema deployed
3. **Google Gemini API** key
4. **GitHub Token** (Personal Access Token)

---

## Step 1: Set Environment Variables

In n8n Settings → Variables, add:

```
WEBHOOK_SECRET = <random-32-char-string>
```

Generate with:
```bash
openssl rand -hex 32
```

---

## Step 2: Create Credentials

### Supabase API
- **Name**: Supabase
- **Host**: `https://your-project.supabase.co`
- **Service Role Key**: (from Supabase dashboard)

### GitHub Token (HTTP Header Auth)
- **Name**: GitHub Token
- **Header Name**: Authorization
- **Header Value**: `Bearer ghp_your_token_here`

### Google Gemini (PaLM API)
- **Name**: Google Gemini
- **API Key**: (from Google AI Studio)

---

## Step 3: Import Workflows

Import each file from `n8n/workflows/`:

1. `1-session-initialize.json`
2. `2-repository-analysis.json`
3. `3-user-preferences.json`
4. `4-readme-generate.json`
5. `5-chat-revision.json`
6. `6-github-push.json`

---

## Step 4: Configure Credentials

In each workflow, update the placeholder credential IDs:

| Placeholder | Replace With |
|-------------|--------------|
| `YOUR_SUPABASE_ID` | Your Supabase credential ID |
| `YOUR_GITHUB_TOKEN_ID` | Your GitHub Token credential ID |
| `YOUR_GEMINI_ID` | Your Gemini credential ID |

---

## Step 5: Verify AI Connections

For workflows 2, 4, 5 (with Gemini):
- Ensure purple AI lines connect `Gemini` node → `LLM Chain` node
- If missing, drag from Gemini's output to LLM Chain's AI input

---

## Step 6: Activate Workflows

Toggle each workflow to **Active**.

---

## Testing

### Test Initialize Endpoint

```bash
curl -X POST http://localhost:5678/webhook/initialize \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$(echo -n '{"repo_url":"https://github.com/user/repo","session_id":"test-123"}' | openssl dgst -sha256 -hmac 'YOUR_WEBHOOK_SECRET' | cut -d' ' -f2)" \
  -d '{"repo_url":"https://github.com/user/repo","session_id":"test-123"}'
```

---

## Frontend Configuration

In your frontend `.env`:

```env
VITE_N8N_WEBHOOK_BASE=http://localhost:5678/webhook
VITE_WEBHOOK_SECRET=<same-as-n8n-secret>
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Troubleshooting

### "Invalid Signature" Error
- Verify `WEBHOOK_SECRET` matches in n8n and frontend
- Check signature is being sent as `x-webhook-signature` header

### "No prompt specified" Error
- Ensure LLM Chain nodes have `text` parameter (not `prompt`)
- Verify typeVersion is `1.4` for LLM Chain nodes

### Gemini Rate Limit
- Check Google AI Studio for quota
- Consider adding retry logic or delays
