import React from 'react';
import { getClientReviewBatchAction } from '@/app/actions/clientSubmissions';
import { ClientReviewPortalView } from '@/components/client-review/ClientReviewPortalView';
import { AlertTriangle, Lock } from 'lucide-react';

export const revalidate = 0;

interface ClientReviewPageProps {
  params: {
    token: string;
  };
}

export default async function ClientReviewPage({ params }: ClientReviewPageProps) {
  const token = params.token;
  const res = await getClientReviewBatchAction(token);

  if (!res.success || !res.candidates) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="h-16 w-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white tracking-tight">
              Link Expired or Invalid Access Token
            </h1>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
              {res.error || 'This candidate review link is invalid, expired, or has been revoked. Please request an updated review link from your account recruiter.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientReviewPortalView
      token={token}
      positionTitle={res.positionTitle || 'Submitted Candidates'}
      clientName={res.clientName || 'Valued Client'}
      recruiterMessage={res.recruiterMessage}
      candidates={res.candidates}
    />
  );
}
