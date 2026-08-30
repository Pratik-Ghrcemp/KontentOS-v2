# KontentOS

KontentOS is a professional AI-powered Creator Operating System. Built with Next.js 14, React, TypeScript, and Supabase.

## Prerequisites
- Node.js 18+
- Supabase project
- FFmpeg for local production renders (auto-installed through `@ffmpeg-installer/ffmpeg`, or set `LOCAL_FFMPEG_PATH`)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Supabase Setup:**
   Ensure the following settings are configured in your Supabase Dashboard:
   - **Authentication > URL Configuration:** Set your Site URL to `http://localhost:3000` (or your production URL).
   - **Authentication > Providers:** Ensure Email provider is enabled.
   - **Database Migrations:** Run the initial schemas to set up tables and storage buckets:
     ```bash
     npx supabase db push
     ```
     *(Alternatively, you can manually run the SQL files located in `supabase/migrations/` in the Supabase SQL Editor).*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Production Build

To verify your code before deployment, run the release gate:
```bash
npm run verify:release
```

For faster targeted checks during development:
```bash
npm run typecheck
npm run test:render:phase-g
npm run build
```

Production deployment and rollback notes are in [docs/production-release.md](docs/production-release.md).

## Legacy Files
The older Vite/Vanilla JS version is preserved in the `legacy/` directory for reference and should not be modified.
