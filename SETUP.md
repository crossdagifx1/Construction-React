# HAVI'S DESIGN — Setup

A full-stack site: **Vite + React** frontend, **Express + Prisma** API, **Supabase Postgres** database, JWT admin auth, and **Supabase Storage** image uploads.

## 1. Prerequisites

- Node 18+
- A Supabase project (you already have one: `xyypfvqhvxccipjewdym`)

## 2. Environment variables

Copy `.env.example` to `.env` (already done) and fill in the values.

### Database connection (important)

Your project's **direct** host (`db.<ref>.supabase.co`) is **IPv6-only**, which most
networks can't reach. Use the **Supavisor connection pooler** instead (IPv4):

1. Supabase Dashboard → **Connect** (top bar) → **ORMs** → **Prisma**.
2. Copy the two URLs it shows into `.env`:
   - `DATABASE_URL` → the **Transaction** pooler (`...pooler.supabase.com:6543/...?pgbouncer=true`)
   - `DIRECT_URL` → the **Session** pooler (`...pooler.supabase.com:5432/...`)
3. Replace `<REGION>` (e.g. `eu-central-1`) and confirm the password.

> Tip: the dashboard fills the region in for you — just copy the whole strings.

### Image uploads

For the admin's image uploads, add your **service role key**:

- Dashboard → **Project Settings → API → `service_role` secret** → paste into
  `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

Then create a **public** storage bucket named `media`:

- Dashboard → **Storage → New bucket** → name `media` → toggle **Public** on.

(Until the key + bucket exist, everything works except uploads — you can still
paste image URLs in the admin.)

## 3. Install & initialise the database

```bash
npm install
npm run setup     # prisma generate + db push + seed
```

`setup` creates the tables and seeds them with the current site content and your
admin account (from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`).

## 4. Run

```bash
npm run dev       # starts Vite (5173) + API (4000) together
```

- Public site → http://localhost:5173
- Admin → http://localhost:5173/admin/login

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Vite + API together (development) |
| `npm run web` | Vite only |
| `npm run server` | API only |
| `npm run build` | Production build of the frontend |
| `npm run db:push` | Apply the Prisma schema to the DB |
| `npm run db:seed` | Seed content + admin |
| `npm run setup` | generate + push + seed |

## Security notes

- `.env` is gitignored. Never commit it.
- **Rotate the database password** — it was shared in plaintext during setup.
  Dashboard → Project Settings → Database → Reset password, then update `.env`.
- Change `JWT_SECRET` to a long random string for production.

## How content flows

- The public site loads everything from `GET /api/site`.
- If the API/DB is unreachable, the site falls back to built-in defaults
  (`src/lib/defaults.js`) so it always renders.
- The admin writes to the DB; refresh the public site to see changes.
