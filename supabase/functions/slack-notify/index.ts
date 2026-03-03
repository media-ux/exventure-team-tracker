import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL");
const SLACK_WEBHOOK_AUTH_TOKEN = Deno.env.get("SLACK_WEBHOOK_AUTH_TOKEN");
const TRACKER_BASE_URL = Deno.env.get("TRACKER_BASE_URL") || "http://localhost:5173";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  sub_unit_id: string;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  record: TaskRecord;
  old_record: TaskRecord | null;
}

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify authorization (SEC-03)
  const authHeader = req.headers.get("Authorization");
  if (!SLACK_WEBHOOK_AUTH_TOKEN || authHeader !== `Bearer ${SLACK_WEBHOOK_AUTH_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check webhook URL is configured
  if (!SLACK_WEBHOOK_URL) {
    return new Response(
      JSON.stringify({ error: "SLACK_WEBHOOK_URL not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { type, record, old_record } = payload;

    // Determine notification type
    let notificationType: "created" | "assigned" | "completed" | "edited" | null = null;
    const changedFields: string[] = [];

    if (type === "INSERT") {
      notificationType = "created"; // SLACK-01
    } else if (type === "UPDATE" && old_record) {
      // Check if assignment changed (SLACK-02)
      if (record.assigned_to !== old_record.assigned_to && record.assigned_to !== null) {
        notificationType = "assigned";
      }
      // Check if status changed to done (SLACK-03) — takes priority
      else if (record.status === "done" && old_record.status !== "done") {
        notificationType = "completed";
      }
      // Check for any other field edits (title, description, due_date, status)
      else {
        if (record.title !== old_record.title) changedFields.push("title");
        if (record.description !== old_record.description) changedFields.push("description");
        if (record.due_date !== old_record.due_date) changedFields.push("due date");
        if (record.status !== old_record.status) changedFields.push("status");
        if (changedFields.length > 0) {
          notificationType = "edited";
        }
      }
    }

    if (!notificationType) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not a notification-worthy change" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Resolve related entity names via service role client (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve assignee name
    let assigneeName: string | null = null;
    if (record.assigned_to) {
      const { data: member } = await supabase
        .from("team_members")
        .select("name")
        .eq("id", record.assigned_to)
        .single();
      assigneeName = member?.name ?? null;
    }

    // Resolve sub-unit and project names
    const { data: subUnit } = await supabase
      .from("sub_units")
      .select("name, project_id")
      .eq("id", record.sub_unit_id)
      .single();

    let projectName: string | null = null;
    if (subUnit?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", subUnit.project_id)
        .single();
      projectName = project?.name ?? null;
    }

    // Build Slack Block Kit message (SLACK-04)
    const taskUrl = `${TRACKER_BASE_URL}/tasks`;
    const blocks = buildSlackBlocks(notificationType, record, old_record, assigneeName, projectName, subUnit?.name ?? null, taskUrl, changedFields);

    // POST to Slack
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blocks),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error("Slack webhook error:", errorText);
      return new Response(
        JSON.stringify({ error: "Slack webhook failed", details: errorText }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, notification: notificationType }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

function buildSlackBlocks(
  notificationType: "created" | "assigned" | "completed" | "edited",
  task: TaskRecord,
  oldTask: TaskRecord | null,
  assigneeName: string | null,
  projectName: string | null,
  subUnitName: string | null,
  taskUrl: string,
  changedFields: string[],
) {
  const emoji = {
    created: ":new:",
    assigned: ":bust_in_silhouette:",
    completed: ":white_check_mark:",
    edited: ":pencil2:",
  }[notificationType];

  const title = {
    created: "Task Created",
    assigned: "Task Assigned",
    completed: "Task Completed",
    edited: "Task Edited",
  }[notificationType];

  const contextParts: string[] = [];
  if (projectName) contextParts.push(`*Project:* ${projectName}`);
  if (subUnitName) contextParts.push(`*Sub-unit:* ${subUnitName}`);
  if (assigneeName) contextParts.push(`*Assignee:* ${assigneeName}`);
  if (task.due_date) contextParts.push(`*Due:* ${task.due_date}`);

  // Build change details for edited notifications
  const changeLines: string[] = [];
  if (notificationType === "edited" && oldTask) {
    if (oldTask.title !== task.title) {
      changeLines.push(`*Title:* ~${oldTask.title}~ → ${task.title}`);
    }
    if (oldTask.description !== task.description) {
      const oldDesc = oldTask.description || "(empty)";
      const newDesc = task.description || "(empty)";
      changeLines.push(`*Description:* ~${oldDesc}~ → ${newDesc}`);
    }
    if (oldTask.due_date !== task.due_date) {
      const oldDue = oldTask.due_date || "none";
      const newDue = task.due_date || "none";
      changeLines.push(`*Due date:* ~${oldDue}~ → ${newDue}`);
    }
    if (oldTask.status !== task.status) {
      changeLines.push(`*Status:* ~${oldTask.status}~ → ${task.status}`);
    }
  }

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${taskUrl}|${task.title}>*`,
        },
      },
      ...(changeLines.length > 0
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: changeLines.join("\n"),
              },
            },
          ]
        : []),
      ...(contextParts.length > 0
        ? [
            {
              type: "context",
              elements: contextParts.map((text) => ({
                type: "mrkdwn",
                text,
              })),
            },
          ]
        : []),
      {
        type: "divider",
      },
    ],
  };
}
