import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  completionEmail,
  enrollmentEmail,
} from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

describe("email templates", () => {
  it("enrollment email includes the course title and url", () => {
    const content = enrollmentEmail({
      name: "Budi",
      courseTitle: "Belajar QA",
      courseUrl: "https://app.test/courses/qa",
    });
    expect(content.subject).toContain("Belajar QA");
    expect(content.html).toContain("https://app.test/courses/qa");
    expect(content.html).toContain("Budi");
  });

  it("completion email includes the certificate url", () => {
    const content = completionEmail({
      name: "Sari",
      courseTitle: "Belajar QA",
      certificateUrl: "https://app.test/courses/qa",
    });
    expect(content.subject).toContain("Belajar QA");
    expect(content.html).toContain("https://app.test/courses/qa");
  });
});

describe("sendEmail transport", () => {
  const originalKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  });

  it("no-ops (skipped) when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendEmail("to@test.com", {
      subject: "Hi",
      html: "<p>Hi</p>",
    });

    expect(result).toEqual({ sent: false, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Resend and reports sent on ok response", async () => {
    process.env.RESEND_API_KEY = "test_key";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const result = await sendEmail("to@test.com", {
      subject: "Hi",
      html: "<p>Hi</p>",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(true);
  });

  it("never throws on transport failure", async () => {
    process.env.RESEND_API_KEY = "test_key";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    await expect(
      sendEmail("to@test.com", { subject: "Hi", html: "<p>Hi</p>" }),
    ).resolves.toEqual({ sent: false });
  });
});
