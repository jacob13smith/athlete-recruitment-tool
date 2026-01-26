# RecruitMe - Implementation & Execution Plan

## Project Overview

**RecruitMe** is a B2C web application for high school volleyball athletes to create, edit, and publish public athletic profiles with personal information and embedded YouTube videos. Profiles are shareable via unique public URLs.

**Tech Stack:**
- Next.js 14 (App Router)
- Prisma ORM 7.3.0 + PostgreSQL
- NextAuth.js v5 (Auth.js)
- TypeScript
- Tailwind CSS
- Zod (validation)

## Core Architecture: Draft vs Published Model

### Key Principle
**All draft changes are invisible on the public profile until explicitly published.**

- **Draft**: Editable fields stored in database, visible only in dashboard
- **Published Snapshot**: Immutable copy of draft at time of publishing
- **hasUnpublishedChanges**: Boolean flag derived by comparing draft vs published snapshot
- **Slug**: UUIDv4 generated on first publish, immutable thereafter

## Database Schema Design

### Models

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed with bcryptjs
  
  // PUBLISHING METADATA (stored on User)
  slug            String? @unique  // UUIDv4, generated on first publish
  isPublished     Boolean @default(false)
  publishedAt     DateTime?
  
  // RELATIONS (optional - user may not have profiles yet)
  draftProfileId     String? @unique
  draftProfile       Profile? @relation(fields: [draftProfileId], references: [id], onDelete: Cascade)
  
  publishedProfileId String? @unique
  publishedProfile   Profile? @relation(fields: [publishedProfileId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}

// SINGLE PROFILE MODEL (used for both draft and published)
model Profile {
  id        String   @id @default(cuid())
  
  // PROFILE FIELDS (same structure for draft and published)
  firstName          String?
  lastName           String?
  email              String?  // defaults to user.email, but editable
  graduationYear     String?  // 4-digit year as string
  highSchool         String?
  club               String?
  residence          String?  // free-text city
  height             String?
  primaryPosition    String?  // enum: Setter, Outside Hitter, etc.
  secondaryPosition  String?  // enum: same options
  gpa                String?
  standingTouch      String?
  spikeTouch         String?
  
  // TIMESTAMPS
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // RELATIONS
  videos         Video[]
  
  @@map("profiles")
}

// SINGLE VIDEO MODEL (used for both draft and published)
model Video {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  // VIDEO FIELDS
  url       String   // YouTube URL (required)
  title     String?
  order     Int      @default(0)  // Order within videos
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("videos")
  @@index([profileId, order])
}
```

**Key Design Decisions:**
- **Single Profile Model**: One Profile model used for both draft and published (simpler schema)
- **Single Video Model**: One Video model used for both draft and published (no publish awareness)
- **User Relations**: User model has `draftProfile` and `publishedProfile` relations (both pointing to Profile)
- **Publish Metadata**: Stored on User model (slug, isPublished, publishedAt)
- **Order Storage**: Video order is stored in the `order` field within each video model
- **Publishing Process**: When publishing, copy draft Profile (create new Profile) and copy all draft Videos to published Profile
- **hasUnpublishedChanges**: Computed by comparing draft Profile + Videos vs published Profile + Videos

## Field Specifications

### Position Enum Options
- Setter
- Outside Hitter
- Opposite / Right Side
- Middle Blocker
- Libero
- Defensive Specialist

### Validation Rules
- All fields optional
- Empty fields not rendered on public page
- Email: defaults to account email, but editable
- Graduation Year: 4-digit year string
- Videos: Max 10, YouTube URLs only
- Slug: UUIDv4, generated on first publish, immutable

## API Routes Structure

```
/app/api/
  /auth/
    /[...nextauth]/route.ts          # NextAuth handlers
    /signup/route.ts                 # User registration
  /profile/
    /route.ts                        # GET (draft), PUT (update draft)
    /publish/route.ts                # POST (publish draft → snapshot)
    /unpublish/route.ts               # POST (unpublish, keep slug)
    /status/route.ts                  # GET (hasUnpublishedChanges)
  /videos/
    /route.ts                        # GET (draft videos), POST (add video)
    /[id]/route.ts                   # PUT (update), DELETE (remove)
    /reorder/route.ts                # PUT (drag-and-drop order)
```

## Page Routes

```
/app/
  /page.tsx                          # Landing page with Login/Signup components
  /dashboard/page.tsx                # Main dashboard (draft editing)
  /athlete/[slug]/page.tsx           # Public profile (published snapshot only)
  /athlete/[slug]/not-found.tsx      # 404 for unpublished/draft
```

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] Initialize Next.js app with TypeScript
- [x] Set up Prisma + PostgreSQL connection
- [x] Configure Tailwind CSS
- [x] Set up folder structure
- [x] Verify authentication system (email + password) - Phase 3
- [x] Test database connection - Complete

**Deliverables:**
- ✅ Working Next.js app structure
- ✅ Prisma connected (schema ready)
- ✅ Basic folder structure in place
- ✅ Core files created (layout, providers, db.ts)

**Files Created:**
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx` (placeholder)
- `components/providers.tsx`
- `lib/db.ts`
- `README.md`

---

### Phase 2: Database Schema & Models ✅ COMPLETE

- [x] Design Prisma schema with single Profile and Video models
- [x] Create User model with:
  - Basic auth fields (email, password)
  - Publish metadata (slug, isPublished, publishedAt)
  - Relations: draftProfile and publishedProfile (both to Profile)
- [x] Create Profile model with:
  - All profile fields (firstName, lastName, email, etc.)
  - Back-references to User (for Prisma relation system)
  - Relation to Video[]
- [x] Create Video model:
  - Fields: url, title, order
  - Relation to Profile
  - No publish awareness
- [x] Set up relations between models
- [x] Run initial migration: `npm run db:migrate` - Complete
- [x] Generate Prisma client: `npm run db:generate` - Complete

**Deliverables:**
- ✅ Complete Prisma schema with single models
- ⏳ Database migrations - Ready to run
- ⏳ Prisma client - Ready to generate

**Files Created:**
- `prisma/schema.prisma`

---

### Phase 3: Authentication System ✅ COMPLETE

- [x] Verify/Implement NextAuth.js configuration
- [x] Create signup API route (`/api/auth/signup`)
  - Hash password with bcryptjs
  - Create user account
  - Return session
- [x] Create landing page (`/app/page.tsx`)
  - Combined login/signup page
  - Internal Login component
  - Internal Signup component
  - Toggle between login/signup modes
- [x] Set up protected route middleware
- [x] Test authentication flow - Complete

**Deliverables:**
- ✅ Working email/password authentication
- ✅ Protected dashboard route
- ✅ Combined login/signup landing page

**Files Created:**
- `app/api/auth/signup/route.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/page.tsx` (landing with login/signup)
- `app/dashboard/page.tsx` (protected dashboard)
- `components/LoginForm.tsx`
- `components/SignupForm.tsx`
- `components/LogoutButton.tsx`
- `middleware.ts`
- `lib/auth.ts`
- `lib/utils.ts` (password hashing)
- `types/next-auth.d.ts` (TypeScript types)

---

### Phase 4: Draft Profile Management ✅ COMPLETE

- [x] Create profile API route (`/api/profile/route.ts`)
  - GET: Return user's draft Profile (via user.draftProfile, create if doesn't exist)
  - PUT: Update draft Profile fields
