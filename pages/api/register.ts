import type { NextApiRequest, NextApiResponse } from 'next';
import getDb from '../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, role, institution, school, phone, country } = req.body;

  if (!email || !password || !role || !institution || !school || !country) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (role === 'student' && !phone) {
    return res.status(400).json({ error: 'Phone number is required for students' });
  }

  try {
    const db = getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await db.from('users').insert({
      email,
      password: hashedPassword,
      role,
      institution,
      school,
      phone: phone || null,
      country
    }).select('id').single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw error;
    }

    const userId = data.id;

    const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '7d' });

    res.setHeader('Set-Cookie', serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    }));

    return res.status(201).json({ id: userId, email, role });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Failed to register' });
  }
}
