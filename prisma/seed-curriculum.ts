import { LectureType, QuestionType } from "@prisma/client";

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

export type GeneratedQuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options: { id: string; text: string }[];
  correctAnswerIds: string[];
  explanation: string;
  order: number;
};

export type GeneratedQuiz = {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number | null;
  questions: GeneratedQuizQuestion[];
};

export type GeneratedLecture = {
  id: string;
  title: string;
  type: LectureType;
  order: number;
  durationSeconds: number | null;
  contentMd: string | null;
  videoUrl: string | null;
  quiz?: GeneratedQuiz;
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

/**
 * Deterministic quiz per course: 5 questions mixing single-answer
 * MULTIPLE_CHOICE, one multi-answer MULTIPLE_CHOICE, and TRUE_FALSE. The first
 * course's quiz is timed (120s) to showcase the timed flow; the rest are
 * untimed. Questions are generic-but-sensible so they read well for any topic.
 */
function generateQuiz(
  courseSlug: string,
  topic: string,
  courseIndex: number,
): GeneratedQuiz {
  const quizId = `quiz_${courseSlug}`;
  const q = (n: number) => `${quizId}_q${n}`;

  const questions: GeneratedQuizQuestion[] = [
    {
      id: q(1),
      type: QuestionType.MULTIPLE_CHOICE,
      question: `Apa langkah pertama yang paling disarankan saat mulai belajar ${topic}?`,
      options: [
        { id: `${q(1)}_a`, text: "Memahami konsep dasarnya lebih dulu" },
        { id: `${q(1)}_b`, text: "Langsung mengerjakan proyek paling kompleks" },
        { id: `${q(1)}_c`, text: "Menghafal semua istilah tanpa konteks" },
        { id: `${q(1)}_d`, text: "Melewati bagian teori sepenuhnya" },
      ],
      correctAnswerIds: [`${q(1)}_a`],
      explanation:
        "Memahami konsep dasar lebih dulu memberi fondasi sebelum masuk ke praktik yang lebih kompleks.",
      order: 1,
    },
    {
      id: q(2),
      type: QuestionType.MULTIPLE_CHOICE,
      question: `Manakah pernyataan yang BENAR tentang belajar ${topic}? (pilih semua yang benar)`,
      options: [
        { id: `${q(2)}_a`, text: "Konsistensi lebih penting daripada kecepatan" },
        { id: `${q(2)}_b`, text: "Teori sebaiknya dikaitkan dengan praktik" },
        { id: `${q(2)}_c`, text: "Memahami konsep tidak ada gunanya" },
        { id: `${q(2)}_d`, text: "Praktik sama sekali tidak diperlukan" },
      ],
      correctAnswerIds: [`${q(2)}_a`, `${q(2)}_b`],
      explanation:
        "Konsistensi dan mengaitkan teori dengan praktik adalah dua kebiasaan belajar yang terbukti efektif.",
      order: 2,
    },
    {
      id: q(3),
      type: QuestionType.TRUE_FALSE,
      question: `${topic} sebaiknya dipelajari secara konsisten dan bertahap, bukan terburu-buru.`,
      options: [
        { id: `${q(3)}_true`, text: "Benar" },
        { id: `${q(3)}_false`, text: "Salah" },
      ],
      correctAnswerIds: [`${q(3)}_true`],
      explanation:
        "Belajar bertahap dan konsisten membantu pemahaman jangka panjang dibanding belajar terburu-buru.",
      order: 3,
    },
    {
      id: q(4),
      type: QuestionType.MULTIPLE_CHOICE,
      question: `Mengapa praktik langsung penting dalam mempelajari ${topic}?`,
      options: [
        { id: `${q(4)}_a`, text: "Karena mengubah teori menjadi keterampilan nyata" },
        { id: `${q(4)}_b`, text: "Karena membuat belajar jadi lebih lambat" },
        { id: `${q(4)}_c`, text: "Karena menghindari pemahaman konsep" },
        { id: `${q(4)}_d`, text: "Karena tidak ada hubungannya dengan hasil" },
      ],
      correctAnswerIds: [`${q(4)}_a`],
      explanation:
        "Praktik mengubah pengetahuan teoretis menjadi keterampilan yang benar-benar bisa dipakai.",
      order: 4,
    },
    {
      id: q(5),
      type: QuestionType.TRUE_FALSE,
      question: `Menghafal tanpa memahami konsep adalah cara terbaik menguasai ${topic}.`,
      options: [
        { id: `${q(5)}_true`, text: "Benar" },
        { id: `${q(5)}_false`, text: "Salah" },
      ],
      correctAnswerIds: [`${q(5)}_false`],
      explanation:
        "Pemahaman konsep jauh lebih bertahan dan fleksibel dibanding sekadar menghafal.",
      order: 5,
    },
  ];

  return {
    id: quizId,
    title: `Kuis: Uji pemahaman ${topic}`,
    description: `Uji pemahamanmu tentang ${topic}. Jawab semua soal lalu submit untuk melihat skor.`,
    passingScore: 60,
    timeLimit: courseIndex === 0 ? 120 : null,
    questions,
  };
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
        quiz: generateQuiz(courseSlug, topic, courseIndex),
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
