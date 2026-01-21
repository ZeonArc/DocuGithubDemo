# n8n Supabase Node Configuration Reference

Complete field configurations for all Supabase nodes in DocuGithub workflows.

---

## Workflow 1: Session Initialize

### Node: Create Session in Supabase

**Settings:**
- **Operation:** Create
- **Table:** `sessions`
- **Data to Send:** Define Below for Each Column

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `id` | `={{ $json.session_id }}` |
| `repo_url` | `={{ $json.repo_url }}` |
| `repo_owner` | `={{ $json.owner }}` |
| `repo_name` | `={{ $json.repo }}` |
| `default_branch` | `={{ $json.default_branch || 'main' }}` |
| `status` | `initialized` |
| `created_at` | `={{ new Date().toISOString() }}` |
| `updated_at` | `={{ new Date().toISOString() }}` |

---

## Workflow 2: Repository Analysis

### Node: Fetch Session

**Settings:**
- **Operation:** Get
- **Table:** `sessions`
- **Select:** `*`

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

---

### Node: Update Session Analysis

**Settings:**
- **Operation:** Update
- **Table:** `sessions`
- **Data to Send:** Define Below for Each Column

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `analysis` | `={{ JSON.stringify($json.analysis) }}` |
| `status` | `analyzed` |
| `updated_at` | `={{ new Date().toISOString() }}` |

---

## Workflow 3: User Preferences

### Node: Check Session Exists

**Settings:**
- **Operation:** Get
- **Table:** `sessions`
- **Select:** `id, status`

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

---

### Node: Update Session Preferences

**Settings:**
- **Operation:** Update
- **Table:** `sessions`
- **Data to Send:** Define Below for Each Column

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `preferences` | `={{ JSON.stringify($json.preferences) }}` |
| `status` | `preferences_set` |
| `updated_at` | `={{ new Date().toISOString() }}` |

---

## Workflow 4: README Generate

### Node: Fetch Session

**Settings:**
- **Operation:** Get
- **Table:** `sessions`
- **Select:** `*`

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

---

### Node: Create Version Record

**Settings:**
- **Operation:** Create
- **Table:** `readme_versions`
- **Data to Send:** Define Below for Each Column

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `session_id` | `={{ $json.session_id }}` |
| `version` | `={{ $json.version }}` |
| `content` | `={{ $json.readme }}` |
| `changes_summary` | `Initial generation` |
| `created_at` | `={{ new Date().toISOString() }}` |

---

### Node: Update Session

**Settings:**
- **Operation:** Update
- **Table:** `sessions`
- **Data to Send:** Define Below for Each Column

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `generated_readme` | `={{ $json.readme }}` |
| `current_version` | `={{ $json.version }}` |
| `status` | `generated` |
| `updated_at` | `={{ new Date().toISOString() }}` |

---

## Workflow 5: Chat Revision

### Node: Fetch Session

**Settings:**
- **Operation:** Get
- **Table:** `sessions`
- **Select:** `*`

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

---

### Node: Create New Version

**Settings:**
- **Operation:** Create
- **Table:** `readme_versions`
- **Data to Send:** Define Below for Each Column

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `session_id` | `={{ $json.session_id }}` |
| `version` | `={{ $json.version }}` |
| `content` | `={{ $json.revised_readme }}` |
| `changes_summary` | `={{ $json.changes_summary }}` |
| `user_message` | `={{ $json.user_message }}` |
| `created_at` | `={{ new Date().toISOString() }}` |

---

### Node: Update Session Version

**Settings:**
- **Operation:** Update
- **Table:** `sessions`
- **Data to Send:** Define Below for Each Column

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `generated_readme` | `={{ $json.revised_readme }}` |
| `current_version` | `={{ $json.version }}` |
| `status` | `revised` |
| `updated_at` | `={{ new Date().toISOString() }}` |

---

## Workflow 6: GitHub Push

### Node: Fetch Session

**Settings:**
- **Operation:** Get
- **Table:** `sessions`
- **Select:** `*`

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

---

### Node: Fetch User GitHub Token

**Settings:**
- **Operation:** Get
- **Table:** `users`
- **Select:** `github_token`

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.user_id }}` |

---

### Node: Update Session - Pushed

**Settings:**
- **Operation:** Update
- **Table:** `sessions`
- **Data to Send:** Define Below for Each Column

**Filters:**

| Key | Condition | Value |
|-----|-----------|-------|
| `id` | equals | `={{ $json.session_id }}` |

**Fields to Send:**

| Field Name or ID | Field Value |
|------------------|-------------|
| `status` | `pushed` |
| `pushed_at` | `={{ new Date().toISOString() }}` |
| `commit_sha` | `={{ $json.commit_sha }}` |
| `commit_url` | `={{ $json.commit_url }}` |
| `updated_at` | `={{ new Date().toISOString() }}` |

---

## Quick Reference: All Tables

### `sessions` Table Fields

| Column | Type | Used In |
|--------|------|---------|
| `id` | UUID | All workflows |
| `user_id` | UUID | WF6 |
| `repo_url` | TEXT | WF1 |
| `repo_owner` | VARCHAR | WF1 |
| `repo_name` | VARCHAR | WF1 |
| `default_branch` | VARCHAR | WF1 |
| `status` | VARCHAR | All workflows |
| `analysis` | JSONB | WF2 |
| `preferences` | JSONB | WF3 |
| `generated_readme` | TEXT | WF4, WF5 |
| `current_version` | INTEGER | WF4, WF5 |
| `pushed_at` | TIMESTAMPTZ | WF6 |
| `commit_sha` | VARCHAR | WF6 |
| `commit_url` | TEXT | WF6 |
| `created_at` | TIMESTAMPTZ | WF1 |
| `updated_at` | TIMESTAMPTZ | All workflows |

### `readme_versions` Table Fields

| Column | Type | Used In |
|--------|------|---------|
| `id` | UUID | Auto-generated |
| `session_id` | UUID | WF4, WF5 |
| `version` | INTEGER | WF4, WF5 |
| `content` | TEXT | WF4, WF5 |
| `changes_summary` | TEXT | WF4, WF5 |
| `user_message` | TEXT | WF5 |
| `created_at` | TIMESTAMPTZ | WF4, WF5 |

### `users` Table Fields

| Column | Type | Used In |
|--------|------|---------|
| `id` | UUID | WF6 |
| `github_token` | TEXT | WF6 |

---

## Expression Syntax Notes

- All expressions start with `=` in n8n
- Use `$json.fieldName` to access input data
- Use `JSON.stringify()` for JSONB columns
- Use `new Date().toISOString()` for timestamps
- Use `|| 'default'` for fallback values
