# Email Verification Plan — Block Publishing Until Verified

## Goals

- **Verify ownership** — Ensure the user controls the email address they signed up with.
- **Block publishing** — Users cannot publish their profile until their email is verified. All other dashboard actions (edit draft, save, unpublish, settings) remain allowed.
- **Reuse existing patterns** — Mirror the password-reset flow (tokens, Resend, verify-via-link) for consistency and less new code.

---

## User Flows

### New signup

1. User signs up → account created, `emailVerified = false`.
2. We send a verification email with a link (e.g. ` /verify-email?token=...`).
3. User can log in immediately and use the dashboard (edit, save, unpublish).
4. **Publish** is disabled until they verify.

### Verify via link

1. User clicks link in email → ` /verify-email?token=...`.
2. Page either auto-submits the token to the verify API or shows a "Verify" button; API validates token, marks user verified, invalidates token.
3. On success → redirect to dashboard (or home). User can now publish.

### Resend verification (unverified user on dashboard)

1. User sees "Verify your email to publish" and a "Resend verification email" action.
2. User clicks → `POST /api/auth/resend-verification` (auth required, rate limited).
3. New token created, new email sent. Same flow as initial verification.

### Existing users (before this feature)

- **Grandfathering:** Treat existing users as verified so we don’t block them.
- Migration: set `emailVerified = true` for all users created before the migration (or via a one-off update). New users get `emailVerified = false` until they verify.

---

## Data Model

### 1. `User` model

Add a boolean (or timestamp) to track verification:

```prisma
emailVerified Boolean @default(false)
```

- `true` → verified (can publish).
- `false` → not verified (publish blocked).

Optional: `emailVerifiedAt DateTime?` for auditing. For v1, a boolean is enough.

### 2. `EmailVerificationToken` model

Same pattern as `PasswordResetToken`:

| Field     | Type     | Notes                                      |
|----------|----------|--------------------------------------------|
| `id`     | `String` | `@id @default(cuid())`                     |
| `userId` | `String` | FK → `User`, `onDelete: Cascade`           |
| `token`  | `String` | `@unique`, random (e.g. `crypto.randomBytes(32).hex`) |
| `expiresAt` | `DateTime` | e.g. 24 hours from creation            |
| `usedAt` | `DateTime?` | Set when token is consumed              |
| `createdAt` | `DateTime` | `@default(now())`                     |

Indexes: `@@index([token])`, `@@index([userId])`.

- **Create** on signup and on "Resend verification".
- **Consume** in verify-email API: validate, mark used, set `User.emailVerified = true`, delete other verification tokens for that user.
- **Expiry:** e.g. 24 h (configurable). Clear error if expired; prompt to use "Resend verification".

---

## API Routes

### `POST /api/auth/verify-email`

- **Body:** `{ "token": "..." }`.
- **Auth:** Not required (user may not be logged in when clicking email link).
- **Logic:**
  - Find `EmailVerificationToken` by `token`.
  - If missing, expired (`expiresAt < now`), or `usedAt != null` → 400 with clear message.
  - Update `User`: `emailVerified = true` (and optionally `emailVerifiedAt = now`).
  - Set `usedAt = now` on token, delete other verification tokens for this user.
- **Response:** `{ "message": "Email verified successfully" }` → 200.

### `POST /api/auth/resend-verification`

- **Auth:** Required (session).
- **Rate limit:** Same idea as forgot-password (e.g. 3 per 15 min per user or per IP).
- **Logic:**
  - If `User.emailVerified` → 400 "Email is already verified".
  - Delete existing verification tokens for this user, create new token, send verification email via Resend.
- **Response:** 200 with generic success message (don’t reveal whether email was sent, to avoid enumeration; though we’re authenticated, so we could be more specific—either way is fine).

---

## Publish Blocking

### API: `POST /api/profile/publish`

- After auth and "user exists" checks, **before** doing any publish logic:
  - Load `User.emailVerified` (or already have it from user fetch).
  - If `!emailVerified` → `403` with `{ "error": "Verify your email to publish your profile." }`.
- Unpublish stays unchanged; only publish is gated.

### UI: Profile status and Publish controls

- **`GET /api/profile/status`**  
  Extend response with `emailVerified: boolean`. Use existing user fetch; no extra DB call if you already load the user.

- **`PublishControls`**
  - When `!emailVerified`:
    - Disable the **Publish** button.
    - Show a short message: e.g. "Verify your email to publish your profile."
    - Expose **Resend verification email** (link or button) that calls `POST /api/auth/resend-verification`.
  - Unpublish remains enabled (verified users can unpublish; unverified users who were grandfathered or previously verified can too).

