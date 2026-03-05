import type { NextApiRequest, NextApiResponse } from 'next';
import getDb from '../../../lib/db';
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

  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (req.method !== 'POST') return res.status(405).end();

  const { course_id, start_date, num_weeks, days_of_week, start_session_num } = req.body;

  if (!course_id || !start_date || !num_weeks || !days_of_week || !start_session_num) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDb();
    const startDate = new Date(start_date);
    let currentSessionNum = parseInt(start_session_num);
    const inserts: any[] = [];

    for (let w = 0; w < num_weeks; w++) {
      for (const day of days_of_week) {
        const d = new Date(startDate);
        // Calculate the date for this week and day
        // day is 0-6 (Sun-Sat)
        // Find the next occurrence of 'day' starting from startDate + w weeks
        const diff = (day - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + (w * 7) + diff);

        inserts.push({
          course_id,
          session_number: currentSessionNum++,
          title: `Class Update ${currentSessionNum - 1}`,
          date: d.toISOString(),
          status: 'upcoming'
        });
      }
    }

    const { error } = await db.from('sessions').insert(inserts);

    if (error) throw error;

    return res.status(201).json({ success: true, count: inserts.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to bulk create updates' });
  }
}
