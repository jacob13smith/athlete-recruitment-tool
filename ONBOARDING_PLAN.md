# Dashboard Onboarding Flow — Plan

## Goals

- **Reduce confusion** — New users understand *what* RecruitMe is and *why* they’re here (build a shareable recruitment profile for coaches/recruiters).
- **Clarify the workflow** — Draft → Save → Publish. Save stores your draft; Publish makes it live. Users often conflate these.
- **Increase completion** — Encourage profile completeness (photo, basics, at least one video) and first publish.
- **Keep it lightweight** — Short, skippable, and non-blocking. No long slide decks.

---

## Dashboard Snapshot (What We’re Teaching)

| Section | Purpose |
|--------|---------|
| **Athlete Information** | Photo, name, contact, school, grad year, position, measurements, GPA, etc. All editable; lives in your *draft* until you Save. |
| **Videos** | Up to 10 YouTube links. Add highlights / game footage. |
| **Publish Status** | Publish / Unpublish. When published, you get a shareable link like `yoursite.com/athlete/your-name`. |
| **Save Changes** (footer) | Persists draft edits. Enable Publish only after saving. |

**Mental model:** Draft (private) ↔ Save (persist) ↔ Publish (public link). You can edit the draft anytime and publish again to update the live profile.

---

## Recommended Approach: Hybrid (Welcome Modal + Optional Tour)

### 1. Welcome modal (first visit only)

- **When:** First time a user lands on the dashboard (see “First-time detection” below).
- **Content:** Single, short modal.
  - Headline: e.g. “Build your recruitment profile”
  - 2–3 bullets: what they’ll do (add info, add videos, save, publish, share link).
  - **Primary CTA:** “Got it” / “Start” — closes modal, shows dashboard.
  - **Secondary:** “Show me around” — closes modal and starts the optional tour (step 2).
- **Design:** Simple, minimal. Match existing app styling (Tailwind, etc.). No carousel.

### 2. Optional “Show me around” tour

- **When:** User clicks “Show me around” in the welcome modal, or “Replay onboarding” in Settings (optional).
- **Style:** Spotlight / tooltip tour that highlights real UI elements in order.
- **Steps (example):**

  | Step | Target | Message (short) |
  |------|--------|------------------|
  | 1 | Athlete Information section | “Add your photo and basics — name, school, position. This is your draft.” |
  | 2 | Videos section | “Add up to 10 YouTube videos. Highlights and game footage help recruiters.” |
  | 3 | Publish Status section | “When you’re ready, Save Changes first, then Publish. You’ll get a shareable link.” |
  | 4 | Save Changes footer button | “Save stores your draft. Publish makes it live. You can edit and publish again anytime.” |
  | 5 | Settings (header) | “Change password, delete account, or replay this tour in Settings.” |

- **Behaviour:** Next / Back / Skip. Skip or completing the tour marks the tour as done. “Replay onboarding” resets only the tour, not the welcome modal.

### 3. Optional “Get started” checklist (later enhancement)

- **When:** Dashboard loaded, user has dismissed onboarding.
- **Content:** Small collapsible checklist, e.g. “Get started” in the sidebar or above the first section.
- **Items:** e.g. “Add profile photo”, “Fill name & school”, “Add at least one video”, “Save changes”, “Publish profile”.
- **Behaviour:** Check off from real data (profile, videos, publish status). Hides or minimizes when all done. Complements the tour; not required for v1.

---

## First-Time Detection

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **A. `User` flag in DB** | Persistent across devices, survives clear storage | Requires migration, API to set flag |
| **B. `localStorage`** | No backend changes, fast to ship | Per-device; lost on clear/storage |
| **C. Heuristic** | No new fields | “First time” is inferred (e.g. no draft profile, first dashboard visit) |

**Recommendation for v1:** **A. DB flag**

- Add `hasCompletedOnboarding` (or `onboardingCompletedAt`) to `User`.
- Dashboard (or a small onboarding wrapper) checks it once on load.
- When user dismisses the welcome modal (and optionally finishes or skips the tour), call an API that sets the flag.
- **Settings:** “Replay onboarding” clears only the *tour* state (e.g. `localStorage` or a separate “tour completed” flag). Welcome modal stays “seen” via DB.

**Fallback:** If you want to ship without backend changes, use **B** (`localStorage` key like `recruitme-onboarding-done`) and document that it’s per-device. You can later switch to **A** and migrate.

---

## UX Principles

