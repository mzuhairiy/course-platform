import { LectureType } from "@prisma/client";

// One small local Creative-Commons clip (~10s, <1MB) is reused for every VIDEO
// lecture, served from /public. Keeps the repo light and progress tracking fast
// to exercise end-to-end. The duration matches the actual clip length.
const SAMPLE_VIDEO_URL = "/sample-lecture.mp4";
const SAMPLE_VIDEO_DURATION = 10;

type LessonBlueprint = { title: string; reading?: boolean };
type SectionBlueprint = { title: string; lessons: LessonBlueprint[] };

const SECTION_BLUEPRINTS: SectionBlueprint[] = [
  {
    title: "Pengenalan",
    lessons: [
      { title: "Selamat datang & overview kelas" },
      { title: "Apa itu {topic} dan kenapa penting" },
      { title: "Peta belajar {topic}" },
    ],
  },
  {
    title: "Konsep Dasar",
    lessons: [
      { title: "Konsep inti {topic}" },
      { title: "Terminologi & istilah penting", reading: true },
      { title: "Contoh sederhana langkah demi langkah" },
    ],
  },
  {
    title: "Setup & Tools",
    lessons: [
      { title: "Menyiapkan environment" },
      { title: "Tools yang dibutuhkan" },
      { title: "Konfigurasi awal" },
    ],
  },
  {
    title: "Praktik",
    lessons: [
      { title: "Latihan pertama: {topic}" },
      { title: "Best practices & pola umum", reading: true },
      { title: "Kesalahan umum yang harus dihindari" },
      { title: "Latihan mandiri" },
    ],
  },
  {
    title: "Studi Kasus",
    lessons: [
      { title: "Studi kasus dunia nyata" },
      { title: "Membangun proyek mini {topic}" },
      { title: "Review & perbaikan" },
    ],
  },
];

export type GeneratedLecture = {
  id: string;
  title: string;
  type: LectureType;
  order: number;
  durationSeconds: number | null;
  contentMd: string | null;
  videoUrl: string | null;
};

export type GeneratedSection = {
  id: string;
  title: string;
  order: number;
  lectures: GeneratedLecture[];
};

function readingContent(title: string, topic: string): string {
  return [
    `## ${title}`,
    `Bagian ini membahas ${topic} lebih dekat supaya kamu punya gambaran utuh sebelum masuk ke praktik.`,
    `Pahami konsepnya perlahan — tidak perlu menghafal. Yang penting kamu mengerti alur dan alasannya, lalu kaitkan dengan contoh nyata.`,
    `Beberapa poin penting:`,
    `- Mulai dari yang sederhana sebelum kasus kompleks\n- Konsistensi lebih penting daripada kecepatan\n- Selalu hubungkan teori dengan praktik`,
    `Setelah membaca bagian ini, lanjutkan ke lecture berikutnya untuk mempraktikkannya langsung.`,
  ].join("\n\n");
}

/** Deterministic curriculum: 3–5 sections, mostly VIDEO with 1–2 READING and a QUIZ at the end. */
export function generateCurriculum(
  courseSlug: string,
  topic: string,
  courseIndex: number,
): GeneratedSection[] {
  const sectionCount = 3 + (courseIndex % 3); // 3..5
  const blueprints = SECTION_BLUEPRINTS.slice(0, sectionCount);

  return blueprints.map((blueprint, si) => {
    const isLast = si === blueprints.length - 1;
    const lectures: GeneratedLecture[] = blueprint.lessons.map((lesson, li) => {
      const title = lesson.title.replace(/\{topic\}/g, topic);
      const base = {
        id: `lec_${courseSlug}_${si}_${li}`,
        title,
        order: li + 1,
      };

      if (lesson.reading) {
        return {
          ...base,
          type: LectureType.READING,
          durationSeconds: null,
          videoUrl: null,
          contentMd: readingContent(title, topic),
        };
      }

      return {
        ...base,
        type: LectureType.VIDEO,
        durationSeconds: SAMPLE_VIDEO_DURATION,
        videoUrl: SAMPLE_VIDEO_URL,
        contentMd: null,
      };
    });

    if (isLast) {
      lectures.push({
        id: `lec_${courseSlug}_${si}_quiz`,
        title: `Kuis: Uji pemahaman ${topic}`,
        type: LectureType.QUIZ,
        order: lectures.length + 1,
        durationSeconds: null,
        videoUrl: null,
        contentMd: null,
      });
    }

    return {
      id: `sec_${courseSlug}_${si}`,
      title: blueprint.title,
      order: si + 1,
      lectures,
    };
  });
}
