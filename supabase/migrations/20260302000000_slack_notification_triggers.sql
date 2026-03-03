-- Phase 4: Slack Integration — Database Triggers
-- Creates AFTER INSERT/UPDATE triggers on tasks table that call the
-- slack-notify Edge Function via pg_net (async, non-blocking).

-- =============================================================================
-- ENABLE pg_net EXTENSION
-- Allows async HTTP requests from PostgreSQL (fire-and-forget)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- =============================================================================
-- TRIGGER FUNCTION: notify_slack_on_task_change()
-- Builds JSON payload and POSTs to Edge Function via net.http_post()
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_slack_on_task_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  edge_function_url TEXT;
  auth_token TEXT;
BEGIN
  -- Build the Edge Function URL from Supabase project URL
  -- In production, this reads from a vault secret or config
  edge_function_url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/slack-notify';

  auth_token := current_setting('app.settings.slack_webhook_auth_token', true);

  -- Skip if configuration is missing
  IF edge_function_url IS NULL OR auth_token IS NULL THEN
    RAISE LOG 'Slack notification skipped: missing configuration (supabase_url or slack_webhook_auth_token)';
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Build payload
  IF TG_OP = 'INSERT' THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'record', row_to_json(NEW)::JSONB,
      'old_record', NULL
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notify on meaningful changes:
    -- 1. assigned_to changed (task assigned)
    -- 2. status changed (task completed or status update)
    -- 3. title, description, or due_date changed (task edited)
    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL)
       OR (OLD.status IS DISTINCT FROM NEW.status)
       OR (OLD.title IS DISTINCT FROM NEW.title)
       OR (OLD.description IS DISTINCT FROM NEW.description)
       OR (OLD.due_date IS DISTINCT FROM NEW.due_date) THEN
      payload := jsonb_build_object(
        'type', 'UPDATE',
        'record', row_to_json(NEW)::JSONB,
        'old_record', row_to_json(OLD)::JSONB
      );
    ELSE
      -- Not a notification-worthy change (e.g., only updated_at)
      RETURN NEW;
    END IF;
  END IF;

  -- Fire-and-forget HTTP POST via pg_net (non-blocking)
  PERFORM net.http_post(
    url := edge_function_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_token
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- Fire AFTER INSERT and AFTER UPDATE on the tasks table
-- =============================================================================

-- Trigger: task created (SLACK-01)
CREATE TRIGGER slack_notify_task_created
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_slack_on_task_change();

-- Trigger: task updated — assigned (SLACK-02) or completed (SLACK-03)
CREATE TRIGGER slack_notify_task_updated
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_slack_on_task_change();
