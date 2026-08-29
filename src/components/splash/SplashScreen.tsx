'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing RecruitOS Security Layer...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress bar increment over 3 seconds (3000ms)
    const intervalTime = 30; // 30ms step
    const totalSteps = 3000 / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress > 30 && currentProgress <= 70) {
        setStatusText('Validating Multi-Tenant Encrypted Session...');
      } else if (currentProgress > 70) {
        setStatusText('Preparing Enterprise Recruiter Cockpit...');
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setIsFadingOut(true);

        // Perform authentication check at the end of splash screen duration
        setTimeout(async () => {
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              router.replace('/cockpit');
            } else {
              router.replace('/login');
            }
          } catch (error) {
            router.replace('/login');
          }
        }, 300); // 300ms fade transition
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0b0f19] text-white flex flex-col justify-center items-center p-6 transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Splash Branding Card */}
      <div className="w-full max-w-sm text-center space-y-6 relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Animated Glowing Logo Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 blur-md opacity-75 animate-pulse" />
          <div className="relative h-full w-full rounded-3xl bg-slate-950 border border-slate-800 p-0.5 shadow-2xl flex items-center justify-center">
            <div className="h-full w-full bg-slate-900/90 rounded-[22px] flex items-center justify-center">
              <Sparkles className="h-9 w-9 text-brand-400 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Brand Name & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Recruit<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-cyan-400">OS</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Enterprise Recruitment Operating System
          </p>
        </div>

        {/* Progress Bar & Status Telemetry */}
        <div className="space-y-3 pt-4">
          <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-75 ease-out shadow-glow-brand"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span className="transition-all duration-300">{statusText}</span>
            <span className="font-mono text-brand-400 font-bold">{progress}%</span>
          </div>
        </div>

        {/* Multi-Tenant Security Footer Badge */}
        <div className="pt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>PostgreSQL RLS Tenant Scoped Security Active</span>
        </div>
      </div>
    </div>
  );
}
