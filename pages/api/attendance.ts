import type { NextApiRequest, NextApiResponse } from 'next';
import getDb, { getServiceDb } from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let user: any;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const db = getServiceDb();
  if (user.role !== 'student') return res.status(403).json({ error: 'Only students can mark attendance' });

  const { sessionId, status } = req.body;
  if (!sessionId || !status) return res.status(400).json({ error: 'Update ID and status are required' });
  if (!['attended', 'missed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const { error } = await db.from('attendance').upsert({
      student_id: user.id,
      session_id: sessionId,
      status
    }, { onConflict: 'student_id, session_id' });

    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }
}
