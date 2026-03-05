import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
  res.json({ success: true });
}
