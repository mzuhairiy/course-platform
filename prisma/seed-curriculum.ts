import { LectureType } from "@prisma/client";

// Creative-Commons sample videos (Google test bucket) with their real durations.
const SAMPLE_VIDEOS: { url: string; duration: number }[] = [
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: 596,
  },
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: 653,
  },
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    duration: 888,
  },
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    duration: 734,
  },
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 15,
  },
];

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
  let videoCounter = courseIndex;

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

      const video = SAMPLE_VIDEOS[videoCounter % SAMPLE_VIDEOS.length];
      videoCounter += 1;
      return {
        ...base,
        type: LectureType.VIDEO,
        durationSeconds: video.duration,
        videoUrl: video.url,
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
