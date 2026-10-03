import React from 'react';
import { getPrepKitByTokenAction } from '@/app/actions/interviewPrep';
import { CandidatePrepKitView } from '@/components/interview/CandidatePrepKitView';
import { ShieldAlert } from 'lucide-react';

interface PrepKitPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function CandidatePrepKitPage({ params }: PrepKitPageProps) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  const res = await getPrepKitByTokenAction(token);

  if (!res.success || !res.kit) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="h-16 w-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black">Invalid or Expired Link</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This interview preparation kit token is either invalid, expired, or has been removed. Please contact your recruiter for an updated link.
          </p>
        </div>
      </div>
    );
  }

  return <CandidatePrepKitView token={token} kit={res.kit} />;
}