- [x] Implement profile form component
  - All fields optional
  - Inline validation with Zod
  - Save Draft button
- [x] Create dashboard page structure
  - Athlete Information section
  - Form with all profile fields
- [x] Implement field validation
  - Email format
  - Graduation year (4 digits)
  - Position dropdowns
- [x] Test draft saving functionality - Complete
- [x] Ensure draft Profile is created on first save

**Deliverables:**
- Draft Profile CRUD API
- Draft editing form
- Save Draft functionality

**Files to Create:**
- `app/api/profile/route.ts`
- `app/dashboard/page.tsx`
- `components/ProfileForm.tsx`
- `lib/validations.ts` (Zod schemas)

---

### Phase 5: Video Management (Draft) ✅ COMPLETE

- [x] Create video API routes for draft Profile videos
  - GET `/api/videos`: List Videos for user's draft Profile
  - POST `/api/videos`: Add Video to draft Profile (max 10 validation)
  - PUT `/api/videos/[id]`: Update Video
  - DELETE `/api/videos/[id]`: Remove Video
  - PUT `/api/videos/reorder`: Update Video order
- [x] Implement YouTube URL validation
  - Extract video ID
  - Validate format
  - Inline error messages
- [x] Create video management component
  - Add video form
  - Video list with drag-and-drop
  - Max 10 videos enforcement (check Video count on draft Profile)
  - Delete/edit functionality
