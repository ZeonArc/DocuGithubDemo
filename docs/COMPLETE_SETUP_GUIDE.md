# Complete Auth0 + n8n Setup Guide

A detailed step-by-step guide for setting up Auth0 authentication with n8n workflows for DocuGithub.

---

## Table of Contents

1. [Auth0 Setup](#part-1-auth0-setup)
2. [n8n Setup](#part-2-n8n-setup)
3. [Frontend Configuration](#part-3-frontend-configuration)
4. [Testing](#part-4-testing)

---

# Part 1: Auth0 Setup

## Step 1.1: Create Auth0 Account

1. Go to [https://auth0.com](https://auth0.com)
2. Click **Sign Up**
3. Create your account (you can use GitHub, Google, or email)
4. Select your **region** (choose closest to your users)
5. Complete the onboarding wizard

---

## Step 1.2: Create Application

1. In Auth0 Dashboard, go to **Applications → Applications**
2. Click **+ Create Application**
3. Fill in:
   - **Name**: `DocuGithub`
   - **Type**: Select **Single Page Application**
4. Click **Create**

### Configure Application Settings

1. Click on your new application
2. Go to **Settings** tab
3. Note down these values:
   - **Domain**: `your-tenant.auth0.com` (e.g., `dev-abc123.us.auth0.com`)
   - **Client ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. Scroll down and configure:

   **Allowed Callback URLs:**
   ```
   http://localhost:5173,http://localhost:5173/callback
   ```

   **Allowed Logout URLs:**
   ```
   http://localhost:5173
   ```

   **Allowed Web Origins:**
   ```
   http://localhost:5173
   ```

5. Click **Save Changes**

---

## Step 1.3: Create API

1. Go to **Applications → APIs**
2. Click **+ Create API**
3. Fill in:
   - **Name**: `DocuGithub API`
   - **Identifier**: `https://docugithub.api` (this is your audience)
   - **Signing Algorithm**: `RS256`
4. Click **Create**

---

## Step 1.4: Enable GitHub Social Connection

1. Go to **Authentication → Social**
2. Find **GitHub** and click on it
3. Toggle to **Enable**

### Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name**: `DocuGithub Auth0`
   - **Homepage URL**: `https://your-tenant.auth0.com`
   - **Authorization callback URL**: `https://your-tenant.auth0.com/login/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Add to Auth0

1. Back in Auth0 GitHub connection settings
2. Paste:
   - **Client ID**: (from GitHub)
   - **Client Secret**: (from GitHub)
3. Under **Permissions**, enable:
   - ✅ `read:user`
   - ✅ `user:email`
   - ✅ `repo` (for write access)
4. Click **Save**

---

## Step 1.5: Create Action to Expose GitHub Token

This step exposes the GitHub access token in Auth0's JWT so we can use it in n8n.

1. Go to **Actions → Library**
2. Click **+ Build Custom**
3. Fill in:
   - **Name**: `Add GitHub Token`
   - **Trigger**: `Login / Post Login`
4. Click **Create**

5. Replace the code with:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  // Only process GitHub logins
  if (event.connection.strategy !== 'github') {
    return;
  }

  // Get GitHub identity
  const githubIdentity = event.user.identities?.find(
    identity => identity.provider === 'github'
  );

  if (!githubIdentity || !githubIdentity.access_token) {
    console.log('No GitHub access token found');
    return;
  }

  const namespace = 'https://docugithub.dev';
  
  // Add GitHub token to ID token and access token
  api.idToken.setCustomClaim(`${namespace}/github_token`, githubIdentity.access_token);
  api.accessToken.setCustomClaim(`${namespace}/github_token`, githubIdentity.access_token);
  
  // Add GitHub username
  if (githubIdentity.profileData?.nickname) {
    api.idToken.setCustomClaim(`${namespace}/github_username`, githubIdentity.profileData.nickname);
    api.accessToken.setCustomClaim(`${namespace}/github_username`, githubIdentity.profileData.nickname);
  }
};
```

6. Click **Deploy**

### Add Action to Login Flow

1. Go to **Actions → Flows → Login**
2. Drag **Add GitHub Token** from the right panel to the flow
3. Click **Apply**

---

# Part 2: n8n Setup

## Step 2.1: Install and Start n8n

### Option A: Docker (Recommended)

```bash
docker run -it --rm \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### Option B: npm

```bash
npx n8n
```

Access n8n at: **http://localhost:5678**

---

## Step 2.2: Create Credentials

### Google Gemini (PaLM) API

1. Get API key from [AI Studio](https://aistudio.google.com/app/apikey)
2. In n8n: **Settings → Credentials → Add Credential**
3. Search: **Google Gemini(PaLM) Api**
4. Enter your API key
5. Save as `Google Gemini(PaLM) Api account`

### GitHub OAuth2

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `n8n DocuGithub`
   - **Homepage URL**: `http://localhost:5678`
   - **Authorization callback URL**: `http://localhost:5678/rest/oauth2-credential/callback`
4. Click **Register application**
5. Copy **Client ID** and generate **Client Secret**

6. In n8n: **Settings → Credentials → Add Credential**
7. Search: **GitHub OAuth2 API**
8. Enter Client ID and Client Secret
9. Click **Connect** to authorize
10. Save as `GitHub OAuth2`

### Supabase

1. In Supabase Dashboard: **Settings → API**
2. Copy:
   - **URL**: `https://your-project.supabase.co`
   - **Service Role Key**: (under `service_role` secret)

3. In n8n: **Settings → Credentials → Add Credential**
4. Search: **Supabase API**
5. Enter:
   - **Host**: Your Supabase URL
   - **Service Role Key**: Your service role key
6. Save as `Supabase`

---

## Step 2.3: Import Workflow

1. In n8n: **Workflows → Import from File**
2. Navigate to your project and select:
   ```
   n8n/docugithub_langchain.json
   ```
3. The workflow will open in the editor

---

## Step 2.4: Configure Auth0 Domain

The workflow has 4 `Auth0: Verify` nodes that need your Auth0 domain.

### Method 1: Edit in n8n UI

1. Click on each `Auth0: Verify` node
2. Change the URL from:
   ```
   https://YOUR_AUTH0_TENANT.auth0.com/userinfo
   ```
   To your actual domain:
   ```
   https://dev-abc123.us.auth0.com/userinfo
   ```

### Method 2: Find and Replace in JSON

Before importing, open `docugithub_langchain.json` and replace:
```
YOUR_AUTH0_TENANT.auth0.com
```
With your actual Auth0 domain.

---

## Step 2.5: Connect Credentials

For each node type, click and select your credential:

| Node | Credential |
|------|------------|
| `Gemini (Analyze)` | Google Gemini(PaLM) Api account |
| `Gemini (Generate)` | Google Gemini(PaLM) Api account |
| `Gemini (Edit)` | Google Gemini(PaLM) Api account |
| `GitHub: Get Repo` | GitHub OAuth2 |
| `GitHub: Check README` | GitHub OAuth2 |
| `GitHub: Update` | GitHub OAuth2 |
| `GitHub: Create` | GitHub OAuth2 |
| `Download Zip` | GitHub OAuth2 |
| `Supabase: Set Status` | Supabase |
| `Supabase: Get Session` | Supabase |
| `Supabase: Save Analysis` | Supabase |
| `Supabase: Save Doc` | Supabase |
| `Supabase: Published` | Supabase |

---

## Step 2.6: Verify AI Connections

Each Gemini node must connect to its LLM Chain with a **purple AI line**.

1. Click **Gemini (Analyze)** node
2. Drag from its output to the AI input (purple dot) on **LLM Chain: Analyze**
3. Repeat for:
   - `Gemini (Generate)` → `LLM Chain: Generate`
   - `Gemini (Edit)` → `LLM Chain: Edit`

---

## Step 2.7: Activate Workflow

1. Toggle the workflow to **Active** (top right)
2. Click on any Webhook node to see the URL
3. Note down your webhook URLs:
   - `http://localhost:5678/webhook/analyze`
   - `http://localhost:5678/webhook/generate`
   - `http://localhost:5678/webhook/publish`
   - `http://localhost:5678/webhook/ai-edit`

---

# Part 3: Frontend Configuration

## Step 3.1: Update .env File

Create or update `.env` in your project root:

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://docugithub.api

# n8n Configuration
VITE_N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Step 3.2: Restart Frontend

```bash
npm run dev
```

---

# Part 4: Testing

## Step 4.1: Get Auth0 Token

### Option A: From Browser

1. Open your frontend app
2. Sign in with GitHub
3. Open browser DevTools → Network tab
4. Look for API calls with `Authorization: Bearer xxx`
5. Copy the token

### Option B: Auth0 Test Token

1. Go to **Applications → APIs → DocuGithub API**
2. Click **Test** tab
3. Copy the test token

---

## Step 4.2: Test Webhooks with curl

```bash
# Set your token
TOKEN="your_access_token_here"

# Test Auth0 validation
curl -X GET "https://your-tenant.auth0.com/userinfo" \
  -H "Authorization: Bearer $TOKEN"

# Should return user info if valid

# Test Analyze endpoint
curl -X POST http://localhost:5678/webhook/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sessionId": "test-uuid",
    "owner": "your-github-username",
    "repo": "your-repo-name"
  }'

# Test AI Edit endpoint
curl -X POST http://localhost:5678/webhook/ai-edit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "selectedText": "Hello world",
    "instruction": "Make it more formal"
  }'
```

---

## Step 4.3: Verify in n8n

1. Open n8n at http://localhost:5678
2. Click on **Executions** tab
3. You should see your test executions
4. Check for any errors in red

---

# Troubleshooting

## Auth0 Issues

| Problem | Solution |
|---------|----------|
| "Unauthorized" error | Check Auth0 domain is correct in workflow |
| Token not working | Verify token at `https://your-tenant.auth0.com/userinfo` |
| GitHub login not appearing | Ensure GitHub connection is enabled in Auth0 |

## n8n Issues

| Problem | Solution |
|---------|----------|
| "Node type not found" | Ensure n8n v2.3+ is installed |
| Gemini not responding | Check API key and AI connections (purple lines) |
| GitHub 401 | Re-authorize GitHub OAuth2 credential |

## Credential Issues

| Problem | Solution |
|---------|----------|
| Credentials not showing | Click the node and select from dropdown |
| OAuth2 expired | Delete and recreate the credential |
| Supabase error | Verify service role key (not anon key) |

---

# Summary Checklist

## Auth0
- [ ] Account created
- [ ] Application created (Single Page App)
- [ ] API created with identifier
- [ ] GitHub social connection enabled
- [ ] GitHub OAuth app created
- [ ] Post-login action deployed
- [ ] Action added to Login flow

## n8n
- [ ] n8n running on port 5678
- [ ] Google Gemini credential created
- [ ] GitHub OAuth2 credential created
- [ ] Supabase credential created
- [ ] Workflow imported
- [ ] Auth0 domain replaced in 4 nodes
- [ ] Credentials connected to nodes
- [ ] AI connections verified (purple lines)
- [ ] Workflow activated

## Frontend
- [ ] .env configured with Auth0 values
- [ ] .env configured with n8n webhook URL
- [ ] Application restarted
