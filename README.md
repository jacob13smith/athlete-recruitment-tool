# RecruitMe - Athlete Recruitment Tool

A B2C web application for high school volleyball athletes to create, edit, and publish public athletic profiles with personal information and embedded YouTube videos.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Prisma ORM 7.3.0 + PostgreSQL
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use SQLite for local development)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string (or SQLite for local: `file:./dev.db`)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: `http://localhost:3000` for local development

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (or use migrations)
   npm run db:push
   # OR
   npm run db:migrate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
athlete-recruitment-tool/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── athlete/           # Public profile pages
│   ├── dashboard/         # User dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── db.ts             # Prisma client
│   └── auth.ts           # NextAuth configuration
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
└── types/                # TypeScript type definitions
```

## Database Schema

### Models

- **User**: Authentication and publish metadata (slug, isPublished, publishedAt)
- **Profile**: Single model for both draft and published profiles
- **Video**: Single model for videos (no publish awareness)

### Key Design

- **Draft vs Published**: User has `draftProfile` and `publishedProfile` relations
- **Publishing**: Creates snapshot by copying draft Profile to new published Profile
- **Slug**: UUIDv4 generated on first publish, stored on User model
- **Videos**: Max 10 videos per profile, drag-and-drop ordering

## Current Status

**Phase 1 & 2 Complete**: ✅
- Next.js app structure
- Prisma schema with User, Profile, and Video models
- Database connection setup
- Basic folder structure

**Next Steps**: Phase 3 - Authentication System

## Development

- **Database Studio**: `npm run db:studio` - Visual database browser
- **Generate Client**: `npm run db:generate` - Regenerate Prisma client after schema changes
- **Migrations**: `npm run db:migrate` - Create and apply migrations
- **Push Schema**: `npm run db:push` - Push schema changes directly (dev only)

## Documentation

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed implementation phases and architecture.
