import type { NextApiRequest, NextApiResponse } from 'next';
import getDb, { getServiceDb } from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let user: any;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const db = getServiceDb();
  const { sessionId } = req.query;

  if (req.method === 'GET') {
    if (!sessionId) return res.status(400).json({ error: 'Update ID is required' });
    try {
      const { data, error } = await db.from('session_content')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return res.json(data || null);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch update content' });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Only admins can upload content' });

    const { session_id, summary, key_points, files, assessment_reminder } = req.body;
    if (!session_id) return res.status(400).json({ error: 'Update ID is required' });

    try {
      const { error } = await db.from('session_content').upsert({
        session_id,
        summary,
        key_points: key_points || [],
        files: files || [],
        assessment_reminder
      }, { onConflict: 'session_id' });

      if (error) throw error;
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to save update content' });
    }
  }

  return res.status(405).end();
}
