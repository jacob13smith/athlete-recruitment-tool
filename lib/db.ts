import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  
  // During build, DATABASE_URL might not be available
  // Create client without adapter - it will work at runtime when DATABASE_URL is set
  if (!connectionString) {
    console.warn('DATABASE_URL is not set. Database operations will fail at runtime.')
    // Return a client that will fail gracefully at runtime
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  const adapter = new PrismaPg({ connectionString })
  // Prisma 7 with adapter: The adapter is valid at runtime
  // IMPORTANT: Run `npm run db:generate` after schema changes to update TypeScript types
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any)
}

const _db = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db

// Type helper to ensure models are accessible
// This works around Prisma 7 adapter type generation issues
// Run `npm run db:generate` to regenerate types after schema changes
// The models exist at runtime - this type assertion makes TypeScript aware of them
type PrismaClientWithModels = PrismaClient & {
  profile: {
    create: (args: any) => Promise<any>
    findUnique: (args: any) => Promise<any>
    findMany: (args?: any) => Promise<any[]>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  video: {
    create: (args: any) => Promise<any>
    findUnique: (args: any) => Promise<any>
    findMany: (args?: any) => Promise<any[]>
    findFirst: (args?: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  user: {
    create: (args: any) => Promise<any>
    findUnique: (args: any) => Promise<any>
    findMany: (args?: any) => Promise<any[]>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
  }
}

// Export with type assertion - models exist at runtime after prisma generate
// Using 'as unknown as' to bypass the type check while preserving model access
export const db = _db as unknown as PrismaClientWithModels
