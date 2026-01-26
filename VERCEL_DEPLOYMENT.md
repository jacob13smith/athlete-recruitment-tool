# Vercel Deployment Guide

## Required Environment Variables

Make sure to set these environment variables in your Vercel project settings:

### 1. **DATABASE_URL** (Required)
Your PostgreSQL connection string.
```
postgresql://user:password@host:5432/database?schema=public
```

**Where to get it:**
- If using Vercel Postgres: It's automatically provided as `POSTGRES_PRISMA_URL` or `POSTGRES_URL_NON_POOLING`
- If using external database (Neon, Supabase, Railway, etc.): Copy the connection string from your database provider

**Important:** Use the **non-pooling** connection string for Prisma with the adapter.

### 2. **NEXTAUTH_SECRET** (Required)
A random secret string for encrypting JWT tokens.

**Generate one:**
```bash
openssl rand -base64 32
```

Or use any secure random string generator. This should be a long, random string.

### 3. **NEXTAUTH_URL** (Required)
Your production URL.

**For Vercel:**
- If using Vercel's default domain: `https://your-project.vercel.app`
- If using custom domain: `https://yourdomain.com`

**Important:** Must include `https://` and no trailing slash.

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
   - **Environment**: Production, Preview, Development (select all)
   
   Repeat for `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

4. **Redeploy** your application after adding environment variables

## Common Issues

### 500 Error on `/api/auth/[...nextauth]`

**Possible causes:**
1. **Missing NEXTAUTH_SECRET** - Check Vercel environment variables
2. **Missing or incorrect DATABASE_URL** - Verify the connection string is correct
3. **Database not accessible** - Check if your database allows connections from Vercel's IPs
4. **NEXTAUTH_URL mismatch** - Must match your actual deployment URL

### Database Connection Issues

- Ensure your database provider allows connections from Vercel's IP addresses
- Some providers require SSL connections - add `?sslmode=require` to your connection string
- Verify the database user has proper permissions

## Testing

After deployment:
1. Check Vercel's function logs for detailed error messages
2. Try accessing `/api/auth/signin` to test the route
3. Check that environment variables are set correctly in Vercel dashboard

## Next Steps

1. Set all three environment variables in Vercel
2. Redeploy the application
3. Check Vercel's function logs if errors persist
4. Verify database is accessible and schema is pushed/migrated