---

## Session / JWT

- **Optional but useful:** Add `emailVerified` to the JWT/session (e.g. in `jwt` and `session` callbacks in `lib/auth.ts`).
- **Benefit:** Dashboard can show "verify email" UI without an extra status fetch, and we can still enforce server-side in publish API.
- **Source of truth:** DB. Session is a cache; publish API must check DB (or user object fetched from DB) before allowing publish.

---

## Email (Resend)

- **New function:** `sendVerificationEmail(email: string, token: string)` in `lib/email.ts`.
- **Link:** `{APP_URL}/verify-email?token={token}`.
- **Content:** Short, clear "Verify your RecruitMe email" CTA; mention that verification is required to publish your profile. Reuse styling from password-reset email (branding, footer).
- **From / env:** Use existing `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; no new env vars.

---

## Verify-email Page

- **Route:** `app/verify-email/page.tsx` (or `verify-email/page.tsx`).
- **Behavior:**
  - Read `token` from `?token=...`.
  - If missing → show "Invalid or missing verification link" and link to login/dashboard or resend.
  - If present → call `POST /api/auth/verify-email` with `{ token }` (on load or via "Verify" button).
  - Success → show "Email verified! You can now publish your profile." and redirect to dashboard (or home) after a short delay.
  - Error (invalid/expired/used) → show clear message and "Resend verification email" (links to dashboard or a resend flow; resend requires auth, so dashboard is natural).

---

## Signup Integration

- In `POST /api/auth/signup`, **after** creating the user:
  1. Create `EmailVerificationToken` (expiry e.g. 24 h).
  2. Call `sendVerificationEmail(user.email, token)`.
- Don’t block signup or login on verification; only block publish.
- Consider catching email send failures: log them, but still return 201 for signup. User can use "Resend verification" later.

---

## Grandfathering Existing Users

- **Migration:** `UPDATE users SET "emailVerified" = true WHERE ...` (e.g. all existing users, or everyone created before a cutoff).
- **New users:** `emailVerified` defaults to `false`; they must verify before publishing.

---

## Rate Limiting

- **Resend verification:** Reuse a limiter similar to `forgotPasswordLimiter` (e.g. 3 per 15 min per user ID or per IP). Add `resendVerificationLimiter` in `lib/ratelimit.ts` and use it in `POST /api/auth/resend-verification`.

---

## Edge Cases & Future Work

| Case | Recommendation |
|------|----------------|
| User changes email | Future: if we add email change, set `emailVerified = false` and require re-verification; optionally send verification to new address. |
| Token expired | Clear error + "Resend verification email" in verify-email page and dashboard. |
| Already verified | Resend API returns 400 "Already verified"; dashboard hides "Resend" when verified. |
| Email send fails | Log error; don’t fail signup. Rely on "Resend verification" for retries. |

---

## Implementation Checklist

- [ ] **Schema:** Add `User.emailVerified` and `EmailVerificationToken` model; migration + grandfathering migration.
- [ ] **Email:** `sendVerificationEmail` in `lib/email.ts`, link to ` /verify-email?token=...`.
- [ ] **Signup:** Create token + send verification email after user create.
- [ ] **Verify API:** `POST /api/auth/verify-email` (validate token, update user, invalidate token).
- [ ] **Resend API:** `POST /api/auth/resend-verification` (auth, rate limit, create new token, send email).
- [ ] **Publish API:** Check `emailVerified` before publishing; return 403 and clear error if not verified.
- [ ] **Status API:** Add `emailVerified` to `GET /api/profile/status` response.
- [ ] **PublishControls:** Disable Publish when `!emailVerified`, show "Verify your email…" and "Resend verification email".
- [ ] **Verify-email page:** Handle `?token=`, call verify API, show success/error, redirect on success.
- [ ] **Session (optional):** Add `emailVerified` to JWT/session for dashboard UX.
- [ ] **Rate limiting:** `resendVerificationLimiter` and use in resend API.
- [ ] **Tests:** Verify signup sends email; verify link verifies user; publish blocked until verified; resend works and is rate limited.

---

## Summary

- **DB:** `User.emailVerified`, `EmailVerificationToken` table; grandfather existing users.
- **APIs:** Verify (public), Resend (auth + rate limit); publish checks `emailVerified`.
- **UI:** Status exposes `emailVerified`; Publish disabled + "Verify your email" + "Resend verification" when unverified; verify-email page for link flow.
- **Email:** Resend-based verification email with link; reuse existing config.

This keeps email verification scoped to "block publish until verified" while reusing patterns you already have for password reset and Resend.
