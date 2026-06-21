// Pure email content builders (no "server-only"): easy to unit-test, and kept
// separate from the transport in email.ts.

export type EmailContent = { subject: string; html: string };

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0b1020">
  <h1 style="font-size:20px">${title}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="font-size:12px;color:#6b7280">Email ini dikirim otomatis oleh platform kursus.</p>
  </body></html>`;
}

export function enrollmentEmail(params: {
  name: string;
  courseTitle: string;
  courseUrl: string;
}): EmailContent {
  return {
    subject: `Kamu terdaftar di "${params.courseTitle}"`,
    html: layout(
      `Selamat datang, ${params.name}!`,
      `<p>Kamu berhasil terdaftar di <strong>${params.courseTitle}</strong>.</p>
       <p><a href="${params.courseUrl}">Mulai belajar sekarang →</a></p>`,
    ),
  };
}

export function completionEmail(params: {
  name: string;
  courseTitle: string;
  certificateUrl: string;
}): EmailContent {
  return {
    subject: `Selamat! Kamu menyelesaikan "${params.courseTitle}"`,
    html: layout(
      `Kerja bagus, ${params.name}! 🎉`,
      `<p>Kamu telah menyelesaikan <strong>${params.courseTitle}</strong>.</p>
       <p><a href="${params.certificateUrl}">Lihat sertifikat kamu →</a></p>`,
    ),
  };
}
