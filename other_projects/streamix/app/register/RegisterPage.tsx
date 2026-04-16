'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function RegisterPage() {
  // Registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Client-side validation before sending to server
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    const result = await register(name, email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/browse');
    }
  };

  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <header className="px-8 py-6">
        <Link href="/"><span className="font-display text-3xl text-netflix-red tracking-widest">STREAMIX</span></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="glass-card rounded-md p-10 w-full max-w-md animate-fade-in">
          <h1 className="text-white text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm mb-8">Start watching in minutes. No credit card required.</p>
          {error && (
            <div className="bg-netflix-red/20 border border-netflix-red/40 text-red-300 px-4 py-3 rounded mb-6 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name" required autoComplete="name" className="input-netflix" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" required autoComplete="email" className="input-netflix" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 characters)" required autoComplete="new-password" className="input-netflix" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password" required autoComplete="new-password" className="input-netflix" />
            <button type="submit" disabled={loading}
              className="btn-netflix w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>)
                : 'Get Started'}
            </button>
          </form>
          <p className="text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
