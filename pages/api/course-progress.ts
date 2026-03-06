import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceDb } from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'catch-up-certainty-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    let user: any;
    try {
        user = jwt.verify(token, JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: 'courseId required' });

    const db = getServiceDb();

    // Get enrolled students
    const { data: enrollments, error } = await db
        .from('enrollments')
        .select('student_id, enrolled_at, users(id, email, full_name)')
        .eq('course_id', courseId);

    if (error) return res.status(500).json({ error: error.message });

    // Get completed sessions for this course
    const { data: completedSessions } = await db
        .from('sessions')
        .select('id')
        .eq('course_id', courseId)
        .eq('status', 'completed');

    const completedIds = (completedSessions || []).map((s: any) => s.id);

    // Get caught up records for this course's sessions
    // Use a fallback UUID if no completed sessions exist to avoid SQL error with empty 'in' list
    const { data: caughtUpRecords } = await db
        .from('caught_up')
        .select('student_id, session_id')
        .in('session_id', completedIds.length ? completedIds : ['00000000-0000-0000-0000-000000000000']);

    // Build response
    const progress = (enrollments || []).map((e: any) => {
        const studentCaughtUp = (caughtUpRecords || [])
            .filter((c: any) => c.student_id === e.student_id).length;
        return {
            student_id: e.student_id,
            email: e.users?.email,
            full_name: e.users?.full_name,
            enrolled_at: e.enrolled_at,
            caught_up: studentCaughtUp,
            total_completed: completedIds.length
        };
    });

    return res.json(progress);
}
