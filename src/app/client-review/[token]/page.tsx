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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="h-16 w-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Link Expired or Invalid Access Token
            </h1>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
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
