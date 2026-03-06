import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServiceDb } from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  try {
    // Step 1: Authenticate against Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Step 2: Fetch role and name from public.users using Service Role Client
    const serviceDb = getServiceDb();
    const { data: userRow, error: userError } = await serviceDb
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userRow) {
      return res.status(401).json({ error: 'Account not configured. Contact admin.' });
    }

    // Step 3: Issue JWT with role
    const token = jwt.sign(
      { id: userRow.id, email: userRow.email, role: userRow.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.setHeader(
      'Set-Cookie',
      `auth_token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${24 * 60 * 60}`
    );

    res.json({ user: userRow });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
