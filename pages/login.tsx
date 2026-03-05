import { useEffect, useState } from 'react';
import { useAuth } from './_app';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8"
      >
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 font-sans">Welcome Back</h1>
          <p className="text-zinc-500 mt-2 font-sans">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1 font-sans">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-sans"
              placeholder="you@university.ac.zm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1 font-sans">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-sans"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium font-sans"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 text-white font-semibold py-2.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 font-sans"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        </div>
      </motion.div>
    </div>
  );
}
