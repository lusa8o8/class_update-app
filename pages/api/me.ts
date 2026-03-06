import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceDb } from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(200).json({ user: null });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const db = getServiceDb();

    const { data: user, error } = await db
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', payload.id)
      .single();

    if (error || !user) return res.status(200).json({ user: null });
    return res.status(200).json({ user });
  } catch {
    return res.status(200).json({ user: null });
  }
}
