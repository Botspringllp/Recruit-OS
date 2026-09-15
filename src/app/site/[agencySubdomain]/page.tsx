import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicWebsiteDataAction } from '@/app/actions/websiteBuilder';
import { AgencyWebsiteTemplate } from '@/components/website/AgencyWebsiteTemplate';
import { Globe, ShieldAlert } from 'lucide-react';

export async function generateMetadata({
  params
}: {
  params: Promise<{ agencySubdomain: string }>;
}) {
  const { agencySubdomain } = await params;
  const res = await getPublicWebsiteDataAction(agencySubdomain);
  if (res.success && res.data?.config) {
    return {
      title: `${res.data.config.agencyName} | Official Recruitment Website`,
      description: res.data.config.tagline || res.data.config.heroSubtitle || 'Official recruitment agency website'
    };
  }
  return {
    title: 'Recruitment Agency Website | RecruitOS',
    description: 'Official recruitment agency site'
  };
}

export default async function PublicAgencyWebsitePage({
  params
}: {
  params: Promise<{ agencySubdomain: string }>;
}) {
  const { agencySubdomain } = await params;

  if (!agencySubdomain) {
    notFound();
  }

  const result = await getPublicWebsiteDataAction(agencySubdomain);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-slate-100 font-sans">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Globe className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Website Not Published</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            {result.error || 'This agency website is currently under maintenance or has not been published.'}
          </p>
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-bold">
            Powered by <strong className="text-amber-400">RecruitOS Platform</strong>
          </div>
        </div>
      </div>
    );
  }

  const { agency, config, jobs } = result.data;

  // Verify website is PUBLISHED for public view
  if (config.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-slate-100 font-sans">
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Website Under Setup</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            The agency website for <strong className="text-white">{agency.name}</strong> is currently in draft mode and has not been published to the public yet.
          </p>
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-bold">
            Powered by <strong className="text-amber-400">RecruitOS Platform</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AgencyWebsiteTemplate
      agency={agency}
      config={config}
      jobs={jobs}
      isPreview={false}
    />
  );
}
