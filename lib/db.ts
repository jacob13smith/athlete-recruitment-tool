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
  // Type assertion needed for Prisma 7 adapter compatibility
  // The adapter property is valid at runtime but TypeScript types may be out of sync
  const clientOptions: any = {
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }
  return new PrismaClient(clientOptions)
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