- [x] Integrate video component into dashboard
- [x] Test Video CRUD operations on draft Profile - Complete
- [x] Ensure order field updates correctly on reorder

**Deliverables:**
- Video management API (for draft Profile)
- Drag-and-drop video ordering (updates order field)
- Max 10 videos limit
- YouTube URL validation

**Files to Create:**
- `app/api/videos/route.ts`
- `app/api/videos/[id]/route.ts`
- `app/api/videos/reorder/route.ts`
- `components/VideoManager.tsx`
- `components/VideoEmbed.tsx`
- `lib/youtube-utils.ts`

---

### Phase 6: Publish/Unpublish System ✅ COMPLETE

- [x] Create publish API route (`/api/profile/publish/route.ts`)
  - Generate UUIDv4 slug on first publish (if user.slug is null)
  - Create new Profile for publishedProfile (snapshot of draft Profile fields)
  - Copy all Videos from draft Profile to published Profile (create new Video records)
  - Update User: set publishedProfile relation, isPublished = true, publishedAt = now()
  - Keep draft Profile unchanged
- [x] Create unpublish API route (`/api/profile/unpublish/route.ts`)
  - Set User.isPublished = false
  - Keep User.slug (immutable)
  - Keep published Profile and Videos (for future republish)
- [x] Implement hasUnpublishedChanges computation (`/api/profile/status/route.ts`)
  - Compare draft Profile fields vs published Profile fields
  - Compare draft Profile Videos (count/order/content) vs published Profile Videos (count/order/content)
  - Return boolean flag
- [x] Create publish status component
  - Show current publish status (from User.isPublished)
  - "Publish" vs "Publish Changes" button logic (based on hasUnpublishedChanges)
  - Confirmation modal with public link (using User.slug)
  - Unpublish button
  - Full clickable public URL link
- [x] Integrate publish controls into dashboard
- [x] Test publish/unpublish flow - Complete

**Deliverables:**
- Publish/unpublish API
- UUIDv4 slug generation (stored on User)
- Snapshot mechanism (copy draft Profile → new published Profile)
- hasUnpublishedChanges tracking
- Publish confirmation modal

**Files to Create:**
- `app/api/profile/publish/route.ts`
- `app/api/profile/unpublish/route.ts`
- `app/api/profile/status/route.ts`
- `components/PublishControls.tsx`
- `components/PublishModal.tsx`
- `lib/uuid-utils.ts`

---

### Phase 7: Public Profile Page ✅ COMPLETE

