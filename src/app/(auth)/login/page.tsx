'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Successful login redirect to recruiter cockpit
      router.push('/cockpit');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Background Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main High-Contrast White + Dark Yellow Card Shell */}
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-amber-200/80 shadow-2xl shadow-amber-500/10 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header with Direct Custom Logo */}
        <div className="text-center space-y-3">
          <img
            src="/recruitos-logo.png"
            alt="RecruitOS Brand Logo"
            className="h-16 w-auto mx-auto object-contain"
          />

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Recruit<span className="text-amber-600">OS</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 tracking-wide">
              Enterprise Recruiter Cockpit & Data Platform
            </p>
          </div>
        </div>

        {/* Error Feedback Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* High-Contrast Form Inputs */}
        <form onSubmit={handleLogin} className="space-y-5" method="POST">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
              Work Email
            </label>
            <div className="relative">
              <Mail className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username email"
                required
                placeholder="name@agency.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                Password
              </label>
              <a href="#forgot" className="text-xs font-extrabold text-amber-600 hover:text-amber-700 hover:underline transition-colors">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          {/* Dark Yellow Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-amber-500/30 tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Cockpit</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>End-to-End Multi-Tenant Encrypted</span>
          </p>
        </div>

      </div>
    </div>
  );
}
