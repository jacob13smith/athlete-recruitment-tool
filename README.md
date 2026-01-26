# Athlete Recruitment Tool

A web application for high school volleyball players to manage profiles, share with recruiters and coaches, upload YouTube videos, manage stats, and publish/unpublish profiles with unique URLs.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set your `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)

3. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Documentation

- [Setup Instructions](./SETUP_INSTRUCTIONS.md) - Detailed setup and testing guide
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Full project roadmap and phases

## Current Status

✅ **Phase 1 & 2 Complete**: Project setup, database configuration, and authentication system
- User registration and login
- Password hashing and verification
- Session management
- Protected routes

## Next Steps

- Profile management features
- YouTube video integration
- Profile publishing with unique URLs
- Stats management

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Protected dashboard
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/            # React components
├── lib/                   # Utilities and configurations
├── prisma/                # Database schema
└── types/                 # TypeScript type definitions
```
