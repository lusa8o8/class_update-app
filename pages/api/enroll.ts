import type { NextApiRequest, NextApiResponse } from 'next';
import getDb from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let user: any;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const db = getDb();
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can enroll in courses' });
  }

  const { courseId } = req.body;
  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    const { error } = await db.from('enrollments').insert({
      student_id: user.id,
      course_id: courseId
    });

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Already enrolled in this course' });
      }
      throw error;
    }
    return res.status(201).json({ success: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to enroll' });
  }
}
