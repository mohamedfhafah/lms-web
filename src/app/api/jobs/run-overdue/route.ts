import { NextResponse } from "next/server";
import { overdueReminderQueue } from "server/jobs/queues";
import "server/jobs/overdue-reminders-worker";
import { sendOverdueReminders } from "server/jobs/overdue-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB_SECRET = process.env.JOB_SECRET;

function isAuthorized(req: Request): boolean {
  // If no secret is configured, allow in non-production for convenience
  if (!JOB_SECRET) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("x-job-secret") || req.headers.get("authorization");
  if (!header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return token === JOB_SECRET;
}

async function runOverdue() {
  // Try BullMQ first if available
  if (overdueReminderQueue) {
    try {
      const job = await overdueReminderQueue.add(
        "send",
        {},
        { jobId: `overdue-${Date.now()}` }
      );
      return NextResponse.json({
        message: "Overdue reminders job enqueued",
        jobId: job.id,
        mode: "queue",
      });
    } catch (error) {
      console.warn("Queue add failed, running directly:", error);
    }
  }

  // Fallback: run directly (useful in dev or when BullMQ is disabled)
  const result = await sendOverdueReminders();
  return NextResponse.json({
    message: "Overdue reminders executed directly",
    mode: "direct",
    count: result.count,
  });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return await runOverdue();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to execute overdue reminders", details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return await runOverdue();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to execute overdue reminders", details: message },
      { status: 500 }
    );
  }
}
