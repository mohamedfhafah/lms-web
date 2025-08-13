import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server/db prisma client
vi.mock("server/db", () => {
  return {
    prisma: {
      pret: {
        findMany: vi.fn(),
      },
    },
  };
});

// Mock Clerk client
vi.mock("@clerk/nextjs/server", () => {
  return {
    clerkClient: {
      users: {
        getUser: vi.fn(async (id: string) => ({
          id,
          primaryEmailAddressId: "e1",
          emailAddresses: [
            { id: "e1", emailAddress: `${id}@example.com` },
          ],
        })),
      },
    },
  };
});

// Optional: mock Resend when enabled
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: vi.fn(async () => ({ id: "m_1" })) };
    },
  };
});

// Import after mocks
import { prisma } from "server/db";
import { sendOverdueReminders } from "server/jobs/overdue-reminders";

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  (prisma.pret.findMany as any).mockReset();
});

afterEach(() => {
  process.env = originalEnv;
});

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe("sendOverdueReminders", () => {
  it("returns skipped counts when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    (prisma.pret.findMany as any).mockResolvedValue([
      {
        id: "p1",
        adherentId: 1,
        livreId: "l1",
        dateEcheance: daysAgo(3),
        adherent: { clerkUserId: "user_1", nom: "Alice" },
      },
      {
        id: "p2",
        adherentId: 2,
        livreId: "l2",
        dateEcheance: daysAgo(10),
        adherent: { clerkUserId: "user_2", nom: "Bob" },
      },
    ]);

    const res = await sendOverdueReminders();
    expect(res.count).toBe(2);
    expect(res.emailed).toBe(0);
    expect(res.skipped).toBe(2);
    expect(res.errors).toBe(0);
  });

  it("emails users when RESEND_API_KEY is set and Clerk provides emails", async () => {
    process.env.RESEND_API_KEY = "test_abc";

    (prisma.pret.findMany as any).mockResolvedValue([
      {
        id: "p3",
        adherentId: 3,
        livreId: "l3",
        dateEcheance: daysAgo(5),
        adherent: { clerkUserId: "user_3", nom: "Cara" },
      },
      {
        id: "p4",
        adherentId: 4,
        livreId: "l4",
        dateEcheance: daysAgo(2),
        adherent: { clerkUserId: "", nom: "NoClerk" },
      },
    ]);

    const res = await sendOverdueReminders();
    expect(res.count).toBe(2);
    // First has email, second is skipped due to missing Clerk ID
    expect(res.emailed).toBe(1);
    expect(res.skipped).toBe(1);
    expect(res.errors).toBe(0);
  });
});
