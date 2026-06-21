import "server-only";

import {
  completionEmail,
  enrollmentEmail,
  type EmailContent,
} from "@/lib/email-templates";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type SendResult = { sent: boolean; skipped?: boolean };

/**
 * Send one transactional email via Resend's REST API (no SDK dependency).
 * No-ops gracefully when RESEND_API_KEY is unset (local/dev) and never throws —
 * email is best-effort and must never break the enrollment/completion flow.
 * Never logs the API key or recipient payloads.
 */
export async function sendEmail(
  to: string,
  content: EmailContent,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, skipped: true };

  const from = process.env.EMAIL_FROM || "no-reply@example.com";
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: content.subject,
        html: content.html,
      }),
    });
    return { sent: res.ok };
  } catch {
    // Swallow network/transport errors — caller must not fail because of email.
    return { sent: false };
  }
}

export function sendEnrollmentEmail(
  to: string,
  params: { name: string; courseTitle: string; courseUrl: string },
): Promise<SendResult> {
  return sendEmail(to, enrollmentEmail(params));
}

export function sendCompletionEmail(
  to: string,
  params: { name: string; courseTitle: string; certificateUrl: string },
): Promise<SendResult> {
  return sendEmail(to, completionEmail(params));
}