- [x] Create public route (`/app/athlete/[slug]/page.tsx`)
  - Fetch User by slug
  - Check User.isPublished (404 if false or doesn't exist)
  - Fetch published Profile (via user.publishedProfile)
  - Render published Profile fields only (not draft Profile)
  - Display all non-empty published fields
  - Display published Profile Videos in order (by order field)
- [x] Create 404 page for unpublished profiles
- [x] Implement YouTube video embedding
- [x] Style public profile page
  - Visually appealing
  - Mobile-first responsive
  - Clean layout
- [x] Test public profile rendering - Complete
- [x] Verify draft Profile changes don't appear until published (by design - only published Profile is fetched)

**Deliverables:**
- Public profile page
- Published Profile snapshot rendering
- Published Videos embedding
- Mobile-responsive design

**Files to Create:**
- `app/athlete/[slug]/page.tsx`
- `app/athlete/[slug]/not-found.tsx`
- `components/PublicProfile.tsx`

---

### Phase 8: Dashboard UX & Polish

- [x] Organize dashboard layout
  - Athlete Information section
  - Videos section
  - Publish Status section
- [x] Implement Save Draft button
  - Clear feedback on save (toast notifications)
  - Sticky footer positioning
  - Enabled/disabled state based on changes
- [x] Implement Publish/Publish Changes button
  - Conditional text based on hasUnpublishedChanges
  - Confirmation modal (PublishModal)
  - Display public link after publish
  - Dynamic enable/disable based on saved changes
- [x] Add read-only public link display on dashboard
- [x] Implement inline error validation
  - Field-level errors (ProfileForm)
  - Video URL errors (VideoManager)
- [x] Mobile-first responsive design
- [x] Clean, functional UI
- [x] **Minimize layout shifting during interactions**
  - [x] Reserve space for video cards (prevent grid reflow when adding/removing)
  - [x] Fixed button dimensions (prevent size changes when text/state changes)
  - [x] Reserve space for error messages (prevent form field movement)
  - [x] Smooth transitions for loading states (skeletons/placeholders)
  - [x] Stable video grid layout (consistent card sizes, prevent jumping)
  - [x] Fixed-height containers for dynamic content (buttons, status messages)
  - [x] Prevent button text width changes (use min-width or fixed width)
  - [x] Smooth add/remove animations for videos (fade in/out instead of instant)

**Deliverables:**
- Polished dashboard
- Clear user feedback
- Mobile-responsive
- Error handling
- **Stable layout with minimal shifting**

**Files to Update:**
- `components/DashboardClient.tsx`
- `components/ProfileForm.tsx`
- `components/VideoManager.tsx`
- `components/PublishControls.tsx`

---

### Phase 9: Error Handling & Validation

- [ ] Implement Zod validation schemas
  - Profile fields
  - Video URLs
  - Email format
  - Graduation year format
- [ ] Add inline error messages
  - Form field errors
  - Video URL errors
  - API error responses
- [ ] Console logging for errors
  - API route errors
  - Client-side errors
- [ ] Test error scenarios
  - Invalid email
  - Invalid YouTube URL
  - Max 10 videos exceeded
  - Duplicate video URLs

**Deliverables:**
- Comprehensive validation
- User-friendly error messages
- Error logging

**Files to Create/Update:**
- `lib/validations.ts`
- Update all API routes with validation
- Update form components with error display

---

### Phase 10: Testing & Hardening

- [ ] Manual smoke test checklist:
  - [ ] Sign up new account
  - [ ] Login
  - [ ] Create draft profile
  - [ ] Add videos (test max 10 limit)
  - [ ] Reorder videos
  - [ ] Save draft
  - [ ] Publish profile (first time)
  - [ ] View public profile
  - [ ] Make draft changes
  - [ ] Verify public profile unchanged
  - [ ] Publish changes
  - [ ] Verify public profile updated
  - [ ] Unpublish profile
  - [ ] Verify public profile returns 404
  - [ ] Republish profile
  - [ ] Verify public profile accessible again
- [ ] Test edge cases:
  - Empty profile fields
  - All fields filled
  - Invalid YouTube URLs
  - Duplicate video URLs
  - Rapid save/publish actions
- [ ] Verify security:
  - Users can only see/edit own profile
  - Draft never visible on public route
  - Published snapshot immutable
- [ ] Console log review
  - All errors logged appropriately
- [ ] Mobile responsiveness test
  - Dashboard on mobile
  - Public profile on mobile

**Deliverables:**
- Fully tested application
- All edge cases handled
- Security verified

---

### Phase 11: Documentation

- [ ] Create/Update README.md
  - Project overview
  - Setup instructions
  - Environment variables
  - Database setup
  - Running the application
  - Current state/features
  - Future roadmap
- [ ] Document API routes
- [ ] Document database schema
- [ ] Document deployment process (if applicable)

**Deliverables:**
- Complete README
- Setup documentation
- API documentation

**Files to Create/Update:**
- `README.md`

---

## Technical Decisions & Assumptions

### Draft vs Published Model
- **Decision**: Single Profile and Video models, User manages draft/published relations
- **Rationale**: Simpler schema, less duplication, easier to maintain
- **User Relations**: User has `draftProfile` and `publishedProfile` relations (both to Profile)
- **Publish Metadata**: Stored on User model (slug, isPublished, publishedAt)
- **Video Model**: Single Video model with no publish awareness
- **Order**: Video order stored in `order` field within each video model
- **Publishing**: Creates new Profile and Video records for published snapshot

### Slug Generation
- **Decision**: UUIDv4 on first publish
- **Rationale**: Opaque, immutable, collision-free
- **Implementation**: Use `crypto.randomUUID()` or `uuid` package

### Video Storage
- **Decision**: Single Video model, no publish awareness
- **Rationale**: Simpler schema, videos are just videos regardless of draft/published context
- **Order Storage**: Order stored in `order` field within each video model
- **Publishing**: Copy draft Profile's Videos to create new Video records for published Profile

### hasUnpublishedChanges
- **Decision**: Computed on-demand, not stored
- **Rationale**: Always accurate, no sync issues
- **Implementation**: Compare draft Profile + Videos vs published Profile + Videos in API route
- **Comparison Logic**: 
  - Compare all profile fields (draft Profile vs published Profile)
  - Compare video count, order, URLs, and titles (draft Profile.videos vs published Profile.videos)
  - Return true if any differences found

### Max 10 Videos
- **Decision**: Enforce in API route validation
- **Rationale**: Simple, clear error messages
- **Implementation**: Check count before allowing new video

### Error Handling
- **Decision**: Console logging only, inline validation
- **Rationale**: MVP constraint, no monitoring infrastructure
- **Future**: Could add error tracking service

---

## File Structure

```
athlete-recruitment-tool/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts
│   │   │   └── signup/
│   │   │       └── route.ts
│   │   ├── profile/
│   │   │   ├── route.ts
│   │   │   ├── publish/
│   │   │   │   └── route.ts
│   │   │   ├── unpublish/
│   │   │   │   └── route.ts
│   │   │   └── status/
│   │   │       └── route.ts
│   │   └── videos/
│   │       ├── route.ts
│   │       ├── [id]/
│   │       │   └── route.ts
│   │       └── reorder/
│   │           └── route.ts
│   ├── athlete/
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── not-found.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx                    # Landing page with Login/Signup
├── components/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── DashboardClient.tsx
│   ├── ProfileForm.tsx
│   ├── VideoManager.tsx
│   ├── VideoEmbed.tsx
│   ├── PublishControls.tsx
│   ├── PublishModal.tsx
│   └── LogoutButton.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── validations.ts
│   ├── youtube-utils.ts
│   └── uuid-utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Success Criteria

### MVP Complete When:
1. ✅ Users can sign up and log in
2. ✅ Users can create/edit draft profile
3. ✅ Users can add/manage videos (max 10, drag-and-drop)
4. ✅ Users can publish profile (generates UUIDv4 slug)
5. ✅ Public profile accessible at `/athlete/[slug]`
6. ✅ Draft changes invisible on public profile until published
7. ✅ Users can unpublish profile (404 on public route)
8. ✅ hasUnpublishedChanges correctly tracked
9. ✅ All fields optional, empty fields not rendered
10. ✅ Mobile-responsive dashboard and public profile
11. ✅ Inline validation and error messages
12. ✅ Users can only see/edit own profile

---

## Future Roadmap (Post-MVP)

- Account/profile deletion
- Email verification
- Password reset
- Profile analytics (views, etc.)
- Social sharing buttons
- Export profile as PDF
- Multiple video platforms (beyond YouTube)
- Profile templates/themes
- Search/discovery features
- Admin dashboard

---

## Notes

- **No design system required**: Use Tailwind utilities directly
- **Mobile-first**: All components responsive from the start
- **Simple solutions preferred**: Avoid over-engineering
- **Console logging only**: No external monitoring for MVP
- **Manual migrations**: Run `npm run db:migrate` when schema changes
- **Single environment**: Same setup for local and production (adjust DATABASE_URL)

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
   ```

3. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Follow implementation phases in order**

---

**Last Updated**: 2024
**Status**: Phase 1, 2, 3, 4, 5, 6 & 7 Complete
**Next Step**: Phase 8 - Dashboard UX & Polish

## Implementation Progress

- ✅ **Phase 1**: Foundation - Complete
- ✅ **Phase 2**: Database Schema & Models - Complete
- ✅ **Phase 3**: Authentication System - Complete
- ✅ **Phase 4**: Draft Profile Management - Complete
- ✅ **Phase 5**: Video Management (Draft) - Complete
- ✅ **Phase 6**: Publish/Unpublish System - Complete (Note: Run `npm run db:generate` if TypeScript errors appear)
- ✅ **Phase 7**: Public Profile Page - Complete
- ⏳ **Phase 8**: Dashboard UX & Polish
- ⏳ **Phase 9**: Error Handling & Validation
- ⏳ **Phase 10**: Testing & Hardening
- ⏳ **Phase 11**: Documentation
