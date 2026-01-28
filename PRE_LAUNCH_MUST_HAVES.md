# Pre-Launch Must-Haves — Implementation Plan

This document outlines the implementation plan for features you should add before onboarding users, plus **external services you need to set up** (all with free tiers where possible).

---

## What You Need to Set Up Externally (Quick List)

Before or while implementing, create accounts and get keys for:

1. **Sentry** (free) — [sentry.io](https://sentry.io)  
   - Create project → get **DSN**.  
   - Used for: error monitoring.

2. **Upstash Redis** (free) — [console.upstash.com](https://console.upstash.com)  
   - Create one Redis database → get **REST URL** and **REST token**.  
   - Used for: rate limiting signup/login/reset.

3. **Resend** (free) — [resend.com](https://resend.com)  
   - Create account → create **API key**.  
   - Optional: add your domain for “from” address; you can start with `onboarding.resend.dev`.  
   - Used for: password-reset emails.

4. **Database backups** (provider-dependent)  
   - In Supabase/Neon/Railway/etc.: enable automated backups and (optionally) test a restore.  
   - No new service; use whatever your DB host offers.

No credit card is required for Sentry, Upstash, or Resend free tiers. Sentry’s free plan includes 5,000 errors/month, which is enough for an MVP.

---

## External Services Summary (Free Tiers)

| Service | Purpose | Free Tier | Sign-up / Setup |
|--------|---------|-----------|------------------|
| **Sentry** | Error monitoring | 5,000 errors/month, 1 user | [sentry.io](https://sentry.io) → Create project → Get DSN |
| **Upstash Redis** | Rate limiting | 500K commands/month, 1 DB | [console.upstash.com](https://console.upstash.com) → Create Redis DB |
| **Resend** | Password-reset & transactional email | 3,000 emails/month, 100/day | [resend.com](https://resend.com) → Get API key, verify domain (or use onboarding domain for testing) |
| **Vercel / Host** | Database backups | Depends on host | Use Supabase/Neon/Railway backup UI or Vercel Postgres backups |

You can do everything below using **Sentry**, **Upstash**, and **Resend** free tiers. No credit card required for those three.

---

## Phase A: Error Monitoring (Sentry)

**Goal:** See production errors and stack traces instead of only console logs.

### A.1 — External Setup (Sentry)

1. **Create Sentry account:** [sentry.io/signup](https://sentry.io/signup)
2. **Create a project:**
   - Product: **JavaScript** (or **Next.js** if listed)
   - Project name: e.g. `recruitme`
3. **Get DSN:**  
   Settings → Project → Client Keys (DSN). It looks like:  
   `https://xxxx@xxxx.ingest.sentry.io/xxxx`
4. **Optional:** Add your production URL to “Allowed Domains” in Sentry project settings.

### A.2 — Implementation

- [ ] Install: `npm install @sentry/nextjs`
- [ ] Run Sentry wizard (if available): `npx @sentry/wizard@latest -i nextjs`  
  - Or add `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` and `instrumentation.ts` per [Next.js Sentry docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [ ] Set env in `.env.local` / Vercel:  
  `NEXT_PUBLIC_SENTRY_DSN=<your-dsn>`
- [ ] Deploy and trigger a test error; confirm it appears in Sentry.

**Deliverables:** Production errors visible in Sentry, source maps optional but recommended.

**Files:**  
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`  
- `instrumentation.ts`  
- `next.config.js` (Sentry webpack plugin)

---

## Phase B: Rate Limiting (Upstash)

**Goal:** Limit signup, login, and sensitive API routes to reduce abuse and brute force.

### B.1 — External Setup (Upstash)

1. **Create Upstash account:** [console.upstash.com](https://console.upstash.com)
2. **Create Redis database:**
   - “Create Database”
   - Name: e.g. `recruitme-ratelimit`
   - Region: closest to your app (e.g. same as Vercel)
   - Leave plan as **Free**
3. **Copy credentials:**  
   - `UPSTASH_REDIS_REST_URL`  
   - `UPSTASH_REDIS_REST_TOKEN`

### B.2 — Implementation

- [ ] Install: `npm install @upstash/ratelimit @upstash/redis`
- [ ] Add `lib/ratelimit.ts`:
  - Create Redis client from env.
  - Define limiters, e.g.:
    - Signup: 3 req / 15 min per IP
    - Login: 5 req / 15 min per IP
    - Password reset request: 3 req / 15 min per IP
- [ ] In **middleware** (or in route handlers):
  - Identify client by `x-forwarded-for` or `x-real-ip` (and fallback).
  - Call Upstash limiter before continuing.
  - Return `429 Too Many Requests` when over limit.
- [ ] Apply to:
  - [ ] `/api/auth/signup` (POST)
  - [ ] `/api/auth/[...nextauth]` (POST, for login)
  - [ ] `/api/auth/forgot-password` (POST) — add in Phase C
  - [ ] Optional: `/api/profile/image` (POST) to limit upload abuse

**Deliverables:**  
- `lib/ratelimit.ts`  
- Middleware or route-level checks  
- `.env.example` updated with `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Suggested limits (tune as needed):**

| Route | Limit | Window |
|-------|--------|--------|
| Signup | 3 | 15 min |
| Login | 5 | 15 min |
| Forgot password | 3 | 15 min |

---

## Phase C: Password Reset

**Goal:** Let users reset password via email link.

### C.1 — External Setup (Resend)

1. **Create Resend account:** [resend.com](https://resend.com)
2. **Get API key:**  
   API Keys → Create → copy key.  
   Env name: `RESEND_API_KEY`
3. **Sending identity:**
   - **Option A (easiest for MVP):** Use Resend’s onboarding domain `onboarding.resend.dev` — no DNS. (Fine for testing / low volume.)
   - **Option B (production):** Add your domain, set DNS (SPF/DKIM/DMARC) as Resend instructs, then send from `noreply@yourdomain.com`.

### C.2 — Database / Schema

- [ ] Add table or columns for reset tokens, e.g.:
  - `PasswordResetToken` (or columns on `User`):  
    `userId`, `token` (random, stored hashed or opaque), `expiresAt`, `usedAt` (optional).
- [ ] Prisma: add model and run migration.

### C.3 — Implementation

- [ ] **POST `/api/auth/forgot-password`**
  - Body: `{ email: string }`
  - Validate email, find user.
  - Create token, set expiry (e.g. 1 hour).
  - Send email via Resend with link:  
    `https://yoursite.com/reset-password?token=...`
  - Always return same generic message (“If an account exists, you’ll get an email”) to avoid email enumeration.
  - Apply rate limit (Phase B).

- [ ] **POST `/api/auth/reset-password`**
  - Body: `{ token: string, newPassword: string }`
  - Validate token (exists, not expired, not used).
  - Update user password (hash with existing bcrypt).
  - Invalidate token.
  - Optional: invalidate sessions / ask user to log in again.

- [ ] **Pages**
  - “Forgot password?” link on login page → `/forgot-password`.
  - `/forgot-password`: form with email → call `POST /api/auth/forgot-password`.
  - `/reset-password`: read `token` from query; form for new password → call `POST /api/auth/reset-password`.

- [ ] **Email template**
  - Use Resend API (or React Email) with a simple HTML/text template: app name, “Reset your password”, button/link, “Ignore if you didn’t request this.”

**Deliverables:**  
- `app/api/auth/forgot-password/route.ts`  
- `app/api/auth/reset-password/route.ts`  
- `app/forgot-password/page.tsx`  
- `app/reset-password/page.tsx`  
- Prisma model/columns + migration  
- Resend send helper (e.g. `lib/email.ts`)

**Env:**  
- `RESEND_API_KEY`  
- `NEXTAUTH_URL` or `APP_URL` for absolute links in emails

---

## Phase D: Terms of Service & Privacy Policy

**Goal:** Have legal pages and consent for launch.

### D.1 — Content (Your Responsibility)

- [ ] **Terms of Service**
  - What the service does, acceptable use, account rules, disclaimer, termination, governing law.
- [ ] **Privacy Policy**
  - What data you collect (email, profile, usage), how you use it, storage, retention, third parties (Sentry, Resend, Upstash, Vercel, DB provider), cookies, user rights (access, deletion), contact.

You can use a generator or lawyer; the plan below only covers where they live in the app.

### D.2 — Implementation

- [ ] **Pages**
  - `app/terms/page.tsx` — render Terms content (markdown or static JSX).
  - `app/privacy/page.tsx` — render Privacy content.
- [ ] **Links**
  - Footer (e.g. PublicProfile, dashboard, landing): “Terms of Service”, “Privacy Policy”.
  - Signup: optional checkbox “I agree to the Terms and Privacy Policy” linking to both; store consent in DB or assume consent-by-signup if you don’t need proof yet.

**Deliverables:**  
- `app/terms/page.tsx`  
- `app/privacy/page.tsx`  
- Footer (or shared layout) updated with links

---

## Phase E: Account Deletion

**Goal:** Let users delete their account and associated data (good practice + helps with GDPR-style expectations).

### E.1 — Implementation

- [ ] **POST `/api/auth/delete-account`** (or `DELETE /api/account`)
  - Require auth (session).
  - Option A: require current password in body for extra safety.
  - Delete or anonymize:
    - User
    - Related draft profile, published profile, videos (confirm cascade deletes in Prisma).
    - Any other user-scoped data (e.g. reset tokens, profile images in Supabase).
  - Sign out user (clear session / cookies).
  - Return success; redirect to home handled by client.

- [ ] **UI**
  - “Account” or “Settings” area (can be a single page or section in dashboard).
  - “Delete account” with confirmation modal: type “DELETE” or “my email” to confirm.
  - On confirm, call delete API then redirect to `/` and show toast.

**Deliverables:**  
- `app/api/auth/delete-account/route.ts` (or under `/api/account`)  
- `app/dashboard/settings/page.tsx` or “Account” section + modal  
- Prisma/DB: ensure `onDelete: Cascade` (or equivalent) for user → profiles, etc.

**Security:**  
- Only the authenticated user can delete their own account.  
- Do not expose other users’ data.

---

## Phase F: Database Backups (Operational)

**Goal:** Avoid permanent data loss.

### F.1 — External / Host Setup

This is done in your **database provider’s UI**, not in code.

- [ ] **If using Supabase:**  
  Project Settings → Database → “Point in Time Recovery” / backups. Enable and note retention.
- [ ] **If using Neon:**  
  Dashboard → Backups. Enable and check retention.
- [ ] **If using Railway / Render / PlanetScale:**  
  Use their backup or snapshot docs and turn on automated backups.
- [ ] **Optional:** Export a backup (e.g. `pg_dump`) once and store somewhere safe to confirm restore works.

**Deliverables:**  
- Backups enabled in provider UI  
- One successful restore test (even to a temp DB)  
- Short note in `SETUP_INSTRUCTIONS.md` or `README` listing backup provider and where to find restore docs

---

## Implementation Order

Recommended order so dependencies are clear:

1. **Phase A — Sentry**  
   No dependency on other must-haves. Do first to get visibility as you ship the rest.

2. **Phase B — Rate limiting**  
   Protects signup/login and the new password-reset route.

3. **Phase C — Password reset**  
   Depends on Resend (email) and reuses rate limiting.

4. **Phase D — Terms & Privacy**  
   Only content + pages + links. Can be done in parallel with C or E.

5. **Phase E — Account deletion**  
   Purely app + DB; no new external services.

6. **Phase F — Backups**  
   Pure ops; can be done any time, preferably before launch.

---

## Environment Variables Checklist

Add to `.env.example` and your real env (Vercel, etc.):

```bash
# Sentry (Phase A)
NEXT_PUBLIC_SENTRY_DSN=

# Upstash Redis (Phase B)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend (Phase C)
RESEND_API_KEY=

# App URL for emails (Phase C)
NEXTAUTH_URL=https://yourdomain.com
# or
APP_URL=https://yourdomain.com
```

Keep actual secrets out of the repo and document in `SETUP_INSTRUCTIONS.md` or a “Deployment” section where each var comes from (e.g. “Resend API Keys → Create”).

---

## Quick Reference: Free Tier Limits

| Service | Limit | Notes |
|--------|--------|--------|
| Sentry | 5,000 errors/month | Enough for early launch; upgrade if you scale. |
| Upstash Redis | 500K commands/month | Rate limiting uses few commands per request. |
| Resend | 3,000 emails/month, 100/day | Fine for password reset and light transactional email. |

---

## Files to Create/Update (Summary)

| Phase | New Files | Updated Files |
|-------|-----------|----------------|
| A | `sentry.*.config.ts`, `instrumentation.ts` | `next.config.js`, `.env.example` |
| B | `lib/ratelimit.ts` | `middleware.ts` or auth/signup routes, `.env.example` |
| C | `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`, `lib/email.ts`, Prisma migration for tokens | `app/page.tsx` (forgot link), `.env.example` |
| D | `app/terms/page.tsx`, `app/privacy/page.tsx` | Footer / layout components |
| E | `app/api/auth/delete-account/route.ts`, `app/dashboard/settings/page.tsx` or account section | Dashboard nav, `.env.example` if needed |
| F | — | `SETUP_INSTRUCTIONS.md` or README |

---

**Last updated:** 2024  
**Next step:** Start with Phase A (Sentry), then B (rate limiting), then C (password reset).  
After that, D–F can be done in any order or in parallel.
