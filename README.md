# HAVI Construction - Full Stack Website

A premium, full-stack web application designed for a professional construction and design company (HAVI). Built with a React frontend, Express API backend, Prisma ORM (connected to Supabase PostgreSQL), and Supabase Storage for media uploads.

This repository is pre-configured for a unified deployment on Vercel (both frontend and backend).

---

## 🚀 Key Features

*   **Premium React Frontend**: Dynamic, modern, responsive landing pages and admin dashboard styled with Tailwind CSS.
*   **Express API Backend**: Secure REST endpoints for content management, authentication, contact submissions, and media uploads.
*   **Prisma ORM**: Robust database queries, schema definition, and automatic migrations connected to Supabase Postgres.
*   **Supabase Integration**:
    *   **Postgres Database**: Relational database storage.
    *   **Storage Buckets**: S3-compatible media asset storage for portfolio gallery uploads.
*   **Admin Dashboard**: Manage services, process steps, portfolio projects (with live image uploads), testimonials, and client contact messages.
*   **Vercel Serverless Compatible**: Out-of-the-box support for Vercel unified frontend & serverless backend routing.

---

## 📂 Project Structure

```text
├── api/                  # Vercel serverless function entrypoint
│   └── index.js          # Routes API requests to the Express server
├── prisma/               # Database schema and seed files
│   ├── schema.prisma     # Prisma DB models
│   └── seed.js           # Admin seed scripts
├── public/               # Static web assets
├── server/               # Express backend codebase
│   ├── routes/           # API routes (auth, site, contact, crud)
│   ├── db.js             # Prisma Client instance
│   ├── supabase.js       # Supabase Client configuration
│   └── index.js          # Core Express server logic
├── src/                  # React client codebase
│   ├── components/       # Shared UI components
│   ├── pages/            # Page components (Home, Portfolio, Admin Dashboard, etc.)
│   ├── sections/         # Homepage sections (Hero, About, Services, etc.)
│   └── main.jsx          # React app entry point
├── vercel.json           # Vercel deployment configuration
├── vite.config.js        # Vite compilation configuration
└── package.json          # Combined project dependencies & scripts
```

---

## 🛠️ Local Setup and Installation

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add the following:
```env
# Database (Supabase Postgres)
DATABASE_URL="postgresql://...pooler..."
DIRECT_URL="postgresql://...direct..."

# Auth
JWT_SECRET="your-long-random-jwt-secret"
JWT_EXPIRES_IN="7d"

# Admin Seed Credentials
ADMIN_EMAIL="admin@havisdesign.com"
ADMIN_PASSWORD="your-password"

# Supabase Storage (for uploads)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_BUCKET="media"

# Local Server Port
PORT=4000
```

### 3. Initialize the Database (Prisma)
Generate the client, run migrations, and seed the initial admin account:
```bash
npm run setup
```

### 4. Run the Project Locally
Run both frontend and backend concurrently in development mode:
```bash
npm run dev
```
*   **Frontend**: http://localhost:3000 (or the port specified by Vite)
*   **Backend API**: http://localhost:4000

---

## 📦 Deployment on Vercel

This repository contains a `vercel.json` file that maps `/api/*` requests to the Express serverless function and routes everything else to the static Vite frontend.

### To Deploy:
1. Push this repository to your GitHub account (`crossdagifx1`).
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Under **Project Settings**, configure all environment variables listed in the `.env` section.
4. Deploy! Vercel will run `npm run build` which automatically builds the static frontend and triggers `prisma generate` via `postinstall` to bundle the Prisma client.
