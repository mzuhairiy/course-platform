import { CourseLevel, CourseStatus } from "@prisma/client";

export type SeedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export const CATEGORIES: SeedCategory[] = [
  {
    id: "cat_programming",
    name: "Programming",
    slug: "programming",
    description: "Pengembangan web, mobile, dan rekayasa perangkat lunak.",
  },
  {
    id: "cat_design",
    name: "Design",
    slug: "design",
    description: "UI/UX, desain produk, dan design system.",
  },
  {
    id: "cat_business",
    name: "Business",
    slug: "business",
    description: "Kewirausahaan, pemasaran, dan manajemen.",
  },
  {
    id: "cat_data",
    name: "Data & Analytics",
    slug: "data-analytics",
    description: "Analisis data, SQL, dan visualisasi.",
  },
  {
    id: "cat_personal",
    name: "Personal Development",
    slug: "personal-development",
    description: "Produktivitas, karier, dan soft skill.",
  },
];

export type SeedInstructor = {
  id: string;
  email: string;
  name: string;
  bio: string;
};

export const INSTRUCTORS: SeedInstructor[] = [
  {
    id: "user_instructor",
    email: "instructor@example.com",
    name: "Budi Santoso",
    bio: "Software engineer dengan 10+ tahun pengalaman membangun aplikasi web. Fokus pada JavaScript, TypeScript, dan ekosistem React/Next.js.",
  },
  {
    id: "user_instructor_2",
    email: "instructor2@example.com",
    name: "Sarah Wijaya",
    bio: "Product designer yang sudah memimpin desain di beberapa startup. Senang membahas UX research, design system, dan workflow Figma.",
  },
  {
    id: "user_instructor_3",
    email: "instructor3@example.com",
    name: "Andi Pratama",
    bio: "Data analyst dan konsultan BI. Terbiasa mengolah data dengan SQL dan spreadsheet, lalu menyajikannya jadi insight yang actionable.",
  },
  {
    id: "user_instructor_4",
    email: "instructor4@example.com",
    name: "Rina Kusuma",
    bio: "Praktisi digital marketing dan product management. Membantu banyak UMKM tumbuh lewat strategi pemasaran yang terukur.",
  },
];

export type SeedCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  categorySlug: string;
  instructorId: string;
  level: CourseLevel;
  price: number;
  status: CourseStatus;
  publishedAt: Date | null;
  topic: string;
};

const md = (paras: string[]) => paras.join("\n\n");

