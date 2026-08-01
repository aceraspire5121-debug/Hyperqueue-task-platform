'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../store/authSlice';
import { api } from '../../services/api';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user, tokens } = res.data.data;
        dispatch(
          setAuth({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          })
        );
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password credentials.');
    } font-medium {
      setIsLoading(false);
    }
  };

  const quickFillUser = () => {
    setEmail('user@saarthi.ai');
    setPassword('UserPassword123!');
  };

  const quickFillAdmin = () => {
    setEmail('admin@saarthi.ai');
    setPassword('AdminPassword123!');
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur-xl shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Welcome to SaarthiFlow
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sign in to access your task automation dashboard
          </p>
        </div>

        {/* Quick Fill Demo Buttons */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Quick Fill Demo Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={quickFillUser}
              className="flex items-center justify-center space-x-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Demo User</span>
            </button>
            <button
              type="button"
              onClick={quickFillAdmin}
              className="flex items-center justify-center space-x-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>System Admin</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="user@saarthi.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/30"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
