import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMongoDb } from '@/lib/db/mongodb'
import { Redis } from 'ioredis'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      app: 'healthy',
      postgres: 'unknown',
      mongodb: 'unknown',
      redis: 'unknown',
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
  }

  // Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.postgres = 'healthy'
  } catch (error) {
    health.services.postgres = 'unhealthy'
    health.status = 'degraded'
  }

  // Check MongoDB
  try {
    const db = await getMongoDb()
    await db.command({ ping: 1 })
    health.services.mongodb = 'healthy'
  } catch (error) {
    health.services.mongodb = 'unhealthy'
    health.status = 'degraded'
  }

  // Check Redis
  if (process.env.REDIS_URL) {
    try {
      const redis = new Redis(process.env.REDIS_URL)
      await redis.ping()
      await redis.quit()
      health.services.redis = 'healthy'
    } catch (error) {
      health.services.redis = 'unhealthy'
      health.status = 'degraded'
    }
  } else {
    health.services.redis = 'not_configured'
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}