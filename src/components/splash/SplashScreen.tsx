'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TESTING_MODE } from '@/lib/config';

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing RecruitOS Security Layer...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress bar increment over ~2.5 seconds (2500ms)
    const duration = 2500;
    const intervalTime = 25; // 25ms step
    const totalSteps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress > 30 && currentProgress <= 70) {
        setStatusText('Validating Multi-Tenant Encrypted Session...');
      } else if (currentProgress > 70) {
        setStatusText(TESTING_MODE ? 'Redirecting to Authentication Entry...' : 'Preparing Enterprise Recruiter Cockpit...');
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setIsFadingOut(true);

        // Perform navigation check at the end of splash screen duration
        setTimeout(async () => {
          try {
            if (TESTING_MODE) {
              // Testing Mode: Always force routing to Login Page so user manually clicks Login
              router.replace('/login');
            } else {
              // Production Mode: Check session and auto-route if authenticated
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();

              if (user) {
                router.replace('/cockpit');
              } else {
                router.replace('/login');
              }
            }
          } catch (error) {
            router.replace('/login');
          }
        }, 300); // 300ms fade out transition
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#07090e] text-white flex flex-col justify-center items-center p-6 transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-yellow-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Splash Branding Card */}
      <div className="w-full max-w-sm text-center space-y-6 relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Direct Custom Logo */}
        <img
          src="/recruitos-logo.png"
          alt="RecruitOS Logo"
          className="h-20 w-auto mx-auto object-contain animate-pulse"
        />

        {/* Brand Name & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Recruit<span className="text-amber-500">OS</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
            Enterprise Recruitment Operating System
          </p>
        </div>

        {/* Progress Bar & Status Telemetry */}
        <div className="space-y-3 pt-4">
          <div className="w-full bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 h-full rounded-full transition-all duration-75 ease-out shadow-glow-amber"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="transition-all duration-300">{statusText}</span>
            <span className="font-mono text-amber-400 font-extrabold">{progress}%</span>
          </div>
        </div>

        {/* Multi-Tenant Security Footer Badge */}
        <div className="pt-6 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          <span>{TESTING_MODE ? 'Testing Mode Auth Flow Active' : 'PostgreSQL RLS Tenant Scoped Security Active'}</span>
        </div>
      </div>
    </div>
  );
}