1. **Skippable** — Users can close the modal or skip the tour immediately.
2. **Short** — Welcome modal: &lt; 30 seconds to read. Tour: 5 steps, &lt; 1 min.
3. **Non-blocking** — They can use the dashboard even if they skip. No gate before editing.
4. **Repeatable** — “Replay onboarding” (tour only) in Settings for users who want a refresher.
5. **Mobile-friendly** — Modal and tooltips work on small screens (stack, larger tap targets).

---

## Implementation Outline

### Phase 1: Welcome modal + first-time detection

1. **Backend (if using DB):**
   - Add `hasCompletedOnboarding Boolean @default(false)` to `User`.
   - Migration + API route, e.g. `POST /api/profile/onboarding-complete` (auth required, sets flag).
2. **Frontend:**
   - On dashboard load, fetch onboarding status (or derive from `User` in session).
   - If not completed: render a **WelcomeModal** ( overlay + card with copy and “Got it” / “Show me around”).
   - On “Got it”: call onboarding-complete API, set local state so we don’t show again this session.
   - On “Show me around”: same API call, then start tour.

### Phase 2: “Show me around” tour

1. **Library or custom:**
   - **Library:** e.g. [Driver.js](https://driverjs.com/) or [Shepherd.js](https://shepherdjs.dev/) for spotlight + steps. Easy to wire to existing sections.
   - **Custom:** Fixed positions or `data-*` attributes on sections, small tooltip components, Next/Back/Skip. More control, more work.
2. **Steps:** Map to Athlete Information, Videos, Publish Status, Save Changes footer, Settings. Use stable selectors (e.g. `data-onboarding="athlete-info"`).
3. **Completion:** On “Skip” or “Done”, mark tour completed (e.g. `localStorage` or API). Don’t show welcome modal again.

### Phase 3 (optional): Settings + checklist

- Add “Replay onboarding” in Settings → clears tour state, triggers tour again (not the welcome modal).
- Optionally add a “Get started” checklist component and wire it to profile/videos/publish state.

---

## Copy Suggestions (Welcome Modal)

**Headline:**  
“Build your recruitment profile”

**Body (bullets):**
- Add your photo, info, and volleyball highlights.
- Save your draft, then publish to get a shareable link.
- Coaches and recruiters can view your profile at that link.

**Primary button:** “Got it”  
**Secondary button:** “Show me around”

---

## Copy Suggestions (Tour Steps)

Use the table in “Optional ‘Show me around’ tour” above. Keep each step to 1–2 short sentences. Avoid jargon (“draft”, “publish”) until you’ve introduced them in the welcome modal.

---

## Open Decisions

- **Modal vs. first slide of a carousel:** Recommendation: single welcome modal. Carousels often get skipped entirely; one clear screen is enough.
- **Tour highlight style:** Spotlight (dim rest of page) vs. simple tooltips next to each section. Spotlight feels more “guided”; tooltips are lighter. Driver.js/Shepherd support both.
- **“Get started” checklist:** Defer to v2 unless you want a quick win; helpful but not required for the first version.

---

## Success Metrics (Optional)

- % of new users who open the dashboard and complete onboarding (modal dismiss or tour finish).
- % who add profile photo, add ≥1 video, or publish within 7 days.
- Support tickets or feedback about “how does Save vs Publish work?” (goal: decrease over time).

---

## Summary

| Item | Recommendation |
|------|----------------|
| **Modality** | Welcome modal + optional spotlight/tooltip tour |
| **First-time detection** | DB flag `hasCompletedOnboarding` on `User` (or `localStorage` for v1 quick ship) |
| **Steps** | 5-step tour: Athlete Info → Videos → Publish Status → Save footer → Settings |
| **Key message** | Draft → Save → Publish; shareable link when published |
| **Replay** | “Replay onboarding” in Settings (tour only) |

This gives you a clear, implementable plan. Start with the welcome modal + DB (or `localStorage`) flag; add the tour next; then Settings replay and optionally the checklist.

---

## Implementation (done)

- **DB:** `User.hasCompletedOnboarding`; migration `20250128180000_add_has_completed_onboarding`.
- **API:** `GET /api/profile/onboarding-status`, `POST /api/profile/onboarding-complete`.
- **UI:** `WelcomeModal`, `DashboardOnboarding` (driver.js tour), `data-onboarding` on dashboard sections, “Replay onboarding” in Settings.
- **Setup:** Run `npm install` (driver.js), then `npm run db:push` or `npm run db:migrate` / `db:migrate:deploy`.
