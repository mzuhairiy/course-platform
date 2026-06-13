import { getCurrentUser } from "@/lib/auth";
import { getCourseCertificateMeta } from "@/server/services/course";
import {
  generateCertificatePdf,
  issueCertificateIfEligible,
} from "@/server/services/certificate";

// On-demand certificate PDF download. The PDF is generated per request and not
// persisted (pdfUrl stays null for now).
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { courseId: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // issueCertificateIfEligible is scoped to this user + course and returns null
  // unless they are enrolled AND have completed the course — so a learner can
  // never reach someone else's certificate, and an incomplete course 404s.
  const certificate = await issueCertificateIfEligible(user.id, params.courseId);
  if (!certificate) {
    return new Response("Not Found", { status: 404 });
  }

  const course = await getCourseCertificateMeta(params.courseId);
  if (!course) {
    return new Response("Not Found", { status: 404 });
  }

  const pdf = await generateCertificatePdf({
    studentName: user.name ?? "Student",
    courseName: course.title,
    certificateNumber: certificate.certificateNumber,
    instructorName: course.instructor.name ?? "Instructor",
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${course.slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
