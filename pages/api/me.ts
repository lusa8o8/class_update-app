import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import getDb from '../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const db = getDb();
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await db.from('users')
      .select('id, email, role, institution, school, phone, country')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
