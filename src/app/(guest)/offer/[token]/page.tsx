import React from 'react';
import { getPublicOfferLetterAction } from '@/app/actions/offerActions';
import { PublicOfferClientView } from '@/components/offer/PublicOfferClientView';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function OfferPortalPage({ params }: PageProps) {
  const { token } = await params;
  const res = await getPublicOfferLetterAction(token);

  if (!res.success || !res.offer) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl w-fit mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white">Offer Not Found</h2>
          <p className="text-xs text-slate-400 font-medium">
            {res.error || 'The offer link you are trying to access is invalid, revoked, or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  return <PublicOfferClientView offer={res.offer} />;
}
