import type { NextApiRequest, NextApiResponse } from 'next';
import getDb from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let user: any;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const db = getDb();
    const { data: enrollments, error } = await db.from('enrollments')
      .select(`
        enrolled_at,
        student_id,
        course:courses (
          *,
          sessions (id, status)
        )
      `)
      .eq('student_id', user.id)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    // Get caught up status for this student
    const { data: caughtUpStatus, error: caughtUpError } = await db.from('caught_up_status')
      .select('session_id')
      .eq('student_id', user.id)
      .eq('caught_up', true);

    if (caughtUpError) throw caughtUpError;

    const caughtUpSessionIds = new Set(caughtUpStatus.map(s => s.session_id));

    const formattedCourses = enrollments.map((e: any) => {
      const course = e.course;
      const sessions = course.sessions || [];
      
      return {
        ...course,
        enrolled_at: e.enrolled_at,
        total_updates: sessions.length,
        completed_updates: sessions.filter((s: any) => s.status === 'completed').length,
        caught_up_updates: sessions.filter((s: any) => caughtUpSessionIds.has(s.id)).length
      };
    });

    return res.json(formattedCourses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch your courses' });
  }
}
