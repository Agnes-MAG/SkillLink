# SkillLink — Intelligent Campus Skill Exchange Platform

SkillLink lets students offer the skills they have, request the skills they need, and run the
resulting exchange through a structured lifecycle with matching, messaging, ratings and moderation.

Stack: **React 19 + Vite + Tailwind CSS 4 + Supabase** (Postgres, Auth, Storage, Realtime).

## Features

| Area | What it does |
| --- | --- |
| Auth | Email/password sign up, sign in, password reset, protected routes, suspended-account gate |
| Onboarding | 5-step wizard (basics → photo → skills offered → skills needed → done) with a weighted completion score |
| Profiles | Department/year/bio/avatar, trust stats, trust badges, reviews, availability toggle |
| Skills | CRUD for offered and needed skills, 9 categories, max 10 per type, offer/need exclusivity |
| Discover | Tiered matching (exact → category → related-skill graph) with a weighted match score and filters |
| Sessions | Full state machine: pending → accepted/declined/cancelled/expired → completed → rated, plus escalation |
| Ratings | 1–5 stars with comment, recency-weighted average, automatic trust-stat recalculation |
| Chat | Realtime messaging unlocked by an accepted session, typing indicators, read receipts, message reporting |
| Notifications | Database-trigger driven, delivered live over Supabase Realtime |
| Admin | Analytics, user suspension, session oversight, moderation queue |
| UX | Dark mode, skeletons, toasts, confirm dialogs, empty states, keyboard/ARIA support, reduced motion |

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Supabase credentials
npm run dev
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   It creates every table, enum, index, trigger, RPC, RLS policy, the `avatars` storage bucket, and
   adds `messages`/`notifications` to the realtime publication.
3. In **Project Settings → API**, copy the project URL and the `anon` public key into `.env`:

   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

4. Optional: to make yourself an admin, run
   `update public.profiles set role = 'admin' where id = '<your-user-id>';`
5. Optional: disable "Confirm email" under **Authentication → Providers → Email** for faster local
   testing.

## Business rules enforced in the database

Rules are enforced by Postgres triggers and RLS, not only in the UI, so they hold for any client:

- pending requests expire after 48 hours (`expire_stale_sessions()` RPC, called on Sessions load);
- a provider may hold at most 3 pending requests, a requester at most 5, and 10 new requests/day;
- no duplicate open request for the same requester + provider + skill;
- only legal session status transitions are accepted;
- a user cannot list the same skill name as both an offer and a need;
- ratings are recency-weighted (1.0 / 0.7 / 0.4 by age) and adjusted by the rater's own reputation;
- three 1-star ratings within 30 days auto-suspends an account and notifies admins;
- chat rows are only readable/writable by the two participants of an accepted-or-later session.

## Match score

```text
0.35 × skill match quality
0.20 × provider rating
0.15 × response-time score
0.15 × completion rate
0.10 × same-department proximity
0.05 × recent activity
```

`> 80` Excellent match · `60–80` Good match · `< 60` Possible match.

## Scripts

```bash
npm run dev       # start the dev server
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # oxlint
```

## Project structure

```text
src/
  components/   common UI primitives, layout, auth guard, feature components
  contexts/     auth + theme providers
  hooks/        useAuth, useTheme, useNotifications, useRealtimeMessages
  lib/          constants, validators (zod), matching engine, trust badges, formatting, errors
  pages/        landing, login, onboarding, dashboard, discover, sessions, chat, profile, admin
  services/     Supabase data access, one module per domain
supabase/
  migrations/   schema, RLS, triggers, RPCs, storage policies
```
