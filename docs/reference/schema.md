# Database Schema (Prisma)

> Source of truth untuk struktur data. Update file ini setiap kali schema berubah.
>
> **Catatan perubahan setelah plan awal:**
> - `User.bio` ditambahkan (profile settings + content seed instruktur).
> - `Course.coverLabel` ditambahkan (cover 3D-text generatif pengganti thumbnail).

## Database Schema (Prisma)

Schema ini cover **Fase 1–3** (auth, course, enrollment, video, quiz, payment, certificate). Fase 4–5 di-extend nanti.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// AUTH (Auth.js v5 compatible)
// ==========================================

enum UserRole {
  STUDENT
  INSTRUCTOR
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  bio           String?   // profil user & instruktur (ditambah saat profile settings + content seed)
  role          UserRole  @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  enrollments     Enrollment[]
  progress        LectureProgress[]
  quizAttempts    QuizAttempt[]
  transactions    Transaction[]
  certificates    Certificate[]
  authoredCourses Course[]  @relation("CourseInstructor")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==========================================
// COURSE
// ==========================================

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  courses     Course[]
}

model Course {
  id            String       @id @default(cuid())
  slug          String       @unique
  title         String
  subtitle      String?
  description   String       @db.Text
  thumbnailUrl  String?
  coverLabel    String?      // label ringkas utk cover 3D-text generatif (mis. "Next.js", "SQL")
  level         CourseLevel  @default(BEGINNER)
  language      String       @default("id")
  price         Int          @default(0)        // dalam Rupiah, 0 = free
  status        CourseStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id])

  instructorId String
  instructor   User    @relation("CourseInstructor", fields: [instructorId], references: [id])

  sections     Section[]
  enrollments  Enrollment[]
  transactions Transaction[]
  certificates Certificate[]
}

model Section {
  id        String   @id @default(cuid())
  courseId  String
  title     String
  order     Int
  createdAt DateTime @default(now())

  course   Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lectures Lecture[]

  @@index([courseId])
}

enum LectureType {
  VIDEO
  READING
  QUIZ
}

model Lecture {
  id        String      @id @default(cuid())
  sectionId String
  title     String
  type      LectureType
  order     Int
  durationSeconds Int?  // untuk video
  contentMd       String? @db.Text  // untuk reading
  videoAssetId    String? // Mux asset ID (unused — Mux di-drop, video pakai URL input)
  videoPlaybackId String? // Mux playback ID (unused — field dipertahankan untuk future use)
  createdAt DateTime    @default(now())

  section  Section          @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  progress LectureProgress[]
  quiz     Quiz?

  @@index([sectionId])
}

// ==========================================
// ENROLLMENT & PROGRESS
// ==========================================

model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  courseId   String
  enrolledAt DateTime @default(now())
  completedAt DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LectureProgress {
  id            String   @id @default(cuid())
  userId        String
  lectureId     String
  watchedSeconds Int     @default(0)
  isCompleted   Boolean  @default(false)
  completedAt   DateTime?
  updatedAt     DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  lecture Lecture @relation(fields: [lectureId], references: [id], onDelete: Cascade)

  @@unique([userId, lectureId])
  @@index([userId])
}

// ==========================================
// QUIZ
// ==========================================

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
}

model Quiz {
  id           String   @id @default(cuid())
  lectureId    String   @unique
  title        String
  description  String?
  passingScore Int      @default(70)  // percentage
  timeLimit    Int?     // dalam detik, null = unlimited

  lecture   Lecture        @relation(fields: [lectureId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  attempts  QuizAttempt[]
}

model QuizQuestion {
  id          String       @id @default(cuid())
  quizId      String
  type        QuestionType
  question    String       @db.Text
  options     Json         // [{id, text}]
  correctAnswerIds String[]
  explanation String?      @db.Text
  order       Int

  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)
}

model QuizAttempt {
  id          String   @id @default(cuid())
  userId      String
  quizId      String
  score       Int      // percentage
  passed      Boolean
  answers     Json     // [{questionId, selectedIds}]
  startedAt   DateTime @default(now())
  submittedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ==========================================
// PAYMENT
// ==========================================

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
  CANCELLED
  REFUNDED
}

model Transaction {
  id              String            @id @default(cuid())
  userId          String
  courseId        String
  orderId         String            @unique  // ID yang dikirim ke Midtrans
  amount          Int
  status          TransactionStatus @default(PENDING)
  paymentMethod   String?
  midtransToken   String?           // Snap token
  midtransResponse Json?            // Raw response untuk debugging
  paidAt          DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@index([userId])
  @@index([status])
}

// ==========================================
// CERTIFICATE
// ==========================================

model Certificate {
  id           String   @id @default(cuid())
  userId       String
  courseId     String
  certificateNumber String @unique  // format: CERT-YYYY-XXXXX
  issuedAt     DateTime @default(now())
  pdfUrl       String?

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}

// ==========================================
// REVIEW (Fase 5 — rating + komentar per course)
// ==========================================
// Hanya user yang enrolled boleh review. Satu review per user per course
// (upsert saat re-submit). User & Course punya back-relation `reviews`.

model Review {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  rating    Int // 1..5 stars
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([courseId])
}
```

