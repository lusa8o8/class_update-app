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

  if (req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const { data: feedback, error } = await db.from('feedback')
        .select(`
          *,
          users!student_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the results to match the previous structure
      const formattedFeedback = feedback.map((f: any) => ({
        ...f,
        student_email: f.users?.email,
        student_phone: f.users?.phone || 'N/A', // Using N/A if phone is missing
        student_name: f.users?.full_name
      }));

      return res.json(formattedFeedback);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'student') return res.status(403).json({ error: 'Students only' });
    const { type, content } = req.body;
    if (!type || !content) return res.status(400).json({ error: 'Type and content are required' });

    try {
      const { error } = await db.from('feedback').insert({
        student_id: user.id,
        type,
        content
      });

      if (error) throw error;
      return res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  return res.status(405).end();
}
