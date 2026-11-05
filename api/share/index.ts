import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createShare } from '../../src/utils/share'
import { redisStore } from '../_lib/store'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const forwarded = req.headers['x-forwarded-for']
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ?? 'unknown'
    const result = await createShare(req.body, ip, redisStore())
    return res.status(result.status).json(result.body)
  } catch {
    return res.status(500).json({ error: 'Sharing is not available right now' })
  }
}
