import { useState } from 'react';
import { motion } from 'motion/react';
import Head from 'next/head';

export default function WaitlistPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        university: '',
        school: '',
        reason: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setError('');

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
            } else {
                setError(data.error || 'Failed to join waitlist. Please try again.');
                setStatus('idle');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setStatus('idle');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <Head>
                    <title>CatchUp — Join the Waitlist</title>
                </Head>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-12 text-center"
                >
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">You're on the list.</h2>
                    <p className="text-zinc-500 mb-6">We'll be in touch.</p>
                    <a
                        href="https://whatsapp.com/channel/0029Vb7KJmTDzgTAu7YXO10Z"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                        Join our WhatsApp channel for updates
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 py-12">
            <Head>
                <title>CatchUp — Join the Waitlist</title>
            </Head>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 sm:p-10"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2 font-sans">CatchUp</h1>
                    <p className="text-lg font-semibold text-zinc-800 mb-1">Never fall behind again.</p>
                    <p className="text-zinc-500 text-sm">Miss class. Stay in sync. Join the waitlist for early access.</p>
                    <p className="text-zinc-600 text-sm mt-4 leading-relaxed font-sans">
                        CatchUp is a structured catch-up system for university students.
                        When you miss a class, you get a clear summary of what was covered,
                        what's due, and where you are in the syllabus — so you can get back
                        on track without the anxiety.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900"
                            placeholder="Jane Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900"
                            placeholder="jane@university.edu"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">University</label>
                        <input
                            type="text"
                            required
                            value={formData.university}
                            onChange={e => setFormData({ ...formData, university: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900"
                            placeholder="Harvard University"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">School / Faculty</label>
                        <input
                            type="text"
                            required
                            value={formData.school}
                            onChange={e => setFormData({ ...formData, school: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900"
                            placeholder="School of Engineering"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Why do you need this? <span className="text-zinc-400 font-normal">(Optional)</span></label>
                        <textarea
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900 min-h-[80px]"
                            placeholder="I miss classes because of work..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full mt-2 bg-zinc-900 text-white font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        {status === 'submitting' ? 'Joining...' : 'Join Waitlist'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
