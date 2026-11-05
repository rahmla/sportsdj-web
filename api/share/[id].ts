import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getShare } from '../../src/utils/share.js'
import { redisStore } from '../_lib/store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
    const result = await getShare(id, redisStore())
    return res.status(result.status).json(result.body)
  } catch {
    return res.status(500).json({ error: 'Sharing is not available right now' })
  }
}
