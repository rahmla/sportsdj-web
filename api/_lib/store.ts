import { Redis } from '@upstash/redis'
import type { ShareStore } from '../../src/utils/share.js'

/** Redis-backed store. The Upstash integration sets KV_REST_API_* (or UPSTASH_REDIS_REST_*). */
export function redisStore(): ShareStore {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Share storage is not configured')
  const redis = new Redis({ url, token })
  return {
    async get(key) {
      const v = await redis.get<unknown>(key)
      if (v === null || v === undefined) return null
      return typeof v === 'string' ? v : JSON.stringify(v)
    },
    async set(key, value, ttl) { await redis.set(key, value, { ex: ttl }) },
    async touch(key, ttl) { await redis.expire(key, ttl) },
    async incr(key, windowSeconds) {
      const n = await redis.incr(key)
      if (n === 1) await redis.expire(key, windowSeconds)
      return n
    },
  }
}
