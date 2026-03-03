# Slack Integration Setup Guide

This guide walks you through connecting the Ex-Venture team tracker to Slack so that task notifications appear in your channel automatically.

**What you'll get:**
- Notification when a task is **created**
- Notification when a task is **assigned** to someone
- Notification when a task is **completed** (status changed to "done")
- Each notification includes the task title, project, assignee, and a link back to the tracker

---

## Prerequisites

- A Slack workspace where you have permission to install apps
- Access to your Supabase project dashboard (or Supabase CLI installed)
- The Ex-Venture team tracker deployed and running

---

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter:
   - **App Name:** `Ex-Venture Tracker`
   - **Workspace:** Select your Slack workspace
5. Click **"Create App"**

## Step 2: Enable Incoming Webhooks

1. In your new app's settings, click **"Incoming Webhooks"** in the left sidebar
2. Toggle **"Activate Incoming Webhooks"** to **On**
3. Scroll down and click **"Add New Webhook to Workspace"**
4. Select the channel where you want notifications (e.g., `#engineering-tasks`)
5. Click **"Allow"**
6. Copy the **Webhook URL** — it will start with `hooks.slack.com/services/` followed by three path segments.
   Keep this URL private. Anyone with it can post to your channel.

## Step 3: Generate an Auth Token

The Edge Function requires a bearer token to prevent unauthorized calls. Generate a random token:

**On macOS/Linux:**
```bash
openssl rand -hex 32
```

**On Windows (PowerShell):**
```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Copy the generated token. You'll use it in the next step.

## Step 4: Store Secrets in Supabase

Set the following secrets for the Edge Function:

```bash
# The Slack webhook URL from Step 2
supabase secrets set SLACK_WEBHOOK_URL="<your-slack-webhook-url>"

# The auth token from Step 3
supabase secrets set SLACK_WEBHOOK_AUTH_TOKEN="your-generated-token-here"

# The base URL of your deployed tracker (used for clickable links in Slack)
supabase secrets set TRACKER_BASE_URL="https://your-tracker-domain.vercel.app"
```

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available to Edge Functions — you don't need to set them.

## Step 5: Deploy the Edge Function

From the project root:

```bash
supabase functions deploy slack-notify
```

You should see output confirming the function was deployed.

## Step 6: Configure Database Settings

The database trigger needs to know the Edge Function URL and auth token. Set these as PostgreSQL configuration values in your Supabase SQL Editor:

```sql
-- Set these in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-ref.supabase.co';
ALTER DATABASE postgres SET app.settings.slack_webhook_auth_token = 'your-generated-token-here';
```

Replace the values with:
- Your actual Supabase project URL (from your `.env.local` or Supabase dashboard)
- The auth token you generated in Step 3

> **Important:** After running these commands, new database connections will pick up the settings. Existing connections may need a reconnect (this happens automatically over time).

## Step 7: Apply the Migration

If you haven't already, apply the database migration that creates the triggers:

```bash
supabase db push
```

Or if running locally:

```bash
supabase db reset
```

## Step 8: Test the Integration

### Quick test via the tracker:
1. Open the tracker in your browser
2. Create a new task
3. Check your Slack channel — you should see a "Task Created" notification

### Test via curl (directly call the Edge Function):
```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/slack-notify' \
  -H 'Authorization: Bearer your-auth-token-here' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "INSERT",
    "record": {
      "id": "test-id",
      "title": "Test Task from curl",
      "description": null,
      "status": "backlog",
      "assigned_to": null,
      "sub_unit_id": "test-sub-unit",
      "created_by": "test-user",
      "due_date": null,
      "created_at": "2026-03-02T00:00:00Z",
      "updated_at": "2026-03-02T00:00:00Z"
    },
    "old_record": null
  }'
```

### Verify auth protection:
```bash
# This should return 401 Unauthorized
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/slack-notify' \
  -H 'Content-Type: application/json' \
  -d '{"type": "INSERT", "record": {"title": "Unauthorized test"}}'
```

---

## Troubleshooting

### No notification appears in Slack

1. **Check Edge Function logs:**
   ```bash
   supabase functions logs slack-notify
   ```

2. **Verify secrets are set:**
   ```bash
   supabase secrets list
   ```
   You should see `SLACK_WEBHOOK_URL`, `SLACK_WEBHOOK_AUTH_TOKEN`, and `TRACKER_BASE_URL`.

3. **Check database settings:**
   Run in the SQL Editor:
   ```sql
   SHOW app.settings.supabase_url;
   SHOW app.settings.slack_webhook_auth_token;
   ```

4. **Verify pg_net is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

5. **Check trigger exists:**
   ```sql
   SELECT trigger_name, event_manipulation
   FROM information_schema.triggers
   WHERE event_object_table = 'tasks';
   ```

### Slack returns an error

- **`invalid_payload`**: The webhook URL may be wrong or expired. Generate a new one in Slack App settings.
- **`channel_not_found`**: The channel was deleted or the app was removed from it. Re-add the webhook.
- **`too_many_requests`**: You're hitting Slack's rate limit (1 message/second). This shouldn't happen with normal usage.

### Edge Function returns 401

- Verify `SLACK_WEBHOOK_AUTH_TOKEN` matches between the Edge Function secret and the database setting `app.settings.slack_webhook_auth_token`.

### Edge Function returns 500

- Check that `SLACK_WEBHOOK_URL` is set as a secret.
- Check Edge Function logs for the detailed error.

---

## Architecture Overview

```
Task created/updated in database
  --> PostgreSQL trigger fires (AFTER INSERT/UPDATE on tasks)
  --> Calls Edge Function via pg_net (async, non-blocking)
  --> Edge Function resolves entity names (assignee, project, sub-unit)
  --> Formats Slack Block Kit message
  --> POSTs to Slack Incoming Webhook URL
  --> Notification appears in Slack channel
```

This design means notifications fire regardless of whether changes come from the React app, the Supabase dashboard, or future API integrations (e.g., OpenClaw agents).
