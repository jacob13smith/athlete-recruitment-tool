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
