import type { NextApiRequest, NextApiResponse } from 'next';
import getDb, { getServiceDb } from '../../lib/db';
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

  const db = getServiceDb();

  if (req.method === 'GET') {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: 'Course ID is required' });

    try {
      // If student, check if enrolled
      if (user.role === 'student') {
        const { data: enrollment, error: enrollError } = await db.from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (enrollError || !enrollment) return res.status(403).json({ error: 'Not enrolled in this course' });
      }

      const { data: sessions, error } = await db.from('sessions')
        .select(`
          *,
          attendance!left (status, student_id),
          caught_up!left (caught_up_at, student_id)
        `)
        .eq('course_id', courseId)
        .order('session_number', { ascending: true });

      if (error) throw error;

      // Filter and format the results to only include the current user's attendance and caught up status
      const formattedSessions = sessions.map((s: any) => {
        const userAttendance = s.attendance?.find((a: any) => a.student_id === user.id);
        const userCaughtUp = s.caught_up?.find((cs: any) => cs.student_id === user.id);
        const { attendance, caught_up, ...rest } = s;
        return {
          ...rest,
          attendance_status: userAttendance?.status || null,
          caught_up: !!userCaughtUp,
          caught_up_at: userCaughtUp?.caught_up_at || null
        };
      });

      return res.json(formattedSessions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch updates' });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create updates' });

    const { course_id, session_number, title, date } = req.body;
    if (!course_id || !session_number || !title || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const { data, error } = await db.from('sessions')
        .insert({ course_id, session_number, title, date })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        error: 'Failed to create update',
        detail: error?.message || String(error),
        code: error?.code
      });
    }
  }

  if (req.method === 'PATCH') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Only admins can modify updates' });

    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'ID and status are required' });

    try {
      const { error } = await db.from('sessions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to modify update' });
    }
  }

  return res.status(405).end();
}
