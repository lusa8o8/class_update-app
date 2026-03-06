import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { full_name, email, university, school, reason } = req.body;
    if (!full_name || !email || !university || !school) {
        return res.status(400).json({ error: 'Name, email, university and school are required' });
    }

    const db = getServiceDb();
    const { error } = await db.from('waitlist').insert({
        full_name, email, university, school, reason
    });

    if (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'This email is already on the waitlist.' });
        }
        return res.status(500).json({ error: 'Failed to join waitlist' });
    }

    return res.status(201).json({ success: true });
}
