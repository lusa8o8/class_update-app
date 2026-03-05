import type { NextApiRequest, NextApiResponse } from 'next';
import getDb from '../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  try {
    const db = getDb();
    const { data: user, error } = await db.from('users').select('*').eq('email', email).single();

    if (error || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${24 * 60 * 60}`);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