export const COURSES: SeedCourse[] = [
  {
    id: "course_api_testing",
    slug: "api-testing-postman",
    title: "Belajar API Testing dengan Postman dari Nol",
    subtitle: "Uji REST API secara sistematis tanpa menulis banyak kode",
    description: md([
      "Kursus ini membawamu memahami API testing dari dasar menggunakan Postman. Kamu akan belajar membaca dokumentasi API, membuat request, hingga menyusun koleksi tes yang rapi.",
      "Di akhir kelas kamu bisa membuat automated test sederhana, menjalankan koleksi lewat Collection Runner, dan memvalidasi response API dengan percaya diri.",
    ]),
    categorySlug: "programming",
    instructorId: "user_instructor",
    level: CourseLevel.INTERMEDIATE,
    price: 249000,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-05-20T00:00:00.000Z"),
    topic: "API Testing",
  },
  {
    id: "course_nextjs_pemula",
    slug: "next-js-14-untuk-pemula",
    title: "Next.js 14 untuk Pemula",
    subtitle: "Bangun aplikasi web full-stack dengan App Router",
    description: md([
      "Pelajari Next.js 14 dari nol: routing dengan App Router, Server Components, dan pengambilan data di sisi server.",
      "Kamu akan membangun beberapa halaman nyata sambil memahami kapan memakai Server Component vs Client Component.",
    ]),
    categorySlug: "programming",
    instructorId: "user_instructor",
    level: CourseLevel.BEGINNER,
    price: 0,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    topic: "Next.js",
  },
  {
    id: "course_typescript",
    slug: "typescript-mendalam",
    title: "TypeScript Mendalam",
    subtitle: "Type system, generics, dan pattern lanjutan",
    description: md([
      "Tingkatkan pemahaman TypeScript-mu: dari tipe dasar ke generics, utility types, dan pattern yang dipakai di codebase production.",
      "Cocok untuk developer yang sudah pakai TypeScript tapi ingin menulis tipe yang lebih aman dan ekspresif.",
    ]),
    categorySlug: "programming",
    instructorId: "user_instructor",
    level: CourseLevel.ADVANCED,
    price: 349000,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-04-10T00:00:00.000Z"),
    topic: "TypeScript",
  },
  {
    id: "course_ui_fundamentals",
    slug: "ui-design-fundamentals",
    title: "UI Design Fundamentals: dari Wireframe ke High-Fidelity",
    subtitle: "Prinsip antarmuka yang rapi, konsisten, dan mudah dipakai",
    description: md([
      "Mulai dari prinsip dasar desain antarmuka: layout, tipografi, warna, dan spacing. Kamu akan berlatih dari wireframe sampai high-fidelity mockup.",
      "Kelas ini membangun fondasi yang kuat sebelum kamu mendalami tools desain yang lebih advanced.",
    ]),
    categorySlug: "design",
    instructorId: "user_instructor_2",
    level: CourseLevel.BEGINNER,
    price: 199000,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-05-05T00:00:00.000Z"),
    topic: "UI Design",
  },
  {
    id: "course_figma",
    slug: "figma-untuk-product-designer",
    title: "Figma untuk Product Designer",
    subtitle: "Workflow desain produk modern di Figma",
    description: md([
      "Kuasai Figma sebagai tool utama product designer: components, auto layout, variants, dan prototyping.",
      "Kamu akan belajar menyusun file yang rapi dan mudah di-handoff ke tim engineering.",
    ]),
    categorySlug: "design",
    instructorId: "user_instructor_2",
    level: CourseLevel.INTERMEDIATE,
    price: 0,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-05-28T00:00:00.000Z"),
    topic: "Figma",
  },
  {
    id: "course_design_system",
    slug: "design-system-dari-nol",
    title: "Design System dari Nol",
    subtitle: "Bangun design system yang scalable dan konsisten",
    description: md([
      "Pelajari cara membangun design system: tokens, komponen, dokumentasi, dan governance.",
      "Kelas ini masih dalam penyusunan dan akan segera dirilis.",
    ]),
    categorySlug: "design",
    instructorId: "user_instructor_2",
    level: CourseLevel.ADVANCED,
    price: 449000,
    status: CourseStatus.DRAFT,
    publishedAt: null,
    topic: "Design System",
  },
  {
    id: "course_excel",
    slug: "excel-analisis-bisnis",
    title: "Excel untuk Analisis Bisnis",
    subtitle: "Olah dan analisis data bisnis dengan Excel",
    description: md([
      "Belajar Excel untuk kebutuhan bisnis nyata: formula penting, PivotTable, dan dashboard sederhana.",
      "Setelah kelas ini kamu bisa mengubah data mentah jadi laporan yang mudah dibaca.",
    ]),
    categorySlug: "data-analytics",
    instructorId: "user_instructor_3",
    level: CourseLevel.BEGINNER,
    price: 149000,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-03-15T00:00:00.000Z"),
    topic: "Excel",
  },
  {
    id: "course_sql",
    slug: "sql-untuk-data-analyst",
    title: "SQL untuk Data Analyst",
    subtitle: "Query, join, dan agregasi data dengan SQL",
    description: md([
      "Kuasai SQL untuk analisis data: SELECT, filtering, JOIN antar tabel, agregasi, dan subquery.",
      "Kamu akan banyak berlatih dengan studi kasus dataset yang realistis.",
    ]),
    categorySlug: "data-analytics",
    instructorId: "user_instructor_3",
    level: CourseLevel.INTERMEDIATE,
    price: 299000,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-04-22T00:00:00.000Z"),
    topic: "SQL",
  },
  {
    id: "course_dataviz",
    slug: "dasar-data-visualization",
    title: "Dasar Data Visualization",
    subtitle: "Sajikan data jadi cerita yang mudah dipahami",
    description: md([
      "Pelajari prinsip visualisasi data: memilih chart yang tepat, menghindari grafik yang menyesatkan, dan bercerita lewat data.",
      "Cocok untuk siapa saja yang sering presentasi angka ke audiens.",
    ]),
    categorySlug: "data-analytics",
    instructorId: "user_instructor_3",
    level: CourseLevel.BEGINNER,
    price: 0,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-06-03T00:00:00.000Z"),
    topic: "Data Visualization",
  },
  {
    id: "course_digital_marketing",
    slug: "digital-marketing-umkm",
    title: "Digital Marketing untuk UMKM",
    subtitle: "Strategi pemasaran digital praktis untuk usaha kecil",
    description: md([
      "Strategi digital marketing yang langsung bisa dipakai UMKM: konten media sosial, iklan dasar, dan funnel sederhana.",
      "Fokus pada langkah praktis dengan budget terbatas namun terukur.",
    ]),
    categorySlug: "business",
    instructorId: "user_instructor_4",
    level: CourseLevel.BEGINNER,
    price: 179000,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-05-12T00:00:00.000Z"),
    topic: "Digital Marketing",
  },
  {
    id: "course_product_mgmt",
    slug: "manajemen-produk-pemula",
    title: "Manajemen Produk untuk Pemula",
    subtitle: "Dari ide ke roadmap produk",
    description: md([
      "Pengantar manajemen produk: menemukan masalah, memprioritaskan fitur, dan menyusun roadmap.",
      "Kelas ini sudah diarsipkan dan digantikan versi yang lebih baru.",
    ]),
    categorySlug: "business",
    instructorId: "user_instructor_4",
    level: CourseLevel.INTERMEDIATE,
    price: 329000,
    status: CourseStatus.ARCHIVED,
    publishedAt: new Date("2026-02-10T00:00:00.000Z"),
    topic: "Manajemen Produk",
  },
  {
    id: "course_produktivitas",
    slug: "produktivitas-manajemen-waktu",
    title: "Produktivitas & Manajemen Waktu",
    subtitle: "Sistem sederhana untuk fokus dan konsisten",
    description: md([
      "Bangun sistem produktivitas pribadi: prioritas, time blocking, dan kebiasaan yang berkelanjutan.",
      "Bukan soal sibuk, tapi soal mengerjakan hal yang benar dengan tenang.",
    ]),
    categorySlug: "personal-development",
    instructorId: "user_instructor_4",
    level: CourseLevel.BEGINNER,
    price: 0,
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date("2026-05-30T00:00:00.000Z"),
    topic: "Manajemen Waktu",
  },
];
