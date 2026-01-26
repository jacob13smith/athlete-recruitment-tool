import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  
  // During build, DATABASE_URL might not be available
  // Create client without adapter - it will work at runtime when DATABASE_URL is set
  if (!connectionString) {
    // Return a client that will fail gracefully at runtime
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    // @ts-expect-error - Prisma 7 adapter type compatibility issue
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
