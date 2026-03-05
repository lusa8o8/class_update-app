import type { NextApiRequest, NextApiResponse } from 'next';
import getDb from '../../lib/db';
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

  const db = getDb();

  if (req.method === 'GET') {
    try {
      // List all courses with enrollment counts
      const { data: courses, error } = await db.from('courses')
        .select(`
          *,
          enrollments (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the enrollment count
      const formattedCourses = courses.map((c: any) => ({
        ...c,
        student_count: c.enrollments?.[0]?.count || 0
      }));

      return res.json(formattedCourses);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create courses' });
    }

    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    try {
      const { data, error } = await db.from('courses')
        .insert({ name, code, description })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Course code already exists' });
        }
        throw error;
      }

      return res.status(201).json(data);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create course' });
    }
  }

  return res.status(405).end();
}
