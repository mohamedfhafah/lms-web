import { describe, it, expect, vi, beforeEach } from "vitest";

const routePath = "src/app/api/jobs/run-overdue/route";

beforeEach(() => {
  vi.resetModules();
  // Default: disable Bull worker/queue
  process.env.ENABLE_BULL_WORKER = "false";
});

function makeReq(method: string, headers?: Record<string, string>) {
  return new Request("http://localhost/api/jobs/run-overdue", {
    method,
    headers,
  });
}

describe("/api/jobs/run-overdue route", () => {
  it("returns 401 when JOB_SECRET is set and no header provided", async () => {
    process.env.JOB_SECRET = "topsecret";

    vi.doMock("server/jobs/queues", () => ({ overdueReminderQueue: null }));
    vi.doMock("server/jobs/overdue-reminders-worker", () => ({}));
    vi.doMock("server/jobs/overdue-reminders", () => ({
      sendOverdueReminders: vi.fn(async () => ({ count: 0, emailed: 0, skipped: 0, errors: 0 })),
    }));

    const mod = await import(routePath);
    const res = await mod.POST(makeReq("POST"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error", "Unauthorized");
  });

  it("runs directly when authorized via x-job-secret and queue disabled", async () => {
    process.env.JOB_SECRET = "s3cr3t";

    const mockResult = { count: 2, emailed: 1, skipped: 1, errors: 0 };
    vi.doMock("server/jobs/queues", () => ({ overdueReminderQueue: null }));
    vi.doMock("server/jobs/overdue-reminders-worker", () => ({}));
    const sendOverdueReminders = vi.fn(async () => mockResult);
    vi.doMock("server/jobs/overdue-reminders", () => ({ sendOverdueReminders }));

    const mod = await import(routePath);
    const res = await mod.POST(makeReq("POST", { "x-job-secret": "s3cr3t" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      message: "Overdue reminders executed directly",
      mode: "direct",
      ...mockResult,
    });
    expect(sendOverdueReminders).toHaveBeenCalledTimes(1);
  });

  it("enqueues when queue is available and authorized via Authorization header", async () => {
    process.env.JOB_SECRET = "abc";

    const add = vi.fn(async () => ({ id: "job_123" }));
    vi.doMock("server/jobs/queues", () => ({ overdueReminderQueue: { add } }));
    vi.doMock("server/jobs/overdue-reminders-worker", () => ({}));
    // Will not be called in queue mode, but mock anyway
    vi.doMock("server/jobs/overdue-reminders", () => ({
      sendOverdueReminders: vi.fn(async () => ({ count: 0, emailed: 0, skipped: 0, errors: 0 })),
    }));

    const mod = await import(routePath);
    const res = await mod.POST(makeReq("POST", { Authorization: "Bearer abc" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      message: "Overdue reminders job enqueued",
      mode: "queue",
      jobId: "job_123",
    });
    expect(add).toHaveBeenCalledTimes(1);
  });
});
