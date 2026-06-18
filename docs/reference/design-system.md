# Design System

> Palet **putih + navy** (Maven-style). Source of truth untuk warna, tipografi, spacing.

## Design System Spec

Inspired by Maven.com — clean, minimalis, edukatif-friendly. Premium tanpa flashy.

### Colors

Palet: **putih + navy** (Maven-style). Implementasi via CSS variables di
`src/app/globals.css` (HSL triplet) + token Tailwind di `tailwind.config.ts`
(`hsl(var(--x))`). Nama token di bawah = nama yang dipakai di kode.

```css
/* globals.css — :root (nilai aktual) */
--background: 0 0% 100%;        /* white */
--foreground: 222 30% 12%;      /* near-black kebiruan (heading & body) */

/* Surface */
--surface: 40 20% 97%;          /* soft cream */
--surface-muted: 220 14% 96%;

/* Border */
--border: 220 13% 91%;
--border-strong: 222 25% 65%;   /* navy subtle — dipakai hover course card */

/* Text sekunder */
--muted-foreground: 220 9% 46%; /* dipakai via text-muted-foreground */
--subtle: 220 9% 60%;

/* Primary / brand — navy (accent utama, link, focus ring) */
--primary: 236 63% 10%;     /* navy pekat (#090b28); button primary, footer/navbar/hero bg */
--brand: 236 63% 10%;       /* alias semantik utk aksen (= primary) */
--brand-hover: 236 63% 18%; /* hover sedikit lebih terang */
--ring: 236 63% 10%;        /* focus ring navy */
--accent: 222 20% 95%;          /* interaction surface netral (hover menu) */

/* Semantic — TIDAK ikut navy */
--success: 142 76% 36%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;       /* "danger" */
```

Catatan pemakaian:
- **Button** primary = navy bg + teks putih (`bg-primary`); secondary = putih
  + border & teks navy; link = `text-primary` underline on hover.
- **Footer** = navy gelap (`bg-primary`) dengan teks putih, link
  `primary-foreground/70` → putih saat hover (Maven-style).
- **Navbar** tetap putih, border bottom subtle, active link navy.
- Hex hardcode hanya untuk aset yang tak bisa baca CSS var (favicon, OG image):
  `#090b28` = `hsl(236 63% 10%)`, disentralisasi di `BRAND_NAVY_HEX`
  (`src/config/site.ts`).

### Typography

- **Heading**: Inter (font-weight 600–700), atau Söhne kalau ada budget. Tracking tight.
- **Body**: Inter (font-weight 400–500), generous line-height (1.6–1.7)
- **Mono** (untuk code): JetBrains Mono atau Geist Mono

Scale:
- `text-xs` 12px — micro labels
- `text-sm` 14px — secondary info
- `text-base` 16px — body
- `text-lg` 18px — emphasized body
- `text-xl` 20px — small heading
- `text-2xl` 24px — section heading
- `text-3xl` 30px — page heading
- `text-4xl` 36px — hero secondary
- `text-5xl` 48px — hero primary
- `text-6xl` 60px+ — display

### Spacing

Generous. Card padding minimum 24px. Section vertical padding minimum 64px desktop, 48px mobile.

### Components Style Guide

- **Buttons**: rounded-md (6px), no gradient, subtle shadow on primary
- **Cards**: white background, border (1px solid border), no shadow OR very subtle (shadow-sm). Hover: border-strong + slight lift
- **Inputs**: border, focus ring accent color, generous padding (px-3 py-2.5)
- **Hover states**: subtle, gak heboh
- **Animation**: minimal, only for purposeful transitions (modal, dropdown). No decoration animation.

### Layout

- Max container width: `max-w-7xl` (1280px) untuk full content, `max-w-3xl` untuk reading content
- Grid gaps: 24px minimum
- Mobile-first responsive

