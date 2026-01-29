# Quick Start Guide - Run in Git Bash

Since the terminal tool uses PowerShell, please run these commands directly in **Git Bash**:

## Step 1: Navigate to Project
```bash
cd /c/Users/jacob/Desktop/projects/athlete-recruitment-tool
```

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Generate Prisma Client
```bash
npm run db:generate
```

## Step 4: Set Up Database
```bash
npm run db:push
```

## Step 5: Start Development Server
```bash
npm run dev
```

## Alternative: Use the Setup Script

You can also use the automated setup script:

```bash
cd /c/Users/jacob/Desktop/projects/athlete-recruitment-tool
chmod +x setup.sh
./setup.sh
```

Then to start the server:
```bash
./start.sh
```

Or simply:
```bash
npm run dev
```

---

**Note:** The app will be available at http://localhost:3000 once the dev server starts.

## Troubleshooting

### "The table `password_reset_tokens` does not exist"

The schema was updated with a `PasswordResetToken` model for forgot-password flow. Sync the database:

```bash
npm run db:push
```

Or, if you use Prisma Migrate:

```bash
npm run db:migrate
```

### Email verification (new tables / columns)

The schema adds `User.emailVerified` and `EmailVerificationToken` for email verification. Sync the database:

```bash
npm run db:push
```

Or run migrations:

```bash
npm run db:migrate
```

Then regenerate the Prisma client:

```bash
npm run db:generate
```
