# 49GIG

**49GIG** is a full-stack platform for hiring freelance talent and managing engagements end to end—from discovery and contracts to funding, milestones, billing, and support workflows. The product is built around a **refined, dashboard-first experience**: responsive layouts, thoughtful typography, light and dark themes, and UI patterns designed for clarity at scale.

---

## Highlights

- **Client & freelancer workspaces** — Dedicated dashboards, hire lifecycle tracking, and role-appropriate views.
- **Trust & operations** — Escrow-aware flows, structured billing, transaction history, and dispute handling aligned to real collaboration models (including team hires).
- **Modern frontend** — [Next.js](https://nextjs.org/) App Router, [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and accessible components ([Radix UI](https://www.radix-ui.com/)) with cohesive motion and feedback.
- **Realtime backend** — [Convex](https://www.convex.dev/) for queries, mutations, and reactive data—keeping the UI in sync without brittle glue code.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js · React |
| Styling | Tailwind CSS · class-variance-authority |
| UI primitives | Radix UI · Lucide icons |
| Backend / DB | Convex |
| Payments | Stripe |
| Forms & validation | React Hook Form · Zod |
| Email | React Email · Resend |

Other notable libraries include Framer Motion, TipTap (rich text), and Recharts where analytics or editing call for them.

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm** (or compatible package manager)
- A **Convex** project for local development ([Convex docs](https://docs.convex.dev/))
- Environment variables as required by your deployment (Stripe, Convex, email, etc.)—see project `.env` examples or internal docs.

---

## Local development

Install dependencies:

```bash
npm install
```

Start the Next.js app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

In a **second terminal**, run the Convex development server (syncs functions and keeps the dev deployment updated):

```bash
npx convex dev
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

## Deployment

Deploy the frontend where you host Next.js apps (for example [Vercel](https://vercel.com/)). Configure Convex for **production** per [Convex deployment guidance](https://docs.convex.dev/production), and set production environment variables for Stripe, auth, and third-party services.

---

## Project philosophy

49GIG aims to feel **precise and calm**: information hierarchy first, restrained use of color (including gold accenting in brand contexts), and interfaces that stay legible on mobile and desktop. Contributions should preserve accessibility, consistency with existing patterns, and separation of concerns between UI, Convex functions, and shared business logic.

---

## License

This repository is **private**. All rights reserved unless otherwise stated by the project owners.
