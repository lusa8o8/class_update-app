import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'motion/react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [institution, setInstitution] = useState('');
  const [school, setSchool] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          institution,
          school,
          phone: role === 'student' ? phone : undefined,
          country
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(role === 'admin' ? '/admin' : '/student');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-zinc-200 p-8 sm:p-12"
      >
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-6 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
          </Link>
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white mb-4">
            <UserPlus size={24} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Create your account</h1>
          <p className="text-zinc-500 mt-2">Join the platform to start managing or catching up on your classes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                      role === 'student' 
                        ? 'bg-zinc-900 text-white border-zinc-900' 
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Student
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                      role === 'admin' 
                        ? 'bg-zinc-900 text-white border-zinc-900' 
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                  placeholder="name@institution.edu"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              {role === 'student' && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">WhatsApp Number</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                    placeholder="+260 97..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Institution</label>
                <input 
                  type="text" 
                  required
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                  placeholder="e.g. The University of Zambia"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">School / Faculty</label>
                <input 
                  type="text" 
                  required
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                  placeholder="e.g. School of Humanities"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Country</label>
                <input 
                  type="text" 
                  required
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                  placeholder="e.g. Zambia"
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-lg shadow-zinc-900/20 active:scale-[0.98]"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account? <Link href="/login" className="text-zinc-900 font-bold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
